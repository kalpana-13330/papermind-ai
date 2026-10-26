const fs = require('fs');
const path = require('path');

const stylePath = path.resolve(__dirname, '..', 'assets', 'css', 'style.css');
let styleContent = fs.readFileSync(stylePath, 'utf8');

// 1. PIN THE NAVBAR
// Ensure .header has position: fixed !important with z-index and body offset
const pinnedNavCss = `
/* ==========================================================================
   PINNED NAVBAR SYSTEM (UNIVERSAL DESKTOP & MOBILE FIXED PINNING)
   ========================================================================== */
.header {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  z-index: 10000 !important;
  transition: background 0.3s cubic-bezier(0.16, 1, 0.3, 1), 
              box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1), 
              border-color 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

body {
  padding-top: 76px !important;
}

/* Dark Theme Pinned Header */
[data-theme="dark"] .header,
.header {
  background: rgba(5, 7, 10, 0.85) !important;
  backdrop-filter: blur(20px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(20px) saturate(180%) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
}

[data-theme="dark"] .header.scrolled,
.header.scrolled {
  background: rgba(5, 7, 10, 0.95) !important;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.7) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12) !important;
}

/* Light Theme Pinned Header with Soft Clay Highlight */
[data-theme="light"] .header {
  background: rgba(240, 244, 250, 0.88) !important;
  backdrop-filter: blur(20px) saturate(160%) !important;
  -webkit-backdrop-filter: blur(20px) saturate(160%) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.9) !important;
  box-shadow: 0 8px 24px rgba(160, 178, 204, 0.2) !important;
}

[data-theme="light"] .header.scrolled {
  background: rgba(245, 248, 252, 0.96) !important;
  box-shadow: 0 12px 32px rgba(160, 178, 204, 0.3), inset 0 -1px 0 rgba(255, 255, 255, 0.9) !important;
  border-bottom: 1px solid rgba(200, 214, 230, 0.6) !important;
}
`;

// 2. AWWWARDS LEVEL CLAYMORPHISM UI FOR LIGHT THEME (FROM CAPABILITIES TO BEFORE FOOTER)
const claymorphismCss = `
/* ==========================================================================
   AWWWARDS-LEVEL CLAYMORPHISM UI SYSTEM (LIGHT THEME ONLY)
   Scoped to: #features, #about, #statistics, #how-it-works, #testimonials, #faq, #cta, #newsletter
   ========================================================================== */

/* Light Theme Global Canvas & Section Styling */
[data-theme="light"] {
  --clay-bg-canvas: #eef3f9;
  --clay-surface: linear-gradient(145deg, #ffffff 0%, #f1f5fa 100%);
  --clay-surface-card: #f8fafc;
  --clay-shadow-outer-primary: rgba(160, 178, 204, 0.32);
  --clay-shadow-outer-darker: rgba(145, 165, 195, 0.4);
  --clay-shadow-inner-white: rgba(255, 255, 255, 0.95);
  --clay-shadow-inner-dark: rgba(160, 178, 204, 0.25);
  --clay-border: 1px solid rgba(255, 255, 255, 0.95);
  --clay-radius-card: 28px;
  --clay-radius-pill: 999px;
  --clay-radius-btn: 18px;
}

[data-theme="light"] body {
  background-color: #f0f4f9 !important;
  color: #0f172a !important;
}

/* Sections Backgrounds below Hero */
[data-theme="light"] .features-section,
[data-theme="light"] .why-us-section,
[data-theme="light"] .stats-section,
[data-theme="light"] .how-it-works-section,
[data-theme="light"] .testimonials-section,
[data-theme="light"] .faq-section,
[data-theme="light"] .cta-section,
[data-theme="light"] .newsletter-section {
  background-color: transparent !important;
  position: relative;
}

/* Section Header Clay Badges & Typography */
[data-theme="light"] .section-badge {
  background: linear-gradient(145deg, #ffffff 0%, #e6effa 100%) !important;
  color: #2563eb !important;
  font-weight: 700 !important;
  border-radius: 999px !important;
  border: 1px solid rgba(255, 255, 255, 0.95) !important;
  box-shadow: 
    6px 8px 18px rgba(160, 178, 204, 0.3),
    -4px -4px 12px rgba(255, 255, 255, 0.95),
    inset 2px 2px 4px rgba(255, 255, 255, 0.9),
    inset -2px -2px 5px rgba(160, 178, 204, 0.2) !important;
  padding: 0.55rem 1.35rem !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 0.6rem !important;
  letter-spacing: 0.04em !important;
}

[data-theme="light"] .section-title {
  color: #0f172a !important;
  font-weight: 800 !important;
  letter-spacing: -0.03em !important;
}

[data-theme="light"] .section-subheading {
  color: #475569 !important;
  font-size: 1.05rem !important;
  line-height: 1.65 !important;
}

/* --------------------------------------------------------------------------
   1. CAPABILITIES / FEATURES SECTION CLAYMORPHISM (#features)
   -------------------------------------------------------------------------- */
[data-theme="light"] .feature-card {
  background: linear-gradient(145deg, #ffffff 0%, #f3f6fa 100%) !important;
  border-radius: 28px !important;
  border: 1px solid rgba(255, 255, 255, 0.95) !important;
  box-shadow: 
    12px 18px 34px rgba(160, 178, 204, 0.32),
    -8px -8px 22px rgba(255, 255, 255, 0.95),
    inset 3px 3px 6px rgba(255, 255, 255, 0.95),
    inset -3px -3px 8px rgba(160, 178, 204, 0.22) !important;
  padding: 2.25rem 2rem !important;
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1) !important;
  backdrop-filter: none !important;
}

[data-theme="light"] .feature-card:hover {
  transform: translateY(-7px) scale(1.015) !important;
  box-shadow: 
    18px 28px 48px rgba(160, 178, 204, 0.42),
    -10px -10px 28px rgba(255, 255, 255, 1),
    inset 4px 4px 8px rgba(255, 255, 255, 0.95),
    inset -4px -4px 10px rgba(160, 178, 204, 0.28) !important;
}

/* Volumetric 3D Clay Icon Socket */
[data-theme="light"] .feature-icon-wrapper {
  width: 62px !important;
  height: 62px !important;
  border-radius: 20px !important;
  background: linear-gradient(145deg, #ffffff 0%, #eaf0f9 100%) !important;
  border: 1px solid rgba(255, 255, 255, 0.95) !important;
  box-shadow: 
    6px 8px 18px rgba(160, 178, 204, 0.32),
    -4px -4px 12px rgba(255, 255, 255, 0.95),
    inset 2px 2px 4px rgba(255, 255, 255, 0.95),
    inset -2px -2px 5px rgba(160, 178, 204, 0.25) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  margin-bottom: 1.5rem !important;
  color: #2563eb !important;
  font-size: 1.5rem !important;
}

[data-theme="light"] .feature-title {
  color: #0f172a !important;
  font-weight: 700 !important;
  font-size: 1.25rem !important;
  margin-bottom: 0.75rem !important;
}

[data-theme="light"] .feature-desc {
  color: #475569 !important;
  line-height: 1.65 !important;
  font-size: 0.95rem !important;
}

[data-theme="light"] .feature-footer-link {
  margin-top: 1.25rem !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 0.5rem !important;
  color: #2563eb !important;
  font-weight: 600 !important;
  font-size: 0.92rem !important;
  transition: all 0.25s ease !important;
}

[data-theme="light"] .feature-card:hover .feature-footer-link {
  color: #1d4ed8 !important;
  gap: 0.75rem !important;
}

/* --------------------------------------------------------------------------
   2. WHY CHOOSE US / ACADEMIC RIGOR CLAYMORPHISM (#about)
   -------------------------------------------------------------------------- */
[data-theme="light"] .why-us-canvas {
  background: linear-gradient(145deg, #ffffff 0%, #f1f5fa 100%) !important;
  border-radius: 36px !important;
  border: 1px solid rgba(255, 255, 255, 0.95) !important;
  box-shadow: 
    16px 24px 44px rgba(160, 178, 204, 0.35),
    -10px -10px 28px rgba(255, 255, 255, 0.95),
    inset 4px 4px 8px rgba(255, 255, 255, 0.95),
    inset -4px -4px 10px rgba(160, 178, 204, 0.22) !important;
  position: relative !important;
}

[data-theme="light"] .canvas-glow {
  background: radial-gradient(circle, rgba(37, 99, 235, 0.12) 0%, transparent 70%) !important;
}

[data-theme="light"] .connection-line {
  stroke: rgba(160, 178, 204, 0.6) !important;
}

[data-theme="light"] .ai-core-badge,
[data-theme="light"] .core-icon {
  background: linear-gradient(145deg, #2563eb 0%, #1d4ed8 100%) !important;
  color: #ffffff !important;
  border-radius: 50% !important;
  box-shadow: 
    8px 12px 24px rgba(37, 99, 235, 0.38),
    -4px -4px 14px rgba(255, 255, 255, 0.9),
    inset 2px 2px 4px rgba(255, 255, 255, 0.45),
    inset -2px -2px 6px rgba(0, 0, 0, 0.25) !important;
}

[data-theme="light"] .core-label {
  background: linear-gradient(145deg, #ffffff, #f1f5fa) !important;
  color: #0f172a !important;
  border-radius: 999px !important;
  border: 1px solid rgba(255, 255, 255, 0.95) !important;
  box-shadow: 
    4px 6px 14px rgba(160, 178, 204, 0.28),
    -3px -3px 8px rgba(255, 255, 255, 0.95),
    inset 1px 1px 2px rgba(255, 255, 255, 0.9) !important;
}

[data-theme="light"] .why-float-card {
  background: linear-gradient(145deg, #ffffff 0%, #f3f6fa 100%) !important;
  border-radius: 20px !important;
  border: 1px solid rgba(255, 255, 255, 0.95) !important;
  box-shadow: 
    10px 14px 28px rgba(160, 178, 204, 0.32),
    -6px -6px 18px rgba(255, 255, 255, 0.95),
    inset 2px 2px 5px rgba(255, 255, 255, 0.95),
    inset -2px -2px 6px rgba(160, 178, 204, 0.22) !important;
}

[data-theme="light"] .why-item {
  background: linear-gradient(145deg, #ffffff 0%, #f3f6fa 100%) !important;
  border-radius: 24px !important;
  border: 1px solid rgba(255, 255, 255, 0.95) !important;
  box-shadow: 
    10px 14px 28px rgba(160, 178, 204, 0.28),
    -6px -6px 18px rgba(255, 255, 255, 0.95),
    inset 2px 2px 4px rgba(255, 255, 255, 0.95),
    inset -2px -2px 6px rgba(160, 178, 204, 0.2) !important;
  padding: 1.5rem !important;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
  margin-bottom: 1.25rem !important;
}

[data-theme="light"] .why-item:hover {
  transform: translateX(6px) translateY(-3px) scale(1.01) !important;
  box-shadow: 
    14px 20px 36px rgba(160, 178, 204, 0.38),
    -8px -8px 22px rgba(255, 255, 255, 1),
    inset 3px 3px 6px rgba(255, 255, 255, 0.95),
    inset -3px -3px 8px rgba(160, 178, 204, 0.25) !important;
}

[data-theme="light"] .why-item-icon,
[data-theme="light"] .why-icon-box {
  width: 52px !important;
  height: 52px !important;
  border-radius: 16px !important;
  background: linear-gradient(145deg, #ffffff 0%, #eaf0f9 100%) !important;
  border: 1px solid rgba(255, 255, 255, 0.95) !important;
  box-shadow: 
    5px 6px 14px rgba(160, 178, 204, 0.28),
    -3px -3px 10px rgba(255, 255, 255, 0.95),
    inset 2px 2px 3px rgba(255, 255, 255, 0.95),
    inset -2px -2px 4px rgba(160, 178, 204, 0.2) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  color: #2563eb !important;
  font-size: 1.25rem !important;
}

[data-theme="light"] .why-item-text h4 {
  color: #0f172a !important;
  font-weight: 700 !important;
  font-size: 1.15rem !important;
  margin-bottom: 0.35rem !important;
}

[data-theme="light"] .why-item-text p {
  color: #475569 !important;
  font-size: 0.95rem !important;
  line-height: 1.55 !important;
}

/* --------------------------------------------------------------------------
   3. STATISTICS SECTION CLAYMORPHISM (#statistics)
   -------------------------------------------------------------------------- */
[data-theme="light"] .stat-card {
  background: linear-gradient(145deg, #ffffff 0%, #f3f6fa 100%) !important;
  border-radius: 28px !important;
  border: 1px solid rgba(255, 255, 255, 0.95) !important;
  box-shadow: 
    12px 18px 34px rgba(160, 178, 204, 0.32),
    -8px -8px 22px rgba(255, 255, 255, 0.95),
    inset 3px 3px 6px rgba(255, 255, 255, 0.95),
    inset -3px -3px 8px rgba(160, 178, 204, 0.22) !important;
  padding: 2.5rem 2rem !important;
  text-align: center !important;
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

[data-theme="light"] .stat-card:hover {
  transform: translateY(-6px) scale(1.02) !important;
  box-shadow: 
    16px 24px 44px rgba(160, 178, 204, 0.42),
    -10px -10px 28px rgba(255, 255, 255, 1),
    inset 4px 4px 8px rgba(255, 255, 255, 0.95),
    inset -4px -4px 10px rgba(160, 178, 204, 0.28) !important;
}

[data-theme="light"] .stat-icon {
  width: 64px !important;
  height: 64px !important;
  border-radius: 50% !important;
  margin: 0 auto 1.5rem auto !important;
  background: linear-gradient(145deg, #ffffff 0%, #e8f0fc 100%) !important;
  border: 1px solid rgba(255, 255, 255, 0.95) !important;
  box-shadow: 
    6px 8px 18px rgba(160, 178, 204, 0.3),
    -4px -4px 12px rgba(255, 255, 255, 0.95),
    inset 2px 2px 4px rgba(255, 255, 255, 0.95),
    inset -2px -2px 5px rgba(160, 178, 204, 0.2) !important;
  color: #2563eb !important;
  font-size: 1.5rem !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

[data-theme="light"] .stat-number {
  color: #0f172a !important;
  font-size: 3rem !important;
  font-weight: 800 !important;
  letter-spacing: -0.04em !important;
  line-height: 1.1 !important;
  margin-bottom: 0.5rem !important;
}

[data-theme="light"] .stat-label {
  color: #475569 !important;
  font-weight: 600 !important;
  font-size: 1rem !important;
}

[data-theme="light"] .stat-bar {
  background: #ebf0f7 !important;
  box-shadow: inset 2px 2px 5px rgba(160, 178, 204, 0.32), inset -2px -2px 5px rgba(255, 255, 255, 0.95) !important;
  border-radius: 999px !important;
  height: 8px !important;
  margin-top: 1rem !important;
  overflow: hidden !important;
}

[data-theme="light"] .stat-bar-fill {
  background: linear-gradient(90deg, #2563eb, #3b82f6) !important;
  border-radius: 999px !important;
  box-shadow: 2px 2px 6px rgba(37, 99, 235, 0.35) !important;
}

/* --------------------------------------------------------------------------
   4. HOW IT WORKS SECTION CLAYMORPHISM (#how-it-works)
   -------------------------------------------------------------------------- */
[data-theme="light"] .step-card {
  background: linear-gradient(145deg, #ffffff 0%, #f3f6fa 100%) !important;
  border-radius: 28px !important;
  border: 1px solid rgba(255, 255, 255, 0.95) !important;
  box-shadow: 
    12px 18px 34px rgba(160, 178, 204, 0.32),
    -8px -8px 22px rgba(255, 255, 255, 0.95),
    inset 3px 3px 6px rgba(255, 255, 255, 0.95),
    inset -3px -3px 8px rgba(160, 178, 204, 0.22) !important;
  padding: 2.5rem 2rem !important;
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1) !important;
  position: relative !important;
}

[data-theme="light"] .step-card:hover {
  transform: translateY(-6px) scale(1.015) !important;
  box-shadow: 
    16px 24px 44px rgba(160, 178, 204, 0.42),
    -10px -10px 28px rgba(255, 255, 255, 1),
    inset 4px 4px 8px rgba(255, 255, 255, 0.95),
    inset -4px -4px 10px rgba(160, 178, 204, 0.28) !important;
}

[data-theme="light"] .step-number,
[data-theme="light"] .step-icon-num {
  width: 52px !important;
  height: 52px !important;
  border-radius: 50% !important;
  background: linear-gradient(145deg, #2563eb 0%, #1d4ed8 100%) !important;
  color: #ffffff !important;
  font-weight: 800 !important;
  font-size: 1.25rem !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  box-shadow: 
    6px 10px 20px rgba(37, 99, 235, 0.4),
    -3px -3px 8px rgba(255, 255, 255, 0.8),
    inset 2px 2px 4px rgba(255, 255, 255, 0.45),
    inset -2px -2px 6px rgba(0, 0, 0, 0.25) !important;
  margin-bottom: 1.5rem !important;
}

[data-theme="light"] .step-title {
  color: #0f172a !important;
  font-weight: 700 !important;
  font-size: 1.25rem !important;
  margin-bottom: 0.75rem !important;
}

[data-theme="light"] .step-desc {
  color: #475569 !important;
  line-height: 1.65 !important;
  font-size: 0.95rem !important;
}

/* --------------------------------------------------------------------------
   5. TESTIMONIALS SECTION CLAYMORPHISM (#testimonials)
   -------------------------------------------------------------------------- */
[data-theme="light"] .user-testi-card,
[data-theme="light"] .testimonial-card {
  background: linear-gradient(145deg, #ffffff 0%, #f3f6fa 100%) !important;
  border-radius: 28px !important;
  border: 1px solid rgba(255, 255, 255, 0.95) !important;
  box-shadow: 
    12px 18px 34px rgba(160, 178, 204, 0.32),
    -8px -8px 22px rgba(255, 255, 255, 0.95),
    inset 3px 3px 6px rgba(255, 255, 255, 0.95),
    inset -3px -3px 8px rgba(160, 178, 204, 0.22) !important;
  padding: 2.25rem !important;
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

[data-theme="light"] .user-testi-card:hover,
[data-theme="light"] .testimonial-card:hover {
  transform: translateY(-6px) scale(1.015) !important;
  box-shadow: 
    16px 26px 44px rgba(160, 178, 204, 0.42),
    -10px -10px 28px rgba(255, 255, 255, 1),
    inset 4px 4px 8px rgba(255, 255, 255, 0.95),
    inset -4px -4px 10px rgba(160, 178, 204, 0.28) !important;
}

[data-theme="light"] .user-avatar-circle {
  width: 52px !important;
  height: 52px !important;
  border-radius: 50% !important;
  background: linear-gradient(145deg, #2563eb, #3b82f6) !important;
  color: #ffffff !important;
  box-shadow: 
    4px 6px 14px rgba(37, 99, 235, 0.35),
    inset 2px 2px 3px rgba(255, 255, 255, 0.4) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-weight: 700 !important;
}

[data-theme="light"] .testi-author-info h4 {
  color: #0f172a !important;
  font-weight: 700 !important;
}

[data-theme="light"] .testi-author-info span {
  color: #64748b !important;
}

[data-theme="light"] .testi-card-text {
  color: #334155 !important;
  font-style: italic !important;
  line-height: 1.65 !important;
}

/* Clay Add Testimonial Action Button */
[data-theme="light"] .btn-add-testi,
[data-theme="light"] .btn-add-review {
  background: linear-gradient(145deg, #2563eb 0%, #1d4ed8 100%) !important;
  color: #ffffff !important;
  border-radius: 999px !important;
  border: 1px solid rgba(255, 255, 255, 0.4) !important;
  box-shadow: 
    8px 12px 24px rgba(37, 99, 235, 0.38),
    -4px -4px 14px rgba(255, 255, 255, 0.9),
    inset 2px 2px 4px rgba(255, 255, 255, 0.45),
    inset -2px -2px 6px rgba(0, 0, 0, 0.25) !important;
  padding: 0.85rem 1.75rem !important;
  font-weight: 600 !important;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

[data-theme="light"] .btn-add-testi:hover,
[data-theme="light"] .btn-add-review:hover {
  transform: translateY(-3px) scale(1.02) !important;
  box-shadow: 
    10px 16px 30px rgba(37, 99, 235, 0.45),
    -6px -6px 18px rgba(255, 255, 255, 1),
    inset 3px 3px 5px rgba(255, 255, 255, 0.5) !important;
}

[data-theme="light"] .btn-add-testi:active,
[data-theme="light"] .btn-add-review:active {
  transform: translateY(2px) scale(0.98) !important;
  box-shadow: 
    4px 6px 14px rgba(37, 99, 235, 0.3),
    inset 4px 4px 8px rgba(0, 0, 0, 0.3) !important;
}

/* --------------------------------------------------------------------------
   6. FAQ SECTION CLAYMORPHISM (#faq)
   -------------------------------------------------------------------------- */
[data-theme="light"] .faq-item {
  background: linear-gradient(145deg, #ffffff 0%, #f3f6fa 100%) !important;
  border-radius: 22px !important;
  border: 1px solid rgba(255, 255, 255, 0.95) !important;
  box-shadow: 
    10px 14px 28px rgba(160, 178, 204, 0.28),
    -6px -6px 18px rgba(255, 255, 255, 0.95),
    inset 2px 2px 4px rgba(255, 255, 255, 0.95),
    inset -2px -2px 6px rgba(160, 178, 204, 0.2) !important;
  margin-bottom: 1.25rem !important;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
  overflow: hidden !important;
}

[data-theme="light"] .faq-item:hover {
  box-shadow: 
    14px 20px 36px rgba(160, 178, 204, 0.36),
    -8px -8px 22px rgba(255, 255, 255, 1),
    inset 3px 3px 6px rgba(255, 255, 255, 0.95),
    inset -3px -3px 8px rgba(160, 178, 204, 0.24) !important;
}

[data-theme="light"] .faq-item.active {
  background: linear-gradient(145deg, #ffffff 0%, #edf3fa 100%) !important;
  box-shadow: 
    12px 18px 34px rgba(160, 178, 204, 0.35),
    -8px -8px 22px rgba(255, 255, 255, 1),
    inset 3px 3px 6px rgba(255, 255, 255, 0.95),
    inset -3px -3px 8px rgba(160, 178, 204, 0.25) !important;
}

[data-theme="light"] .faq-question {
  color: #0f172a !important;
  font-weight: 700 !important;
  font-size: 1.15rem !important;
  padding: 1.5rem !important;
}

[data-theme="light"] .faq-icon-wrapper {
  width: 40px !important;
  height: 40px !important;
  border-radius: 50% !important;
  background: linear-gradient(145deg, #ffffff 0%, #eaf0f9 100%) !important;
  border: 1px solid rgba(255, 255, 255, 0.95) !important;
  box-shadow: 
    4px 6px 12px rgba(160, 178, 204, 0.25),
    -3px -3px 8px rgba(255, 255, 255, 0.95),
    inset 1px 1px 3px rgba(255, 255, 255, 0.9) !important;
  color: #2563eb !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

[data-theme="light"] .faq-answer {
  color: #475569 !important;
  line-height: 1.7 !important;
  padding: 0 1.5rem 1.5rem 1.5rem !important;
}

/* --------------------------------------------------------------------------
   7. CALL TO ACTION SECTION CLAYMORPHISM (#cta)
   -------------------------------------------------------------------------- */
[data-theme="light"] .cta-card {
  background: linear-gradient(145deg, #ffffff 0%, #f1f5fa 100%) !important;
  border-radius: 36px !important;
  border: 1px solid rgba(255, 255, 255, 0.95) !important;
  box-shadow: 
    18px 28px 50px rgba(160, 178, 204, 0.38),
    -12px -12px 32px rgba(255, 255, 255, 1),
    inset 4px 4px 8px rgba(255, 255, 255, 0.95),
    inset -4px -4px 12px rgba(160, 178, 204, 0.25) !important;
  padding: 4rem 3rem !important;
  position: relative !important;
}

[data-theme="light"] .cta-title {
  color: #0f172a !important;
  font-weight: 800 !important;
  font-size: clamp(2rem, 4vw, 2.75rem) !important;
  letter-spacing: -0.03em !important;
  margin-bottom: 1rem !important;
}

[data-theme="light"] .cta-desc {
  color: #475569 !important;
  font-size: 1.15rem !important;
  line-height: 1.65 !important;
  max-width: 650px !important;
  margin: 0 auto 2.5rem auto !important;
}

[data-theme="light"] .cta-actions .btn-primary {
  background: linear-gradient(145deg, #2563eb 0%, #1d4ed8 100%) !important;
  color: #ffffff !important;
  border-radius: 999px !important;
  border: 1px solid rgba(255, 255, 255, 0.4) !important;
  box-shadow: 
    8px 14px 28px rgba(37, 99, 235, 0.4),
    -4px -4px 14px rgba(255, 255, 255, 0.9),
    inset 2px 2px 4px rgba(255, 255, 255, 0.45),
    inset -2px -2px 6px rgba(0, 0, 0, 0.25) !important;
  padding: 1rem 2.25rem !important;
  font-weight: 700 !important;
  font-size: 1.05rem !important;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

[data-theme="light"] .cta-actions .btn-primary:hover {
  transform: translateY(-4px) scale(1.02) !important;
  box-shadow: 
    12px 18px 36px rgba(37, 99, 235, 0.48),
    -6px -6px 18px rgba(255, 255, 255, 1) !important;
}

[data-theme="light"] .cta-actions .btn-glass {
  background: linear-gradient(145deg, #ffffff 0%, #f1f5fa 100%) !important;
  color: #0f172a !important;
  border-radius: 999px !important;
  border: 1px solid rgba(255, 255, 255, 0.95) !important;
  box-shadow: 
    8px 12px 24px rgba(160, 178, 204, 0.3),
    -4px -4px 14px rgba(255, 255, 255, 0.95),
    inset 2px 2px 4px rgba(255, 255, 255, 0.95),
    inset -2px -2px 5px rgba(160, 178, 204, 0.2) !important;
  padding: 1rem 2.25rem !important;
  font-weight: 700 !important;
  font-size: 1.05rem !important;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

[data-theme="light"] .cta-actions .btn-glass:hover {
  transform: translateY(-4px) scale(1.02) !important;
  box-shadow: 
    12px 18px 32px rgba(160, 178, 204, 0.4),
    -6px -6px 18px rgba(255, 255, 255, 1) !important;
}

/* --------------------------------------------------------------------------
   8. NEWSLETTER SECTION CLAYMORPHISM (#newsletter)
   -------------------------------------------------------------------------- */
[data-theme="light"] .newsletter-container {
  background: linear-gradient(145deg, #ffffff 0%, #f1f5fa 100%) !important;
  border-radius: 36px !important;
  border: 1px solid rgba(255, 255, 255, 0.95) !important;
  box-shadow: 
    16px 26px 48px rgba(160, 178, 204, 0.35),
    -10px -10px 28px rgba(255, 255, 255, 1),
    inset 4px 4px 8px rgba(255, 255, 255, 0.95),
    inset -4px -4px 10px rgba(160, 178, 204, 0.22) !important;
  padding: 3.5rem 3rem !important;
}

[data-theme="light"] .newsletter-icon-badge {
  width: 68px !important;
  height: 68px !important;
  border-radius: 50% !important;
  margin: 0 auto 1.5rem auto !important;
  background: linear-gradient(145deg, #ffffff 0%, #e8f0fc 100%) !important;
  border: 1px solid rgba(255, 255, 255, 0.95) !important;
  box-shadow: 
    8px 10px 22px rgba(160, 178, 204, 0.32),
    -4px -4px 14px rgba(255, 255, 255, 0.95),
    inset 2px 2px 4px rgba(255, 255, 255, 0.95),
    inset -2px -2px 5px rgba(160, 178, 204, 0.22) !important;
  color: #2563eb !important;
  font-size: 1.75rem !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

[data-theme="light"] .newsletter-title {
  color: #0f172a !important;
  font-weight: 800 !important;
  font-size: 2.25rem !important;
}

[data-theme="light"] .newsletter-desc {
  color: #475569 !important;
  font-size: 1.05rem !important;
}

/* Inset Clay Input Cavity */
[data-theme="light"] .newsletter-input-group {
  background: #ebf0f7 !important;
  border-radius: 999px !important;
  border: 1px solid rgba(200, 214, 230, 0.6) !important;
  box-shadow: 
    inset 3px 3px 7px rgba(160, 178, 204, 0.35),
    inset -3px -3px 7px rgba(255, 255, 255, 0.95) !important;
  padding: 0.4rem 0.6rem !important;
  display: flex !important;
  align-items: center !important;
}

[data-theme="light"] .newsletter-input {
  background: transparent !important;
  color: #0f172a !important;
  border: none !important;
  font-weight: 500 !important;
  padding: 0.75rem 1rem !important;
}

[data-theme="light"] .newsletter-input::placeholder {
  color: #94a3b8 !important;
}

[data-theme="light"] .newsletter-btn {
  background: linear-gradient(145deg, #2563eb 0%, #1d4ed8 100%) !important;
  color: #ffffff !important;
  border-radius: 999px !important;
  border: 1px solid rgba(255, 255, 255, 0.4) !important;
  box-shadow: 
    6px 8px 18px rgba(37, 99, 235, 0.38),
    -3px -3px 8px rgba(255, 255, 255, 0.8),
    inset 2px 2px 3px rgba(255, 255, 255, 0.45) !important;
  padding: 0.75rem 1.75rem !important;
  font-weight: 700 !important;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

[data-theme="light"] .newsletter-btn:hover {
  transform: translateY(-2px) scale(1.02) !important;
  box-shadow: 
    8px 12px 24px rgba(37, 99, 235, 0.45),
    inset 3px 3px 5px rgba(255, 255, 255, 0.5) !important;
}
`;

// Append both pinned navbar and claymorphism styles to style.css
styleContent += '\n' + pinnedNavCss + '\n' + claymorphismCss;
fs.writeFileSync(stylePath, styleContent, 'utf8');
console.log('Successfully added Pinned Navbar and Awwwards-Level Claymorphism UI to style.css!');
