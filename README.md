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
- `/src`: Source code React frontend.
- `/backend`: Server Express dan logika bisnis.
- `/backend/migrations`: Script migrasi database.
- `/public`: Aset statis public.

---
*Dikembangkan dengan ❤️ untuk SMK PPRQ.*
