class StorageManager {
    constructor() {
        this.dbName = 'firefox-pwa-db';
        this.dbVersion = 1;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Bookmarks store
                if (!db.objectStoreNames.contains('bookmarks')) {
                    const bookmarksStore = db.createObjectStore('bookmarks', { keyPath: 'id' });
                    bookmarksStore.createIndex('url', 'url', { unique: false });
                    bookmarksStore.createIndex('title', 'title', { unique: false });
                    bookmarksStore.createIndex('folderId', 'folderId', { unique: false });
                }

                // History store
                if (!db.objectStoreNames.contains('history')) {
                    const historyStore = db.createObjectStore('history', { keyPath: 'id' });
                    historyStore.createIndex('url', 'url', { unique: false });
                    historyStore.createIndex('title', 'title', { unique: false });
                    historyStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                // Downloads store
                if (!db.objectStoreNames.contains('downloads')) {
                    const downloadsStore = db.createObjectStore('downloads', { keyPath: 'id' });
                    downloadsStore.createIndex('url', 'url', { unique: false });
                    downloadsStore.createIndex('filename', 'filename', { unique: false });
                    downloadsStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    }

    async addItem(storeName, item) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(item);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getItem(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllItems(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteItem(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

export default StorageManager;
