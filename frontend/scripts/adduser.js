const form = document.getElementById('CreateUserForm');
const msgEl = document.getElementById('createUserMessage');
const modal = document.getElementById('userSuccessModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const createAnotherBtn = document.getElementById('createAnotherBtn');
const returnToDashboardBtn = document.getElementById('returnToDashboardBtn');

// Modal functions
function openModal() {
    if (!modal) return;
    modal.classList.remove('user-modal-hidden');
    modal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
    if (!modal) return;
    modal.classList.add('user-modal-hidden');
    modal.setAttribute('aria-hidden', 'true');
}

// Close modal handlers
if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
}

if (modal) {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

// Create another user - reset form and close modal
if (createAnotherBtn) {
    createAnotherBtn.addEventListener('click', () => {
        closeModal();
        form.reset();
        msgEl.textContent = '';
        msgEl.className = '';
        // Scroll to top of form
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}

// Return to dashboard
if (returnToDashboardBtn) {
    returnToDashboardBtn.addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });
}

// Password generation (if needed)
const generatePwBtn = document.getElementById('generate-pw');
if (generatePwBtn) {
    generatePwBtn.addEventListener('click', () => {
        const passwordInput = document.getElementById('password');
        if (passwordInput) {
            // Generate a random password (12 characters)
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
            let password = '';
            for (let i = 0; i < 12; i++) {
                password += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            passwordInput.value = password;
            passwordInput.type = 'text'; // Show generated password
            setTimeout(() => {
                passwordInput.type = 'password'; // Hide after 3 seconds
            }, 3000);
        }
    });
}

// Form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msgEl.textContent = '';
    msgEl.className = '';
    
    const companyId = document.getElementById('companyId').value.trim();
    const role = document.getElementById('role').value.trim();
    const firstname = document.getElementById('firstname').value.trim();
    const surname = document.getElementById('surname').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    try {
        const res = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ companyId, role, firstname, surname, username, password })
        });

        const data = await res.json();
        if (res.ok && data.success) {
            // Fill modal summary with user data
            document.getElementById('summaryCompanyId').textContent = companyId || '—';
            document.getElementById('summaryFullName').textContent = `${firstname || ''} ${surname || ''}`.trim() || '—';
            document.getElementById('summaryInitials').textContent = username || '—';
            document.getElementById('summaryRole').textContent = role || '—';
            document.getElementById('summaryUserId').textContent = data.userId || '—';

            // Show success modal
            openModal();
        } else {
            msgEl.textContent = data.message || 'Failed to create user.';
            msgEl.className = 'error';
        }
    } catch (err) {
        console.error('Create user request failed', err);
        msgEl.textContent = 'Network or server error. Please try again.';
        msgEl.className = 'error';
    }
});
