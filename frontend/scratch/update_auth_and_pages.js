const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

// 1. UPDATE auth.css WITH COMPLETE LIGHT AND MONOCHROMATIC DARK THEMES
const authCssPath = path.join(projectRoot, 'assets', 'css', 'auth.css');
let authCss = fs.readFileSync(authCssPath, 'utf8');

const authThemeStyles = `
/* ==========================================================================
   LIGHT THEME & MONOCHROMATIC DARK THEME OVERRIDES FOR AUTH (LOGIN / REGISTER)
   ========================================================================== */

/* --- 1. LIGHT THEME OVERRIDES --- */
[data-theme="light"] .auth-wrapper {
  background: #f8fafc !important;
  color: #0f172a !important;
}

[data-theme="light"] .auth-sidebar {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%) !important;
  border-right: 1px solid #e2e8f0 !important;
  color: #0f172a !important;
}

[data-theme="light"] .auth-sidebar-glow-1,
[data-theme="light"] .auth-sidebar-glow-2,
[data-theme="light"] .auth-content-glow-1,
[data-theme="light"] .auth-content-glow-2 {
  display: none !important;
}

[data-theme="light"] .auth-sidebar-title {
  color: #0f172a !important;
  -webkit-text-fill-color: #0f172a !important;
  background: none !important;
}

[data-theme="light"] .auth-sidebar-desc {
  color: #475569 !important;
}

[data-theme="light"] .auth-illustration-canvas {
  background: rgba(255, 255, 255, 0.8) !important;
  border: 1px solid #e2e8f0 !important;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05) !important;
}

[data-theme="light"] .canvas-core-icon {
  background: #0f172a !important;
  color: #ffffff !important;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.2) !important;
}

[data-theme="light"] .floating-glass-card {
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
  color: #0f172a !important;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06) !important;
}

[data-theme="light"] .float-card-title {
  color: #0f172a !important;
}

[data-theme="light"] .float-card-desc {
  color: #64748b !important;
}

[data-theme="light"] .highlight-icon {
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
  color: #0f172a !important;
}

[data-theme="light"] .highlight-text {
  color: #334155 !important;
}

[data-theme="light"] .auth-sidebar-footer {
  color: #64748b !important;
}

[data-theme="light"] .auth-content {
  background: #f8fafc !important;
  background-image: radial-gradient(rgba(0, 0, 0, 0.04) 1px, transparent 1px) !important;
  background-size: 24px 24px !important;
}

[data-theme="light"] .auth-card {
  background: rgba(255, 255, 255, 0.95) !important;
  border: 1px solid #e2e8f0 !important;
  box-shadow: 0 20px 45px -10px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04) !important;
  backdrop-filter: blur(20px) !important;
  -webkit-backdrop-filter: blur(20px) !important;
}

[data-theme="light"] .auth-card::before {
  display: none !important;
}

[data-theme="light"] .auth-logo-circle {
  background: #f1f5f9 !important;
  border: 1px solid #e2e8f0 !important;
  color: #0f172a !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05) !important;
}

[data-theme="light"] .auth-welcome-back {
  color: #0f172a !important;
}

[data-theme="light"] .auth-welcome-sub {
  color: #64748b !important;
}

[data-theme="light"] .auth-title {
  color: #0f172a !important;
  -webkit-text-fill-color: #0f172a !important;
  background: none !important;
}

[data-theme="light"] .floating-label,
[data-theme="light"] .standard-label {
  color: #1e293b !important;
  font-weight: 600 !important;
}

[data-theme="light"] .input-icon-left {
  color: #64748b !important;
}

[data-theme="light"] .auth-input {
  background: #ffffff !important;
  border: 1px solid #cbd5e1 !important;
  color: #0f172a !important;
}

[data-theme="light"] .auth-input:hover {
  border-color: #94a3b8 !important;
}

[data-theme="light"] .auth-input:focus {
  border-color: #0f172a !important;
  box-shadow: 0 0 0 4px rgba(15, 23, 42, 0.08) !important;
}

/* Bulletproof Autofill in Light Mode */
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
  transition: background-color 5000s ease-in-out 0s !important;
}

[data-theme="light"] .password-toggle {
  color: #64748b !important;
}

[data-theme="light"] .password-toggle:hover {
  color: #0f172a !important;
}

[data-theme="light"] .remember-me span {
  color: #475569 !important;
}

[data-theme="light"] .forgot-password {
  color: #0f172a !important;
  font-weight: 500 !important;
}

[data-theme="light"] .forgot-password:hover {
  color: #475569 !important;
}

[data-theme="light"] .btn-primary.auth-btn {
  background: #0f172a !important;
  color: #ffffff !important;
  border: none !important;
  font-weight: 600 !important;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.2) !important;
}

[data-theme="light"] .btn-primary.auth-btn:hover {
  background: #1e293b !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.25) !important;
}

[data-theme="light"] .auth-divider span {
  background: #ffffff !important;
  color: #94a3b8 !important;
}

[data-theme="light"] .auth-divider::before,
[data-theme="light"] .auth-divider::after {
  background: #e2e8f0 !important;
}

[data-theme="light"] .btn-social {
  background: #ffffff !important;
  border: 1px solid #cbd5e1 !important;
  color: #0f172a !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04) !important;
}

[data-theme="light"] .btn-social:hover {
  background: #f8fafc !important;
  border-color: #94a3b8 !important;
}

[data-theme="light"] .btn-social i {
  color: #0f172a !important;
}

[data-theme="light"] .trust-badge {
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
  color: #334155 !important;
}

[data-theme="light"] .auth-footer p {
  color: #64748b !important;
}

[data-theme="light"] .auth-footer-link {
  color: #0f172a !important;
  font-weight: 600 !important;
}


/* --- 2. MONOCHROMATIC DARK THEME OVERRIDES --- */
[data-theme="dark"] .auth-wrapper {
  background: #05070a !important;
  color: #ffffff !important;
}

[data-theme="dark"] .auth-sidebar {
  background: linear-gradient(145deg, #0a0d14 0%, #05070a 100%) !important;
  border-right: 1px solid rgba(255, 255, 255, 0.06) !important;
  color: #ffffff !important;
}

[data-theme="dark"] .auth-sidebar-glow-1,
[data-theme="dark"] .auth-sidebar-glow-2,
[data-theme="dark"] .auth-content-glow-1,
[data-theme="dark"] .auth-content-glow-2 {
  display: none !important;
}

[data-theme="dark"] .auth-sidebar-title {
  background: linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%) !important;
  -webkit-background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
}

[data-theme="dark"] .auth-sidebar-desc {
  color: #94a3b8 !important;
}

[data-theme="dark"] .auth-illustration-canvas {
  background: rgba(255, 255, 255, 0.03) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
}

[data-theme="dark"] .canvas-core-icon {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.04) 100%) !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  color: #ffffff !important;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.25), 0 4px 16px rgba(0, 0, 0, 0.5) !important;
}

[data-theme="dark"] .floating-glass-card {
  background: rgba(255, 255, 255, 0.035) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  color: #ffffff !important;
  backdrop-filter: blur(20px) !important;
}

[data-theme="dark"] .float-card-title {
  color: #ffffff !important;
}

[data-theme="dark"] .float-card-desc {
  color: #94a3b8 !important;
}

[data-theme="dark"] .highlight-icon {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: #ffffff !important;
}

[data-theme="dark"] .highlight-text {
  color: #cbd5e1 !important;
}

[data-theme="dark"] .auth-content {
  background: #05070a !important;
  background-image: radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px) !important;
  background-size: 24px 24px !important;
}

[data-theme="dark"] .auth-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.035) 0%, rgba(255, 255, 255, 0.008) 100%) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  box-shadow: inset 0 1px 1px 0 rgba(255, 255, 255, 0.18), 0 25px 60px -15px rgba(0, 0, 0, 0.85) !important;
  backdrop-filter: blur(28px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(28px) saturate(180%) !important;
}

[data-theme="dark"] .auth-card::before {
  display: none !important;
}

[data-theme="dark"] .auth-logo-circle {
  background: rgba(255, 255, 255, 0.06) !important;
  border: 1px solid rgba(255, 255, 255, 0.14) !important;
  color: #ffffff !important;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.2) !important;
}

[data-theme="dark"] .auth-welcome-back {
  color: #ffffff !important;
}

[data-theme="dark"] .auth-welcome-sub {
  color: #94a3b8 !important;
}

[data-theme="dark"] .auth-title {
  background: linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%) !important;
  -webkit-background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
}

[data-theme="dark"] .floating-label,
[data-theme="dark"] .standard-label {
  color: #e2e8f0 !important;
}

[data-theme="dark"] .input-icon-left {
  color: #94a3b8 !important;
}

[data-theme="dark"] .auth-input {
  background: rgba(255, 255, 255, 0.03) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  color: #ffffff !important;
}

[data-theme="dark"] .auth-input:hover {
  background: rgba(255, 255, 255, 0.05) !important;
  border-color: rgba(255, 255, 255, 0.16) !important;
}

[data-theme="dark"] .auth-input:focus {
  background: rgba(255, 255, 255, 0.07) !important;
  border-color: rgba(255, 255, 255, 0.3) !important;
  box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.08) !important;
}

/* Bulletproof Autofill in Dark Mode */
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

[data-theme="dark"] .password-toggle {
  color: #94a3b8 !important;
}

[data-theme="dark"] .password-toggle:hover {
  color: #ffffff !important;
}

[data-theme="dark"] .remember-me span {
  color: #cbd5e1 !important;
}

[data-theme="dark"] .forgot-password {
  color: #cbd5e1 !important;
}

[data-theme="dark"] .forgot-password:hover {
  color: #ffffff !important;
}

[data-theme="dark"] .btn-primary.auth-btn {
  background: #ffffff !important;
  color: #05070a !important;
  border: none !important;
  font-weight: 600 !important;
  box-shadow: 0 4px 16px rgba(255, 255, 255, 0.15) !important;
}

[data-theme="dark"] .btn-primary.auth-btn:hover {
  background: #e2e8f0 !important;
  color: #000000 !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 8px 26px rgba(255, 255, 255, 0.25) !important;
}

[data-theme="dark"] .auth-divider span {
  background: #05070a !important;
  color: #94a3b8 !important;
}

[data-theme="dark"] .auth-divider::before,
[data-theme="dark"] .auth-divider::after {
  background: rgba(255, 255, 255, 0.1) !important;
}

[data-theme="dark"] .btn-social {
  background: rgba(255, 255, 255, 0.04) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: #ffffff !important;
}

[data-theme="dark"] .btn-social:hover {
  background: rgba(255, 255, 255, 0.08) !important;
  border-color: rgba(255, 255, 255, 0.2) !important;
}

[data-theme="dark"] .btn-social i {
  color: #ffffff !important;
}

[data-theme="dark"] .trust-badge {
  background: rgba(255, 255, 255, 0.04) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  color: #cbd5e1 !important;
}

[data-theme="dark"] .auth-footer p {
  color: #94a3b8 !important;
}

[data-theme="dark"] .auth-footer-link {
  color: #ffffff !important;
  font-weight: 600 !important;
}

/* Floating Auth Page Theme Switch Header */
.auth-theme-header-bar {
  position: absolute;
  top: 1.5rem;
  right: 2rem;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 1rem;
}
`;

// Append theme styles to auth.css if not already present
if (!authCss.includes('LIGHT THEME & MONOCHROMATIC DARK THEME OVERRIDES FOR AUTH')) {
  authCss += '\n' + authThemeStyles;
  fs.writeFileSync(authCssPath, authCss, 'utf8');
  console.log('Successfully updated auth.css with Light and Monochromatic Dark theme rules!');
}

// 2. UPDATE register.css WITH COMPLETE LIGHT AND DARK THEME CHECKLIST RULES
const registerCssPath = path.join(projectRoot, 'assets', 'css', 'register.css');
let registerCss = fs.readFileSync(registerCssPath, 'utf8');

const registerThemeStyles = `
/* ==========================================================================
   REGISTER PAGE: LIGHT & MONOCHROMATIC DARK THEME CHECKLIST & INPUT PERFECTION
   ========================================================================== */

/* --- LIGHT THEME REGISTER --- */
[data-theme="light"] .register-wrapper {
  background: #f8fafc !important;
  color: #0f172a !important;
}

[data-theme="light"] .register-sidebar {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%) !important;
  border-right: 1px solid #e2e8f0 !important;
  color: #0f172a !important;
}

[data-theme="light"] .register-badge-top {
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
  color: #0f172a !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04) !important;
}

[data-theme="light"] .register-title {
  color: #0f172a !important;
  -webkit-text-fill-color: #0f172a !important;
}

[data-theme="light"] .register-desc {
  color: #475569 !important;
}

[data-theme="light"] .float-card {
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
  color: #0f172a !important;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06) !important;
}

[data-theme="light"] .feature-card-v {
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
  color: #0f172a !important;
}

[data-theme="light"] .feature-card-v h4 {
  color: #0f172a !important;
}

[data-theme="light"] .feature-card-v p {
  color: #64748b !important;
}

[data-theme="light"] .register-content {
  background: #f8fafc !important;
}

[data-theme="light"] .register-card {
  background: rgba(255, 255, 255, 0.95) !important;
  border: 1px solid #e2e8f0 !important;
  box-shadow: 0 20px 45px -10px rgba(0, 0, 0, 0.08) !important;
}

[data-theme="light"] .register-card::before {
  display: none !important;
}

[data-theme="light"] .standard-label {
  color: #0f172a !important;
  font-weight: 600 !important;
}

[data-theme="light"] .standard-input {
  background: #ffffff !important;
  border: 1px solid #cbd5e1 !important;
  color: #0f172a !important;
}

[data-theme="light"] .standard-input:-webkit-autofill,
[data-theme="light"] .standard-input:-webkit-autofill:hover, 
[data-theme="light"] .standard-input:-webkit-autofill:focus, 
[data-theme="light"] .standard-input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 1000px #ffffff inset !important;
  box-shadow: 0 0 0 1000px #ffffff inset !important;
  -webkit-text-fill-color: #0f172a !important;
  color: #0f172a !important;
  caret-color: #0f172a !important;
  transition: background-color 5000s ease-in-out 0s !important;
}

/* Password Strength & Requirements Visibility in LIGHT THEME */
[data-theme="light"] .strength-txt-prefix {
  color: #0f172a !important;
  font-weight: 600 !important;
}

[data-theme="light"] .strength-status-text {
  color: #0f172a !important;
  font-weight: 700 !important;
}

[data-theme="light"] .strength-txt-suffix {
  color: #0f172a !important;
  font-weight: 600 !important;
}

[data-theme="light"] .strength-bar {
  background: #e2e8f0 !important;
}

[data-theme="light"] .strength-helpers-inline li {
  color: #334155 !important;
  font-weight: 500 !important;
  font-size: 0.82rem !important;
}

[data-theme="light"] .strength-helpers-inline li i {
  color: #64748b !important;
}

[data-theme="light"] .strength-helpers-inline li.valid {
  color: #047857 !important;
  font-weight: 600 !important;
}

[data-theme="light"] .strength-helpers-inline li.valid i {
  color: #059669 !important;
}

[data-theme="light"] .terms-text {
  color: #475569 !important;
}

[data-theme="light"] .terms-text a {
  color: #0f172a !important;
  font-weight: 600 !important;
}

[data-theme="light"] .register-btn {
  background: #0f172a !important;
  color: #ffffff !important;
  border: none !important;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.2) !important;
}

[data-theme="light"] .register-btn:hover {
  background: #1e293b !important;
  transform: translateY(-2px) !important;
}

/* --- MONOCHROMATIC DARK THEME REGISTER --- */
[data-theme="dark"] .register-wrapper {
  background: #05070a !important;
  color: #ffffff !important;
}

[data-theme="dark"] .register-sidebar {
  background: linear-gradient(145deg, #0a0d14 0%, #05070a 100%) !important;
  border-right: 1px solid rgba(255, 255, 255, 0.06) !important;
  color: #ffffff !important;
}

[data-theme="dark"] .register-badge-top {
  background: rgba(255, 255, 255, 0.06) !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  color: #ffffff !important;
}

[data-theme="dark"] .register-title {
  background: linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%) !important;
  -webkit-background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
}

[data-theme="dark"] .register-desc {
  color: #94a3b8 !important;
}

[data-theme="dark"] .float-card {
  background: rgba(255, 255, 255, 0.04) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: #ffffff !important;
}

[data-theme="dark"] .feature-card-v {
  background: rgba(255, 255, 255, 0.035) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  color: #ffffff !important;
}

[data-theme="dark"] .feature-card-v h4 {
  color: #ffffff !important;
}

[data-theme="dark"] .feature-card-v p {
  color: #94a3b8 !important;
}

[data-theme="dark"] .register-content {
  background: #05070a !important;
}

[data-theme="dark"] .register-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.035) 0%, rgba(255, 255, 255, 0.008) 100%) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  box-shadow: inset 0 1px 1px 0 rgba(255, 255, 255, 0.18), 0 25px 60px -15px rgba(0, 0, 0, 0.85) !important;
  backdrop-filter: blur(28px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(28px) saturate(180%) !important;
}

[data-theme="dark"] .register-card::before {
  display: none !important;
}

[data-theme="dark"] .standard-label {
  color: #ffffff !important;
  font-weight: 600 !important;
}

[data-theme="dark"] .standard-input {
  background: rgba(255, 255, 255, 0.03) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  color: #ffffff !important;
}

[data-theme="dark"] .standard-input:-webkit-autofill,
[data-theme="dark"] .standard-input:-webkit-autofill:hover, 
[data-theme="dark"] .standard-input:-webkit-autofill:focus, 
[data-theme="dark"] .standard-input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 1000px #111520 inset !important;
  box-shadow: 0 0 0 1000px #111520 inset !important;
  -webkit-text-fill-color: #ffffff !important;
  color: #ffffff !important;
  caret-color: #ffffff !important;
  transition: background-color 5000s ease-in-out 0s !important;
}

/* Password Strength & Requirements Visibility in DARK THEME */
[data-theme="dark"] .strength-txt-prefix {
  color: #ffffff !important;
  font-weight: 600 !important;
}

[data-theme="dark"] .strength-status-text {
  color: #ffffff !important;
  font-weight: 700 !important;
}

[data-theme="dark"] .strength-txt-suffix {
  color: #ffffff !important;
  font-weight: 600 !important;
}

[data-theme="dark"] .strength-bar {
  background: rgba(255, 255, 255, 0.08) !important;
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

[data-theme="dark"] .terms-text {
  color: #cbd5e1 !important;
}

[data-theme="dark"] .terms-text a {
  color: #ffffff !important;
}

[data-theme="dark"] .register-btn {
  background: #ffffff !important;
  color: #05070a !important;
  border: none !important;
  box-shadow: 0 4px 16px rgba(255, 255, 255, 0.15) !important;
}

[data-theme="dark"] .register-btn:hover {
  background: #e2e8f0 !important;
  color: #000000 !important;
  transform: translateY(-2px) !important;
}
`;

if (!registerCss.includes('REGISTER PAGE: LIGHT & MONOCHROMATIC DARK THEME CHECKLIST')) {
  registerCss += '\n' + registerThemeStyles;
  fs.writeFileSync(registerCssPath, registerCss, 'utf8');
  console.log('Successfully updated register.css with Light and Monochromatic Dark theme checklist rules!');
}
