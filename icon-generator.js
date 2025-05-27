class IconGenerator {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
    }

    async generateIcons() {
        const sizes = [48, 72, 96, 128, 192, 384, 512];
        const icons = {};

        // Generate regular icons
        for (const size of sizes) {
            icons[`firefox-${size}`] = await this.createFirefoxIcon(size);
        }

        // Generate maskable icons
        const maskableSizes = [192, 512];
        for (const size of maskableSizes) {
            icons[`firefox-maskable-${size}`] = await this.createFirefoxIcon(size, true);
        }

        // Generate shortcut icons
        icons['new-tab-96'] = await this.createNewTabIcon(96);
        icons['private-96'] = await this.createPrivateIcon(96);

        return icons;
    }

    async createFirefoxIcon(size, isMaskable = false) {
        const padding = isMaskable ? Math.floor(size * 0.1) : 0;
        const actualSize = size - (padding * 2);
        
        this.canvas.width = size;
        this.canvas.height = size;
        this.ctx.clearRect(0, 0, size, size);

        // Background for maskable icons
        if (isMaskable) {
            this.ctx.fillStyle = '#0F1126';
            this.ctx.fillRect(0, 0, size, size);
        }

        // Create circular background
        this.ctx.beginPath();
        this.ctx.arc(
            size / 2,
            size / 2,
            actualSize / 2,
            0,
            Math.PI * 2
        );
        this.ctx.fillStyle = '#0F1126';
        this.ctx.fill();

        // Create Firefox body gradient
        const bodyGradient = this.ctx.createLinearGradient(
            padding,
            padding,
            size - padding,
            size - padding
        );
        bodyGradient.addColorStop(0, '#FF9500');
        bodyGradient.addColorStop(1, '#FF4E00');

        // Draw Firefox body
        this.ctx.beginPath();
        this.ctx.arc(
            size / 2,
            size / 2,
            actualSize * 0.4,
            0,
            Math.PI * 2
        );
        this.ctx.fillStyle = bodyGradient;
        this.ctx.fill();

        return this.canvas.toDataURL('image/png');
    }

    async createNewTabIcon(size) {
        this.canvas.width = size;
        this.canvas.height = size;
        this.ctx.clearRect(0, 0, size, size);

        // Draw background
        this.ctx.fillStyle = '#0F1126';
        this.ctx.fillRect(0, 0, size, size);

        // Draw plus symbol
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = size * 0.1;
        this.ctx.beginPath();
        this.ctx.moveTo(size * 0.3, size * 0.5);
        this.ctx.lineTo(size * 0.7, size * 0.5);
        this.ctx.moveTo(size * 0.5, size * 0.3);
        this.ctx.lineTo(size * 0.5, size * 0.7);
        this.ctx.stroke();

        return this.canvas.toDataURL('image/png');
    }

    async createPrivateIcon(size) {
        this.canvas.width = size;
        this.canvas.height = size;
        this.ctx.clearRect(0, 0, size, size);

        // Draw background
        this.ctx.fillStyle = '#0F1126';
        this.ctx.fillRect(0, 0, size, size);

        // Draw mask symbol
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(size * 0.5, size * 0.4, size * 0.2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw mask band
        this.ctx.fillRect(size * 0.2, size * 0.4, size * 0.6, size * 0.15);

        return this.canvas.toDataURL('image/png');
    }
}

export default IconGenerator;
