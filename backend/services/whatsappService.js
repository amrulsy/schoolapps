/**
 * WhatsApp Service - Dual Mode (Internal / External API)
 * 
 * Mode Internal: Menggunakan whatsapp-web.js (gratis, butuh scan QR)
 * Mode External: Menggunakan API pihak ketiga (Fonnte, WooWA, dll)
 * 
 * Anti-Banned Measures:
 * - Random delay antar pesan (5-15 detik)
 * - Message queue dengan throttling
 * - Variasi konten (timestamp unik)
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');

class WhatsAppService {
    constructor() {
        this.mode = process.env.WA_MODE || 'internal';
        this.client = null;
        this.isReady = false;
        this.qrCode = null; // base64 QR image for frontend
        this.queue = [];
        this.isProcessing = false;
        this.statusMessage = 'Belum diinisialisasi';
        this.history = []; // { id, phone, message, status, timestamp, error }
        this.MAX_HISTORY = 100;
        this.hourlyLimit = parseInt(process.env.WA_HOURLY_LIMIT) || 50;

        // Anti-ban config
        this.MIN_DELAY = 5000;  // 5 detik minimum
        this.MAX_DELAY = 15000; // 15 detik maximum
        this.sentCount = 0;
        this.sentCountResetTime = Date.now();
    }

    /**
     * Inisialisasi client WhatsApp (hanya untuk mode internal)
     */
    async initialize() {
        if (this.mode !== 'internal') {
            this.statusMessage = 'Mode External API aktif';
            this.isReady = true;
            console.log('[WA Service] Mode: External API');
            return;
        }

        console.log('[WA Service] Menginisialisasi mode Internal (whatsapp-web.js)...');
        this.statusMessage = 'Menginisialisasi...';

        this.client = new Client({
            authStrategy: new LocalAuth({
                dataPath: './wa_session'
            }),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--disable-gpu'
                ]
            }
        });

        this.client.on('qr', async (qr) => {
            console.log('[WA Service] QR Code diterima. Scan dari halaman admin.');
            this.statusMessage = 'Menunggu scan QR Code...';
            this.isReady = false;
            try {
                this.qrCode = await QRCode.toDataURL(qr);
            } catch (err) {
                console.error('[WA Service] Gagal generate QR image:', err.message);
            }
        });

        this.client.on('ready', () => {
            console.log('[WA Service] ✅ WhatsApp terhubung dan siap!');
            this.isReady = true;
            this.qrCode = null;
            this.statusMessage = 'Terhubung & Siap';
        });

        this.client.on('authenticated', () => {
            console.log('[WA Service] ✅ Autentikasi berhasil (sesi tersimpan).');
            this.statusMessage = 'Terautentikasi';
        });

        this.client.on('auth_failure', (msg) => {
            console.error('[WA Service] ❌ Autentikasi gagal:', msg);
            this.isReady = false;
            this.statusMessage = 'Autentikasi gagal';
        });

        this.client.on('disconnected', (reason) => {
            console.log('[WA Service] ⚠️ Terputus:', reason);
            this.isReady = false;
            this.qrCode = null;
            this.statusMessage = 'Terputus: ' + reason;
        });

        try {
            await this.client.initialize();
        } catch (err) {
            console.error('[WA Service] Gagal inisialisasi:', err.message);
            this.statusMessage = 'Gagal inisialisasi: ' + err.message;
        }
    }

    /**
     * Mendapatkan status service
     */
    getStatus() {
        return {
            mode: this.mode,
            isReady: this.isReady,
            qrCode: this.qrCode,
            statusMessage: this.statusMessage,
            queueLength: this.queue.length,
            sentThisHour: this.sentCount,
            hourlyLimit: this.hourlyLimit,
            history: this.history
        };
    }

    /**
     * Update limit pengiriman per jam
     */
    updateConfig({ hourlyLimit }) {
        if (hourlyLimit) this.hourlyLimit = parseInt(hourlyLimit);
        console.log(`[WA Service] Konfigurasi diupdate: limit ${this.hourlyLimit}/jam`);
        return { success: true, config: { hourlyLimit: this.hourlyLimit } };
    }

    /**
     * Hapus riwayat pesan
     */
    clearHistory() {
        this.history = [];
        return { success: true };
    }

    /**
     * Format nomor telepon ke format WhatsApp (62xxxxx@c.us)
     */
    formatPhone(phone) {
        if (!phone) return null;
        let cleaned = phone.replace(/[^0-9]/g, '');
        if (cleaned.startsWith('0')) {
            cleaned = '62' + cleaned.substring(1);
        }
        if (!cleaned.startsWith('62')) {
            cleaned = '62' + cleaned;
        }
        return cleaned + '@c.us';
    }

    /**
     * Random delay untuk anti-banned
     */
    getRandomDelay() {
        return Math.floor(Math.random() * (this.MAX_DELAY - this.MIN_DELAY + 1)) + this.MIN_DELAY;
    }

    /**
     * Cek dan reset hourly counter
     */
    checkHourlyLimit() {
        const now = Date.now();
        if (now - this.sentCountResetTime > 3600000) {
            this.sentCount = 0;
            this.sentCountResetTime = now;
        }
        return this.sentCount < this.hourlyLimit;
    }

    /**
     * Kirim pesan (masuk ke antrean)
     */
    async sendMessage(phone, message) {
        if (!phone) {
            console.log('[WA Service] Skip: nomor telepon kosong');
            return { success: false, reason: 'Nomor telepon kosong' };
        }

        const msgId = 'msg_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        
        // Tambahkan variasi konten (anti-spam)
        const timestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
        const uniqueMessage = `${message}\n\n_Dikirim: ${timestamp}_`;

        const queueItem = { id: msgId, phone, message: uniqueMessage };
        this.queue.push(queueItem);
        
        // Catat di riwayat sebagai 'pending'
        this._addToHistory({
            id: msgId,
            phone,
            message,
            status: 'pending',
            timestamp: new Date().toISOString()
        });

        console.log(`[WA Service] Pesan ditambahkan ke antrean. Total antrean: ${this.queue.length}`);

        // Mulai proses antrean jika belum berjalan
        if (!this.isProcessing) {
            this._processQueue();
        }

        return { success: true, reason: 'Pesan masuk antrean' };
    }

    /**
     * Proses antrean pesan satu per satu dengan delay
     */
    async _processQueue() {
        if (this.isProcessing || this.queue.length === 0) return;
        this.isProcessing = true;

        while (this.queue.length > 0) {
            // Check hourly limit (misal 50 pesan per jam untuk keamanan)
            if (!this.checkHourlyLimit()) {
                console.log(`[WA Service] Limit tercapai (${this.hourlyLimit}/jam). Menunggu reset jam depan.`);
                this.statusMessage = `Limit per jam tercapai (${this.hourlyLimit}/jam)`;
                await this._sleep(60000); // tunggu 1 menit
                continue;
            }

            const { id, phone, message } = this.queue.shift();

            try {
                if (this.mode === 'internal') {
                    await this._sendInternal(phone, message);
                } else {
                    await this._sendExternal(phone, message);
                }
                this.sentCount++;
                this._updateHistoryStatus(id, 'sent');
            } catch (err) {
                console.error(`[WA Service] Gagal kirim ke ${phone}:`, err.message);
                this._updateHistoryStatus(id, 'failed', err.message);
            }

            // Random delay antar pesan (anti-banned)
            if (this.queue.length > 0) {
                const delay = this.getRandomDelay();
                console.log(`[WA Service] Delay ${delay / 1000}s sebelum pesan berikutnya...`);
                await this._sleep(delay);
            }
        }

        this.isProcessing = false;
    }

    /**
     * Kirim via whatsapp-web.js (Internal)
     */
    async _sendInternal(phone, message) {
        if (!this.isReady || !this.client) {
            throw new Error('WhatsApp belum terhubung. Silakan scan QR Code terlebih dahulu.');
        }
        const chatId = this.formatPhone(phone);
        if (!chatId) throw new Error('Nomor telepon tidak valid');

        await this.client.sendMessage(chatId, message);
        console.log(`[WA Service] ✅ Pesan berhasil dikirim ke ${phone} (internal)`);
    }

    /**
     * Kirim via External API (Fonnte, WooWA, dll)
     */
    async _sendExternal(phone, message) {
        const apiUrl = process.env.WA_EXTERNAL_API_URL;
        const apiToken = process.env.WA_EXTERNAL_API_TOKEN;

        if (!apiUrl || !apiToken) {
            throw new Error('WA_EXTERNAL_API_URL dan WA_EXTERNAL_API_TOKEN belum dikonfigurasi');
        }

        let cleaned = phone.replace(/[^0-9]/g, '');
        if (cleaned.startsWith('0')) cleaned = '62' + cleaned.substring(1);

        const res = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': apiToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                target: cleaned,
                message: message
            })
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`External API error: ${res.status} - ${errText}`);
        }

        console.log(`[WA Service] ✅ Pesan berhasil dikirim ke ${phone} (external)`);
    }

    /**
     * Logout dan hapus sesi (untuk mode internal)
     */
    async logout() {
        if (this.mode === 'internal' && this.client) {
            try {
                await this.client.logout();
                this.isReady = false;
                this.qrCode = null;
                this.statusMessage = 'Logged out';
                console.log('[WA Service] Berhasil logout');
                return { success: true };
            } catch (err) {
                console.error('[WA Service] Gagal logout:', err.message);
                return { success: false, error: err.message };
            }
        }
        return { success: false, error: 'Hanya tersedia untuk mode internal' };
    }

    /**
     * Restart client (untuk mode internal)
     */
    async restart() {
        if (this.mode === 'internal' && this.client) {
            try {
                await this.client.destroy();
            } catch (e) { /* ignore */ }
            this.isReady = false;
            this.qrCode = null;
            this.statusMessage = 'Restarting...';
            await this.initialize();
            return { success: true };
        }
        return { success: false, error: 'Hanya tersedia untuk mode internal' };
    }

    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    _addToHistory(entry) {
        this.history.unshift(entry);
        if (this.history.length > this.MAX_HISTORY) {
            this.history.pop();
        }
    }

    _updateHistoryStatus(id, status, error = null) {
        const entry = this.history.find(h => h.id === id);
        if (entry) {
            entry.status = status;
            if (error) entry.error = error;
        }
    }
}

// Singleton instance
const waService = new WhatsAppService();

module.exports = waService;
