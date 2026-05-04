/* 
  Scroll Studio - Main Script
*/

document.addEventListener('DOMContentLoaded', () => {
    // Mark that JS has loaded - enables fade animations
    document.body.classList.add('js-loaded');

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

    // Header Scroll Effect
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.background = 'rgba(5, 5, 5, 0.95)';
            header.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
        } else {
            header.style.background = 'rgba(5, 5, 5, 0.8)';
            header.style.boxShadow = 'none';
        }
    });

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

    // Work v2 Hover Play
    document.querySelectorAll('.work-card-v2').forEach(card => {
        const video = card.querySelector('video');
        if (video) {
            card.addEventListener('mouseenter', () => {
                video.muted = false;
                video.play().catch(e => console.log("Auto-play prevented", e));
            });
            card.addEventListener('mouseleave', () => {
                video.pause();
                video.muted = true;
                video.currentTime = 0;
            });
        }
    });
});
