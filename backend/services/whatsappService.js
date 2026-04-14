/* eslint-disable react-hooks/rules-of-hooks */
/**
 * WhatsApp Service - Dual Mode (Baileys / External API)
 * 
 * Mode 'baileys': Menggunakan @whiskeysockets/baileys (Pure JS, no Chromium, shared hosting compatible)
 * Mode 'external': Menggunakan API pihak ketiga (Fonnte, WooWA, dll)
 * 
 * Anti-Banned Measures:
 * - Random delay antar pesan (5-15 detik)
 * - Message queue dengan throttling
 * - Variasi konten (timestamp unik)
 */

const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

class WhatsAppService {
    constructor() {
        this.mode = process.env.WA_MODE || 'internal';
        this.sock = null;
        this.isReady = false;
        this.qrCode = null;
        this.queue = [];
        this.isProcessing = false;
        this.statusMessage = 'Belum diinisialisasi';
        this.history = [];
        this.MAX_HISTORY = 100;
        this.hourlyLimit = parseInt(process.env.WA_HOURLY_LIMIT) || 50;

        // Anti-ban config
        this.MIN_DELAY = 5000;
        this.MAX_DELAY = 15000;
        this.sentCount = 0;
        this.sentCountResetTime = Date.now();

        this.logger = null;
        this.store = null;
    }

    /**
     * Inisialisasi client WhatsApp (Baileys)
     */
    async initialize() {
        if (this.mode !== 'internal') {
            this.statusMessage = 'Mode External API aktif';
            this.isReady = true;
            console.log('[WA Service] Mode: External API');
            return;
        }

        console.log('[WA Service] Menginisialisasi mode Internal (Baileys)...');
        this.statusMessage = 'Menginisialisasi...';

        // Dynamic imports for ESM modules
        const baileys = await import("@whiskeysockets/baileys");

        // Debugging exports
        const exportKeys = Object.keys(baileys);
        console.log('[WA Service] Tersedia di library Baileys:', exportKeys.filter(k => !k.startsWith('_')).join(', '));

        const makeWASocket = baileys.default || baileys.makeWASocket;
        const {
            useMultiFileAuthState,
            DisconnectReason,
            fetchLatestBaileysVersion
        } = baileys;

        const { default: pino } = await import("pino");

        this.logger = pino({ level: 'silent' });
        // Store dinonaktifkan sementara untuk kestabilan inisialisasi
        this.store = null;

        const sessionPath = path.join(__dirname, '../wa_session_baileys');
        if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true });

        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
        const { version, isLatest } = await fetchLatestBaileysVersion();

        console.log(`[WA Service] Menggunakan Baileys v${version.join('.')} (Latest: ${isLatest})`);

        this.sock = makeWASocket({
            version,
            logger: this.logger,
            printQRInTerminal: true,
            auth: state,
            browser: ["SIAS SMK PPRQ", "Chrome", "1.0.0"],
            markOnlineOnConnect: true
        });

        // this.store.bind(this.sock.ev);

        this.sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                console.log('[WA Service] QR Code diterima. Scan dari halaman admin.');
                this.statusMessage = 'Menunggu scan QR Code...';
                this.isReady = false;
                try {
                    this.qrCode = await QRCode.toDataURL(qr);
                } catch (err) {
                    console.error('[WA Service] Gagal generate QR image:', err.message);
                }
            }

            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const isLoggedOut = statusCode === DisconnectReason.loggedOut;
                console.log('[WA Service] Koneksi terputus karena:', lastDisconnect?.error, '. StatusCode:', statusCode);
                this.isReady = false;
                this.qrCode = null;

                if (isLoggedOut) {
                    // Logged out — jangan auto-reconnect, biarkan logout() yang handle re-init
                    this.statusMessage = 'Logged out. Menunggu inisialisasi ulang...';
                } else {
                    this.statusMessage = 'Terputus, mencoba menghubungkan kembali...';
                    this.initialize();
                }
            } else if (connection === 'open') {
                console.log('[WA Service] ✅ WhatsApp terhubung dan siap!');
                this.isReady = true;
                this.qrCode = null;
                this.statusMessage = 'Terhubung & Siap';
            }
        });

        this.sock.ev.on('creds.update', saveCreds);
    }

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

    formatPhone(phone) {
        if (!phone) return null;
        let cleaned = phone.replace(/[^0-9]/g, '');
        if (cleaned.startsWith('0')) {
            cleaned = '62' + cleaned.substring(1);
        }
        if (!cleaned.startsWith('62')) {
            cleaned = '62' + cleaned;
        }
        return cleaned + '@s.whatsapp.net'; // Baileys uses @s.whatsapp.net for users
    }

    async sendMessage(phone, message) {
        if (!phone) return { success: false, reason: 'Nomor telepon kosong' };

        const msgId = 'msg_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        const timestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
        const uniqueMessage = `${message}\n\n_Dikirim: ${timestamp}_`;

        const queueItem = { id: msgId, phone, message: uniqueMessage };
        this.queue.push(queueItem);

        this._addToHistory({
            id: msgId,
            phone,
            message,
            status: 'pending',
            timestamp: new Date().toISOString()
        });

        if (!this.isProcessing) this._processQueue();
        return { success: true, reason: 'Pesan masuk antrean' };
    }

    async _processQueue() {
        if (this.isProcessing || this.queue.length === 0) return;
        this.isProcessing = true;

        while (this.queue.length > 0) {
            const now = Date.now();
            if (now - this.sentCountResetTime > 3600000) {
                this.sentCount = 0;
                this.sentCountResetTime = now;
            }

            if (this.sentCount >= this.hourlyLimit) {
                this.statusMessage = `Limit per jam tercapai (${this.hourlyLimit}/jam)`;
                await new Promise(resolve => setTimeout(resolve, 60000));
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

            if (this.queue.length > 0) {
                const delay = Math.floor(Math.random() * (this.MAX_DELAY - this.MIN_DELAY + 1)) + this.MIN_DELAY;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        this.isProcessing = false;
    }

    async _sendInternal(phone, message) {
        if (!this.isReady || !this.sock) {
            throw new Error('WhatsApp belum terhubung. Silakan scan QR Code terlebih dahulu.');
        }
        const jid = this.formatPhone(phone);
        await this.sock.sendMessage(jid, { text: message });
        console.log(`[WA Service] ✅ Pesan berhasil dikirim ke ${phone} (Baileys)`);
    }

    async _sendExternal(phone, message) {
        const apiUrl = process.env.WA_EXTERNAL_API_URL;
        const apiToken = process.env.WA_EXTERNAL_API_TOKEN;

        if (!apiUrl || !apiToken) throw new Error('Konfigurasi API External belum lengkap');

        let cleaned = phone.replace(/[^0-9]/g, '');
        if (cleaned.startsWith('0')) cleaned = '62' + cleaned.substring(1);

        const res = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Authorization': apiToken, 'Content-Type': 'application/json' },
            body: JSON.stringify({ target: cleaned, message: message })
        });

        if (!res.ok) throw new Error(`External API error: ${res.status}`);
        console.log(`[WA Service] ✅ Pesan berhasil dikirim ke ${phone} (external)`);
    }

    async logout() {
        if (this.mode !== 'internal') {
            return { success: false, error: 'Hanya tersedia untuk mode internal' };
        }

        // 1. Coba logout dari socket Baileys (best-effort)
        if (this.sock) {
            try {
                await this.sock.logout();
            } catch (err) {
                console.warn('[WA Service] Peringatan saat logout socket:', err.message);
            }
            this.sock = null;
        }

        // 2. Reset semua state internal
        this.isReady = false;
        this.qrCode = null;
        this.statusMessage = 'Logged out. Menghapus sesi...';

        // 3. Hapus folder sesi agar Baileys generate QR baru saat initialize()
        const sessionPath = path.join(__dirname, '../wa_session_baileys');
        try {
            if (fs.existsSync(sessionPath)) {
                fs.rmSync(sessionPath, { recursive: true, force: true });
                console.log('[WA Service] Folder sesi berhasil dihapus.');
            }
        } catch (err) {
            console.error('[WA Service] Gagal hapus folder sesi:', err.message);
        }

        // 4. Inisialisasi ulang setelah jeda singkat → akan generate QR baru
        this.statusMessage = 'Menunggu scan QR Code baru...';
        setTimeout(() => this.initialize(), 1500);

        return { success: true };
    }


    _addToHistory(entry) {
        this.history.unshift(entry);
        if (this.history.length > this.MAX_HISTORY) this.history.pop();
    }

    _updateHistoryStatus(id, status, error = null) {
        const entry = this.history.find(h => h.id === id);
        if (entry) {
            entry.status = status;
            if (error) entry.error = error;
        }
    }
}

// Tangkal error websocket yang tiba-tiba putus (seperti code "1006") agar server Node.js tidak ikut crash
process.on('unhandledRejection', (reason, promise) => {
    if (String(reason) === '1006' || String(reason) === '1005') {
        console.warn('[WA Service] Peringatan: Socket terputus paksa dengan statushode', reason);
    } else {
        console.error('[Global Error] Unhandled Rejection:', reason);
    }
});

const waService = new WhatsAppService();
module.exports = waService;
