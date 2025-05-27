const CACHE_NAME = 'firefox-pwa-v1';
const DYNAMIC_CACHE = 'firefox-pwa-dynamic-v1';

// Resources to cache initially
const STATIC_RESOURCES = [
    '/',
    '/index.html',
    '/css/main.css',
    '/css/desktop.css',
    '/css/mobile.css',
    '/js/app.js',
    '/js/icon-generator.js',
    '/manifest.json'
];

// Firefox specific pages to cache
const FIREFOX_PAGES = [
    '/firefox-pages/newtab.html',
    '/firefox-pages/private.html',
    '/firefox-pages/about.html',
    '/firefox-pages/config.html',
    '/firefox-pages/addons.html'
];

// Install event - cache static resources
self.addEventListener('install', event => {
    event.waitUntil(
        Promise.all([
            // Cache static resources
            caches.open(CACHE_NAME).then(cache => {
                return cache.addAll(STATIC_RESOURCES);
            }),
            // Cache Firefox specific pages
            caches.open(DYNAMIC_CACHE).then(cache => {
                return cache.addAll(FIREFOX_PAGES);
            })
        ])
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME && name !== DYNAMIC_CACHE)
                    .map(name => caches.delete(name))
            );
        })
    );
});

// Helper function to check if URL is a Firefox internal page
function isFirefoxInternalPage(url) {
    return url.startsWith('firefox:') || url.includes('/firefox-pages/');
}

// Helper function to check if URL should be cached
function shouldCache(url) {
    const urlObj = new URL(url);
    
    // Don't cache other origins except for specific APIs
    if (urlObj.origin !== location.origin) {
        return false;
    }

    // Don't cache query parameters except for specific internal pages
    if (urlObj.search && !isFirefoxInternalPage(url)) {
        return false;
    }

    return true;
}

// Custom response for Firefox internal pages
async function handleFirefoxPage(request) {
    const url = new URL(request.url);
    const page = url.pathname.split('/').pop();

    switch (page) {
        case 'newtab':
            return new Response(
                `<!DOCTYPE html>
                <html>
                    <head>
                        <title>New Tab</title>
                        <link rel="stylesheet" href="/css/main.css">
                    </head>
                    <body>
                        <div class="newtab-content">
                            <h1>New Tab</h1>
                            <!-- Add new tab content here -->
                        </div>
                    </body>
                </html>`,
                {
                    headers: { 'Content-Type': 'text/html' }
                }
            );
        // Add more internal pages as needed
        default:
            return caches.match('/index.html');
    }
}

// Fetch event - handle requests
self.addEventListener('fetch', event => {
    const request = event.request;

    // Handle Firefox internal pages
    if (isFirefoxInternalPage(request.url)) {
        event.respondWith(handleFirefoxPage(request));
        return;
    }

    // Network-first strategy for navigation requests
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then(response => {
                    if (shouldCache(request.url)) {
                        const responseClone = response.clone();
                        caches.open(DYNAMIC_CACHE).then(cache => {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    return caches.match(request)
                        .then(response => response || caches.match('/index.html'));
                })
        );
        return;
    }

    // Cache-first strategy for static resources
    if (request.method === 'GET') {
        event.respondWith(
            caches.match(request)
                .then(response => {
                    if (response) {
                        return response;
                    }

                    return fetch(request).then(networkResponse => {
                        if (shouldCache(request.url)) {
                            const responseClone = networkResponse.clone();
                            caches.open(DYNAMIC_CACHE).then(cache => {
                                cache.put(request, responseClone);
                            });
                        }
                        return networkResponse;
                    });
                })
        );
        return;
    }
});

// Handle push notifications
self.addEventListener('push', event => {
    const options = {
        body: event.data.text(),
        icon: '/assets/icons/firefox-192.png',
        badge: '/assets/icons/firefox-96.png'
    };

    event.waitUntil(
        self.registration.showNotification('Firefox PWA', options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow('/')
    );
});

// Handle background sync
self.addEventListener('sync', event => {
    if (event.tag === 'sync-tabs') {
        event.waitUntil(
            // Implement tab syncing logic here
            Promise.resolve()
        );
    }
});

// Handle periodic sync
self.addEventListener('periodicsync', event => {
    if (event.tag === 'update-content') {
        event.waitUntil(
            // Implement periodic content update logic here
            Promise.resolve()
        );
    }
});

// Message handling
self.addEventListener('message', event => {
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
