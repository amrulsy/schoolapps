require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const pool = mysql.createPool({
    host: process.env.TIDB_HOST,
    port: process.env.TIDB_PORT,
    user: process.env.TIDB_USER,
    password: process.env.TIDB_PASSWORD,
    database: process.env.TIDB_DATABASE,
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: false },
    timezone: 'Z',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function runSeed() {
    console.log('🚀 INITIALIZING MASSIVE DATABASE SEEDING (100% COVERAGE)...');
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        // --- 0. CLEANUP (Dependency Order) ---
        console.log('🧹 Cleaning all tables...');
        const tables = [
            'presensi_sesi', 'jurnal_mengajar', 'jadwal_pelajaran', 'jam_pelajaran',
            'nilai_siswa', 'mata_pelajaran', 'bk_catatan', 'bk_kategori',
            'tabungan', 'siswa_presensi', 'pesan', 'transaksi', 'tagihan',
            'siswa_orangtua', 'siswa_dokumen', 'siswa', 'kategori_tagihan',
            'kelas', 'units', 'tahun_ajaran', 'guru', 'users',
            'cms_banners', 'cms_programs', 'cms_partners', 'cms_settings', 'cms_ppdb_steps',
            'cms_ppdb_requirements', 'cms_posts', 'cms_pages', 'cms_media', 'cms_contacts',
            'student_menus', 'cashflow'
        ];

        // Disable foreign key checks for clean wipe
        await conn.query('SET FOREIGN_KEY_CHECKS = 0');
        for (const table of tables) {
            await conn.query(`DELETE FROM ${table}`);
            try { await conn.query(`ALTER TABLE ${table} AUTO_INCREMENT = 1`); } catch (e) { }
        }
        await conn.query('SET FOREIGN_KEY_CHECKS = 1');

        // --- 1. CORE DATA ---
        console.log('🏛️ Seeding Units, Kelas, Years...');
        await conn.query("INSERT INTO units (id, nama) VALUES (1, 'SMK PPRQ')");

        const kelasNames = [
            'X TKJ', 'XI TKJ', 'XII TKJ',
            'X RPL', 'XI RPL', 'XII RPL',
            'X DKV', 'XI DKV', 'XII DKV'
        ];
        const kelasValues = kelasNames.map((name, i) => [i + 1, 1, name]);
        await conn.query("INSERT INTO kelas (id, unit_id, nama) VALUES ?", [kelasValues]);

        await conn.query("INSERT INTO tahun_ajaran (id, tahun, status) VALUES (1, '2023/2024', 'nonaktif'), (2, '2024/2025', 'aktif')");

        // --- 2. AUTH & USERS ---
        console.log('👥 Seeding Users & Guru (Bcrypt Hashing)...');
        const adminPass = await bcrypt.hash('admin123', 10);
        const guruPass = await bcrypt.hash('guru123', 10);

        await conn.query(`INSERT INTO users (id, nama, username, password_hash, role) VALUES 
            (1, 'Super Admin', 'admin', '${adminPass}', 'admin'),
            (2, 'Bendahara Utama', 'kasir', '${adminPass}', 'kasir'),
            (3, 'Budi Santoso, S.Kom', 'guru_tkj', '${guruPass}', 'guru'),
            (4, 'Siti Aminah, M.Pd', 'guru_umum', '${guruPass}', 'guru'),
            (5, 'Eko Wijaya, S.Ds', 'guru_dkv', '${guruPass}', 'guru')`);

        await conn.query(`INSERT INTO guru (id, nip, nama, user_id) VALUES 
            (1, '198501012010011001', 'Budi Santoso, S.Kom', 3),
            (2, '198802022012012002', 'Siti Aminah, M.Pd', 4),
            (3, '199003032015011003', 'Eko Wijaya, S.Ds', 5)`);

        // --- 3. ACADEMIC INFRA ---
        console.log('📖 Seeding Mapel & Jam Pelajaran...');
        await conn.query(`INSERT INTO mata_pelajaran (id, nama, tingkat) VALUES 
            (1, 'Pendidikan Agama Islam', 'Nasional'), 
            (2, 'Bahasa Indonesia', 'Nasional'), 
            (3, 'Matematika', 'Nasional'),
            (4, 'Sistem Komputer & Jaringan', 'Produktif'), 
            (5, 'Pemrograman Berorientasi Objek', 'Produktif'), 
            (6, 'Dasar-dasar Desain Grafis', 'Produktif')`);

        const jamValues = [
            [1, 1, '07:00:00', '07:45:00', 'Pelajaran'], [2, 2, '07:45:00', '08:30:00', 'Pelajaran'],
            [3, 3, '08:30:00', '09:15:00', 'Pelajaran'], [4, 4, '09:15:00', '09:45:00', 'Istirahat'],
            [5, 5, '09:45:00', '10:30:00', 'Pelajaran'], [6, 6, '10:30:00', '11:15:00', 'Pelajaran']
        ];
        await conn.query("INSERT INTO jam_pelajaran (id, jam_ke, jam_mulai, jam_selesai, tipe) VALUES ?", [jamValues]);

        // --- 4. CMS & PORTAL ---
        console.log('🌐 Seeding CMS Static Content & Settings...');
        await conn.query(`INSERT INTO cms_settings (setting_key, setting_value, setting_type, description) VALUES
            ('site_title', 'SIAS - SMK PPRQ', 'string', 'Judul Situs'),
            ('school_name', 'SMK PPRQ', 'string', 'Nama Sekolah'),
            ('hero_title', 'Membangun Karir\\nDigital Masa Depan\\ndi SMK PPRQ', 'textarea', 'Hero Title'),
            ('hero_highlight', 'Digital Masa Depan', 'string', 'Hero Highlight'),
            ('hero_subtitle', 'Sekolah kejuruan unggulan dengan kurikulum industri dan fasilitas modern untuk mencetak lulusan profesional.', 'textarea', 'Hero Subtitle'),
            ('hero_badge_text', '✨ Pendaftaran Siswa Baru 2025/2026', 'string', 'Badge Hero'),
            ('contact_email', 'info@smk-pprq.sch.id', 'string', 'Email'),
            ('contact_phone', '021-1234567', 'string', 'Telepon'),
            ('contact_address', 'Jl. Raya Pendidikan No. 45, Jakarta', 'textarea', 'Alamat'),
            ('school_network_json', '[]', 'json', 'Daftar sekolah afiliasi'),
            ('footer_description', 'SMK PPRQ berkomitmen melahirkan generasi ahli teknologi dan kreatif yang kompetitif di pasar global.', 'textarea', 'Footer Desc')`);

        await conn.query(`INSERT INTO cms_banners (title, subtitle, image_url, sort_order) VALUES 
            ('Gedung Baru SMK PPRQ', 'Fasilitas belajar yang nyaman dan modern.', 'https://images.unsplash.com/photo-1562774053-701939374585', 0),
            ('Prestasi Robotik', 'Juara 1 LKS Nasional Bidang Robotik.', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758', 1)`);

        console.log('🎨 Seeding CMS Dynamic (Programs, Partners, PPDB)...');
        const milestones_tkj = JSON.stringify([
            { grade: 'Kelas X', title: 'Fondasi Jaringan', skills: ['Basic Networking', 'Hardware Assembly', 'Operating Systems'], icon: 'book', color: '#4f46e5' },
            { grade: 'Kelas XI', title: 'Server & Security', skills: ['Linux Administration', 'Network Safety', 'Cloud Intro'], icon: 'settings', color: '#10b981' },
            { grade: 'Kelas XII', title: 'Advanced Infra', skills: ['CCNA Prep', 'Enterprise Server', 'Capstone Project'], icon: 'graduation-cap', color: '#f59e0b' }
        ]);
        const showcase_tkj = JSON.stringify([
            { title: 'Server Rack Setup', student: 'Budi (XII)', description: 'Optimization of enterprise server rack.', image: 'https://images.unsplash.com/photo-1558494949-ef0109121c64', type: 'image' },
            { title: 'Smart Home IoT', student: 'Siti (XI)', description: 'Controlling home via LAN network.', image: 'https://images.unsplash.com/photo-1558002038-1055907df827', type: 'video' }
        ]);
        const alumni_tkj = JSON.stringify([
            { name: 'Andi Pratama', role: 'Network Engineer', company: 'Google Indonesia', text: 'SMK PPRQ memberikan bekal praktek yang sangat kuat untuk dunia kerja.', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d' }
        ]);
        const stats_tkj = JSON.stringify({ labor_absorption: '95%', partners_count: '50+', quota_per_class: '32' });

        await conn.query(`INSERT INTO cms_programs (icon, title, slug, tagline, description, milestones_json, showcase_json, alumni_json, stats_json) VALUES 
            ('💻', 'Teknik Komputer & Jaringan', 'tkj', 'Expert in Networking', 'Menguasai infrastruktur it modern.', '${milestones_tkj}', '${showcase_tkj}', '${alumni_tkj}', '${stats_tkj}'),
            ('🎨', 'Desain Komunikasi Visual', 'dkv', 'Creative Legend', 'Belajar multimedia dan branding.', '[]', '[]', '[]', '{"labor_absorption":"90%", "partners_count":"30"}')`);

        await conn.query(`INSERT INTO cms_partners (name, logo_url, website_url, sort_order) VALUES 
            ('Cisco', 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/cisco.svg', 'https://cisco.com', 0),
            ('MikroTik', 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/mikrotik.svg', 'https://mikrotik.com', 1),
            ('Adobe', 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/adobe.svg', 'https://adobe.com', 2)`);

        await conn.query(`INSERT INTO cms_ppdb_steps (step_number, title, description, icon) VALUES 
            ('01', 'Formulir Online', 'Isi data diri di website kami.', 'clipboard'),
            ('02', 'Tes Akademik', 'Ujian saring masuk sekolah.', 'edit-3'),
            ('03', 'Wawancara', 'Sesi tanya jawab wali murid.', 'users')`);

        await conn.query(`INSERT INTO cms_ppdb_requirements (text) VALUES ('FC Ijazah SMP'), ('FC Akta Kelahiran'), ('FC Kartu Keluarga')`);

        await conn.query(`INSERT INTO student_menus (label, icon, path, color) VALUES 
            ('Dashboard', 'layout', '/student/dashboard', '#3b82f6'),
            ('Keuangan', 'credit-card', '/student/finance', '#10b981'),
            ('Absensi', 'calendar', '/student/attendance', '#f59e0b')`);

        // --- 5. STUDENTS & PERSONNEL ---
        console.log('🎓 Seeding 50 Students & Families...');
        const students = [];
        const parents = [];
        const fnames = ['Adi', 'Bela', 'Candra', 'Dini', 'Erik', 'Fani', 'Galih', 'Hana', 'Indra', 'Juli'];
        const lnames = ['Saputra', 'Lestari', 'Hidayat', 'Kusuma', 'Maulana'];

        for (let i = 1; i <= 50; i++) {
            const name = `${fnames[i % 10]} ${lnames[i % 5]} ${i}`;
            const kelasId = (i % 9) + 1;
            students.push([i, kelasId, `NISN${10000 + i}`, `NIS${100 + i}`, name, i % 2 === 0 ? 'L' : 'P', 'aktif', 'Jakarta', '2008-01-01', 'WNI', 'Islam', 'Umum', '2024', `std${i}@dummy.id`, `08123${i}456`, 'SMPN 1 Dummy', `NIK${i}XYZ`, `KK${i}XYZ`, 1, 2, 'Main Game', 'Engineer', `REG${i}`, 60, 170, 'O', 'Tidak ada', 'Tidak ada', 'Jl. Sukaria No ' + i]);
            parents.push([i, 'ayah', 'Bpk. ' + fnames[i % 10], '12345678', 'S1', 'Wiraswasta', 5000000, '08777' + i, 'Hidup']);
        }
        await conn.query("INSERT INTO siswa (id, kelas_id, nisn, nis, nama, jk, status, tempat_lahir, tgl_lahir, kewarganegaraan, agama, jurusan, angkatan, email, telp, asal_sekolah, nik, no_kk, anak_ke, jml_saudara, hobby, cita_cita, no_reg, bb, tb, gol_darah, riwayat_penyakit, kebutuhan_khusus, alamat) VALUES ?", [students]);
        await conn.query("INSERT INTO siswa_orangtua (siswa_id, jenis, nama, nik, pendidikan, pekerjaan, penghasilan, hp, status_hidup) VALUES ?", [parents]);

        // --- 6. SCHEDULE & JOURNALS ---
        console.log('🗓️ Seeding Weekly Schedule...');
        const schedule = [
            [1, 1, 1, 4, 'Senin', 1], [2, 1, 1, 4, 'Senin', 2], // ID 1-2: Guru 1, Kelas 1, Mapel 4, Jam 1-2
            [3, 3, 7, 6, 'Selasa', 1], [4, 3, 7, 6, 'Selasa', 2] // ID 3-4: Guru 3, Kelas 7, Mapel 6, Jam 1-2
        ];
        await conn.query("INSERT INTO jadwal_pelajaran (id, guru_id, kelas_id, mapel_id, hari, jam_pelajaran_id) VALUES ?", [schedule]);

        await conn.query(`INSERT INTO jurnal_mengajar (id, guru_id, jadwal_id, kelas_id, mapel_id, tanggal, waktu_masuk_aktual, materi, status_jurnal) VALUES 
            (1, 1, 1, 1, 4, CURDATE(), '07:05:00', 'Basic Routing with MikroTik', 'Selesai')`);

        // --- 7. TRANSACTIONAL HISTORY ---
        console.log('💰 Seeding Billing & Transactions...');
        await conn.query(`INSERT INTO kategori_tagihan (id, kode, nama, nominal, tipe, keterangan) VALUES 
            (1, 'SPP', 'Iuran SPP Bulanan', 250000, 'bulanan', 'Iuran rutin bulanan siswa.'),
            (2, 'GEDUNG', 'Pembangunan Gedung', 1500000, 'insidentil', 'Biaya pembangunan fasilitas.')`);

        const tagihan = students.slice(0, 10).map(s => [s[0], 1, 2, 'April', 2024, 250000, 250000, 'belum']);
        await conn.query("INSERT INTO tagihan (siswa_id, kategori_id, tahun_ajaran_id, bulan, tahun, nominal_asli, nominal, status) VALUES ?", [tagihan]);

        const tabungan = students.slice(0, 5).map(s => [s[0], NOW(), 'setor', 50000, 'Sisa uang saku', 2]);
        await conn.query("INSERT INTO tabungan (siswa_id, tanggal, tipe, nominal, note, user_id) VALUES ?", [tabungan]);

        console.log('💳 Seeding Transactions & Cashflow...');
        await conn.query(`INSERT INTO transaksi (id, invoice_no, tanggal, siswa_id, user_id, total, amount_paid, status) VALUES 
            (1, 'INV-20240323-001', NOW(), 1, 2, 250000, 250000, 'success'),
            (2, 'INV-20240323-002', NOW(), 2, 2, 250000, 250000, 'success')`);

        await conn.query(`INSERT INTO cashflow (tanggal, keterangan, nominal, tipe, ref) VALUES 
            (NOW(), 'Pembayaran SPP INV-001', 250000, 'masuk', 'INV-20240323-001'),
            (NOW(), 'Pembelian ATK Kantor', 50000, 'keluar', 'KAS-001')`);

        console.log('💬 Seeding Messages...');
        const messages = students.slice(0, 5).map(s => [1, 'admin', s[0], 'student', 'Selamat datang di portal siswa!', NOW(), 0]);
        await conn.query("INSERT INTO pesan (pengirim_id, pengirim_type, penerima_id, penerima_type, pesan, waktu, is_read) VALUES ?", [messages]);

        console.log('📝 Seeding CMS Posts, Pages, and Media...');
        await conn.query(`INSERT INTO cms_posts (slug, title, excerpt, content, category, status, author_id, published_at) VALUES 
            ('pembukaan-ppdb-2025', 'PPDB 2025 Resmi Dibuka', 'Segera daftarkan diri anda.', 'Isi konten pengumuman...', 'pengumuman', 'published', 1, NOW()),
            ('tips-belajar-efektif', 'Tips Belajar Efektif', 'Cara belajar di SMK.', 'Isi konten artikel...', 'artikel', 'published', 1, NOW())`);

        await conn.query(`INSERT INTO cms_pages (slug, title, content) VALUES 
            ('sejarah', 'Sejarah Sekolah', '<p>Berdiri sejak tahun 2005...</p>'),
            ('fasilitas', 'Fasilitas Kami', '<ul><li>Lab Komputer</li><li>Studio Seni</li></ul>')`);

        await conn.query(`INSERT INTO cms_media (filename, original_name, mimetype, size, path) VALUES 
            ('hero1.jpg', 'sekolah.jpg', 'image/jpeg', 102400, '/uploads/hero1.jpg')`);

        await conn.query(`INSERT INTO cms_contacts (name, email, subject, message) VALUES 
            ('Rudi', 'rudi@mail.com', 'Info Pendaftaran', 'Kapan terakhir daftar?')`);

        console.log('📊 Seeding Performance, Presence, and BK...');
        const nilai = students.slice(0, 5).map(s => [s[0], 4, 2, 'Genap', 85.5, 80.0, 90.0, 86.2]);
        await conn.query("INSERT INTO nilai_siswa (siswa_id, mapel_id, tahun_ajaran_id, semester, tugas, uts, uas, akhir) VALUES ?", [nilai]);

        const presensiHarian = students.slice(0, 20).map(s => [s[0], CURDATE(), 'hadir', 'N/A']);
        await conn.query("INSERT INTO siswa_presensi (siswa_id, tanggal, status, keterangan) VALUES ?", [presensiHarian]);

        await conn.query(`INSERT INTO bk_kategori (id, nama, tipe, poin) VALUES 
            (1, 'Terlambat Masuk', 'pelanggaran', 5), 
            (2, 'Juara Lomba', 'prestasi', 50)`);

        const bk_catatan = students.slice(0, 3).map(s => [s[0], 1, CURDATE(), 'Terlambat 10 menit', 5, 1]);
        await conn.query("INSERT INTO bk_catatan (siswa_id, bk_kategori_id, tanggal, keterangan, poin, user_id) VALUES ?", [bk_catatan]);

        console.log('📎 Seeding Student Documents...');
        const documents = students.slice(0, 5).flatMap(s => [
            [s[0], 'KK', 'Kartu Keluarga', 'Terverifikasi', '1MB', '/docs/kk.pdf'],
            [s[0], 'AKTA', 'Akta Kelahiran', 'Belum Verifikasi', '500KB', '/docs/akta.jpg']
        ]);
        await conn.query("INSERT INTO siswa_dokumen (siswa_id, kode_dokumen, nama_dokumen, status, file_size, file_path) VALUES ?", [documents]);

        console.log('👨‍💼 Seeding Class Sessions (Presensi Per Mapel)...');
        const presensiSesi = students.slice(0, 10).map(s => [1, s[0], 'hadir', 'Hadir tepat waktu']);
        await conn.query("INSERT INTO presensi_sesi (jurnal_id, siswa_id, status, keterangan) VALUES ?", [presensiSesi]);

        await conn.commit();
        console.log('✅ DATABASE SEEDED SUCCESSFULLY WITH 100% COVERAGE!');

    } catch (err) {
        await conn.rollback();
        console.error('❌ FATAL SEEDING ERROR:', err);
    } finally {
        conn.release();
        process.exit();
    }
}

// Helper for SQL expressions
function NOW() { return new Date().toISOString().slice(0, 19).replace('T', ' '); }
function CURDATE() { return new Date().toISOString().split('T')[0]; }

runSeed();
