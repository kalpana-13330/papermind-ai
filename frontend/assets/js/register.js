document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const form = document.getElementById('registerForm');
    const fullnameInput = document.getElementById('fullname');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const termsCheck = document.getElementById('termsCheck');
    const submitBtn = document.getElementById('registerBtn');

    // Password Toggle
    const passwordToggle = document.getElementById('passwordToggle');

    // Strength Indicator Elements
    const strengthContainer = document.getElementById('strengthContainer');
    const bars = [
        document.getElementById('bar1'),
        document.getElementById('bar2'),
        document.getElementById('bar3'),
        document.getElementById('bar4')
    ];
    const strengthLabel = document.getElementById('strengthLabel');
    const reqLength = document.getElementById('reqLength');
    const reqUpper = document.getElementById('reqUpper');
    const reqLower = document.getElementById('reqLower');
    const reqNum = document.getElementById('reqNum');
    const reqSpec = document.getElementById('reqSpec');

    //Password Visibility Toggle
    passwordToggle.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        passwordToggle.innerHTML = type === 'password' ? '<i class="fa-regular fa-eye"></i>' : '<i class="fa-regular fa-eye-slash"></i>';
    });

    const confirmPasswordToggle = document.getElementById('confirmPasswordToggle');
    if (confirmPasswordToggle) {
        confirmPasswordToggle.addEventListener('click', () => {
            const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            confirmPasswordInput.setAttribute('type', type);
            confirmPasswordToggle.innerHTML = type === 'password' ? '<i class="fa-regular fa-eye"></i>' : '<i class="fa-regular fa-eye-slash"></i>';
        });
    }

    // Password Strength Logic
    passwordInput.addEventListener('input', () => {

        const val = passwordInput.value;
        if (val.length > 0) {
            strengthContainer.classList.add('active');
        } else {
            strengthContainer.classList.remove('active');
            resetStrength();
            return;
        }

        let strengthScore = 0;

        // Check Length (6+, matching backend minimum)
        if (val.length >= 6) {
            reqLength.classList.remove('invalid');
            reqLength.classList.add('valid');
            strengthScore++;
        } else {
            reqLength.classList.add('invalid');
            reqLength.classList.remove('valid');
        }

        // Check Uppercase
        if (/[A-Z]/.test(val)) {
            reqUpper.classList.remove('invalid');
            reqUpper.classList.add('valid');
            strengthScore++;
        } else {
            reqUpper.classList.add('invalid');
            reqUpper.classList.remove('valid');
        }

        // Check Lowercase
        if (/[a-z]/.test(val)) {
            reqLower.classList.remove('invalid');
            reqLower.classList.add('valid');
            strengthScore++;
        } else {
            reqLower.classList.add('invalid');
            reqLower.classList.remove('valid');
        }

        // Check Number
        if (/[0-9]/.test(val)) {
            reqNum.classList.remove('invalid');
            reqNum.classList.add('valid');
            strengthScore++;
        } else {
            reqNum.classList.add('invalid');
            reqNum.classList.remove('valid');
        }

        // Check Special Char
        if (/[^A-Za-z0-9]/.test(val)) {
            reqSpec.classList.remove('invalid');
            reqSpec.classList.add('valid');
            strengthScore++;
        } else {
            reqSpec.classList.add('invalid');
            reqSpec.classList.remove('valid');
        }

        updateStrengthUI(strengthScore);

        // Also re-validate confirm password if it has a value
        if (confirmPasswordInput.value) {
            validateConfirmPassword();
        }
    });
    function resetStrength() {
        bars.forEach(bar => {
            bar.className = 'strength-bar';
        });
        strengthLabel.textContent = 'Password strength';
        const reqs = [reqLength, reqUpper, reqLower, reqNum, reqSpec];
        reqs.forEach(req => {
            req.classList.add('invalid');
            req.classList.remove('valid');
        });
    }

    function updateStrengthUI(score) {
        bars.forEach(bar => bar.className = 'strength-bar'); // reset

        if (score <= 1) {
            bars[0].classList.add('active-weak');
            strengthLabel.textContent = 'Weak';
            strengthLabel.style.color = '#ef4444';
        }
        else if (score === 2 || score === 3) {
            bars[0].classList.add('active-medium');
            bars[1].classList.add('active-medium');
            if (score === 3) bars[2].classList.add('active-medium');
            strengthLabel.textContent = 'Medium';
            strengthLabel.style.color = '#eab308';
        }
        else if (score === 4) {
            bars[0].classList.add('active-strong');
            bars[1].classList.add('active-strong');
            bars[2].classList.add('active-strong');
            strengthLabel.textContent = 'Strong';
            strengthLabel.style.color = '#10b981';
        }
        else if (score === 5) {
            bars[0].classList.add('active-vstrong');
            bars[1].classList.add('active-vstrong');
            bars[2].classList.add('active-vstrong');
            bars[3].classList.add('active-vstrong');
            strengthLabel.textContent = 'Very Strong';
            strengthLabel.style.color = '#6366f1';
        }
    }

    // Validation Functions
    function showError(input, errorElementId, message) {
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');
        document.getElementById(errorElementId).textContent = message;
        document.getElementById(errorElementId).style.display = 'block';
    }

    function showSuccess(input, errorElementId) {
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
        document.getElementById(errorElementId).textContent = '';
        document.getElementById(errorElementId).style.display = 'none';
    }

    function validateFullName() {
        if (fullnameInput.value.trim() === '') {
            showError(fullnameInput, 'fullnameError', 'Full Name is required.');
            return false;
        }
        else if (fullnameInput.value.trim().length < 2) {
            showError(fullnameInput, 'fullnameError', 'Please enter your full name.');
            return false;
        }
        showSuccess(fullnameInput, 'fullnameError');
        return true;
    }

    function validateEmail() {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailInput.value.trim() === '') {
            showError(emailInput, 'emailError', 'Email address is required.');
            return false;
        }
        else if (!emailRegex.test(emailInput.value.trim())) {
            showError(emailInput, 'emailError', 'Please enter a valid email address.');
            return false;
        }
        showSuccess(emailInput, 'emailError');
        return true;
    }

    function validatePassword() {
        if (passwordInput.value === '') {
            showError(passwordInput, 'passwordError', 'Password is required.');
            return false;
        }

        // Backend requires minimum 6 characters
        if (passwordInput.value.length < 6) {
            showError(passwordInput, 'passwordError', 'Password must be at least 6 characters.');
            return false;
        }

        showSuccess(passwordInput, 'passwordError');
        return true;
    }

    function validateConfirmPassword() {
        if (confirmPasswordInput.value === '') {
            showError(confirmPasswordInput, 'confirmPasswordError', 'Please confirm your password.');
            return false;
        } else if (confirmPasswordInput.value !== passwordInput.value) {
            showError(confirmPasswordInput, 'confirmPasswordError', 'Passwords do not match.');
            return false;
        }
        showSuccess(confirmPasswordInput, 'confirmPasswordError');
        return true;
    }

    function validateTerms() {
        if (!termsCheck.checked) {
            document.getElementById('termsError').textContent = 'You must agree to the Terms & Privacy Policy.';
            document.getElementById('termsError').style.display = 'block';
            return false;
        }
        document.getElementById('termsError').textContent = '';
        document.getElementById('termsError').style.display = 'none';
        return true;
    }

    // Input blur event listeners for immediate validation
    fullnameInput.addEventListener('blur', validateFullName);
    emailInput.addEventListener('blur', validateEmail);
    passwordInput.addEventListener('blur', validatePassword);
    confirmPasswordInput.addEventListener('blur', validateConfirmPassword);
    confirmPasswordInput.addEventListener('input', validateConfirmPassword);
    termsCheck.addEventListener('change', validateTerms);

    // Custom Toast Notification function (reuse or implement if not available globally)
    function showToast(title, message, type = 'success') {
        // Use global showToast if main.js provides it
        if (window.showToast && typeof window.showToast === 'function') {
            window.showToast(title, message, type);
            return;
        }

        // Fallback implementation
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type} animate-fade-in-down`;

        let icon = 'fa-check-circle';
        if (type === 'error') icon = 'fa-circle-xmark';
        else if (type === 'info') icon = 'fa-info-circle';

        toast.innerHTML = `
            <div class="toast-icon"><i class="fa-solid ${icon}"></i></div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class = "toast-close"><i class="fa-solid fa-xmark"></i></button>
        `;

        toastContainer.appendChild(toast);

        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.style.animation = 'fadeOutUp 0.3s forwards';
            setTimeout(() => toast.remove(), 300);
        });

        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.animation = 'fadeOutUp 0.3s forwards';
                setTimeout(() => toast.remove(), 300);
            }
        }, 4000);
    }

    // Form Submit
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const isFullnameValid = validateFullName();
        const isEmailValid = validateEmail();
        const isPasswordValid = validatePassword();
        const isConfirmPasswordValid = validateConfirmPassword();
        const isTermsValid = validateTerms();

        if (isFullnameValid && isEmailValid && isPasswordValid && isConfirmPasswordValid && isTermsValid) {
            // Button loading state
            const btnText = submitBtn.querySelector('.btn-text');
            const btnLoader = submitBtn.querySelector('.btn-loader');

            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
            btnText.style.opacity = '0';
            btnLoader.style.display = 'inline-block';

            (async () => {
                try {
                    const name = fullnameInput.value.trim();
                    const email = emailInput.value.trim();
                    const password = passwordInput.value;

                    localStorage.removeItem('papermind_favorites');
                    sessionStorage.clear();
                    await window.authAPI.register(name, email, password);

                    // Success state
                    btnLoader.className = 'fa-solid fa-check btn-loader';
                    btnText.textContent = 'Account Created';
                    btnText.style.opacity = '1';

                    submitBtn.classList.add('btn-success');
                    submitBtn.style.background = 'linear-gradient(135deg, #199b70ff, #059669)';
                    submitBtn.style.boxShadow = '0 0 25px rgba(2, 128, 212, 0.6)';

                    showToast('Success', 'Your account has been created successfully!', 'success');

                    // Redirect to dashboard (user is already logged in with token) or login
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1200);
                } catch (err) {
                    submitBtn.classList.remove('loading');
                    submitBtn.disabled = false;
                    btnText.style.opacity = '1';
                    btnLoader.style.display = 'none';
                    btnLoader.className = 'fa-solid fa-spinner fa-spin btn-loader';

                    const errorMsg = err.message || 'Registration failed. Please try again.';
                    showToast('Registration Error', errorMsg, 'error');
                }
            })();
        } else {
            showToast('Error', 'Please fix the errors in the form before submitting.', 'error');
        }
    });

    // Social Sign-In Modal
    function createSocialModal() {
        const existing = document.getElementById('socialSignInModal');
        if (existing) return existing;

        const modal = document.createElement('div');
        modal.id = 'socialSignInModal';
        modal.style.cssText = `
            position: fixed; inset: 0; z-index: 9999;
            display: flex; align-items: center; justify-content: center;
            background: rgba(3, 7, 18, 0.85);
            backdrop-filter: blur(12px);
            animation: fadeInModal 0.3s ease;
        `;

        modal.innerHTML = `
            <style>
                @keyframes fadeInModal { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUpModal { from { transform: translateY(30px) scale(0.96); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
                #socialModalCard {
                    background: rgba(17, 20, 40, 0.95);
                    border: 1px solid rgba(120, 90, 255, 0.35);
                    border-radius: 24px;
                    padding: 2.5rem 2.75rem;
                    max-width: 420px;
                    width: 90%;
                    text-align: center;
                    box-shadow: 0 30px 80px rgba(0,0,0,0.5), 0 0 60px rgba(99,102,241,0.15);
                    animation: slideUpModal 0.35s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                }
                #socialModalCard .modal-icon {
                    width: 70px; height: 70px;
                    background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(124,58,237,0.2));
                    border: 1px solid rgba(99,102,241,0.35);
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    margin: 0 auto 1.5rem;
                    font-size: 1.8rem; color: #a5b4fc;
                    box-shadow: 0 0 30px rgba(99,102,241,0.3);
                }
                #socialModalCard h3 { color: #f1f5f9; font-size: 1.3rem; font-weight: 700; margin: 0 0 0.75rem; }
                #socialModalCard p { color: #94a3b8; font-size: 0.9rem; line-height: 1.6; margin: 0 0 1.75rem; }
                #socialModalCard .modal-badge {
                    display: inline-flex; align-items: center; gap: 0.5rem;
                    background: rgba(99,102,241,0.12); border: 1px solid rgba(99,102,241,0.3);
                    color: #a5b4fc; padding: 0.4rem 1rem; border-radius: 100px;
                    font-size: 0.8rem; font-weight: 600; margin-bottom: 2rem;
                }
                #socialModalClose {
                    width: 100%; padding: 0.85rem;
                    background: linear-gradient(135deg, #3b82f6, #7c3aed);
                    border: none; border-radius: 14px;
                    color: #fff; font-size: 1rem; font-weight: 600;
                    cursor: pointer; transition: all 0.3s ease;
                    letter-spacing: 0.3px;
                }
                #socialModalClose:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(99,102,241,0.4); }
                .modal-close-x {
                    position: absolute; top: 1rem; right: 1.25rem;
                    background: none; border: none; color: #475569;
                    font-size: 1.1rem; cursor: pointer; padding: 0.25rem;
                    transition: color 0.2s;
                }
                .modal-close-x:hover { color: #f1f5f9; }
            </style>
            <div id="socialModalCard">
                <button class="modal-close-x" id="socialModalX" aria-label="Close">
                    <i class="fa-solid fa-xmark"></i>
                </button>
                <div class="modal-icon">
                    <i class="fa-brands fa-google"></i>
                </div>
                <div class="modal-badge"><i class="fa-solid fa-clock"></i> Coming Soon</div>
                <h3>Social Sign-In</h3>
                <p>Google, GitHub, and Apple sign-in are currently in development. For now, please register with your email and password — it only takes 10 seconds!</p>
                <button id="socialModalClose">Got it, I'll use Email</button>
            </div>
        `;

        document.body.appendChild(modal);

        function closeModal() {
            modal.style.animation = 'fadeInModal 0.2s ease reverse';
            setTimeout(() => modal.remove(), 200);
        }

        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
        modal.querySelector('#socialModalClose').addEventListener('click', closeModal);
        modal.querySelector('#socialModalX').addEventListener('click', closeModal);
        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', escHandler); }
        });

        return modal;
    }

    // ── GitHub OAuth Sign-In ────────────────────────────────────────────────
    const githubRegBtn = document.getElementById('btnGitHubReg');
    if (githubRegBtn) {
        githubRegBtn.addEventListener('click', () => {
            githubRegBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Connecting to GitHub...</span>';
            const apiBase =
                (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) ||
                'http://localhost:5000/api';
            if (githubRegBtn.tagName.toLowerCase() === 'a' && !githubRegBtn.getAttribute('href')) {
                githubRegBtn.href = `${apiBase}/auth/github`;
            } else if (githubRegBtn.tagName.toLowerCase() !== 'a') {
                window.location.href = `${apiBase}/auth/github`;
            }
        });
    }

    // ── Check for OAuth error in URL parameters ──────────────────────────────
    const urlParams = new URLSearchParams(window.location.search);
    const oauthError = urlParams.get('error');
    if (oauthError) {
        showToast('Sign-In Error', decodeURIComponent(oauthError), 'error');
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Apple / other social coming soon
    const appleRegBtn = document.getElementById('btnAppleReg');
    if (appleRegBtn) {
        appleRegBtn.addEventListener('click', () => {
            createSocialModal();
        });
    }
});
