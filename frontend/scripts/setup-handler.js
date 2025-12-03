document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('SetupForm');
    const errorDiv = document.getElementById('loginError');
    const overlay = document.getElementById('setupResultOverlay');
    const closeBtn = document.getElementById('setupModalCloseBtn');
    const downloadBtn = document.getElementById('downloadCredentialsBtn');
    const goToLoginBtn = document.getElementById('goToLoginBtn');

    const summaryCompanyName = document.getElementById('summaryCompanyName');
    const summaryCompanyId = document.getElementById('summaryCompanyId');
    const summaryAdminName = document.getElementById('summaryAdminName');
    const summaryAdminInitials = document.getElementById('summaryAdminInitials');
    const summaryAdminRole = document.getElementById('summaryAdminRole');

    function openModal() {
        if (!overlay) return;
        overlay.classList.remove('setup-modal-hidden');
        overlay.setAttribute('aria-hidden', 'false');
    }

    function closeModal() {
        if (!overlay) return;
        overlay.classList.add('setup-modal-hidden');
        overlay.setAttribute('aria-hidden', 'true');
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal();
            }
        });
    }

    if (goToLoginBtn) {
        goToLoginBtn.addEventListener('click', () => {
            window.location.href = 'login.html';
        });
    }
    form.addEventListener('submit', async (e) => {
        e.preventDefault(); // Verhindert, dass das Formular die Seite neu lädt
        errorDiv.textContent = ''; // Alte Fehler löschen
        // Formularwerte auslesen
        const data = {
            companyName: document.getElementById('company-name').value.trim(),
            companyDesc: document.getElementById('company-desc').value.trim(),
            userAbbr: document.getElementById('user-abbr').value.trim(),
            firstname: document.getElementById('firstname').value.trim(),
            surname: document.getElementById('surname').value.trim(),
            role: document.getElementById('role').value.trim(),
            password: document.getElementById('password').value,
            passwordRepeat: document.getElementById('password-repeat').value
        };
        // Passwort-Matching prüfen
        if (data.password !== data.passwordRepeat) {
            errorDiv.textContent = "Passwords do not match!";
            return;
        }
        try {
            const response = await fetch('/api/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (result.success) {
                const companyId = result.companyId || '(not returned)';

                // Fill modal summary values
                if (summaryCompanyName) {
                    summaryCompanyName.textContent = data.companyName || '—';
                }
                if (summaryCompanyId) {
                    summaryCompanyId.textContent = companyId;
                }
                if (summaryAdminName) {
                    summaryAdminName.textContent = `${data.firstname || ''} ${data.surname || ''}`.trim();
                }
                if (summaryAdminInitials) {
                    summaryAdminInitials.textContent = data.userAbbr || '—';
                }
                if (summaryAdminRole) {
                    summaryAdminRole.textContent = data.role || '—';
                }

                // Setup download handler with captured data
                if (downloadBtn) {
                    const credentials = {
                        companyName: data.companyName,
                        companyDescription: data.companyDesc,
                        companyId,
                        adminUser: {
                            initials: data.userAbbr,
                            firstName: data.firstname,
                            surname: data.surname,
                            role: data.role,
                            password: data.password
                        },
                        createdAt: new Date().toISOString()
                    };

                    downloadBtn.onclick = () => {
                        try {
                            const blob = new Blob(
                                [JSON.stringify(credentials, null, 2)],
                                { type: 'application/json' }
                            );
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'SentinelIS-Credentials.json';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                        } catch (e) {
                            console.error('Failed to generate credentials download:', e);
                            errorDiv.textContent = "Could not generate the credentials file. Please try again.";
                        }
                    };
                }

                openModal();
            } else {
                // Fehler vom Server anzeigen
                errorDiv.textContent = result.message || "An unknown error occurred";
            }
        } catch (err) {
            console.error('Setup request failed:', err);
            errorDiv.textContent = "Failed to send setup request. Please try again.";
        }
    });
});