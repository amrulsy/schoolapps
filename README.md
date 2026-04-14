# 🏫 SchoolApps - SMK PPRQ

**Sistem Manajemen Sekolah Terintegrasi** yang dirancang untuk modernisasi administrasi, layanan publik, dan interaksi komunitas sekolah.

---

## 🚀 Fitur Utama

- **🌐 CMS Portal Publik**: Halaman awal yang premium dan dinamis dengan fitur pengelolaan Testimoni, Galeri Kegiatan, dan FAQ secara langsung via Dashboard Admin.
- **🆔 Identity Management**: Pengelolaan profil sekolah, logo yayasan, dan identitas institusi yang terintegrasi.
- **📊 Manajemen Infaq Harian**: Sistem pelacakan donasi/infaq siswa yang akumulatif, cerdas, dan transparan.
- **🕒 Presensi RFID**: Sistem kehadiran otomatis menggunakan sensor RFID dengan monitoring real-time dan notifikasi.
- **📂 Student Profile & Document**: Dashboard siswa dengan desain Bento Grid untuk manajemen dokumen digital dan profil akademik.
- **🤖 WhatsApp Integration**: Layanan notifikasi otomatis dan integrasi layanan pesan untuk kemudahan komunikasi.
- **🔐 Role-Based Access Control (RBAC)**: Sistem keamanan dengan akses terbatas sesuai peran (Admin, TU, Keuangan, Perbankan, Infaq).

---

## 🛠️ Stack Teknologi

### Frontend
- **Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **UI & Icons**: Vanilla CSS (Premium Design), [Lucide React](https://lucide.dev/)
- **Auth**: [Clerk](https://clerk.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **Components**: SweetAlert2, React Router v7, React Hook Form.

### Backend
- **Runtime**: Node.js (Express)
- **Database**: MySQL / [TiDB Cloud](https://pingcap.com/tidb-cloud)
- **Real-time**: Socket.io
- **Services**: Whatsapp-web.js, Sharp (Image Processing), Multer.

---

## ⚙️ Cara Menjalankan

### Prasyarat
- Node.js (v18+)
- MySQL atau Akun TiDB Cloud

### 1. Setup Backend
```bash
cd backend
npm install
# Buat file .env dengan konfigurasi database & Clerk
npm run dev
```

### 2. Setup Frontend
```bash
# Di root directory
npm install
npm run dev
```

---

## 📁 Struktur Folder

```
schoolapps/
├── src/                        # Frontend (React + Vite)
│   ├── components/             # Komponen UI reusable (Sidebar, Modal, dll)
│   ├── context/                # React Context & Provider (Auth, Keuangan, dll)
│   ├── features/               # Fitur terkelompok (cms, auth, siswa, dll)
│   ├── hooks/                  # Custom React hooks
│   ├── layouts/                # Layout wrapper (AdminLayout, GuruLayout)
│   ├── pages/                  # Halaman berdasarkan role
│   │   ├── admin/              # 33 halaman admin
│   │   └── guru/               # Halaman guru
│   ├── portal/                 # Portal publik (PortalApp)
│   ├── services/               # API client (api.js)
│   ├── student/                # Student portal (StudentApp)
│   └── utils/                  # Helper utilities
│
└── backend/                    # Backend (Node.js + Express)
    ├── controllers/            # Business logic (Attendance, Inventory)
    ├── middleware/             # auth, rateLimiter, logger, upload, cache
    ├── migrations/             # SQL migration files (versioned)
    ├── routes/                 # Express routes per role & fitur
    │   ├── admin/              # Route admin (23 modules)
    │   ├── guru/               # Route guru
    │   ├── public/             # Route publik (portal)
    │   └── student/            # Route siswa
    ├── scripts/                # Utility scripts (seeding, setup)
    ├── services/               # Services (whatsapp, socket, cron)
    ├── utils/                  # Backend utilities (timezone)
    ├── uploads/                # File uploads (gitignored)
    ├── db.js                   # Database connection pool (TiDB/MySQL)
    └── server.js               # Entry point Express app
```

> **Catatan**: File-file sementara (lint artifacts, patch SQL, zip) **tidak** boleh di-commit — sudah diatur di `.gitignore`.

---
*Dikembangkan dengan ❤️ oleh **[Amrul Al Syaif'Fu](https://www.linkedin.com/in/muhamad-amrul-syaifulloh-35019a242/)** untuk SMK PPRQ.*
