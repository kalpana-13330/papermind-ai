/**
 * PaperMind AI - Awwwards Motion & Ultra-Smooth Scroll Engine
 * Powered by Lenis (v1.1+), GSAP (v3.12+), and ScrollTrigger
 */
(function() {
  'use strict';

  // 1. Initialize Lenis Smooth Momentum Scroll
  let lenis = null;
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      lerp: 0.08, // Golden ratio for ultra-buttery momentum deceleration
      wheelMultiplier: 1.05,
      touchMultiplier: 1.5,
      smoothWheel: true,
      syncTouch: true,
      syncTouchLerp: 0.08,
      infinite: false,
      autoRaf: false
    });

    window.lenis = lenis;

    // Register ScrollTrigger with GSAP
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
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

    // Intercept internal anchor links for smooth kinetic gliding
    document.addEventListener('click', (e) => {
      const anchor = e.target.closest('a[href^="#"]');
      if (!anchor) return;

      const targetId = anchor.getAttribute('href');
      if (targetId && targetId.length > 1 && targetId.startsWith('#')) {
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          e.preventDefault();
          lenis.scrollTo(targetEl, {
            offset: -75,
            duration: 1.4,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
          });

          // Close mobile menu if active
          const navMenu = document.getElementById('navMenu');
          const mobileToggle = document.getElementById('mobileToggle');
          if (navMenu && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            if (mobileToggle) {
              const icon = mobileToggle.querySelector('i');
              if (icon) {
                icon.classList.remove('fa-xmark');
                icon.classList.add('fa-bars');
              }
            }
          }
        }
      }
    });

    // Wire up back-to-top button
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
      backToTop.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        lenis.scrollTo(0, {
          duration: 1.5,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
        });
      });
    }
  }

  // 2. Awwwards Preloader Counter & Exit Animation (Matching User Reference Image)
  const preloader = document.getElementById('awwwardsPreloader');
  const counterEl = document.getElementById('preloaderCounter');
  const progressCircle = document.getElementById('preloaderProgressCircle');

  if (preloader && counterEl) {
    // Lock scroll during preloader
    if (lenis) lenis.stop();
    document.body.style.overflow = 'hidden';

    const circumference = 2 * Math.PI * 150; // ~942.48
    const targetProgress = 100;
    const duration = 1800; // 1.8 seconds smooth count
    const startTime = performance.now();

    const updateLoader = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easeT = 1 - Math.pow(1 - t, 3);
      const currentProgress = Math.floor(easeT * targetProgress);

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
      // Re-enable smooth scroll
      if (lenis) lenis.start();
      document.body.style.overflow = '';

      if (typeof gsap !== 'undefined') {
        const tl = gsap.timeline();

        // Scale up counter & circle slightly
        tl.to('.preloader-center-wrap', {
          scale: 1.12,
          opacity: 0,
          duration: 0.55,
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
          duration: 0.25,
          onComplete: () => {
            preloader.style.display = 'none';
            triggerHeroTextStagger();
          }
        }, '-=0.25');
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
      { y: 50, opacity: 0, rotateX: 12 },
      { y: 0, opacity: 1, rotateX: 0, duration: 1.1, stagger: 0.15, ease: 'power3.out' }
    );

    // Stagger Left Column
    gsap.fromTo('.hero-col-left > *', 
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.9, stagger: 0.12, ease: 'power2.out', delay: 0.2 }
    );

    // Stagger Center iPhone Mockup
    gsap.fromTo('.iphone-mockup-frame', 
      { scale: 0.92, opacity: 0, y: 35 },
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
        { y: 30, opacity: 0 },
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
        { y: 40, opacity: 0 },
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
        { y: 35, opacity: 0, scale: 0.96 },
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
        { y: 35, opacity: 0 },
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
