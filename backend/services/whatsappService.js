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
        this.MIN_DELAY = 15000;
        this.MAX_DELAY = 35000;
        this.BURST_SIZE = 3; 
        this.BURST_COOLDOWN = 60000; // Increased to 60 seconds
        this.processedInBurst = 0;
        
        this.sentCount = 0;
        this.sentCountResetTime = Date.now();
        this.lastPresenceUpdate = 0;
        this.peerLastSent = new Map(); // Untuk per-peer throttling
        this.menuCooldown = new Map(); // Cooldown menu agar tidak spamming auto-reply

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
            fetchLatestBaileysVersion,
            Browsers
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

        // Generator Fingerprint Hardware/Browser Acak
        const getRandomBrowser = () => {
            const osOptions = [
                ['Windows', 'Chrome', '120.0.6099.109'],
                ['Mac OS', 'Safari', '17.2'],
                ['Windows', 'Edge', '120.0.2210.121'],
                ['Mac OS', 'Chrome', '120.0.6099.109'],
                ['Ubuntu', 'Firefox', '121.0']
            ];
            return osOptions[Math.floor(Math.random() * osOptions.length)];
        };

        const currentBrowser = getRandomBrowser();
        console.log(`[WA Service] 🛡️ Spoofing Device Fingerprint: ${currentBrowser.join(' - ')}`);

        let socketConfig = {
            version,
            logger: this.logger,
            printQRInTerminal: true,
            auth: state,
            browser: currentBrowser,
            markOnlineOnConnect: false
        };

        // 🛡️ Integrasi Agen Lapisan Proxy jika diletakkan di hosting / `.env`
        if (process.env.WA_PROXY_URL) {
            try {
                const { HttpsProxyAgent } = await import('https-proxy-agent');
                const proxyAgent = new HttpsProxyAgent(process.env.WA_PROXY_URL);
                socketConfig.agent = proxyAgent;
                console.log(`[WA Service] 🛡️ Terhubung melalui Custom Proxy: ${process.env.WA_PROXY_URL}`);
            } catch (err) {
                console.warn('[WA Service] ⚠️ WA_PROXY_URL terdeteksi tapi module `https-proxy-agent` belum diinstall. Koneksi direct dilanjutkan.');
            }
        }

        this.sock = makeWASocket(socketConfig);

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
                
                // Start Ghost Protocol: Heartbeat Online
                this._startHeartbeat();
            }
        });

        this.sock.ev.on('creds.update', saveCreds);

        // --- GHOST PROTOCOL: AUTO-READ & INTERACTION ---
        this.sock.ev.on('messages.upsert', async ({ messages, type }) => {
            if (type !== 'notify') return;
            for (const msg of messages) {
                if (!msg.key.fromMe && !msg.key.remoteJid.includes('@g.us')) {
                    const jid = msg.key.remoteJid;
                    const msgText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
                    
                    // 1. Simulasi orang buka chat (Hanya membanca 80% dari total pesan, random Delay 5-15s)
                    if (Math.random() > 0.2) { // 80% probabilitas dbaca, 20% dibiarkan unread sbg bukti logis manusia
                        const readDelay = Math.floor(Math.random() * 10000) + 5000;
                        setTimeout(async () => {
                            try {
                                if (this.sock && this.isReady) {
                                    await this.sock.readMessages([msg.key]);
                                    console.log(`[WA Service] 👁️ Auto-read pesan dari ${jid}`);
                                }
                            } catch (err) { /* silent fail */ }
                        }, readDelay);
                    }

                    // 2. Guardian Level 4: Auto-Menu (Reputation Building)
                    const lastMenu = this.menuCooldown.get(jid) || 0;
                    if (Date.now() - lastMenu > 3600000) { // Hanya muncul 1 jam sekali per user
                        this.menuCooldown.set(jid, Date.now());
                        
                        setTimeout(async () => {
                            if (this.sock && this.isReady) {
                                const menuText = this.applySpintax(
                                    "{Halo|Hai|Assalamualaikum}! Ini adalah Layanan Otomatis *SMK PPRQ*. 🤖\n\n" +
                                    "Nomor ini digunakan untuk pengiriman notifikasi Infaq/SPP.\n\n" +
                                    "Ketik *INFO* untuk bantuan lebih lanjut."
                                );
                                await this._sendInternal(jid.split('@')[0], menuText);
                                console.log(`[WA Service] 🛡️ Guardian Menu terkirim ke ${jid}`);
                            }
                        }, readDelay + 3000);
                    }
                }
            }
        });
    }

    _startHeartbeat() {
        // Simulasi user buka app setiap 20-40 menit
        const heartbeat = () => {
            if (this.sock && this.isReady) {
                const hour = new Date().getHours();
                // Tidak "Online" jika jam tidur (23 - 05)
                if (hour >= 6 && hour < 23) {
                    this.sock.sendPresenceUpdate('available');
                    console.log('[WA Service] 💓 Ghost Heartbeat: Status Set Online');
                    
                    // Guardian Level 4: Contact Sync Simulation
                    if (Math.random() > 0.8) { // Cukup mensimulasikan sync lebih jarang
                        console.log('[WA Service] 🛡️ Guardian Sync: Mensimulasikan sinkronisasi kontak...');
                        try { this.sock.ev.emit('contacts.upsert', []); } catch(e) {}
                    }

                    setTimeout(() => {
                        this.sock?.sendPresenceUpdate('unavailable');
                    }, 60000); // Online selama 1 menit
                }
            }
            const nextIn = Math.floor(Math.random() * 1200000) + 1200000; // 20-40 mins
            setTimeout(heartbeat, nextIn);
        };
        heartbeat();
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

    applySpintax(text) {
        // 1. Spintax {A|B|C}
        let regex = /\{([^{}]+)\}/g;
        let match;
        while ((match = regex.exec(text)) !== null) {
            let options = match[1].split('|');
            let randomOption = options[Math.floor(Math.random() * options.length)];
            text = text.replace(match[0], randomOption);
            regex.lastIndex = 0;
        }

        // 2. Spatial Randomizer (Aman)
        // Daripada pakai zero-width char (yang memicu spam ML), lebih baik sisipkan spasi/newline transparan acak di ujung kalimat
        // Ini memastikan Hash karakter untuk sistem anti-spam berbeda, tanpa red-flag.
        const randomSpaces = ' '.repeat(Math.floor(Math.random() * 3));
        const randomNewline = Math.random() > 0.5 ? '\n' : '';
        
        return text + randomSpaces + randomNewline;
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
                // Guardian Level 4: Per-Peer Throttling
                const lastSent = this.peerLastSent.get(phone) || 0;
                const timeSinceLast = Date.now() - lastSent;
                if (timeSinceLast < 20000) { // Jika baru kirim ke orang yang sama < 20 detik
                    console.log(`[WA Service] 🛡️ Per-Peer Throttle: Memberi jeda ekstra untuk ${phone}...`);
                    await new Promise(resolve => setTimeout(resolve, 15000));
                }

                // Check jam (Mode Tidur 23:00 - 05:00)
                const hour = new Date().getHours();
                if (hour >= 23 || hour < 5) {
                    console.log('[WA Service] 🌙 Mode Malam: Memperlambat antrean...');
                    await new Promise(resolve => setTimeout(resolve, 60000)); 
                }

                if (this.mode === 'internal') {
                    const jid = this.formatPhone(phone);
                    const [result] = await this.sock.onWhatsApp(jid);
                    if (!result || !result.exists) {
                        throw new Error('Nomor tidak terdaftar di WhatsApp');
                    }
                    
                    await this._sendInternal(phone, message);
                } else {
                    await this._sendExternal(phone, message);
                }
                
                this.sentCount++;
                this.processedInBurst++;
                this.peerLastSent.set(phone, Date.now()); // Update per-peer timestamp
                this._updateHistoryStatus(id, 'sent');
            } catch (err) {
                console.error(`[WA Service] Gagal kirim ke ${phone}:`, err.message);
                this._updateHistoryStatus(id, 'failed', err.message);
            }

            if (this.queue.length > 0) {
                let delayMs;
                if (this.processedInBurst >= this.BURST_SIZE) {
                    console.log(`[WA Service] 💤 Burst limit (${this.BURST_SIZE}) reached. Cooling down for ${this.BURST_COOLDOWN/1000}s...`);
                    delayMs = this.BURST_COOLDOWN + (Math.random() * 10000);
                    this.processedInBurst = 0;
                } else {
                    delayMs = Math.floor(Math.random() * (this.MAX_DELAY - this.MIN_DELAY + 1)) + this.MIN_DELAY;
                }
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
        this.isProcessing = false;
    }

    async _sendInternal(phone, message) {
        if (!this.isReady || !this.sock) {
            throw new Error('WhatsApp belum terhubung. Silakan scan QR Code terlebih dahulu.');
        }
        const jid = this.formatPhone(phone);
        const finalMessage = this.applySpintax(message);

        // Simulation "Typing..." dengan Dynamic Delay yang lebih manusiawi mengikuti panjang teks
        await this.sock.sendPresenceUpdate('composing', jid);
        const charsLength = finalMessage.length;
        // Hitung ~50ms sampai 100ms ketikan per karakter
        const typingDelayMsPerChar = 50 + Math.floor(Math.random() * 50); 
        let typingDelay = charsLength * typingDelayMsPerChar;
        
        if (typingDelay < 2000) typingDelay = 2000 + Math.floor(Math.random() * 1000); // minimal 2-3 detik
        if (typingDelay > 15000) typingDelay = 15000; // Maksimal batas wajar typing sebelum dikira glitch oleh server (15 detik)

        await new Promise(resolve => setTimeout(resolve, typingDelay));

        await this.sock.sendMessage(jid, { text: finalMessage });
        await this.sock.sendPresenceUpdate('paused', jid);

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
