/**
 * AI Research Paper Summarizer - Authentication JavaScript
 * Handles email/password login + Google Identity Services sign-in
 */
document.addEventListener('DOMContentLoaded', () => {

    // ── 1. Password Visibility Toggle ────────────────────────────────────────
    const passwordToggle = document.getElementById('passwordToggle');
    const passwordInput  = document.getElementById('password');

    if (passwordToggle && passwordInput) {
        passwordToggle.addEventListener('click', (e) => {
            e.preventDefault();
            const icon = passwordToggle.querySelector('i');
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                passwordToggle.setAttribute('aria-label', 'Hide Password');
                if (icon) { icon.classList.replace('fa-eye', 'fa-eye-slash'); }
            } else {
                passwordInput.type = 'password';
                passwordToggle.setAttribute('aria-label', 'Show Password');
                if (icon) { icon.classList.replace('fa-eye-slash', 'fa-eye'); }
            }
        });
    }

    // ── 2. Toast Notification ────────────────────────────────────────────────
    const showToast = (message, type = 'info') => {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        let iconClass = 'fa-circle-info';
        if (type === 'success') iconClass = 'fa-circle-check';
        if (type === 'warning') iconClass = 'fa-triangle-exclamation';
        if (type === 'error')   iconClass = 'fa-circle-exclamation';

        toast.innerHTML = `
            <i class="fa-solid ${iconClass} toast-icon" aria-hidden="true"></i>
            <span class="toast-message">${message}</span>
        `;
        container.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 50);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 3800);
    };

    // ── 3. Inline Validation ─────────────────────────────────────────────────
    const emailInput  = document.getElementById('email');
    const emailError  = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');

    const setError = (inputEl, errorEl, message) => {
        if (inputEl) inputEl.classList.add('error');
        if (errorEl) { errorEl.textContent = message; errorEl.classList.add('visible'); }
    };

    const clearError = (inputEl, errorEl) => {
        if (inputEl) inputEl.classList.remove('error');
        if (errorEl) {
            errorEl.classList.remove('visible');
            setTimeout(() => { if (!errorEl.classList.contains('visible')) errorEl.textContent = ''; }, 250);
        }
    };

    const validateEmail = () => {
        if (!emailInput) return false;
        const value = emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) { setError(emailInput, emailError, 'Email address is required.'); return false; }
        if (!emailRegex.test(value)) { setError(emailInput, emailError, 'Please enter a valid email address.'); return false; }
        clearError(emailInput, emailError);
        return true;
    };

    const validatePassword = () => {
        if (!passwordInput) return false;
        const value = passwordInput.value;
        if (!value) { setError(passwordInput, passwordError, 'Password is required.'); return false; }
        if (value.length < 6) { setError(passwordInput, passwordError, 'Password must be at least 6 characters.'); return false; }
        clearError(passwordInput, passwordError);
        return true;
    };

    if (emailInput) {
        emailInput.addEventListener('blur', validateEmail);
        emailInput.addEventListener('input', () => { if (emailInput.classList.contains('error')) validateEmail(); });
    }
    if (passwordInput) {
        passwordInput.addEventListener('blur', validatePassword);
        passwordInput.addEventListener('input', () => { if (passwordInput.classList.contains('error')) validatePassword(); });
    }

    // ── 4. Email / Password Login Form ───────────────────────────────────────
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const isEmailValid    = validateEmail();
            const isPasswordValid = validatePassword();
            if (!isEmailValid || !isPasswordValid) {
                showToast('Please fix the errors in the form.', 'warning');
                return;
            }

            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalBtnHTML = submitBtn ? submitBtn.innerHTML : '';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Signing In...</span>';
            }

            try {
                await window.authAPI.login(emailInput.value.trim(), passwordInput.value);
                showToast('Sign in successful! Redirecting...', 'success');
                setTimeout(() => {
                    const params  = new URLSearchParams(window.location.search);
                    const next    = params.get('next');
                    const safePage = next && /^[a-zA-Z0-9_\-]+\.html$/.test(next) ? next : 'dashboard.html';
                    window.location.href = safePage;
                }, 1000);
            } catch (err) {
                if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = originalBtnHTML; }
                const msg = err.message || 'Invalid email or password.';
                showToast(msg, 'warning');
                setError(passwordInput, passwordError, msg);
            }
        });
    }

    // ── 5. GitHub OAuth Sign-In ──────────────────────────────────────────────
    const githubBtn = document.getElementById('btnGitHub');
    if (githubBtn) {
        githubBtn.addEventListener('click', () => {
            githubBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Connecting to GitHub...</span>';
            const apiBase =
                (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) ||
                'http://localhost:5000/api';
            // Set href dynamically if not already preset
            if (githubBtn.tagName.toLowerCase() === 'a' && !githubBtn.getAttribute('href')) {
                githubBtn.href = `${apiBase}/auth/github`;
            } else if (githubBtn.tagName.toLowerCase() !== 'a') {
                window.location.href = `${apiBase}/auth/github`;
            }
        });
    }

    // ── 6. Check for OAuth error or notification in URL ──────────────────────
    const urlParams = new URLSearchParams(window.location.search);
    const oauthError = urlParams.get('error');
    if (oauthError) {
        showToast(decodeURIComponent(oauthError), 'error');
        // Clean URL to prevent re-triggering error on page refresh
        window.history.replaceState({}, document.title, window.location.pathname);
    }
});
