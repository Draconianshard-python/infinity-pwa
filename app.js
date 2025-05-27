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
