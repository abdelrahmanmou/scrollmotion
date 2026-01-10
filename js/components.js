/**
 * Scroll Studio - Shared Components
 * JavaScript-based component injection for static HTML site
 */

const SITE_CONFIG = {
    name: 'Scroll Studio',
    url: 'https://scrollmotion.site',
    calendlyUrl: 'https://calendly.com/abdo-moustafa-1998/new-meeting',
    currentYear: new Date().getFullYear()
};

// Navigation structure for consistent linking
const NAV_STRUCTURE = {
    main: [
        { label: 'About', href: '/#about' },
        { label: 'Portfolio', href: '/portfolio.html' },
        { label: 'Case Studies', href: '/case-studies.html' },
        { label: 'Blog', href: '/blog/' }
    ],
    services: [
        { label: 'SaaS Explainer Videos', href: '/services/saas-explainer-videos.html' },
        { label: 'Motion Graphics', href: '/services/motion-graphics.html' },
        { label: 'Product Demo Videos', href: '/services/product-demo-videos.html' },
        { label: 'Startup Video Production', href: '/services/startup-video-production.html' }
    ],
    industries: [
        { label: 'FinTech', href: '/industries/fintech.html' },
        { label: 'HealthTech', href: '/industries/healthtech.html' },
        { label: 'EdTech', href: '/industries/edtech.html' },
        { label: 'E-commerce', href: '/industries/ecommerce.html' },
        { label: 'Real Estate', href: '/industries/real-estate.html' },
        { label: 'LegalTech', href: '/industries/legaltech.html' }
    ],
    locations: [
        { label: 'Cairo', href: '/locations/cairo.html' },
        { label: 'Dubai', href: '/locations/dubai.html' },
        { label: 'London', href: '/locations/london.html' },
        { label: 'New York', href: '/locations/new-york.html' },
        { label: 'San Francisco', href: '/locations/san-francisco.html' },
        { label: 'Berlin', href: '/locations/berlin.html' }
    ],
    articles: [
        { label: 'SaaS Video Marketing Strategy 2025', href: '/articles/saas-video-marketing-strategy-2025.html' },
        { label: 'Video Production Costs', href: '/articles/saas-video-production-costs.html' },
        { label: 'Explainer Video Guide', href: '/articles/perfect-saas-explainer-video.html' },
        { label: 'Video Marketing ROI', href: '/articles/video-marketing-roi.html' }
    ]
};

/**
 * Get the base path for links based on current page depth
 */
function getBasePath() {
    const path = window.location.pathname;
    const depth = (path.match(/\//g) || []).length - 1;
    if (depth === 0 || path === '/' || path === '/index.html') {
        return '';
    }
    return '../'.repeat(depth);
}

/**
 * Resolve a path based on current page location
 */
function resolvePath(href) {
    const base = getBasePath();
    // Handle absolute paths starting with /
    if (href.startsWith('/')) {
        if (base === '') {
            return '.' + href;
        }
        return base + href.substring(1);
    }
    return href;
}

/**
 * Generate the header HTML
 */
function generateHeader() {
    const base = getBasePath();
    const homeLink = base === '' ? '/' : base + 'index.html';

    return `
    <header>
        <div class="container">
            <nav>
                <a href="${homeLink}" class="logo">
                    <img src="${base}logo.svg" alt="Scroll Studio" height="40" style="height: 40px; width: auto;">
                </a>
                <button class="mobile-menu-btn" aria-label="Toggle menu">
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
                <div class="nav-links">
                    ${NAV_STRUCTURE.main.map(item =>
        `<a href="${resolvePath(item.href)}">${item.label}</a>`
    ).join('\n                    ')}
                    <button class="btn btn-primary" style="padding: 8px 20px; font-size: 0.8rem;"
                        onclick="Calendly.initPopupWidget({url: '${SITE_CONFIG.calendlyUrl}'}); return false;">Book Call</button>
                </div>
            </nav>
        </div>
        <div class="mobile-overlay"></div>
    </header>`;
}

/**
 * Generate the footer HTML with comprehensive internal linking
 */
function generateFooter() {
    return `
    <footer>
        <div class="container">
            <div class="footer-grid">
                <div class="footer-brand">
                    <h3>Scroll<span class="text-gradient">Studio</span></h3>
                    <p style="font-size: 0.9rem; color: var(--text-muted); margin-top: 10px; max-width: 280px;">
                        Specialized SaaS motion graphics & video production for startups.
                    </p>
                </div>
                
                <div class="footer-links">
                    <h4>Services</h4>
                    <ul>
                        ${NAV_STRUCTURE.services.map(item =>
        `<li><a href="${resolvePath(item.href)}">${item.label}</a></li>`
    ).join('\n                        ')}
                    </ul>
                </div>
                
                <div class="footer-links">
                    <h4>Industries</h4>
                    <ul>
                        ${NAV_STRUCTURE.industries.map(item =>
        `<li><a href="${resolvePath(item.href)}">${item.label}</a></li>`
    ).join('\n                        ')}
                    </ul>
                </div>
                
                <div class="footer-links">
                    <h4>Resources</h4>
                    <ul>
                        ${NAV_STRUCTURE.articles.map(item =>
        `<li><a href="${resolvePath(item.href)}">${item.label}</a></li>`
    ).join('\n                        ')}
                        <li><a href="${resolvePath('/blog/')}">All Articles</a></li>
                    </ul>
                </div>
            </div>
            
            <div class="footer-bottom">
                <p>© ${SITE_CONFIG.currentYear} ${SITE_CONFIG.name}. All Rights Reserved.</p>
                <div class="social-links">
                    <a href="https://instagram.com" class="social-icon" aria-label="Instagram" target="_blank" rel="noopener">IG</a>
                    <a href="https://youtube.com" class="social-icon" aria-label="YouTube" target="_blank" rel="noopener">YT</a>
                    <a href="https://linkedin.com" class="social-icon" aria-label="LinkedIn" target="_blank" rel="noopener">LI</a>
                </div>
            </div>
        </div>
    </footer>`;
}

/**
 * Generate breadcrumb schema and HTML
 */
function generateBreadcrumbs(items) {
    if (!items || items.length === 0) return '';

    const schemaItems = items.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": item.name,
        ...(item.url ? { "item": item.url } : {})
    }));

    const schema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": schemaItems
    };

    const html = `
    <nav class="breadcrumbs" aria-label="Breadcrumb">
        <ol>
            ${items.map((item, index) => `
                <li${index === items.length - 1 ? ' aria-current="page"' : ''}>
                    ${item.url ? `<a href="${resolvePath(item.url)}">${item.name}</a>` : item.name}
                </li>
            `).join('')}
        </ol>
    </nav>`;

    return { schema, html };
}

/**
 * Generate related articles section based on category
 */
function generateRelatedArticles(currentUrl, category, maxItems = 4) {
    const allArticles = [
        { title: 'SaaS Video Marketing Strategy 2025', href: '/articles/saas-video-marketing-strategy-2025.html', category: 'strategy' },
        { title: 'SaaS Video Production Costs', href: '/articles/saas-video-production-costs.html', category: 'budgeting' },
        { title: '2D vs 3D Animation for SaaS', href: '/articles/2d-vs-3d-animation-saas.html', category: 'production' },
        { title: 'The Perfect SaaS Explainer Video', href: '/articles/perfect-saas-explainer-video.html', category: 'production' },
        { title: 'Motion Graphics for SaaS Growth', href: '/articles/saas-motion-graphics.html', category: 'production' },
        { title: 'Product Demos vs Explainers', href: '/articles/product-demos-vs-explainers.html', category: 'strategy' },
        { title: 'SaaS Video Launch Guide', href: '/articles/saas-video-launch.html', category: 'strategy' },
        { title: 'Video Marketing ROI', href: '/articles/video-marketing-roi.html', category: 'analytics' },
        { title: 'Explainer Video Length Guide', href: '/articles/explainer-video-length.html', category: 'production' },
        { title: 'Explainer Video Script Writing', href: '/articles/explainer-video-script-writing.html', category: 'production' },
        { title: 'Best Explainer Video Examples', href: '/articles/best-explainer-video-examples.html', category: 'inspiration' },
        { title: 'Animated vs Live Action Video', href: '/articles/animated-vs-live-action-video.html', category: 'strategy' },
        { title: 'Video for B2B Sales', href: '/articles/video-for-b2b-sales.html', category: 'sales' },
        { title: 'SaaS Onboarding Videos', href: '/articles/saas-onboarding-videos.html', category: 'retention' },
        { title: 'Social Media Video Strategy', href: '/articles/social-media-video-strategy.html', category: 'social' },
        { title: 'Video Testimonials Guide', href: '/articles/video-testimonials-guide.html', category: 'social-proof' },
        { title: 'Video SEO Guide', href: '/articles/video-seo-guide.html', category: 'seo' }
    ];

    // Filter out current article and prioritize same category
    const filtered = allArticles
        .filter(a => !currentUrl.includes(a.href))
        .sort((a, b) => {
            if (a.category === category && b.category !== category) return -1;
            if (b.category === category && a.category !== category) return 1;
            return 0;
        })
        .slice(0, maxItems);

    if (filtered.length === 0) return '';

    return `
    <div class="related-articles">
        <h3>Related Articles</h3>
        <ul>
            ${filtered.map(article =>
        `<li><a href="${resolvePath(article.href)}">${article.title}</a></li>`
    ).join('\n            ')}
        </ul>
    </div>`;
}

/**
 * Generate related services section
 */
function generateRelatedServices(currentUrl) {
    const services = NAV_STRUCTURE.services
        .filter(s => !currentUrl.includes(s.href));

    if (services.length === 0) return '';

    return `
    <div class="related-links">
        <h3>Our Services</h3>
        <ul>
            ${services.map(service =>
        `<li><a href="${resolvePath(service.href)}">${service.label}</a></li>`
    ).join('\n            ')}
        </ul>
    </div>`;
}

/**
 * Generate related industries section
 */
function generateRelatedIndustries(currentUrl) {
    const industries = NAV_STRUCTURE.industries
        .filter(i => !currentUrl.includes(i.href));

    if (industries.length === 0) return '';

    return `
    <div class="related-links">
        <h3>Industries We Serve</h3>
        <ul>
            ${industries.map(industry =>
        `<li><a href="${resolvePath(industry.href)}">${industry.label}</a></li>`
    ).join('\n            ')}
        </ul>
    </div>`;
}

/**
 * Initialize components on page load
 */
function initComponents() {
    // Load Calendly widget CSS and JS if not already present
    if (!document.querySelector('link[href*="calendly"]')) {
        const calendlyCSS = document.createElement('link');
        calendlyCSS.href = 'https://assets.calendly.com/assets/external/widget.css';
        calendlyCSS.rel = 'stylesheet';
        document.head.appendChild(calendlyCSS);

        const calendlyJS = document.createElement('script');
        calendlyJS.src = 'https://assets.calendly.com/assets/external/widget.js';
        calendlyJS.async = true;
        document.head.appendChild(calendlyJS);
    }

    // Inject header if placeholder exists
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (headerPlaceholder) {
        headerPlaceholder.outerHTML = generateHeader();
    }

    // Inject footer if placeholder exists
    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (footerPlaceholder) {
        footerPlaceholder.outerHTML = generateFooter();
    }

    // Initialize mobile menu after header is injected
    initMobileMenu();
}

/**
 * Initialize mobile menu functionality
 */
function initMobileMenu() {
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
            document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
        });

        if (mobileOverlay) {
            mobileOverlay.addEventListener('click', () => {
                mobileMenuBtn.classList.remove('active');
                navLinks.classList.remove('active');
                mobileOverlay.classList.remove('active');
                document.body.style.overflow = '';
            });
        }

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
}

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initComponents);
} else {
    initComponents();
}

// Export for use in other scripts
window.ScrollStudioComponents = {
    generateHeader,
    generateFooter,
    generateBreadcrumbs,
    generateRelatedArticles,
    generateRelatedServices,
    generateRelatedIndustries,
    NAV_STRUCTURE,
    SITE_CONFIG,
    resolvePath
};
