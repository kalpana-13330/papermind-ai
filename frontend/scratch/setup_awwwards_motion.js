const fs = require('fs');
const path = require('path');

const frontendRoot = path.resolve(__dirname, '..');

// 1. CREATE awwwards-motion.js
const motionJsPath = path.join(frontendRoot, 'assets', 'js', 'awwwards-motion.js');
const motionJsContent = `/**
 * PaperMind AI - Awwwards Motion Engine
 * Powered by GSAP, ScrollTrigger, and Lenis Smooth Scroll
 */
(function() {
  'use strict';

  // 1. Initialize Lenis Smooth Scroll
  let lenis;
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      infinite: false,
    });

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    } else {
      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    }
  }

  // 2. Awwwards Preloader Counter & Exit Animation (Matching User Reference)
  const preloader = document.getElementById('awwwardsPreloader');
  const counterEl = document.getElementById('preloaderCounter');
  const progressCircle = document.getElementById('preloaderProgressCircle');

  if (preloader && counterEl) {
    const circumference = 2 * Math.PI * 150; // ~942.48
    let currentProgress = 0;
    const targetProgress = 100;
    const duration = 1800; // 1.8 seconds smooth count
    const startTime = performance.now();

    const updateLoader = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easeT = 1 - Math.pow(1 - t, 3);
      currentProgress = Math.floor(easeT * targetProgress);

      // Pad number to 2 digits ("00", "01", ... "99", "100")
      counterEl.textContent = currentProgress < 10 ? '0' + currentProgress : '' + currentProgress;

      // Update SVG perimeter stroke
      if (progressCircle) {
        const offset = circumference - (currentProgress / 100) * circumference;
        progressCircle.style.strokeDashoffset = offset;
      }

      if (t < 1) {
        requestAnimationFrame(updateLoader);
      } else {
        counterEl.textContent = '100';
        triggerCurtainReveal();
      }
    };

    requestAnimationFrame(updateLoader);

    function triggerCurtainReveal() {
      if (typeof gsap !== 'undefined') {
        const tl = gsap.timeline();

        // Scale up counter & circle slightly
        tl.to('.preloader-center-wrap', {
          scale: 1.12,
          opacity: 0,
          duration: 0.6,
          ease: 'power2.inOut'
        });

        // Split curtains top & bottom
        tl.to('.curtain-top', {
          yPercent: -100,
          duration: 0.85,
          ease: 'power4.inOut'
        }, '-=0.2');

        tl.to('.curtain-bottom', {
          yPercent: 100,
          duration: 0.85,
          ease: 'power4.inOut'
        }, '<');

        tl.to(preloader, {
          opacity: 0,
          duration: 0.3,
          onComplete: () => {
            preloader.style.display = 'none';
            // Start Stagger Entrance
            triggerHeroTextStagger();
          }
        }, '-=0.3');
      } else {
        preloader.style.transition = 'opacity 0.6s ease';
        preloader.style.opacity = '0';
        setTimeout(() => {
          preloader.style.display = 'none';
          triggerHeroTextStagger();
        }, 600);
      }
    }
  } else {
    // If loader doesn't exist, start animations right away
    window.addEventListener('DOMContentLoaded', () => {
      triggerHeroTextStagger();
    });
  }

  // 3. GSAP Text Stagger Entrance Animations
  function triggerHeroTextStagger() {
    if (typeof gsap === 'undefined') return;

    // Split & Stagger Hero Title lines
    gsap.fromTo('.hero-main-title span', 
      { y: 55, opacity: 0, rotateX: 15 },
      { y: 0, opacity: 1, rotateX: 0, duration: 1.1, stagger: 0.15, ease: 'power3.out' }
    );

    // Stagger Left Column
    gsap.fromTo('.hero-col-left > *', 
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.9, stagger: 0.12, ease: 'power2.out', delay: 0.2 }
    );

    // Stagger Center iPhone Mockup
    gsap.fromTo('.iphone-mockup-frame', 
      { scale: 0.92, opacity: 0, y: 40 },
      { scale: 1, opacity: 1, y: 0, duration: 1.2, ease: 'power3.out', delay: 0.3 }
    );

    // Stagger Right Column Cards
    gsap.fromTo('.hero-col-right > *', 
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.9, stagger: 0.15, ease: 'power2.out', delay: 0.4 }
    );

    // Initialize ScrollTrigger for Sections
    initScrollStaggers();
  }

  function initScrollStaggers() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    // Stagger section headers
    gsap.utils.toArray('.section-header').forEach((header) => {
      gsap.fromTo(header.children,
        { y: 35, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.85,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: header,
            start: 'top 85%',
            toggleActions: 'play none none none'
          }
        }
      );
    });

    // Stagger feature cards
    if (document.querySelector('.features-grid')) {
      gsap.fromTo('.feature-card',
        { y: 45, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.features-grid',
            start: 'top 82%',
            toggleActions: 'play none none none'
          }
        }
      );
    }

    // Stagger Why Choose Us items
    if (document.querySelector('.why-items-list')) {
      gsap.fromTo('.why-item',
        { x: 30, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.75,
          stagger: 0.08,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.why-items-list',
            start: 'top 82%',
            toggleActions: 'play none none none'
          }
        }
      );
    }

    // Stagger Statistics Cards
    if (document.querySelector('.stats-grid')) {
      gsap.fromTo('.stat-card',
        { y: 40, opacity: 0, scale: 0.96 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.85,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.stats-grid',
            start: 'top 82%',
            toggleActions: 'play none none none'
          }
        }
      );
    }

    // Stagger How it Works Steps
    if (document.querySelector('.steps-grid')) {
      gsap.fromTo('.step-card',
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.85,
          stagger: 0.15,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.steps-grid',
            start: 'top 82%',
            toggleActions: 'play none none none'
          }
        }
      );
    }
  }

})();
`;
fs.writeFileSync(motionJsPath, motionJsContent, 'utf8');
console.log('Created assets/js/awwwards-motion.js');

// 2. APPEND PRELOADER STYLES TO style.css
const styleCssPath = path.join(frontendRoot, 'assets', 'css', 'style.css');
let styleCss = fs.readFileSync(styleCssPath, 'utf8');

const preloaderStyles = `
/* ==========================================================================
   AWWWARDS-LEVEL LUXURY CIRCULAR PRELOADER (MATCHING USER REFERENCE)
   ========================================================================== */
.awwwards-preloader {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  z-index: 999999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #05070a;
  overflow: hidden;
  user-select: none;
}

.preloader-curtain {
  position: absolute;
  left: 0;
  width: 100%;
  height: 51%;
  background: #05070a;
  z-index: 1;
}

.curtain-top {
  top: 0;
}

.curtain-bottom {
  bottom: 0;
}

.preloader-center-wrap {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2.5rem;
}

.preloader-circle-frame {
  position: relative;
  width: clamp(240px, 34vw, 340px);
  height: clamp(240px, 34vw, 340px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 60px rgba(0, 0, 0, 0.8), inset 0 0 30px rgba(255, 255, 255, 0.015);
}

.preloader-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.preloader-circle-bg {
  fill: rgba(0, 0, 0, 0.4);
  stroke: rgba(255, 255, 255, 0.12);
  stroke-width: 1.5;
}

.preloader-circle-bar {
  fill: none;
  stroke: #ffffff;
  stroke-width: 2;
  stroke-dasharray: 942;
  stroke-dashoffset: 942;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.08s linear;
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.5));
}

.preloader-counter-box {
  position: relative;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preloader-num {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: clamp(4.5rem, 11vw, 7.5rem);
  font-weight: 300;
  color: #f7f4ea;
  letter-spacing: -0.04em;
  line-height: 1;
  text-shadow: 0 0 25px rgba(247, 244, 234, 0.2);
  font-variant-numeric: tabular-nums;
}

.preloader-status-text {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  color: #94a3b8;
  font-size: 0.85rem;
  font-weight: 500;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  font-family: 'Poppins', sans-serif;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 0 8px #ffffff;
  animation: preloaderPulse 1.2s infinite alternate ease-in-out;
}

@keyframes preloaderPulse {
  0% { transform: scale(0.8); opacity: 0.4; }
  100% { transform: scale(1.3); opacity: 1; }
}
`;

if (!styleCss.includes('AWWWARDS-LEVEL LUXURY CIRCULAR PRELOADER')) {
  styleCss += '\n' + preloaderStyles;
  fs.writeFileSync(styleCssPath, styleCss, 'utf8');
  console.log('Appended preloader styles to style.css');
}

// 3. UPDATE index.html
const indexPath = path.join(frontendRoot, 'index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');

// Add Playfair Display Google Font
if (!indexHtml.includes('Playfair+Display')) {
  indexHtml = indexHtml.replace(
    'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap',
    'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,300;0,400;0,600;0,800;1,400&family=Poppins:wght@300;400;500;600;700;800&display=swap'
  );
}

// Add Lenis & GSAP CDN scripts in <head> or before scripts
const cdnScripts = `
    <!-- GSAP & Lenis Smooth Scroll -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
    <script src="https://unpkg.com/lenis@1.1.18/dist/lenis.min.js"></script>
`;

if (!indexHtml.includes('gsap.min.js')) {
  indexHtml = indexHtml.replace('</head>', cdnScripts + '\n</head>');
}

// Replace old page-loader with awwwards-preloader
const awwwardsPreloaderHtml = `
    <!-- AWWWARDS-LEVEL LUXURY CIRCULAR PRELOADER (MATCHING USER REFERENCE IMAGE) -->
    <div class="awwwards-preloader" id="awwwardsPreloader">
        <div class="preloader-curtain curtain-top"></div>
        <div class="preloader-curtain curtain-bottom"></div>
        <div class="preloader-center-wrap">
            <div class="preloader-circle-frame">
                <!-- SVG Perimeter Progress Trace -->
                <svg class="preloader-svg" viewBox="0 0 320 320">
                    <circle class="preloader-circle-bg" cx="160" cy="160" r="150" />
                    <circle class="preloader-circle-bar" id="preloaderProgressCircle" cx="160" cy="160" r="150" />
                </svg>
                <!-- Elegant Luxury Serif Number Counter starting at 00 -->
                <div class="preloader-counter-box">
                    <span class="preloader-num" id="preloaderCounter">00</span>
                </div>
            </div>
            <div class="preloader-status-text">
                <span class="status-dot"></span>
                <span class="status-msg">Loading...</span>
            </div>
        </div>
    </div>
`;

// Replace old loader
if (indexHtml.includes('<div class="page-loader" id="pageLoader">')) {
  const oldLoaderStart = indexHtml.indexOf('<div class="page-loader" id="pageLoader">');
  const oldLoaderEnd = indexHtml.indexOf('</div>', indexHtml.indexOf('</div>', indexHtml.indexOf('</div>', oldLoaderStart) + 1) + 1) + 6;
  indexHtml = indexHtml.substring(0, oldLoaderStart) + awwwardsPreloaderHtml + indexHtml.substring(oldLoaderEnd);
} else if (!indexHtml.includes('id="awwwardsPreloader"')) {
  indexHtml = indexHtml.replace('</body>', awwwardsPreloaderHtml + '\n</body>');
}

// Add awwwards-motion.js script at bottom
if (!indexHtml.includes('awwwards-motion.js')) {
  indexHtml = indexHtml.replace('</body>', '    <script src="assets/js/awwwards-motion.js?v=7.0"></script>\n</body>');
}

fs.writeFileSync(indexPath, indexHtml, 'utf8');
console.log('Successfully updated index.html with Awwwards preloader, GSAP, Lenis, and Text Stagger!');
