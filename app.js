import IconGenerator from './icon-generator.js';
import TabManager from './tab-manager.js';
import IconGenerator from './icon-generator.js';
class FirefoxPWA {
    constructor() {
        this.tabManager = new TabManager();
        this.setupNavigationEvents();
        this.setupURLBar();
    }

    setupNavigationEvents() {
        const backBtn = document.getElementById('back-button');
        const forwardBtn = document.getElementById('forward-button');
        const reloadBtn = document.getElementById('reload-button');

        backBtn.addEventListener('click', () => {
            history.back();
        });

        forwardBtn.addEventListener('click', () => {
            history.forward();
        });

        reloadBtn.addEventListener('click', () => {
            const frame = document.getElementById('browser-frame');
            frame.contentWindow.location.reload();
        });
    }

    setupURLBar() {
        const urlbar = document.getElementById('urlbar');
        
        urlbar.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                let url = urlbar.value.trim();
                
                // Handle search queries
                if (!url.includes('.') || url.includes(' ')) {
                    url = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
                }
                // Add https if no protocol specified
                else if (!/^https?:\/\//i.test(url)) {
                    url = 'https://' + url;
                }

                this.tabManager.updateActiveTab({ url });
                document.getElementById('browser-frame').src = url;
            }
        });
    }
}

// Initialize the app
window.addEventListener('load', () => {
    window.app = new FirefoxPWA();
});

async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/service-worker.js');
            
            // Handle updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // New service worker available
                        if (confirm('New version available! Update now?')) {
                            newWorker.postMessage({ type: 'SKIP_WAITING' });
                            window.location.reload();
                        }
                    }
                });
            });

            // Handle controller change
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                // Reload page when new service worker takes over
                window.location.reload();
            });

            console.log('Service Worker registered successfully!');
            return registration;
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    }
}
}


async function initializePWA() {
    // Generate icons
    const iconGenerator = new IconGenerator();
    const icons = await iconGenerator.generateIcons();
    
    // Update manifest with generated icons
    const manifest = await (await fetch('manifest.json')).json();
    
    // Add regular and maskable icons
    manifest.icons = Object.entries(icons)
        .filter(([name]) => name.startsWith('firefox-'))
        .map(([name, dataUrl]) => {
            const size = name.match(/\d+/)[0];
            const isMaskable = name.includes('maskable');
            return {
                src: dataUrl,
                sizes: `${size}x${size}`,
                type: 'image/png',
                purpose: isMaskable ? 'maskable' : 'any'
            };
        });
    
    // Add shortcut icons
    manifest.shortcuts.forEach(shortcut => {
        const iconName = shortcut.url.includes('private') ? 'private-96' : 'new-tab-96';
        shortcut.icons = [{
            src: icons[iconName],
            sizes: '96x96',
            type: 'image/png'
        }];
    });

    // Create and inject dynamic manifest
    const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
    const manifestUrl = URL.createObjectURL(manifestBlob);
    
    // Update manifest link
    const manifestLink = document.querySelector('link[rel="manifest"]');
    manifestLink.href = manifestUrl;

    // Update favicon
    const favicon = document.querySelector('link[rel="icon"]');
    favicon.href = icons['firefox-196'];
    
    // Update apple-touch-icon
    const appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
    appleIcon.href = icons['firefox-180'];
}

// Initialize when the page loads
window.addEventListener('load', initializePWA);

// Rest of your app.js code will go here...
// Add this to the existing app.js




// Call this after IconGenerator initialization
registerServiceWorker();
