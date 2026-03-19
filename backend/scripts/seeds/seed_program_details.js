const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../backend/.env' });

async function seed() {
    const pool = mysql.createPool({
        host: process.env.TIDB_HOST,
        port: process.env.TIDB_PORT,
        user: process.env.TIDB_USER,
        password: process.env.TIDB_PASSWORD,
        database: process.env.TIDB_DATABASE,
        ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: false }
    });

    const tkjFeatures = [
        { id: 1, title: 'Kurikulum Industri', description: 'Materi yang disusun bersama pakar industri teknologi terkini.', icon: '🏆' },
        { id: 2, title: 'Sertifikasi Mikrotik', description: 'Dapatkan pengakuan internasional dengan sertifikasi resmi MTCNA.', icon: '🌐' },
        { id: 3, title: 'Laboratorium Modern', description: 'Fasilitas praktik dengan perangkat Cisco dan server high-end.', icon: '🖥️' },
        { id: 4, title: 'Peluang Kerja Luas', description: 'Lulusan siap bekerja sebagai Network Engineer atau System Admin.', icon: '💼' }
    ];

    const tkjContent = `
        <p>Teknik Komputer dan Jaringan (TKJ) merupakan program keahlian yang membekali peserta didik dengan keterampilan, pengetahuan, dan sikap agar kompeten dalam merakit, menginstall program, merawat dan memperbaiki komputer serta jaringan.</p>
        <h3>Apa yang akan dipelajari?</h3>
        <ul>
            <li>Administrasi Infrastruktur Jaringan</li>
            <li>Administrasi Sistem Jaringan</li>
            <li>Teknologi Layanan Jaringan</li>
            <li>Keamanan Jaringan</li>
            <li>Cloud Computing Dasar</li>
        </ul>
        <p>Dengan bimbingan pengajar profesional dan praktisi dari dunia industri, siswa dipersiapkan untuk menghadapi tantangan di era Digital 4.0.</p>
    `;

    try {
        console.log('🌱 Seeding TKJ detailed data...');

        // Check if TKJ exists
        const [rows] = await pool.query('SELECT id FROM cms_programs WHERE title LIKE "%Teknik Komputer%"');

        if (rows.length > 0) {
            await pool.query(
                `UPDATE cms_programs SET 
                    slug = 'tkj',
                    tagline = 'Expert in Networking & Infrastructure for Digital Age',
                    banner_image = 'https://img.freepik.com/premium-psd/3d-cartoon-boy-with-laptop-headphones_1142-37839.jpg',
                    color_theme = '#6366f1',
                    features_json = ?,
                    full_content = ?
                WHERE id = ?`,
                [JSON.stringify(tkjFeatures), tkjContent, rows[0].id]
            );
            console.log('✅ TKJ updated successfully!');
        } else {
            console.log('⚠️ TKJ program not found, skipping seed update.');
        }

    } catch (err) {
        console.error('❌ Error seeding:', err);
    } finally {
        await pool.end();
    }
}

seed();
