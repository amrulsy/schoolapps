const pool = require('./db');

async function seed() {
    console.log('🌱 Starting seeding dummy data...');
    try {
        // Testimonials
        await pool.query(`INSERT INTO cms_testimonials (name, role, company, photo_url, quote, rating, sort_order) VALUES 
            ('Budi Santoso', 'Alumni 2020', 'Google Indonesia', 'https://ui-avatars.com/api/?name=Budi+Santoso&background=random', 'Sekolah ini memberikan bekal yang sangat berharga bagi karir saya di bidang IT. Fasilitasnya sangat memadai.', 5, 1),
            ('Siti Aminah', 'Orang Tua Siswa', 'Wiraswasta', 'https://ui-avatars.com/api/?name=Siti+Aminah&background=random', 'Saya sangat puas dengan kualitas pengajaran dan pembentukan karakter di SMK PPRQ.', 5, 2),
            ('Andi Wijaya', 'Siswa Kelas XII DKV', 'SMK PPRQ', 'https://ui-avatars.com/api/?name=Andi+Wijaya&background=random', 'Belajar di sini sangat menyenangkan. Guru-gurunya sangat kompeten dan up-to-date.', 5, 3)
        `);
        console.log('✅ Testimonials seeded.');

        // Gallery
        await pool.query(`INSERT INTO cms_gallery (title, image_url, category, description, sort_order) VALUES 
            ('Gedung Utama', 'https://images.unsplash.com/photo-1541339907198-e08756ebafe3?auto=format&fit=crop&w=800', 'Fasilitas', 'Tampilan depan gedung utama sekolah.', 1),
            ('Lab Komputer', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800', 'Fasilitas', 'Laboratorium komputer dengan spesifikasi tinggi.', 2),
            ('Ekstrakurikuler Basket', 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800', 'Kegiatan', 'Latihan rutin tim basket sekolah.', 3),
            ('Ujian Kompetensi Keahlian', 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800', 'Kegiatan', 'Siswa sedang mengerjakan proyek ujian.', 4)
        `);
        console.log('✅ Gallery seeded.');

        // FAQ
        await pool.query(`INSERT INTO cms_faq (question, answer, category, sort_order) VALUES 
            ('Apa saja syarat pendaftaran di SMK PPRQ?', 'Syarat pendaftaran meliputi fotokopi ijazah SMP, akta kelahiran, kartu keluarga, dan pas foto terbaru.', 'PPDB', 1),
            ('Apakah tersedia asrama bagi siswa dari luar kota?', 'Ya, kami menyediakan asrama (boarding school) dengan fasilitas lengkap dan pembimbingan 24 jam.', 'Fasilitas', 2),
            ('Program keahlian apa yang paling diminati?', 'Saat ini Desain Komunikasi Visual (DKV) dan Rekayasa Perangkat Lunak (RPL) menjadi program yang paling banyak diminati.', 'Akademik', 3)
        `);
        console.log('✅ FAQ seeded.');

        console.log('✨ Seeding completed successfully!');
    } catch (err) {
        console.error('❌ Seeding failed:', err.message);
    } finally {
        process.exit();
    }
}

seed();
