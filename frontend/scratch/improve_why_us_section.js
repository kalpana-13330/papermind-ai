const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

// 1. UPDATE index.html icon
const indexPath = path.join(projectRoot, 'index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');

// Replace fa-brain-circuit with fa-brain so icon appears crisp
indexHtml = indexHtml.replace('class="fa-solid fa-brain-circuit"', 'class="fa-solid fa-brain"');

fs.writeFileSync(indexPath, indexHtml, 'utf8');
console.log('Updated index.html core icon to fa-brain!');

// 2. UPDATE style.css with why-us section dark theme styles
const styleCssPath = path.join(projectRoot, 'assets', 'css', 'style.css');
let styleCss = fs.readFileSync(styleCssPath, 'utf8');

const whyUsDarkStyles = `
/* ==========================================================================
   WHY CHOOSE US (ABOUT SECTION) - HIGH-TRANSPARENCY GLASS & MONOCHROME
   ========================================================================== */
[data-theme="dark"] .why-us-section {
  background: transparent !important;
  position: relative;
}

/* Left Illustration Showcase Canvas */
[data-theme="dark"] .why-us-canvas {
  background: linear-gradient(145deg, rgba(16, 20, 28, 0.75) 0%, rgba(8, 10, 15, 0.92) 100%) !important;
  background-image: radial-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px) !important;
  background-size: 22px 22px !important;
  border-radius: 28px !important;
  border: 1px solid rgba(255, 255, 255, 0.09) !important;
  box-shadow: inset 0 1px 1px 0 rgba(255, 255, 255, 0.22), inset 0 0 50px rgba(255, 255, 255, 0.015), 0 35px 80px -15px rgba(0, 0, 0, 0.85) !important;
  backdrop-filter: blur(32px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(32px) saturate(180%) !important;
}

[data-theme="dark"] .canvas-glow {
  background: radial-gradient(circle, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0) 70%) !important;
}

/* Metallic Silver Laser Connection Lines */
[data-theme="dark"] .connection-line {
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0.12)) !important;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.25) !important;
}

/* Central AI Core Badge */
[data-theme="dark"] .core-pulse {
  background: rgba(255, 255, 255, 0.08) !important;
  box-shadow: 0 0 25px rgba(255, 255, 255, 0.12) !important;
}

[data-theme="dark"] .core-icon {
  width: 68px !important;
  height: 68px !important;
  border-radius: 22px !important;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.04) 100%) !important;
  border: 1px solid rgba(255, 255, 255, 0.25) !important;
  color: #ffffff !important;
  font-size: 2rem !important;
  box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.4), 0 15px 35px rgba(0, 0, 0, 0.7), 0 0 25px rgba(255, 255, 255, 0.1) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

[data-theme="dark"] .core-label {
  background: rgba(14, 18, 26, 0.88) !important;
  backdrop-filter: blur(16px) !important;
  -webkit-backdrop-filter: blur(16px) !important;
  border: 1px solid rgba(255, 255, 255, 0.18) !important;
  color: #ffffff !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25), 0 8px 18px rgba(0, 0, 0, 0.6) !important;
  font-size: 0.78rem !important;
  font-weight: 700 !important;
  letter-spacing: 0.04em !important;
  padding: 0.28rem 0.9rem !important;
}

/* Why-us Floating High-Transparency Glass Cards */
[data-theme="dark"] .why-float-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.065) 0%, rgba(255, 255, 255, 0.015) 100%) !important;
  backdrop-filter: blur(24px) saturate(190%) !important;
  -webkit-backdrop-filter: blur(24px) saturate(190%) !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.22), 0 18px 40px rgba(0, 0, 0, 0.65) !important;
  transition: all 0.3s ease !important;
}

[data-theme="dark"] .why-float-card:hover {
  border-color: rgba(255, 255, 255, 0.28) !important;
  box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.35), 0 24px 50px rgba(0, 0, 0, 0.8) !important;
}

[data-theme="dark"] .pdf-icon-mini {
  background: rgba(255, 255, 255, 0.08) !important;
  border: 1px solid rgba(255, 255, 255, 0.14) !important;
  color: #ffffff !important;
}

[data-theme="dark"] .pdf-title-mini {
  color: #ffffff !important;
}

[data-theme="dark"] .pdf-status-mini {
  color: #94a3b8 !important;
}

[data-theme="dark"] .pdf-status-mini i {
  color: #ffffff !important;
}

[data-theme="dark"] .summary-badge-mini {
  color: #ffffff !important;
  font-weight: 700 !important;
}

[data-theme="dark"] .summary-text-mini {
  color: #cbd5e1 !important;
}

[data-theme="dark"] .mini-tag {
  background: rgba(255, 255, 255, 0.06) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: #f1f5f9 !important;
}

[data-theme="dark"] .metric-icon-mini {
  background: rgba(255, 255, 255, 0.08) !important;
  border: 1px solid rgba(255, 255, 255, 0.14) !important;
  color: #ffffff !important;
}

[data-theme="dark"] .metric-text-mini strong {
  color: #ffffff !important;
  font-size: 0.95rem !important;
}

[data-theme="dark"] .metric-text-mini span {
  color: #94a3b8 !important;
}

/* Right Side Content & Checklist Cards */
[data-theme="dark"] .why-us-description {
  color: #94a3b8 !important;
}

[data-theme="dark"] .why-items-list {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

[data-theme="dark"] .why-item {
  display: flex !important;
  align-items: center !important;
  gap: 1.25rem !important;
  padding: 1.2rem 1.45rem !important;
  border-radius: 20px !important;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.035) 0%, rgba(255, 255, 255, 0.008) 100%) !important;
  backdrop-filter: blur(28px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(28px) saturate(180%) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  box-shadow: inset 0 1px 1px 0 rgba(255, 255, 255, 0.16), 0 12px 28px -5px rgba(0, 0, 0, 0.6) !important;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

[data-theme="dark"] .why-item:hover {
  transform: translateX(8px) translateY(-2px) !important;
  border-color: rgba(255, 255, 255, 0.22) !important;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.065) 0%, rgba(255, 255, 255, 0.015) 100%) !important;
  box-shadow: inset 0 1px 2px 0 rgba(255, 255, 255, 0.32), 0 22px 48px -5px rgba(0, 0, 0, 0.85) !important;
}

[data-theme="dark"] .why-item-icon {
  width: 44px !important;
  height: 44px !important;
  border-radius: 50% !important;
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  color: #ffffff !important;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.2) !important;
  font-size: 1.05rem !important;
  flex-shrink: 0 !important;
  margin-top: 0 !important;
  transition: all 0.25s ease !important;
}

[data-theme="dark"] .why-item:hover .why-item-icon {
  background: #ffffff !important;
  color: #05070a !important;
  border-color: #ffffff !important;
  transform: scale(1.08) !important;
  box-shadow: 0 4px 16px rgba(255, 255, 255, 0.25) !important;
}

[data-theme="dark"] .why-item-text h4 {
  font-size: 1.08rem !important;
  font-weight: 700 !important;
  color: #ffffff !important;
  margin-bottom: 0.25rem !important;
  letter-spacing: -0.01em !important;
}

[data-theme="dark"] .why-item-text p {
  font-size: 0.92rem !important;
  color: #cbd5e1 !important;
  line-height: 1.55 !important;
}
`;

if (!styleCss.includes('WHY CHOOSE US (ABOUT SECTION) - HIGH-TRANSPARENCY GLASS')) {
  styleCss += '\n' + whyUsDarkStyles;
  fs.writeFileSync(styleCssPath, styleCss, 'utf8');
  console.log('Successfully appended Why Choose Us high-transparency glass styles to style.css!');
}
