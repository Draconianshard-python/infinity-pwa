import IconGenerator from './icon-generator.js';

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


// Call this after IconGenerator initialization
registerServiceWorker();
