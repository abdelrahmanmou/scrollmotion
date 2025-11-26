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
                status.innerHTML = '<span style="color: #ff4444;">Oops! There was a problem submitting your form.</span>';
            }
        });
    }
});
