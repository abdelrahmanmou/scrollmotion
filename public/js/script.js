/* 
  Scroll Studio - Main Script
*/

document.addEventListener('DOMContentLoaded', () => {
    // Mark that JS has loaded - enables fade animations
    document.body.classList.add('js-loaded');

    // 1. Initialize Lenis Smooth Scroll
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // 2. GSAP Scroll Animations
    gsap.registerPlugin(ScrollTrigger);

    // Reveal Sections
    const revealElements = document.querySelectorAll('.fade-in');
    revealElements.forEach((el) => {
        gsap.fromTo(el, 
            { 
                opacity: 0, 
                y: 50,
            }, 
            {
                opacity: 1,
                y: 0,
                duration: 1.2,
                ease: 'power4.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 90%',
                    toggleActions: 'play none none none'
                }
            }
        );
    });

    // 3. Magnetic Buttons
    const magneticButtons = document.querySelectorAll('.btn-primary, .btn-outline, .btn-hero-main');
    magneticButtons.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            gsap.to(btn, {
                x: x * 0.3,
                y: y * 0.3,
                duration: 0.3,
                ease: 'power2.out'
            });
        });

        btn.addEventListener('mouseleave', () => {
            gsap.to(btn, {
                x: 0,
                y: 0,
                duration: 0.5,
                ease: 'elastic.out(1, 0.3)'
            });
        });
    });

    // 4. Header Scroll Blur
    const header = document.querySelector('.header-modern');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    // 5. Hero Reveal Animation
    const heroTl = gsap.timeline();
    heroTl.from('.hero-content h1', {
        y: 100,
        opacity: 0,
        duration: 1.2,
        ease: 'power4.out',
        delay: 0.5
    })
    .from('.hero-content .subtitle-modern', {
        y: 50,
        opacity: 0,
        duration: 1,
        ease: 'power3.out'
    }, '-=0.8')
    .from('.hero-actions-modern', {
        y: 30,
        opacity: 0,
        duration: 1,
        ease: 'power3.out'
    }, '-=0.6');

    // ===== LAZY LOAD YOUTUBE IFRAMES =====
    // Replace YouTube iframes with lightweight thumbnails. Load actual iframe on click.
    const youtubeIframes = document.querySelectorAll('iframe[src*="youtube.com/embed"]');

    youtubeIframes.forEach(iframe => {
        // Extract video ID from src
        const src = iframe.getAttribute('src');
        const match = src.match(/embed\/([a-zA-Z0-9_-]+)/);
        if (!match) return;

        const videoId = match[1];
        const title = iframe.getAttribute('title') || 'Video';

        // Create facade container
        const facade = document.createElement('div');
        facade.className = 'youtube-facade';
        facade.setAttribute('data-video-id', videoId);
        facade.setAttribute('data-title', title);
        facade.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #111 url('https://img.youtube.com/vi/${videoId}/hqdefault.jpg') center/cover no-repeat;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        // Add play button overlay
        const playBtn = document.createElement('div');
        playBtn.innerHTML = `
            <svg width="68" height="48" viewBox="0 0 68 48">
                <path d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55c-2.93.78-4.63 3.26-5.42 6.19C.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C68.06 34.95 68 24 68 24s-.06-10.95-1.48-16.26z" fill="#f00"/>
                <path d="M45 24L27 14v20" fill="#fff"/>
            </svg>
        `;
        playBtn.style.cssText = `
            opacity: 0.9;
            transition: opacity 0.2s, transform 0.2s;
        `;
        facade.appendChild(playBtn);

        // Hover effect
        facade.addEventListener('mouseenter', () => {
            playBtn.style.opacity = '1';
            playBtn.style.transform = 'scale(1.1)';
        });
        facade.addEventListener('mouseleave', () => {
            playBtn.style.opacity = '0.9';
            playBtn.style.transform = 'scale(1)';
        });

        // Click to load actual iframe
        facade.addEventListener('click', () => {
            const realIframe = document.createElement('iframe');
            realIframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
            realIframe.title = title;
            realIframe.frameBorder = '0';
            realIframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
            realIframe.allowFullscreen = true;
            realIframe.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%;';
            facade.replaceWith(realIframe);
        });

        // Replace iframe with facade
        iframe.replaceWith(facade);
    });

    // ===== LAZY LOAD VIDEOS =====
    // Use Intersection Observer to load videos only when they enter the viewport
    const lazyVideos = document.querySelectorAll('video[data-src]');
    const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const video = entry.target;
                if (video.dataset.src) {
                    video.src = video.dataset.src;
                    video.removeAttribute('data-src');
                }
                videoObserver.unobserve(video);
            }
        });
    }, { rootMargin: '200px' });

    lazyVideos.forEach(video => videoObserver.observe(video));

    // Smooth Scroll for Navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Intersection Observer for Fade-in Animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in').forEach(el => {
        observer.observe(el);
    });

    // Header Scroll Effect - using existing header variable from line 80

    // Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const mobileOverlay = document.querySelector('.mobile-overlay');

    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenuBtn.classList.toggle('active');
            navLinks.classList.toggle('active');
            if (mobileOverlay) {
                mobileOverlay.classList.toggle('active');
            }
            // Prevent body scroll when menu is open
            document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
        });

        // Close menu when clicking overlay
        if (mobileOverlay) {
            mobileOverlay.addEventListener('click', () => {
                mobileMenuBtn.classList.remove('active');
                navLinks.classList.remove('active');
                mobileOverlay.classList.remove('active');
                document.body.style.overflow = '';
            });
        }

        // Close menu when clicking nav links
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuBtn.classList.remove('active');
                navLinks.classList.remove('active');
                if (mobileOverlay) {
                    mobileOverlay.classList.remove('active');
                }
                document.body.style.overflow = '';
            });
        });
    }

    // Pricing Tabs
    const pricingTabs = document.querySelectorAll('.pricing-tab');
    const pricingContents = document.querySelectorAll('.pricing-tab-content');

    pricingTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;

            pricingTabs.forEach(t => t.classList.remove('active'));
            pricingContents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            const content = document.getElementById('tab-' + target);
            if (content) content.classList.add('active');
        });
    });

    // Contact Form Handling (AJAX)
    const form = document.getElementById('contact-form');
    const status = document.getElementById('form-status');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = new FormData(form);

            status.innerHTML = '<span style="color: #fff;">Sending...</span>';

            try {
                const response = await fetch(form.action, {
                    method: form.method,
                    body: data,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    status.innerHTML = '<span style="color: #00ffff;">Thanks! Message sent successfully.</span>';
                    form.reset();
                } else {
                    const jsonData = await response.json();
                    if (Object.hasOwn(jsonData, 'errors')) {
                        status.innerHTML = `<span style="color: #ff4444;">${jsonData.errors.map(error => error.message).join(", ")}</span>`;
                    } else {
                        status.innerHTML = '<span style="color: #ff4444;">Oops! There was a problem submitting your form.</span>';
                    }
                }
            } catch (error) {
                status.textContent = 'Oops! There was a network error.';
                status.style.color = 'red';
            }
        });
    }

    // Shorts Scroll Buttons
    const shortsSection = document.getElementById('shorts');
    if (shortsSection) {
        const shortsTrack = shortsSection.querySelector('.shorts-track');
        const prevBtn = shortsSection.querySelector('.scroll-btn.prev');
        const nextBtn = shortsSection.querySelector('.scroll-btn.next');

        if (shortsTrack && prevBtn && nextBtn) {

            prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                shortsTrack.scrollBy({
                    left: -320, // Scroll by card width + gap
                    behavior: 'smooth'
                });
            });

            nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                shortsTrack.scrollBy({
                    left: 320,
                    behavior: 'smooth'
                });
            });
        }
    }
    // Carousel Logic
    const carousel = document.querySelector('#insights-carousel');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');

    if (carousel && prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => {
            carousel.scrollBy({ left: -340, behavior: 'smooth' });
        });

        nextBtn.addEventListener('click', () => {
            carousel.scrollBy({ left: 340, behavior: 'smooth' });
        });
    }

    // Motion Graphics & Cinematic Launch Carousel Scroll Buttons (Generic)
    const motionSections = document.querySelectorAll('#motion-graphics, #cinematic-launch, #motion'); // Support old and new IDs

    motionSections.forEach(section => {
        const motionTrack = section.querySelector('.motion-track');
        const motionPrevBtn = section.querySelector('.scroll-btn.prev');
        const motionNextBtn = section.querySelector('.scroll-btn.next');

        if (motionTrack && motionPrevBtn && motionNextBtn) {
            motionPrevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                motionTrack.scrollBy({
                    left: -470, // Scroll by card width + gap
                    behavior: 'smooth'
                });
            });

            motionNextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                motionTrack.scrollBy({
                    left: 470,
                    behavior: 'smooth'
                });
            });
        }
    });

    // Horizontal Scroll with Mouse Wheel
    const scrollContainers = [
        document.querySelector('.shorts-track'),
        document.querySelector('.motion-track'),
        document.querySelector('#insights-carousel')
    ];

    scrollContainers.forEach(container => {
        if (container) {
            container.addEventListener('wheel', (e) => {
                if (e.deltaY !== 0) {
                    e.preventDefault();
                    container.scrollLeft += e.deltaY;
                }
            }, { passive: false });
        }
    });

    // Work v2 Video Controls
    document.querySelectorAll('.video-container').forEach(container => {
        const video = container.querySelector('video');
        const poster = container.querySelector('.video-poster');
        const playBtn = container.querySelector('.play-btn');
        const muteBtn = container.querySelector('.mute-btn');
        
        if (!video || !playBtn || !muteBtn) return;

        const playIcon = playBtn.querySelector('.play-icon');
        const pauseIcon = playBtn.querySelector('.pause-icon');
        const muteIcon = muteBtn.querySelector('.mute-icon');
        const unmuteIcon = muteBtn.querySelector('.unmute-icon');

        function updatePlayButton() {
            if (video.paused) {
                playIcon.style.display = 'block';
                pauseIcon.style.display = 'none';
                container.classList.remove('is-playing');
            } else {
                playIcon.style.display = 'none';
                pauseIcon.style.display = 'block';
                container.classList.add('is-playing');
            }
        }

        function updateMuteButton() {
            if (video.muted) {
                muteIcon.style.display = 'block';
                unmuteIcon.style.display = 'none';
            } else {
                muteIcon.style.display = 'none';
                unmuteIcon.style.display = 'block';
            }
        }

        // Play/Pause toggle
        playBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            if (video.paused) {
                // Pause all other videos first
                document.querySelectorAll('.video-container video').forEach(v => {
                    if (v !== video) {
                        v.pause();
                        v.style.opacity = '0';
                        const vPoster = v.closest('.mockup-inner').querySelector('.video-poster');
                        if (vPoster) vPoster.style.opacity = '1';
                        v.closest('.video-container').classList.remove('is-playing');
                    }
                });
                
                // Hide poster, show video
                if (poster) poster.style.opacity = '0';
                video.style.opacity = '1';
                
                video.play().then(() => {
                    video.muted = false;
                    updatePlayButton();
                    updateMuteButton();
                }).catch(e => {
                    console.log("Playback blocked", e);
                    // Try muted first
                    video.muted = true;
                    video.play().then(() => {
                        updatePlayButton();
                        updateMuteButton();
                    });
                });
            } else {
                video.pause();
                updatePlayButton();
            }
        });

        // Mute/Unmute toggle
        muteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            video.muted = !video.muted;
            updateMuteButton();
        });

        // Video event listeners
        video.addEventListener('play', updatePlayButton);
        video.addEventListener('pause', updatePlayButton);
        video.addEventListener('volumechange', updateMuteButton);

        // Click on container to play/pause
        container.addEventListener('click', (e) => {
            if (e.target === container || e.target.classList.contains('mockup-inner') || e.target.classList.contains('video-poster')) {
                playBtn.click();
            }
        });

        // Initialize
        updatePlayButton();
        updateMuteButton();
    });

    // Stagger animations for grid items
    const staggerContainers = [
        '.services-grid',
        '.process-grid',
        '.pricing-grid',
        '.testimonials-grid'
    ];

    staggerContainers.forEach(selector => {
        const container = document.querySelector(selector);
        if (container) {
            const items = container.children;
            Array.from(items).forEach((item, index) => {
                item.style.transitionDelay = `${index * 0.1}s`;
            });
        }
    });
});
