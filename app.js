import TabManager from './tab-manager.js';
import StorageManager from './storage-manager.js';
import BookmarkManager from './bookmark-manager.js';
import HistoryManager from './history-manager.js';
import DownloadManager from './download-manager.js';
import IconGenerator from './icon-generator.js';

class FirefoxPWA {
    constructor() {
        this.initializeManagers();
        this.setupNavigationEvents();
        this.setupURLBar();
        this.setupSidebarEvents();
        this.setupWindowControls();
        this.lastUpdateCheck = null;
        this.setupAutoUpdater();
    }

    async initializeManagers() {
        // Initialize storage first
        this.storageManager = new StorageManager();
        await this.storageManager.init();

        // Initialize other managers
        this.tabManager = new TabManager();
        this.bookmarkManager = new BookmarkManager(this.storageManager);
        this.historyManager = new HistoryManager(this.storageManager);
        this.downloadManager = new DownloadManager(this.storageManager);

        // Create initial tab if none exists
        if (this.tabManager.tabs.size === 0) {
            this.tabManager.createNewTab();
        }
    }

    setupNavigationEvents() {
        const backBtn = document.getElementById('back-button');
        const forwardBtn = document.getElementById('forward-button');
        const reloadBtn = document.getElementById('reload-button');
        const menuBtn = document.getElementById('menu-button');

        backBtn.addEventListener('click', () => {
            const frame = document.getElementById('browser-frame');
            if (frame.contentWindow.history.length > 0) {
                frame.contentWindow.history.back();
            }
            this.updateNavigationButtons();
        });

        forwardBtn.addEventListener('click', () => {
            const frame = document.getElementById('browser-frame');
            frame.contentWindow.history.forward();
            this.updateNavigationButtons();
        });

        reloadBtn.addEventListener('click', () => {
            const frame = document.getElementById('browser-frame');
            frame.contentWindow.location.reload();
        });

        menuBtn.addEventListener('click', () => {
            this.toggleMenu();
        });
    }

    updateNavigationButtons() {
        const frame = document.getElementById('browser-frame');
        const backBtn = document.getElementById('back-button');
        const forwardBtn = document.getElementById('forward-button');

        backBtn.disabled = !frame.contentWindow.history.length;
        forwardBtn.disabled = !frame.contentWindow.history.length;
    }

    setupURLBar() {
        const urlbar = document.getElementById('urlbar');
        
        urlbar.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                let url = urlbar.value.trim();
                
                // Handle special firefox: URLs
                if (url.startsWith('firefox:')) {
                    this.handleFirefoxURL(url);
                    return;
                }
                
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

        // Handle URL bar focus
        urlbar.addEventListener('focus', () => {
            urlbar.select();
        });
    }

    handleFirefoxURL(url) {
        const pages = {
            'firefox:newtab': '/firefox-pages/newtab.html',
            'firefox:downloads': '/firefox-pages/downloads.html',
            'firefox:history': '/firefox-pages/history.html',
            'firefox:bookmarks': '/firefox-pages/bookmarks.html',
            'firefox:settings': '/firefox-pages/settings.html',
            'firefox:about': '/firefox-pages/about.html'
        };

        const page = pages[url] || pages['firefox:newtab'];
        this.tabManager.updateActiveTab({ url: page });
        document.getElementById('browser-frame').src = page;
    }

    setupSidebarEvents() {
        const sidebar = document.getElementById('sidebar');
        const sidebarSelect = document.getElementById('sidebar-select');
        const sidebarContent = document.getElementById('sidebar-content');
        const sidebarClose = document.getElementById('sidebar-close');

        sidebarSelect.addEventListener('change', async () => {
            await this.updateSidebarContent(sidebarSelect.value);
        });

        sidebarClose.addEventListener('click', () => {
            sidebar.hidden = true;
        });

        // Handle sidebar item clicks
        sidebarContent.addEventListener('click', (e) => {
            const item = e.target.closest('.sidebar-item');
            if (!item) return;

            const deleteButton = e.target.closest('.delete-button');
            if (deleteButton) {
                this.handleSidebarItemDelete(item);
            } else {
                this.handleSidebarItemClick(item);
            }
        });
    }

    async updateSidebarContent(type) {
        const container = document.getElementById('sidebar-content');
        
        switch (type) {
            case 'bookmarks':
                await this.showBookmarks(container);
                break;
            case 'history':
                await this.showHistory(container);
                break;
            case 'downloads':
                await this.showDownloads(container);
                break;
        }
    }

    async showBookmarks(container) {
        const bookmarks = await this.bookmarkManager.getAllBookmarks();
        container.innerHTML = bookmarks.map(bookmark => `
            <div class="sidebar-item bookmark-item" data-id="${bookmark.id}" data-url="${bookmark.url}">
                <img src="${bookmark.favicon}" alt="">
                <span>${bookmark.title}</span>
                <button class="delete-button" aria-label="Delete bookmark">×</button>
            </div>
        `).join('');
    }

    async showHistory(container) {
        const history = await this.historyManager.getHistory();
        container.innerHTML = history.map(entry => `
            <div class="sidebar-item history-item" data-id="${entry.id}" data-url="${entry.url}">
                <img src="${entry.favicon}" alt="">
                <span>${entry.title}</span>
                <small>${new Date(entry.timestamp).toLocaleString()}</small>
                <button class="delete-button" aria-label="Delete history entry">×</button>
            </div>
        `).join('');
    }

    async showDownloads(container) {
        const downloads = await this.downloadManager.getDownloads();
        container.innerHTML = downloads.map(download => `
            <div class="sidebar-item download-item" data-id="${download.id}">
                <span>${download.filename}</span>
                <small>${download.status}</small>
                ${download.status === 'in_progress' ? 
                    `<progress value="${download.progress}" max="100"></progress>` : 
                    ''}
                <button class="delete-button" aria-label="Delete download">×</button>
            </div>
        `).join('');
    }

    handleSidebarItemClick(item) {
        const url = item.dataset.url;
        if (url) {
            this.tabManager.createNewTab(url);
        }
    }

    async handleSidebarItemDelete(item) {
        const { id } = item.dataset;
        const type = item.classList.contains('bookmark-item') ? 'bookmarks' :
                    item.classList.contains('history-item') ? 'history' : 'downloads';
        
        await this.storageManager.deleteItem(type, id);
        item.remove();
    }

    setupWindowControls() {
        const minimizeBtn = document.querySelector('.window-control.minimize');
        const maximizeBtn = document.querySelector('.window-control.maximize');
        const closeBtn = document.querySelector('.window-control.close');

        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => {
                if (window.electron) {
                    window.electron.minimizeWindow();
                }
            });
        }

        if (maximizeBtn) {
            maximizeBtn.addEventListener('click', () => {
                if (window.electron) {
                    window.electron.maximizeWindow();
                }
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (window.electron) {
                    window.electron.closeWindow();
                }
            });
        }
    }

    setupAutoUpdater() {
        setInterval(() => {
            this.checkForUpdates();
        }, 1000 * 60 * 60); // Check every hour
    }

    async checkForUpdates() {
        const now = new Date();
        if (this.lastUpdateCheck && 
            (now - this.lastUpdateCheck) < (1000 * 60 * 60)) {
            return;
        }

        this.lastUpdateCheck = now;

        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            await registration.update();
        }
    }

    toggleMenu() {
        // Implementation for menu toggle
    }
}

// Initialize the app
window.addEventListener('load', async () => {
    // Initialize PWA features
    const iconGenerator = new IconGenerator();
    await iconGenerator.generateIcons();
    
    // Register service worker
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/service-worker.js');
            console.log('ServiceWorker registration successful');
        } catch (err) {
            console.error('ServiceWorker registration failed: ', err);
        }
    }

    // Create app instance
    window.app = new FirefoxPWA();
});
