/**
 * Component Loader
 * Handles loading and configuring reusable HTML components
 */

// Load component
async function loadComponent(selector, componentPath, callback) {
    const element = document.querySelector(selector);
    if (!element) {
        console.error(`[Component] Element with selector ${selector} not found`);
        return;
    }

    try {
        // Define possible paths to try
        const basePath = getBasePath();
        const paths = [
            // Try the standard path first
            basePath + 'components/' + componentPath,
            // Fallback paths if the standard one fails
            `/Cancer/components/${componentPath}`,
            `./components/${componentPath}`,
            `../components/${componentPath}`,
            `components/${componentPath}`,
            `/components/${componentPath}`,
            `${window.location.origin}/Cancer/components/${componentPath}`,
            `${window.location.origin}/components/${componentPath}`
        ];
        
        console.log(`[Component] Attempting to load ${componentPath} from multiple paths`);
        
        // Try each path until one works
        let content = null;
        let successPath = null;
        
        for (const path of paths) {
            try {
                console.log(`[Component] Trying path: ${path}`);
                const response = await fetch(path);
                
                if (response.ok) {
                    console.log(`[Component] Successfully loaded ${componentPath} from ${path}`);
                    content = await response.text();
                    successPath = path;
                    break;
                }
            } catch (error) {
                console.warn(`[Component] Error loading from ${path}:`, error);
            }
        }
        
        // If all paths failed
        if (!content) {
            throw new Error(`Failed to load component from any path`);
        }
        
        // Set the content and initialize the component
        element.innerHTML = content;
        
        // Update links with correct paths
        const links = element.querySelectorAll('a[data-href]');
        links.forEach(link => {
            link.href = basePath + link.getAttribute('data-href');
        });
        
        if (callback) callback();
        console.log(`[Component] Component ${componentPath} fully initialized`);
        
    } catch (error) {
        console.error(`[Component] Error loading component ${componentPath}:`, error);
        element.innerHTML = `<div class="error-message">
            Error loading component
            <small>${error.message}</small>
        </div>`;
    }
}

// Function to get the base path relative to the current page
function getBasePath() {
    console.log('[Path Resolution] Determining base path for components...');
    
    // Check if we're on a specific server or domain based on hostname
    const hostname = window.location.hostname;
    
    // If on localhost/xampp, use the /Cancer/ path
    if (hostname === 'localhost' || hostname.includes('127.0.0.1') || hostname === '') {
        console.log('[Path Resolution] Using local development path');
        return '/Cancer/';
    }
    
    // For live server, try a path relative to document root
    if (window.location.pathname.includes('/Cancer/')) {
        console.log('[Path Resolution] On live server with Cancer in path');
        return '/Cancer/';
    } else {
        // For live server without /Cancer/ in the path, components are at root level
        console.log('[Path Resolution] On live server without Cancer in path');
        return '/';
    }
    
    // Original implementation left for reference
    /*
    // If we're using file:// protocol, return empty string
    if (window.location.protocol === 'file:') {
        console.log('[Path Resolution] Using file protocol, returning root path');
        return '/';
    }

    // Get the pathname
    const path = window.location.pathname;
    console.log(`[Path Resolution] Current pathname: ${path}`);
    
    // If we're at domain root or Cancer root, return /Cancer/
    if (path === '/' || path === '/Cancer/' || path === '/Cancer/index.html') {
        console.log('[Path Resolution] At root, returning /Cancer/');
        return '/Cancer/';
    }
    
    // For other pages, calculate relative path
    const segments = path.split('/').filter(Boolean);
    console.log(`[Path Resolution] Path segments:`, segments);
    
    // Remove 'Cancer' from the segments if it exists
    const cancerIndex = segments.indexOf('Cancer');
    if (cancerIndex !== -1) {
        segments.splice(0, cancerIndex + 1);
    }
    
    // Calculate depth based on remaining segments
    let depth = segments.length;
    if (path.endsWith('/') || path.endsWith('.html')) {
        depth--;
    }
    
    const basePath = depth === 0 ? '/Cancer/' : '../'.repeat(depth);
    console.log(`[Path Resolution] Final base path: ${basePath}`);
    return basePath;
    */
}

// Load header component
function loadHeader() {
    loadComponent('#header', 'header.html', () => {
        // Initialize mobile menu toggle
        const menuToggle = document.querySelector('.navbar-toggle');
        const menu = document.querySelector('.navbar-menu');
        
        if (menuToggle && menu) {
            menuToggle.addEventListener('click', () => {
                menu.classList.toggle('active');
                menuToggle.classList.toggle('active');
            });
        }
        
        // Update active menu item based on current page
        updateActiveMenuItem();
    });
}

// Load footer component
function loadFooter() {
    loadComponent('#footer', 'footer.html', () => {
        // Update copyright year
        const yearElement = document.querySelector('.footer-bottom p');
        if (yearElement && yearElement.textContent.includes('2025')) {
            const currentYear = new Date().getFullYear();
            yearElement.textContent = yearElement.textContent.replace('2025', currentYear);
        }
    });
}

// Set the active menu item
function updateActiveMenuItem() {
    const currentPath = window.location.pathname;
    console.log(`[Navigation] Updating active menu item for path: ${currentPath}`);
    const menuItems = document.querySelectorAll('.navbar-menu a');
    
    menuItems.forEach(item => {
        const href = item.getAttribute('href');
        console.log(`[Navigation] Checking menu item: ${href}`);
        
        // Get the base path and combine with href for comparison
        const basePath = getBasePath();
        const fullHref = basePath + href;
        
        if (currentPath.endsWith(href) || 
            (href === 'index.html' && (currentPath.endsWith('/') || currentPath.endsWith('/index.html'))) ||
            currentPath.endsWith(fullHref)) {
            console.log(`[Navigation] Setting active menu item: ${href}`);
            item.classList.add('active');
        }
    });
}

// Load breadcrumb component and configure it
function loadBreadcrumb(container, current, parent = null, parentUrl = null) {
    loadComponent(container, 'breadcrumb.html', () => {
        const currentElement = document.getElementById('breadcrumb-current');
        const parentElement = document.getElementById('breadcrumb-parent');
        const homeElement = document.getElementById('breadcrumb-home');
        
        if (currentElement) {
            currentElement.textContent = current;
        }
        
        if (parentElement) {
            if (parent) {
                parentElement.textContent = parent;
                if (parentUrl) {
                    parentElement.setAttribute('href', parentUrl);
                }
            } else {
                // Remove parent level if not needed
                parentElement.previousSibling?.remove(); // Remove separator
                parentElement.remove();
            }
        }
        
        if (homeElement) {
            // Update home link based on current page depth
            homeElement.setAttribute('href', `${getBasePath()}index.html`);
        }
    });
}

// Load hero component and configure it
function loadHero(container, options = {}) {
    loadComponent(container, 'hero.html', () => {
        const { title, description, ctaText, ctaUrl, imageSrc, imageAlt } = options;
        
        // Set hero content
        if (title) {
            const titleElement = document.getElementById('hero-title');
            if (titleElement) titleElement.textContent = title;
        }
        
        if (description) {
            const descElement = document.getElementById('hero-description');
            if (descElement) descElement.textContent = description;
        }
        
        if (ctaText) {
            const ctaElement = document.getElementById('hero-cta');
            if (ctaElement) {
                ctaElement.textContent = ctaText;
                if (ctaUrl) ctaElement.setAttribute('href', ctaUrl);
            }
        } else {
            // Remove CTA if not needed
            const ctaElement = document.getElementById('hero-cta');
            if (ctaElement) ctaElement.style.display = 'none';
        }
        
        // Configure the background image for static hero
        const heroStatic = document.querySelector('.hero-static');
        if (heroStatic && imageSrc) {
            heroStatic.style.backgroundImage = `url('${imageSrc}')`;
        }
    });
}

// Load hero component with overlay background
function loadHeroWithOverlay(container, options = {}) {
    loadComponent(container, 'hero.html', () => {
        const { title, description, ctaText, ctaUrl, backgroundImage } = options;
        
        // Set hero content
        if (title) {
            const titleElement = document.getElementById('hero-title');
            if (titleElement) titleElement.textContent = title;
        }
        
        if (description) {
            const descElement = document.getElementById('hero-description');
            if (descElement) descElement.textContent = description;
        }
        
        if (ctaText) {
            const ctaElement = document.getElementById('hero-cta');
            if (ctaElement) {
                ctaElement.textContent = ctaText;
                if (ctaUrl) ctaElement.setAttribute('href', ctaUrl);
            }
        } else {
            // Remove CTA if not needed
            const ctaElement = document.getElementById('hero-cta');
            if (ctaElement) ctaElement.style.display = 'none';
        }
        
        // Set the background image for the hero static component
        const heroStatic = document.querySelector('.hero-static');
        if (heroStatic && backgroundImage) {
            console.log('[Hero] Setting background image:', backgroundImage);
            heroStatic.style.backgroundImage = `url('${backgroundImage}')`;
        }
    });
}

// Document ready function
document.addEventListener('DOMContentLoaded', () => {
    // Load components if their containers exist
    if (document.querySelector('#header')) {
        loadHeader();
    }
    
    if (document.querySelector('#footer')) {
        loadFooter();
    }
    
    // Initialize any breadcrumb containers
    const breadcrumbContainer = document.querySelector('#breadcrumb-container');
    if (breadcrumbContainer) {
        loadBreadcrumb('#breadcrumb-container', document.title);
    }
}); 