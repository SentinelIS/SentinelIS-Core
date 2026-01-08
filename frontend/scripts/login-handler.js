document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const company = document.getElementById('company').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('loginError');
    errorEl.textContent = '';

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ company, username, password })
        });
        const data = await res.json();
        if (res.ok && data.success) {
            // remember company id for admin actions
            try {
                localStorage.setItem('companyId', company);
                if (data.userId) localStorage.setItem('userId', data.userId);
                if (data.username) localStorage.setItem('username', data.username);
            } catch (_) {}
            // server can return redirect path
            window.location.href = data.redirect || '/dashboard.html';
        } else {
            errorEl.textContent = data.message || 'Login failed';
        }
        // Save credentials to localStorage
        try {
            localStorage.setItem('companyId', company);
            localStorage.setItem('username', username);
            localStorage.setItem('password', password);
            if (data.userId) localStorage.setItem('userId', data.userId);
        } catch (_) {}
    } catch (err) {
        errorEl.textContent = 'Network or server error';
        console.error(err);
    }
});
