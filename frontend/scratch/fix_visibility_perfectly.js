const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

// 1. UPDATE register.css
const regCssPath = path.join(projectRoot, 'assets', 'css', 'register.css');
let regCss = fs.readFileSync(regCssPath, 'utf8');

// Append ultimate high-contrast rules at the end of register.css
const ultimateVisibilityRules = `
/* ==========================================================================
   PERFECT VISIBILITY & AESTHETICS OVERRIDES (LIGHT & DARK THEMES)
   ========================================================================== */

/* ------------------ LIGHT THEME PERFECT CONTRAST ------------------ */
[data-theme="light"] .register-wrapper,
[data-theme="light"] .auth-wrapper {
    background: #f8fafc !important;
    color: #0f172a !important;
}

[data-theme="light"] .register-sidebar,
[data-theme="light"] .auth-sidebar {
    background: #f8fafc !important;
    border-right: 1px solid #e2e8f0 !important;
}

[data-theme="light"] .register-sidebar .logo,
[data-theme="light"] .auth-sidebar .nav-brand,
[data-theme="light"] .auth-sidebar-header a {
    color: #0f172a !important;
}

[data-theme="light"] .register-badge-top {
    background: #ffffff !important;
    border: 1px solid #cbd5e1 !important;
    color: #0f172a !important;
    font-weight: 600 !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04) !important;
}

[data-theme="light"] .register-badge-top i {
    color: #0f172a !important;
}

/* FIX: Ensure Headline is 100% Bold Obsidian, never white */
[data-theme="light"] .register-title,
[data-theme="light"] .auth-sidebar-title,
[data-theme="light"] .register-sidebar-body .register-title {
    color: #0f172a !important;
    -webkit-text-fill-color: #0f172a !important;
    background: none !important;
    font-weight: 800 !important;
}

/* "with AI" in light mode: deep sleek slate gradient */
[data-theme="light"] .register-title .text-gradient-primary,
[data-theme="light"] .auth-sidebar-title .text-gradient-primary,
[data-theme="light"] .auth-title .text-gradient-primary {
    background: linear-gradient(135deg, #0f172a 0%, #334155 100%) !important;
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    text-shadow: none !important;
}

[data-theme="light"] .register-desc,
[data-theme="light"] .auth-sidebar-desc {
    color: #475569 !important;
    font-weight: 500 !important;
}

/* Floating Mockup Cards in Sidebar: Clean white cards */
[data-theme="light"] .float-card,
[data-theme="light"] .float-card.fc-pdf,
[data-theme="light"] .float-card.fc-ai,
[data-theme="light"] .float-card.fc-charts,
[data-theme="light"] .float-card.fc-research {
    background: #ffffff !important;
    border: 1px solid #cbd5e1 !important;
    color: #0f172a !important;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08) !important;
}

[data-theme="light"] .float-card.fc-pdf i {
    color: #ef4444 !important;
}

[data-theme="light"] .float-card.fc-charts i {
    color: #10b981 !important;
}

[data-theme="light"] .float-card.fc-ai i {
    color: #0f172a !important;
}

[data-theme="light"] .holo-core {
    background: #ffffff !important;
    border: 1px solid #cbd5e1 !important;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1) !important;
}

[data-theme="light"] .holo-brain {
    color: #0f172a !important;
}

/* Feature cards in sidebar */
[data-theme="light"] .feature-card-v {
    background: #ffffff !important;
    border: 1px solid #e2e8f0 !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04) !important;
}

[data-theme="light"] .feature-card-v h4 {
    color: #0f172a !important;
    font-weight: 700 !important;
}

[data-theme="light"] .feature-card-v p {
    color: #64748b !important;
}

[data-theme="light"] .feature-card-v .fc-icon {
    background: #f1f5f9 !important;
    border: 1px solid #e2e8f0 !important;
    color: #0f172a !important;
}

/* Right Content Area */
[data-theme="light"] .register-content,
[data-theme="light"] .auth-content {
    background: #f8fafc !important;
}

[data-theme="light"] .register-card,
[data-theme="light"] .auth-card {
    background: #ffffff !important;
    border: 1px solid #e2e8f0 !important;
    box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04) !important;
}

[data-theme="light"] .register-card::before,
[data-theme="light"] .auth-card::before {
    display: none !important;
}

[data-theme="light"] .auth-logo-circle {
    background: #f1f5f9 !important;
    border: 1px solid #e2e8f0 !important;
    color: #0f172a !important;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06) !important;
}

[data-theme="light"] .premium-logo-ring {
    border-color: rgba(15, 23, 42, 0.06) !important;
}

[data-theme="light"] .auth-welcome-back {
    color: #64748b !important;
    font-weight: 600 !important;
}

[data-theme="light"] .auth-title {
    color: #0f172a !important;
    -webkit-text-fill-color: #0f172a !important;
    font-weight: 800 !important;
}

/* Labels: 100% High-Contrast Obsidian */
[data-theme="light"] .register-card .standard-label,
[data-theme="light"] .register-card label,
[data-theme="light"] .auth-card .standard-label,
[data-theme="light"] .auth-card label,
[data-theme="light"] .standard-label {
    color: #0f172a !important;
    font-weight: 700 !important;
    font-size: 0.9rem !important;
    opacity: 1 !important;
}

/* Inputs: Crisp White Surface with Dark Slate Typed Text */
[data-theme="light"] .register-card .standard-input,
[data-theme="light"] .register-card input[type="text"],
[data-theme="light"] .register-card input[type="email"],
[data-theme="light"] .register-card input[type="password"],
[data-theme="light"] .auth-input,
[data-theme="light"] .standard-input {
    background: #ffffff !important;
    border: 1.5px solid #cbd5e1 !important;
    color: #0f172a !important;
    -webkit-text-fill-color: #0f172a !important;
    caret-color: #0f172a !important;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04) !important;
    font-size: 0.96rem !important;
}

[data-theme="light"] .register-card .standard-input:hover,
[data-theme="light"] .auth-input:hover {
    border-color: #94a3b8 !important;
}

[data-theme="light"] .register-card .standard-input:focus,
[data-theme="light"] .auth-input:focus {
    border-color: #0f172a !important;
    background: #ffffff !important;
    box-shadow: 0 0 0 4px rgba(15, 23, 42, 0.08) !important;
}

/* Input Placeholder */
[data-theme="light"] .register-card input::placeholder,
[data-theme="light"] .auth-input::placeholder {
    color: #94a3b8 !important;
    -webkit-text-fill-color: #94a3b8 !important;
    opacity: 1 !important;
}

/* Input Left Icons */
[data-theme="light"] .input-icon-left i,
[data-theme="light"] .register-card .input-icon-left i {
    color: #64748b !important;
}

/* Autofill: Force Pure White Background with Dark Slate Text in Light Mode */
[data-theme="light"] .register-card input:-webkit-autofill,
[data-theme="light"] .register-card input:-webkit-autofill:hover, 
[data-theme="light"] .register-card input:-webkit-autofill:focus, 
[data-theme="light"] .register-card input:-webkit-autofill:active,
[data-theme="light"] .auth-input:-webkit-autofill,
[data-theme="light"] .auth-input:-webkit-autofill:hover, 
[data-theme="light"] .auth-input:-webkit-autofill:focus, 
[data-theme="light"] .auth-input:-webkit-autofill:active,
[data-theme="light"] input:-internal-autofill-selected,
[data-theme="light"] input:autofill {
    -webkit-box-shadow: 0 0 0 1000px #ffffff inset !important;
    box-shadow: 0 0 0 1000px #ffffff inset !important;
    -webkit-text-fill-color: #0f172a !important;
    color: #0f172a !important;
    caret-color: #0f172a !important;
    border-color: #cbd5e1 !important;
    transition: background-color 5000s ease-in-out 0s !important;
}

/* Password Strength & Checklist Items: 100% Crystal-Clear Visibility */
[data-theme="light"] .strength-txt-prefix {
    color: #0f172a !important;
    font-weight: 700 !important;
    font-size: 0.86rem !important;
}

[data-theme="light"] .strength-status-text {
    font-weight: 800 !important;
}

[data-theme="light"] .strength-txt-suffix {
    color: #0f172a !important;
    font-weight: 700 !important;
    font-size: 0.86rem !important;
}

[data-theme="light"] .strength-bar {
    background: #e2e8f0 !important;
}

[data-theme="light"] .strength-helpers-inline {
    display: flex !important;
    flex-wrap: wrap !important;
    gap: 12px 16px !important;
    margin-top: 0.65rem !important;
}

[data-theme="light"] .strength-helpers-inline li,
[data-theme="light"] .register-card .strength-helpers-inline li {
    color: #1e293b !important;
    font-weight: 600 !important;
    font-size: 0.84rem !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 6px !important;
}

[data-theme="light"] .strength-helpers-inline li i,
[data-theme="light"] .register-card .strength-helpers-inline li i {
    color: #64748b !important;
    font-size: 0.95rem !important;
}

[data-theme="light"] .strength-helpers-inline li.valid,
[data-theme="light"] .register-card .strength-helpers-inline li.valid {
    color: #047857 !important;
    font-weight: 700 !important;
}

[data-theme="light"] .strength-helpers-inline li.valid i,
[data-theme="light"] .register-card .strength-helpers-inline li.valid i {
    color: #059669 !important;
    filter: drop-shadow(0 0 4px rgba(5, 150, 105, 0.4)) !important;
}

/* Terms Checkbox */
[data-theme="light"] .terms-text {
    color: #475569 !important;
    font-weight: 500 !important;
}

[data-theme="light"] .terms-text a {
    color: #0f172a !important;
    font-weight: 700 !important;
}

/* Buttons */
[data-theme="light"] .register-btn,
[data-theme="light"] .auth-btn,
[data-theme="light"] .btn-primary {
    background: #0f172a !important;
    color: #ffffff !important;
    border: none !important;
    font-weight: 700 !important;
    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.25) !important;
}

[data-theme="light"] .register-btn:hover,
[data-theme="light"] .auth-btn:hover,
[data-theme="light"] .btn-primary:hover {
    background: #1e293b !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.3) !important;
}

[data-theme="light"] .btn-social {
    background: #ffffff !important;
    border: 1px solid #cbd5e1 !important;
    color: #0f172a !important;
    font-weight: 600 !important;
}

[data-theme="light"] .btn-social:hover {
    background: #f8fafc !important;
    border-color: #94a3b8 !important;
}

[data-theme="light"] .social-svg-icon {
    filter: invert(0) !important;
}

[data-theme="light"] .auth-footer p {
    color: #64748b !important;
}

[data-theme="light"] .auth-footer-link {
    color: #0f172a !important;
    font-weight: 700 !important;
}


/* ------------------ MONOCHROMATIC DARK THEME PERFECT CONTRAST ------------------ */
[data-theme="dark"] .register-wrapper,
[data-theme="dark"] .auth-wrapper {
    background: #05070a !important;
    color: #ffffff !important;
}

[data-theme="dark"] .register-sidebar,
[data-theme="dark"] .auth-sidebar {
    background: linear-gradient(145deg, #0a0d14 0%, #05070a 100%) !important;
    border-right: 1px solid rgba(255, 255, 255, 0.06) !important;
}

[data-theme="dark"] .register-title,
[data-theme="dark"] .auth-sidebar-title {
    background: linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%) !important;
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
}

[data-theme="dark"] .register-desc,
[data-theme="dark"] .auth-sidebar-desc {
    color: #94a3b8 !important;
}

[data-theme="dark"] .register-content,
[data-theme="dark"] .auth-content {
    background: #05070a !important;
}

[data-theme="dark"] .register-card,
[data-theme="dark"] .auth-card {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.035) 0%, rgba(255, 255, 255, 0.008) 100%) !important;
    backdrop-filter: blur(28px) saturate(180%) !important;
    -webkit-backdrop-filter: blur(28px) saturate(180%) !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    box-shadow: inset 0 1px 1px 0 rgba(255, 255, 255, 0.18), 0 25px 60px -15px rgba(0, 0, 0, 0.85) !important;
}

[data-theme="dark"] .register-card::before,
[data-theme="dark"] .auth-card::before {
    display: none !important;
}

[data-theme="dark"] .auth-title {
    background: linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%) !important;
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
}

[data-theme="dark"] .register-card .standard-label,
[data-theme="dark"] .auth-card .standard-label,
[data-theme="dark"] .standard-label {
    color: #ffffff !important;
    font-weight: 600 !important;
}

[data-theme="dark"] .register-card .standard-input,
[data-theme="dark"] .auth-input,
[data-theme="dark"] .standard-input {
    background: rgba(255, 255, 255, 0.03) !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    color: #ffffff !important;
    -webkit-text-fill-color: #ffffff !important;
    caret-color: #ffffff !important;
}

[data-theme="dark"] .register-card input:-webkit-autofill,
[data-theme="dark"] .register-card input:-webkit-autofill:hover, 
[data-theme="dark"] .register-card input:-webkit-autofill:focus, 
[data-theme="dark"] .register-card input:-webkit-autofill:active,
[data-theme="dark"] .auth-input:-webkit-autofill,
[data-theme="dark"] .auth-input:-webkit-autofill:hover, 
[data-theme="dark"] .auth-input:-webkit-autofill:focus, 
[data-theme="dark"] .auth-input:-webkit-autofill:active,
[data-theme="dark"] input:-internal-autofill-selected,
[data-theme="dark"] input:autofill {
    -webkit-box-shadow: 0 0 0 1000px #111520 inset !important;
    box-shadow: 0 0 0 1000px #111520 inset !important;
    -webkit-text-fill-color: #ffffff !important;
    color: #ffffff !important;
    caret-color: #ffffff !important;
    transition: background-color 5000s ease-in-out 0s !important;
}

[data-theme="dark"] .strength-txt-prefix,
[data-theme="dark"] .strength-status-text,
[data-theme="dark"] .strength-txt-suffix {
    color: #ffffff !important;
    font-weight: 600 !important;
}

[data-theme="dark"] .strength-helpers-inline li {
    color: #ffffff !important;
    font-size: 0.82rem !important;
}

[data-theme="dark"] .strength-helpers-inline li i {
    color: #94a3b8 !important;
}

[data-theme="dark"] .strength-helpers-inline li.valid {
    color: #ffffff !important;
    font-weight: 600 !important;
}

[data-theme="dark"] .strength-helpers-inline li.valid i {
    color: #10b981 !important;
    filter: drop-shadow(0 0 6px rgba(16, 185, 129, 0.7)) !important;
}

[data-theme="dark"] .register-btn,
[data-theme="dark"] .auth-btn,
[data-theme="dark"] .btn-primary {
    background: #ffffff !important;
    color: #05070a !important;
    border: none !important;
    font-weight: 600 !important;
    box-shadow: 0 4px 16px rgba(255, 255, 255, 0.15) !important;
}

[data-theme="dark"] .register-btn:hover,
[data-theme="dark"] .auth-btn:hover,
[data-theme="dark"] .btn-primary:hover {
    background: #e2e8f0 !important;
    color: #000000 !important;
    transform: translateY(-2px) !important;
}

[data-theme="dark"] .btn-social {
    background: rgba(255, 255, 255, 0.04) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    color: #ffffff !important;
}

[data-theme="dark"] .social-svg-icon {
    filter: invert(1) !important;
}
`;

regCss += '\n' + ultimateVisibilityRules;
fs.writeFileSync(regCssPath, regCss, 'utf8');
console.log('Appended ultimate visibility rules to register.css!');

// Also append to auth.css to ensure login.html has exact same high contrast
const authCssPath = path.join(projectRoot, 'assets', 'css', 'auth.css');
let authCss = fs.readFileSync(authCssPath, 'utf8');
authCss += '\n' + ultimateVisibilityRules;
fs.writeFileSync(authCssPath, authCss, 'utf8');
console.log('Appended ultimate visibility rules to auth.css!');
