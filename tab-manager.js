class Tab {
    constructor({ id, url, title, favicon, isActive = false }) {
        this.id = id || crypto.randomUUID();
        this.url = url;
        this.title = title || 'New Tab';
        this.favicon = favicon || '/assets/icons/firefox-48.png';
        this.isActive = isActive;
        this.element = this.createTabElement();
    }

    createTabElement() {
        const tab = document.createElement('div');
        tab.className = `tab${this.isActive ? ' active' : ''}`;
        tab.dataset.tabId = this.id;
        
        tab.innerHTML = `
            <img class="tab-favicon" src="${this.favicon}" alt="">
            <span class="tab-title">${this.title}</span>
            <button class="tab-close" aria-label="Close tab">×</button>
        `;
        
        return tab;
    }

    update({ url, title, favicon }) {
        if (url) this.url = url;
        if (title) {
            this.title = title;
            this.element.querySelector('.tab-title').textContent = title;
        }
        if (favicon) {
            this.favicon = favicon;
            this.element.querySelector('.tab-favicon').src = favicon;
        }
    }

    setActive(active) {
        this.isActive = active;
        this.element.classList.toggle('active', active);
    }
}

class TabManager {
    constructor() {
        this.tabs = new Map();
        this.activeTabId = null;
        this.tabsContainer = document.getElementById('tabs-container');
        this.contentArea = document.getElementById('browser-frame');
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // New tab button
        document.getElementById('new-tab-button').addEventListener('click', () => {
            this.createNewTab();
        });

        // Tab container events
        this.tabsContainer.addEventListener('click', (e) => {
            const tabElement = e.target.closest('.tab');
            if (!tabElement) return;

            const closeButton = e.target.closest('.tab-close');
            if (closeButton) {
                this.closeTab(tabElement.dataset.tabId);
            } else {
                this.setActiveTab(tabElement.dataset.tabId);
            }
        });

        // Tab dragging
        this.setupTabDragging();
    }

    setupTabDragging() {
        let draggedTab = null;

        this.tabsContainer.addEventListener('dragstart', (e) => {
            draggedTab = e.target.closest('.tab');
            if (!draggedTab) return;
            
            e.dataTransfer.setData('text/plain', draggedTab.dataset.tabId);
            e.dataTransfer.effectAllowed = 'move';
        });

        this.tabsContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            const tab = e.target.closest('.tab');
            if (!tab || tab === draggedTab) return;

            const rect = tab.getBoundingClientRect();
            const midPoint = rect.x + rect.width / 2;
            
            if (e.clientX < midPoint) {
                tab.style.borderLeft = '2px solid var(--firefox-focus)';
                tab.style.borderRight = '';
            } else {
                tab.style.borderLeft = '';
                tab.style.borderRight = '2px solid var(--firefox-focus)';
            }
        });

        this.tabsContainer.addEventListener('dragleave', (e) => {
            const tab = e.target.closest('.tab');
            if (!tab) return;
            
            tab.style.borderLeft = '';
            tab.style.borderRight = '';
        });

        this.tabsContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            const targetTab = e.target.closest('.tab');
            if (!targetTab || targetTab === draggedTab) return;

            const draggedTabId = e.dataTransfer.getData('text/plain');
            const rect = targetTab.getBoundingClientRect();
            const midPoint = rect.x + rect.width / 2;
            
            this.moveTab(draggedTabId, targetTab.dataset.tabId, e.clientX < midPoint);
            targetTab.style.borderLeft = '';
            targetTab.style.borderRight = '';
        });
    }

    createNewTab(url = 'firefox-pages/newtab.html') {
        const tab = new Tab({
            url,
            title: 'New Tab',
            isActive: true
        });

        this.tabs.set(tab.id, tab);
        this.tabsContainer.appendChild(tab.element);
        this.setActiveTab(tab.id);
        
        return tab;
    }

    closeTab(tabId) {
        const tab = this.tabs.get(tabId);
        if (!tab) return;

        tab.element.remove();
        this.tabs.delete(tabId);

        if (this.activeTabId === tabId) {
            const remainingTabs = Array.from(this.tabs.keys());
            if (remainingTabs.length) {
                this.setActiveTab(remainingTabs[remainingTabs.length - 1]);
            } else {
                this.createNewTab();
            }
        }
    }

    setActiveTab(tabId) {
        const tab = this.tabs.get(tabId);
        if (!tab) return;

        if (this.activeTabId) {
            const currentActive = this.tabs.get(this.activeTabId);
            if (currentActive) {
                currentActive.setActive(false);
            }
        }

        tab.setActive(true);
        this.activeTabId = tabId;
        this.loadTabContent(tab);
    }

    loadTabContent(tab) {
        this.contentArea.src = tab.url;
        
        // Update URL bar
        document.getElementById('urlbar').value = tab.url;
    }

    moveTab(draggedTabId, targetTabId, beforeTarget) {
        const draggedTab = this.tabs.get(draggedTabId);
        const targetTab = this.tabs.get(targetTabId);
        if (!draggedTab || !targetTab) return;

        if (beforeTarget) {
            this.tabsContainer.insertBefore(draggedTab.element, targetTab.element);
        } else {
            this.tabsContainer.insertBefore(draggedTab.element, targetTab.element.nextSibling);
        }
    }

    updateActiveTab({ url, title, favicon }) {
        if (!this.activeTabId) return;
        
        const tab = this.tabs.get(this.activeTabId);
        if (tab) {
            tab.update({ url, title, favicon });
        }
    }
}

export default TabManager;
