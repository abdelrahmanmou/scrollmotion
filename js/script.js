/* 
  Scroll Studio - Main Script
*/

document.addEventListener('DOMContentLoaded', () => {
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
});
