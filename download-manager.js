class DownloadManager {
    constructor(storageManager) {
        this.storage = storageManager;
        this.activeDownloads = new Map();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for download triggers
        window.app.tabManager.on('downloadRequested', (details) => {
            this.startDownload(details);
        });
    }

    async startDownload(details) {
        const download = {
            id: crypto.randomUUID(),
            url: details.url,
            filename: this.getSafeFilename(details.filename || this.getFilenameFromUrl(details.url)),
            timestamp: new Date().toISOString(),
            status: 'in_progress',
            progress: 0,
            totalBytes: details.totalBytes || 0,
            receivedBytes: 0
        };

        this.activeDownloads.set(download.id, download);
        await this.storage.addItem('downloads', download);
        this.dispatchDownloadEvent('started', download);

        try {
            const response = await fetch(download.url);
            const reader = response.body.getReader();
            const contentLength = +response.headers.get('Content-Length');

            const stream = new ReadableStream({
                async start(controller) {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        controller.enqueue(value);
                        download.receivedBytes += value.length;
                        download.progress = (download.receivedBytes / contentLength) * 100;
                        this.updateDownloadProgress(download);
                    }
                    controller.close();
                    reader.releaseLock();
                }
            });

            const blob = await new Response(stream).blob();
            const url = URL.createObjectURL(blob);
            
            // Create download link and trigger download
            const a = document.createElement('a');
            a.href = url;
            a.download = download.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            download.status = 'completed';
            await this.updateDownload(download);
        } catch (error) {
            download.status = 'failed';
            download.error = error.message;
            await this.updateDownload(download);
        }
    }

    async updateDownload(download) {
        await this.storage.addItem('downloads', download);
        this.dispatchDownloadEvent('updated', download);
    }

    updateDownloadProgress(download) {
        this.dispatchDownloadEvent('progress', download);
    }

    async getDownloads() {
        return this.storage.getAllItems('downloads');
    }

    async removeDownload(id) {
        await this.storage.deleteItem('downloads', id);
        this.dispatchDownloadEvent('removed', { id });
    }

    getSafeFilename(filename) {
        return filename.replace(/[/\\?%*:|"<>]/g, '-');
    }

    getFilenameFromUrl(url) {
        try {
            return new URL(url).pathname.split('/').pop() || 'download';
        } catch {
            return 'download';
        }
    }

    dispatchDownloadEvent(type, download) {
        window.dispatchEvent(new CustomEvent('download-change', {
            detail: { type, download }
        }));
    }
}

export default DownloadManager;
