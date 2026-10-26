const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

// 1. UPDATE style.css
const styleCssPath = path.join(projectRoot, 'assets', 'css', 'style.css');
let styleCss = fs.readFileSync(styleCssPath, 'utf8');

// Replace the [data-theme="dark"] section in style.css with the comprehensive monochromatic design system
const darkThemeReplacement = `/* ==========================================================================
   GLOBAL DARK THEME - MONOCHROMATIC OBSIDIAN & HIGH-TRANSPARENCY GLASS
   ========================================================================== */
[data-theme="dark"] {
  /* Core Monochromatic Palette */
  --primary: #ffffff;
  --primary-hover: #e2e8f0;
  --primary-light: rgba(255, 255, 255, 0.05);
  --primary-glow: rgba(255, 255, 255, 0.15);

  --secondary: #94a3b8;
  --secondary-hover: #cbd5e1;
  --secondary-light: rgba(255, 255, 255, 0.04);

  --accent: #cbd5e1;
  --accent-hover: #ffffff;
  --accent-light: rgba(255, 255, 255, 0.06);

  /* Deep Black, Charcoal & Dark Graphite Surfaces */
  --bg-main: #05070a;
  --bg-surface: #0a0d14;
  --bg-subtle: #10141d;
  --bg-dark: #000000;
  --bg-card: rgba(255, 255, 255, 0.025);

  /* Soft White & Platinum / Silver Typography */
  --text-primary: #ffffff;
  --text-secondary: #cbd5e1;
  --text-muted: #94a3b8;
  --text-white: #ffffff;

  /* Borders & Dividers */
  --border-light: rgba(255, 255, 255, 0.08);
  --border-color: rgba(255, 255, 255, 0.08);
  --border-hover: rgba(255, 255, 255, 0.2);
  --border-focus: rgba(255, 255, 255, 0.35);

  /* High-Transparency Glossy Glassmorphism Effect */
  --glass-bg: rgba(255, 255, 255, 0.025);
  --glass-border: 1px solid rgba(255, 255, 255, 0.08);
  --glass-shadow: inset 0 1px 1px 0 rgba(255, 255, 255, 0.18), 0 20px 50px -15px rgba(0, 0, 0, 0.75);
  --glass-blur: blur(28px) saturate(180%);
  --shadow-glow: 0 0 25px rgba(255, 255, 255, 0.08);
}

[data-theme="dark"] body {
  background-color: #05070a !important;
  color: #ffffff !important;
}

[data-theme="dark"] a {
  color: #cbd5e1;
}

[data-theme="dark"] a:hover {
  color: #ffffff;
}

[data-theme="dark"] .text-primary {
  color: #ffffff !important;
}

[data-theme="dark"] .text-secondary {
  color: #cbd5e1 !important;
}

[data-theme="dark"] .text-muted {
  color: #94a3b8 !important;
}

/* Monochromatic Platinum Silver Text Gradient */
[data-theme="dark"] .text-gradient,
[data-theme="dark"] .text-gradient-primary {
  background: linear-gradient(180deg, #ffffff 0%, #cbd5e1 55%, #94a3b8 100%) !important;
  -webkit-background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
  background-clip: text !important;
}

/* Reusable Frosted Glass Section Badges */
[data-theme="dark"] .section-badge {
  background: rgba(255, 255, 255, 0.04) !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  color: #e2e8f0 !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15) !important;
}

[data-theme="dark"] .section-badge i {
  color: #cbd5e1 !important;
}

[data-theme="dark"] .section-title {
  color: #ffffff !important;
}

[data-theme="dark"] .section-subheading {
  color: #94a3b8 !important;
}

/* Sticky Header & Navbar */
[data-theme="dark"] .header {
  background: rgba(5, 7, 10, 0.78) !important;
  backdrop-filter: blur(24px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(24px) saturate(180%) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
}

[data-theme="dark"] .logo-icon {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0.04) 100%) !important;
  border: 1px solid rgba(255, 255, 255, 0.16) !important;
  color: #ffffff !important;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.25), 0 4px 16px rgba(0, 0, 0, 0.5) !important;
}

[data-theme="dark"] .logo-text {
  color: #ffffff !important;
}

[data-theme="dark"] .logo-accent {
  background: linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%) !important;
  -webkit-background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
  font-weight: 300 !important;
}

[data-theme="dark"] .nav-link {
  color: #cbd5e1 !important;
}

[data-theme="dark"] .nav-link:hover,
[data-theme="dark"] .nav-link.active {
  color: #ffffff !important;
  background-color: rgba(255, 255, 255, 0.06) !important;
}

[data-theme="dark"] .nav-lang-pill {
  background: rgba(255, 255, 255, 0.04) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: #f1f5f9 !important;
  backdrop-filter: blur(14px) !important;
  -webkit-backdrop-filter: blur(14px) !important;
}

[data-theme="dark"] .nav-lang-pill:hover {
  background: rgba(255, 255, 255, 0.1) !important;
  border-color: rgba(255, 255, 255, 0.2) !important;
  color: #ffffff !important;
}

/* Monochromatic Buttons */
[data-theme="dark"] .btn-primary,
[data-theme="dark"] .nav-cta,
[data-theme="dark"] .btn-add-testi {
  background: #ffffff !important;
  color: #05070a !important;
  border: none !important;
  font-weight: 600 !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 4px 20px rgba(255, 255, 255, 0.15) !important;
  transition: all 0.25s ease !important;
}

[data-theme="dark"] .btn-primary:hover,
[data-theme="dark"] .nav-cta:hover,
[data-theme="dark"] .btn-add-testi:hover {
  background: #e2e8f0 !important;
  color: #000000 !important;
  box-shadow: inset 0 1px 0 #ffffff, 0 8px 30px rgba(255, 255, 255, 0.25) !important;
  transform: translateY(-2px) !important;
}

[data-theme="dark"] .btn-outline {
  background: rgba(255, 255, 255, 0.04) !important;
  border: 1px solid rgba(255, 255, 255, 0.14) !important;
  color: #f1f5f9 !important;
  backdrop-filter: blur(14px) !important;
  -webkit-backdrop-filter: blur(14px) !important;
}

[data-theme="dark"] .btn-outline:hover {
  background: rgba(255, 255, 255, 0.1) !important;
  border-color: rgba(255, 255, 255, 0.28) !important;
  color: #ffffff !important;
}

[data-theme="dark"] .btn-secondary {
  background: rgba(255, 255, 255, 0.08) !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  color: #ffffff !important;
}

[data-theme="dark"] .btn-secondary:hover {
  background: rgba(255, 255, 255, 0.14) !important;
  border-color: rgba(255, 255, 255, 0.25) !important;
}

/* Back To Top Floating Glass Button */
[data-theme="dark"] .back-to-top {
  background: rgba(255, 255, 255, 0.08) !important;
  backdrop-filter: blur(20px) !important;
  -webkit-backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(255, 255, 255, 0.18) !important;
  color: #ffffff !important;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.25), 0 12px 30px rgba(0, 0, 0, 0.6) !important;
}

[data-theme="dark"] .back-to-top:hover {
  background: #ffffff !important;
  color: #05070a !important;
  box-shadow: 0 15px 35px rgba(255, 255, 255, 0.25) !important;
  transform: translateY(-4px) scale(1.05) !important;
}

/* Ambient Subtle Background Halos (No Blue/Purple Saturation) */
[data-theme="dark"] .ambient-glow-1 {
  background: radial-gradient(circle, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0) 70%) !important;
}

[data-theme="dark"] .ambient-glow-2 {
  background: radial-gradient(circle, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0) 70%) !important;
}

[data-theme="dark"] .ambient-glow-3 {
  background: radial-gradient(circle, rgba(255, 255, 255, 0.025) 0%, rgba(255, 255, 255, 0) 70%) !important;
}

/* High-Transparency Glassmorphism Cards */
[data-theme="dark"] .card-glass,
[data-theme="dark"] .stat-card,
[data-theme="dark"] .feature-card,
[data-theme="dark"] .step-card,
[data-theme="dark"] .faq-item,
[data-theme="dark"] .user-testi-card,
[data-theme="dark"] .empty-testimonials-box,
[data-theme="dark"] .newsletter-container {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.035) 0%, rgba(255, 255, 255, 0.008) 100%) !important;
  backdrop-filter: blur(28px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(28px) saturate(180%) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  box-shadow: inset 0 1px 1px 0 rgba(255, 255, 255, 0.18), inset 0 0 20px rgba(255, 255, 255, 0.01), 0 20px 50px -15px rgba(0, 0, 0, 0.75) !important;
  transition: transform 0.3s cubic-bezier(0.2, 0.9, 0.3, 1), box-shadow 0.3s ease, border-color 0.3s ease !important;
}

[data-theme="dark"] .card-hover:hover,
[data-theme="dark"] .stat-card:hover,
[data-theme="dark"] .feature-card:hover,
[data-theme="dark"] .step-card:hover,
[data-theme="dark"] .user-testi-card:hover {
  transform: translateY(-5px) !important;
  border-color: rgba(255, 255, 255, 0.22) !important;
  box-shadow: inset 0 1px 2px 0 rgba(255, 255, 255, 0.35), inset 0 0 25px rgba(255, 255, 255, 0.02), 0 25px 60px -15px rgba(0, 0, 0, 0.9) !important;
}

/* Statistics Section Overhaul */
[data-theme="dark"] .stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  color: #ffffff !important;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.2) !important;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  margin: 0 auto 1.25rem auto;
  transition: all 0.25s ease !important;
}

[data-theme="dark"] .stat-card:hover .stat-icon {
  background: rgba(255, 255, 255, 0.12) !important;
  border-color: rgba(255, 255, 255, 0.25) !important;
  color: #ffffff !important;
  transform: scale(1.08) !important;
}

[data-theme="dark"] .stat-number {
  font-size: 2.75rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1;
  font-family: var(--font-family);
  background: linear-gradient(180deg, #ffffff 0%, #e2e8f0 55%, #94a3b8 100%) !important;
  -webkit-background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
  background-clip: text !important;
}

[data-theme="dark"] .stat-label {
  font-size: 0.95rem;
  font-weight: 600;
  color: #94a3b8 !important;
  margin-bottom: 1.25rem;
}

[data-theme="dark"] .stat-bar {
  background: rgba(255, 255, 255, 0.06) !important;
  border: 1px solid rgba(255, 255, 255, 0.04) !important;
}

[data-theme="dark"] .stat-bar-fill.fill-1,
[data-theme="dark"] .stat-bar-fill.fill-2,
[data-theme="dark"] .stat-bar-fill.fill-3,
[data-theme="dark"] .stat-bar-fill.fill-4 {
  background: linear-gradient(90deg, #ffffff 0%, #cbd5e1 50%, #64748b 100%) !important;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.2) !important;
}

/* Hero Showcase Monochromatic Dark Glass */
[data-theme="dark"] .hero-showcase-card {
  background: linear-gradient(145deg, rgba(14, 18, 26, 0.92) 0%, rgba(6, 8, 12, 0.98) 100%) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  box-shadow: inset 0 1px 1px 0 rgba(255, 255, 255, 0.15), inset 0 0 40px rgba(255, 255, 255, 0.01), 0 40px 100px -20px rgba(0, 0, 0, 0.85) !important;
}

[data-theme="dark"] .hero-card-ambient-shine {
  background: radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0) 70%) !important;
}

[data-theme="dark"] .hero-nav-arrow {
  background: rgba(255, 255, 255, 0.08) !important;
  border-color: rgba(255, 255, 255, 0.15) !important;
  color: #ffffff !important;
}

[data-theme="dark"] .hero-nav-arrow:hover {
  background: rgba(255, 255, 255, 0.18) !important;
  border-color: rgba(255, 255, 255, 0.3) !important;
}

[data-theme="dark"] .pub-badge {
  background: rgba(255, 255, 255, 0.06) !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  color: #ffffff !important;
}

[data-theme="dark"] .pub-badge:hover {
  background: rgba(255, 255, 255, 0.14) !important;
  border-color: rgba(255, 255, 255, 0.25) !important;
}

[data-theme="dark"] .btn-learn-pill {
  background: #ffffff !important;
  color: #05070a !important;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5) !important;
}

[data-theme="dark"] .btn-learn-pill:hover {
  background: #e2e8f0 !important;
}

[data-theme="dark"] .glass-feature-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.015) 100%) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(20px) !important;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.2), 0 20px 45px -10px rgba(0, 0, 0, 0.5) !important;
}

[data-theme="dark"] .float-widget-badge {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  backdrop-filter: blur(18px) !important;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.18), 0 12px 30px rgba(0, 0, 0, 0.4) !important;
}

[data-theme="dark"] .walk-glass {
  background: rgba(255, 255, 255, 0.06) !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
}

[data-theme="dark"] .score-glass {
  background: #ffffff !important;
  color: #0a0d14 !important;
}

[data-theme="dark"] .phone-bottom-card {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

/* Features Section Overhaul */
[data-theme="dark"] .feature-title {
  color: #ffffff !important;
}

[data-theme="dark"] .feature-desc {
  color: #cbd5e1 !important;
}

[data-theme="dark"] .feature-card::before {
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent) !important;
}

[data-theme="dark"] .icon-gradient-1,
[data-theme="dark"] .icon-gradient-2,
[data-theme="dark"] .icon-gradient-3,
[data-theme="dark"] .icon-gradient-4,
[data-theme="dark"] .icon-gradient-5,
[data-theme="dark"] .icon-gradient-6 {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.03) 100%) !important;
  border: 1px solid rgba(255, 255, 255, 0.14) !important;
  color: #ffffff !important;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.25), 0 8px 20px rgba(0, 0, 0, 0.4) !important;
}

/* Steps Section Overhaul */
[data-theme="dark"] .step-title {
  color: #ffffff !important;
}

[data-theme="dark"] .step-desc {
  color: #cbd5e1 !important;
}

[data-theme="dark"] .step-icon-num {
  background: linear-gradient(180deg, #ffffff 0%, #cbd5e1 55%, #64748b 100%) !important;
  -webkit-background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
}

/* Testimonials Section */
[data-theme="dark"] .empty-icon-wrap {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  color: #ffffff !important;
}

[data-theme="dark"] .empty-title {
  color: #ffffff !important;
}

[data-theme="dark"] .empty-desc {
  color: #cbd5e1 !important;
}

[data-theme="dark"] .empty-testimonials-box .btn-secondary {
  background: rgba(255, 255, 255, 0.08) !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  color: #ffffff !important;
}

[data-theme="dark"] .star-pick.active,
[data-theme="dark"] .testi-card-stars .fa-star {
  color: #f8fafc !important;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.4) !important;
}

[data-theme="dark"] .testimonial-modal-card {
  background: rgba(10, 14, 20, 0.92) !important;
  backdrop-filter: blur(36px) saturate(190%) !important;
  -webkit-backdrop-filter: blur(36px) saturate(190%) !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.25), 0 35px 80px rgba(0, 0, 0, 0.85) !important;
}

[data-theme="dark"] .testi-input,
[data-theme="dark"] .testi-textarea {
  background: rgba(255, 255, 255, 0.03) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: #ffffff !important;
}

[data-theme="dark"] .testi-input:focus,
[data-theme="dark"] .testi-textarea:focus {
  border-color: rgba(255, 255, 255, 0.3) !important;
  background: rgba(255, 255, 255, 0.06) !important;
}

/* FAQ Section */
[data-theme="dark"] .faq-question {
  color: #ffffff !important;
}

[data-theme="dark"] .faq-answer {
  color: #cbd5e1 !important;
}

[data-theme="dark"] .faq-icon-wrapper {
  background: rgba(255, 255, 255, 0.05) !important;
  color: #ffffff !important;
}

[data-theme="dark"] .faq-item.active {
  border-left: 3px solid #ffffff !important;
  border-color: rgba(255, 255, 255, 0.25) !important;
  box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.25), 0 20px 45px -10px rgba(0, 0, 0, 0.8) !important;
}

/* Newsletter Section */
[data-theme="dark"] .newsletter-container {
  background: linear-gradient(145deg, rgba(16, 20, 28, 0.85) 0%, rgba(8, 10, 15, 0.95) 100%) !important;
  backdrop-filter: blur(32px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(32px) saturate(180%) !important;
  border: 1px solid rgba(255, 255, 255, 0.09) !important;
  box-shadow: inset 0 1px 1px 0 rgba(255, 255, 255, 0.18), 0 35px 80px rgba(0, 0, 0, 0.85) !important;
}

[data-theme="dark"] .newsletter-glow-1,
[data-theme="dark"] .newsletter-glow-2 {
  background: rgba(255, 255, 255, 0.03) !important;
}

[data-theme="dark"] .newsletter-input {
  background: rgba(255, 255, 255, 0.04) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: #ffffff !important;
}

[data-theme="dark"] .newsletter-btn {
  background: #ffffff !important;
  color: #05070a !important;
  font-weight: 600 !important;
}

[data-theme="dark"] .newsletter-btn:hover {
  background: #e2e8f0 !important;
}

/* Footer */
[data-theme="dark"] .footer {
  background: #030406 !important;
  border-top: 1px solid rgba(255, 255, 255, 0.07) !important;
}

[data-theme="dark"] .footer-link {
  color: #94a3b8 !important;
}

[data-theme="dark"] .footer-link:hover {
  color: #ffffff !important;
}

[data-theme="dark"] .social-icon {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: #cbd5e1 !important;
}

[data-theme="dark"] .social-icon:hover {
  background: #ffffff !important;
  color: #05070a !important;
  border-color: #ffffff !important;
}`;

// Find start and end of existing [data-theme="dark"] in style.css
const darkStartIdx = styleCss.indexOf('[data-theme="dark"] {');
if (darkStartIdx !== -1) {
  const lightStartIdx = styleCss.indexOf('[data-theme="light"] {', darkStartIdx);
  if (lightStartIdx !== -1) {
    styleCss = styleCss.substring(0, darkStartIdx) + darkThemeReplacement + '\n\n' + styleCss.substring(lightStartIdx);
  }
}

fs.writeFileSync(styleCssPath, styleCss, 'utf8');
console.log('Successfully updated style.css with Monochromatic Dark Theme & High-Transparency Glassmorphism!');
