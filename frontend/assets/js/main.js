/**
 * AI Research Paper Summarizer - Global Main JavaScript
 */
document.addEventListener('DOMContentLoaded', () => {
    // Mobile navigation toggle
    const mobileToggle = document.getElementById('mobileToggle');
    const navMenu = document.getElementById('navMenu');

    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            const icon = mobileToggle.querySelector('i');
            if (icon) {
                if (navMenu.classList.contains('active')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-xmark');
                } else {
                    icon.classList.remove('fa-xmark');
                    icon.classList.add('fa-bars');
                }
            }
        });

        // Close menu when clicking outside or clicking a nav link
        document.addEventListener('click', (e) => {
            if (!navMenu.contains(e.target) && !mobileToggle.contains(e.target)) {
                navMenu.classList.remove('active');
                const icon = mobileToggle.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-xmark');
                    icon.classList.add('fa-bars');
                }
            }
        });
    }

    // Sticky Header Scroll effect
    const header = document.getElementById('header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 20) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    // Animated Statistics Counter-Up Functionality
    const statNumbers = document.querySelectorAll('.stat-number');
    let hasAnimatedStats = false;

    const animateStats = () => {
        statNumbers.forEach(stat => {
            const target = parseInt(stat.getAttribute('data-target'), 10);
            const suffix = stat.getAttribute('data-suffix') || '';
            const duration = 1800; // 1.8 seconds
            const startTime = performance.now();

            const updateCount = (currentTime) => {
                const elapsedTime = currentTime - startTime;
                const progress = Math.min(elapsedTime / duration, 1);
                // Ease out cubic progress
                const easeProgress = 1 - Math.pow(1 - progress, 3);
                const currentCount = Math.floor(easeProgress * target);

                stat.textContent = currentCount + suffix;

                if (progress < 1) {
                    requestAnimationFrame(updateCount);
                } else {
                    stat.textContent = target + suffix;
                }
            };

            requestAnimationFrame(updateCount);
        });
    };

    const statsSection = document.getElementById('statistics');
    if (statsSection && statNumbers.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !hasAnimatedStats) {
                    hasAnimatedStats = true;
                    animateStats();
                }
            });
        }, { threshold: 0.2 });

        observer.observe(statsSection);
    }

    // 1. BACK TO TOP BUTTON
    const backToTopBtn = document.getElementById('backToTop');
    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        });

        backToTopBtn.addEventListener('click', (e) => {
            if (window.lenis) {
                e.preventDefault();
                window.lenis.scrollTo(0, { duration: 1.5 });
            } else {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }
        });
    }

    // 2. PAGE LOADER FADE OUT
    const pageLoader = document.getElementById('pageLoader');
    if (pageLoader) {
        // Hide loader after fully loaded, or fallback after 1.5 seconds max
        const fadeLoader = () => {
            pageLoader.classList.add('loaded');
            setTimeout(() => {
                pageLoader.remove();
            }, 600);
        };

        window.addEventListener('load', fadeLoader);
        // Fallback
        setTimeout(() => {
            if (!pageLoader.classList.contains('loaded')) {
                fadeLoader();
            }
        }, 1500);
    }

    // 3. SCROLL FADE-UP ANIMATIONS
    const fadeElements = document.querySelectorAll('.fade-up');
    if (fadeElements.length > 0) {
        const fadeObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    fadeObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px'
        });

        fadeElements.forEach(el => fadeObserver.observe(el));
    }

    // 4. BUTTON RIPPLE EFFECT
    const rippleButtons = document.querySelectorAll('.ripple-effect, .btn-primary, .btn-glass, .btn-outline');
    rippleButtons.forEach(btn => {
        btn.classList.add('ripple-btn');
        btn.addEventListener('click', function(e) {
            const x = e.clientX - e.target.getBoundingClientRect().left;
            const y = e.clientY - e.target.getBoundingClientRect().top;
            
            const ripple = document.createElement('span');
            ripple.className = 'ripple-span';
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });

    // 5. FAQ ACCORDION HANDLER
    const faqTriggers = document.querySelectorAll('.faq-trigger');
    faqTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const item = trigger.closest('.faq-item');
            const content = item.querySelector('.faq-content');
            const icon = trigger.querySelector('.faq-icon-wrapper i');
            const isOpen = item.classList.contains('active');
            
            // Close all other FAQ items (accordion behavior)
            document.querySelectorAll('.faq-item').forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                    otherItem.querySelector('.faq-trigger').setAttribute('aria-expanded', 'false');
                    otherItem.querySelector('.faq-content').style.maxHeight = null;
                    const otherIcon = otherItem.querySelector('.faq-icon-wrapper i');
                    if (otherIcon) {
                        otherIcon.className = 'fa-solid fa-plus';
                    }
                }
            });

            // Toggle current FAQ item
            if (isOpen) {
                item.classList.remove('active');
                trigger.setAttribute('aria-expanded', 'false');
                content.style.maxHeight = null;
                if (icon) {
                    icon.className = 'fa-solid fa-plus';
                }
            } else {
                item.classList.add('active');
                trigger.setAttribute('aria-expanded', 'true');
                content.style.maxHeight = content.scrollHeight + 'px';
                if (icon) {
                    icon.className = 'fa-solid fa-minus';
                }
            }
        });
    });
});


