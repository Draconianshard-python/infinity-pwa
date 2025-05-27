class BookmarkManager {
    constructor(storageManager) {
        this.storage = storageManager;
        this.bookmarkButton = document.getElementById('bookmarks-button');
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.bookmarkButton.addEventListener('click', () => {
            this.toggleBookmarkStatus();
        });
    }

    async toggleBookmarkStatus() {
        const currentTab = window.app.tabManager.getCurrentTab();
        if (!currentTab) return;

        const existingBookmark = await this.getBookmarkByUrl(currentTab.url);
        
        if (existingBookmark) {
            await this.removeBookmark(existingBookmark.id);
            this.bookmarkButton.classList.remove('active');
        } else {
            await this.addBookmark({
                id: crypto.randomUUID(),
                url: currentTab.url,
                title: currentTab.title,
                favicon: currentTab.favicon,
                folderId: 'root',
                timestamp: new Date().toISOString()
            });
            this.bookmarkButton.classList.add('active');
        }
    }

    async addBookmark(bookmark) {
        await this.storage.addItem('bookmarks', bookmark);
        this.dispatchBookmarkEvent('added', bookmark);
    }

    async removeBookmark(id) {
        const bookmark = await this.storage.getItem('bookmarks', id);
        if (bookmark) {
            await this.storage.deleteItem('bookmarks', id);
            this.dispatchBookmarkEvent('removed', bookmark);
        }
    }

    async getBookmarkByUrl(url) {
        const bookmarks = await this.storage.getAllItems('bookmarks');
        return bookmarks.find(b => b.url === url);
    }

    async getAllBookmarks() {
        return this.storage.getAllItems('bookmarks');
    }

    dispatchBookmarkEvent(type, bookmark) {
        window.dispatchEvent(new CustomEvent('bookmark-change', {
            detail: { type, bookmark }
        }));
    }
}

export default BookmarkManager;
