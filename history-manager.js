class HistoryManager {
    constructor(storageManager) {
        this.storage = storageManager;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for tab content loads
        window.app.tabManager.on('tabContentLoaded', (tab) => {
            this.addHistoryEntry({
                id: crypto.randomUUID(),
                url: tab.url,
                title: tab.title,
                favicon: tab.favicon,
                timestamp: new Date().toISOString()
            });
        });
    }

    async addHistoryEntry(entry) {
        // Don't record internal pages
        if (entry.url.startsWith('firefox-pages/')) return;

        await this.storage.addItem('history', entry);
        this.dispatchHistoryEvent('added', entry);
    }

    async getHistory(limit = 100) {
        const history = await this.storage.getAllItems('history');
        return history
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }

    async clearHistory() {
        const history = await this.storage.getAllItems('history');
        for (const entry of history) {
            await this.storage.deleteItem('history', entry.id);
        }
        this.dispatchHistoryEvent('cleared');
    }

    async searchHistory(query) {
        const history = await this.storage.getAllItems('history');
        return history.filter(entry => 
            entry.title.toLowerCase().includes(query.toLowerCase()) ||
            entry.url.toLowerCase().includes(query.toLowerCase())
        );
    }

    dispatchHistoryEvent(type, entry) {
        window.dispatchEvent(new CustomEvent('history-change', {
            detail: { type, entry }
        }));
    }
}

export default HistoryManager;
