const pool = require('./db');

async function seedCms() {
    console.log('Seeding CMS data...');
    try {
        // Clear existing data
        await pool.query('DELETE FROM cms_contacts');
        await pool.query('DELETE FROM cms_settings');
        await pool.query('DELETE FROM cms_pages');
        await pool.query('DELETE FROM cms_posts');
        await pool.query('DELETE FROM cms_banners');

        // Insert Banners
        console.log('Inserting Banners...');
        await pool.query(`
            INSERT INTO cms_banners (title, image_url, link_url, is_active, sort_order) VALUES
            ('Selamat Datang di Portal PPDB', 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1200', '/portal/ppdb', 1, 0),
            ('Fasilitas Sekolah Modern', 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1200', '/portal', 1, 1),
            ('Pendaftaran Gelombang 1 Dibuka', 'https://images.unsplash.com/photo-1427504494785-3a9a275179cb?q=80&w=1200', '/portal/ppdb', 1, 2)
        `);

        // Insert Posts
        console.log('Inserting Posts...');
        await pool.query(`
            INSERT INTO cms_posts (slug, title, excerpt, content, cover_image, category, status, is_pinned, published_at) VALUES
            ('pembukaan-ppdb-2025', 'Pembukaan PPDB Tahun Ajaran 2025/2026', 'Pendaftaran Peserta Didik Baru (PPDB) SMK PPRQ resmi dibuka mulai hari ini.', '<p>Pendaftaran Peserta Didik Baru (PPDB) SMK PPRQ secara resmi dibuka mulai 1 Maret 2025. Segera daftarkan putra/putri Anda...</p>', 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=800', 'pengumuman', 'published', 1, NOW()),
            ('prestasi-nasional-siswa', 'Siswa SMK PPRQ Juara 1 LKS Nasional', 'Selamat kepada Tim Robotik SMK PPRQ yang berhasil meraih Juara 1 pada ajang LKS tingkat Nasional 2025.', '<p>Prestasi membanggakan kembali diraih oleh siswa-siswi SMK PPRQ. Tim Robotik berhasil menjuarai...</p>', 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800', 'berita', 'published', 0, NOW()),
            ('jadwal-ujian-semester', 'Jadwal Ujian Akhir Semester Genap', 'Informasi pelaksanaan Ujian Akhir Semester (UAS) Genap Tahun Ajaran 2024/2025.', '<p>Diberitahukan kepada seluruh siswa kelas X dan XI bahwa Ujian Akhir Semester Genap akan dilaksanakan pada...</p>', null, 'pengumuman', 'published', 0, NOW())
        `);

        // Insert Pages
        console.log('Inserting Pages...');
        await pool.query(`
            INSERT INTO cms_pages (slug, title, content, is_active) VALUES
            ('profil', 'Profil Sekolah', '<p>SMK PPRQ adalah institusi pendidikan kejuruan yang berdedikasi untuk mencetak tenaga profesional yang siap kerja dan berakhlak mulia.</p>', 1),
            ('visi-misi', 'Visi & Misi', '<h3>Visi</h3><p>Menjadi sekolah kejuruan unggul di tingkat nasional.</p><h3>Misi</h3><ul><li>Menyelenggarakan pendidikan berbasis kompetensi.</li><li>Membina karakter peserta didik.</li></ul>', 1),
            ('syarat-pendaftaran', 'Syarat Pendaftaran PPDB', '<ul><li>Fotokopi Ijazah/SKL</li><li>Fotokopi Kartu Keluarga</li><li>Pas Foto 3x4 (4 lembar)</li></ul>', 1)
        `);

        // Insert Settings
        console.log('Inserting Settings...');
        await pool.query(`
            INSERT INTO cms_settings (setting_key, setting_value, setting_type, description) VALUES
            ('site_title', 'Portal Resmi SMK PPRQ', 'string', 'Judul Situs'),
            ('site_description', 'Portal informasi dan pendaftaran peserta didik baru SMK PPRQ terpadu.', 'string', 'Deskripsi Situs'),
            ('school_name', 'SMK PPRQ', 'string', 'Nama Sekolah'),
            ('school_tagline', 'Unggul, Profesional, Berakhlak Mulia', 'string', 'Tagline Sekolah'),
            ('footer_description', 'SMK PPRQ adalah institusi pendidikan kejuruan yang berdedikasi untuk mencetak tenaga profesional yang siap kerja.', 'textarea', 'Deskripsi Footer'),
            ('contact_email', 'info@smk-pprq.sch.id', 'string', 'Email Kontak'),
            ('contact_phone', '+62 812-3456-7890', 'string', 'Nomor Telepon'),
            ('contact_hours', 'Senin - Jumat: 07:00 - 15:30', 'string', 'Jam Operasional'),
            ('contact_address', 'Jl. Pendidikan No. 123, Kota Pendidikan', 'textarea', 'Alamat Lengkap'),
            ('contact_maps_embed', '', 'textarea', 'Google Maps Embed'),
            ('school_profile_content', '<p>SMK PPRQ adalah institusi pendidikan kejuruan yang berdedikasi untuk mencetak tenaga profesional yang siap kerja dan berakhlak mulia. Berdiri sejak tahun 2005, kami terus bertransformasi menjadi pusat unggulan pendidikan vokasi.</p>', 'textarea', 'Konten Profil Sekolah'),
            ('school_vision_mission_content', \"<h3>Visi</h3><p>Menjadi sekolah kejuruan unggul di tingkat nasional.</p><h3>Misi</h3><ul><li>Menyelenggarakan pendidikan berbasis kompetensi.</li><li>Membina karakter peserta didik.</li><li>Menjalin kemitraan strategis dengan industri.</li></ul>\", 'textarea', 'Konten Visi & Misi'),
            ('social_facebook', 'https://facebook.com/smkpprq', 'string', 'Link Facebook'),
            ('social_instagram', 'https://instagram.com/smk.pprq', 'string', 'Link Instagram'),
            ('social_youtube', 'https://youtube.com/@smkpprq', 'string', 'Link YouTube'),
            ('registration_open', 'true', 'boolean', 'Status Buka Pendaftaran'),
            ('registration_link', 'https://ppdb.smk-pprq.sch.id', 'string', 'Link Aplikasi PPDB External'),
            ('registration_message', 'Pendaftaran Gelombang 1 Dibuka hingga 30 April 2025', 'textarea', 'Pesan Penjelasan Pendaftaran')
        `);

        // Insert Contacts (Dummy Messages)
        console.log('Inserting dummy Contact messages...');
        await pool.query(`
            INSERT INTO cms_contacts (name, email, phone, subject, message, is_read) VALUES
            ('Budi Santoso', 'budi@example.com', '08123456789', 'Pertanyaan PPDB', 'Apakah pendaftaran untuk jurusan RPL masih tersedia?', 0),
            ('Siti Aminah', 'siti@example.com', '08556677889', 'Biaya Sekolah', 'Mohon informasi mengenai rincian biaya pendaftaran dan SPP per bulan.', 1)
        `);

        console.log('✅ CMS Seeding successfully completed!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error seeding CMS tables:', err);
        process.exit(1);
    }
}

seedCms();
