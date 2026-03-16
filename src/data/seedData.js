/* =============================================
   SIAS SMK PPRQ — Seed & Initial Data
   ============================================= */

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

// Default parent template
const defaultAyah = (nama, telp) => ({
    nama: `Bp. ${nama.split(' ').pop()}`,
    nik: '3301010101800001',
    pendidikan: 'SMA',
    pekerjaan: 'Wiraswasta',
    penghasilan: 3000000,
    hp: telp,
    status_hidup: 'Hidup',
})
const defaultIbu = (nama, telp) => ({
    nama: `Ibu ${nama.split(' ').pop()}`,
    nik: '3301014504820002',
    pendidikan: 'SMA',
    pekerjaan: 'Ibu Rumah Tangga',
    penghasilan: 0,
    hp: telp,
    status_hidup: 'Hidup',
})
const defaultWali = (waliNama, telp, alamat) => ({
    nama: waliNama || '-',
    nik: '-',
    hubungan: 'Orang Tua',
    pendidikan: 'SMA',
    pekerjaan: '-',
    penghasilan: 0,
    hp: telp,
    status_hidup: 'Hidup',
    alamat,
})

export const SEED_STUDENTS = [
    {
        id: 1, nisn: '0012345601', nis: '25001', nama: 'Ahmad Fauzi',
        kelas: 'X IPA 1', kelasId: 1, jk: 'L', status: 'aktif',
        tempatLahir: 'Bogor', tglLahir: '2010-03-15',
        telp: '081234567801', email: 'ahmad.fauzi@student.pprq.sch.id',
        alamat: 'Jl. Merdeka No.10', rt: '02', rw: '04',
        kelurahan: 'Sukamaju', kecamatan: 'Ciawi', kabupaten: 'Bogor',
        provinsi: 'Jawa Barat', kodepos: '16720',
        jenis_tinggal: 'Bersama Orang Tua',
        jurusan: 'IPA', angkatan: '2025',
        kewarganegaraan: 'WNI', nik: '3201051503100001',
        no_kk: '3201050101200001', anak_ke: 1, jml_saudara: 2,
        hobby: 'Membaca', cita_cita: 'Dokter',
        asal_sekolah: 'SMP Negeri 1 Bogor',
        no_reg: 'REG202500001',
        agama: 'Islam',
        // Kesehatan
        bb: 58, tb: 168, gol_darah: 'O',
        riwayat_penyakit: '-', kebutuhan_khusus: 'Tidak',
        wali: 'Bp. Fauzi',
        ayah: defaultAyah('Ahmad Fauzi', '081234567801'),
        ibu: defaultIbu('Ahmad Fauzi', '081234567801'),
        wali_detail: defaultWali('Bp. Fauzi', '081234567801', 'Jl. Merdeka No.10'),
        dokumen: [
            { id: 'kk', nama: 'Kartu Keluarga (KK)', status: 'Terverifikasi', size: '1.2 MB' },
            { id: 'akte', nama: 'Akte Kelahiran', status: 'Terverifikasi', size: '0.8 MB' },
            { id: 'ijazah', nama: 'Ijazah Terakhir', status: 'Belum Verifikasi', size: '2.4 MB' },
            { id: 'kip', nama: 'Kartu KIP/PIP', status: 'Tidak Ada', size: '-' },
            { id: 'skl', nama: 'Surat Keterangan Lulus SMP', status: 'Belum Verifikasi', size: '1.1 MB' },
        ]
    },
    {
        id: 2, nisn: '0012345602', nis: '25002', nama: 'Budi Santoso',
        kelas: 'X IPA 1', kelasId: 1, jk: 'L', status: 'aktif',
        tempatLahir: 'Jakarta', tglLahir: '2010-06-22',
        telp: '081234567802', email: 'budi.santoso@student.pprq.sch.id',
        alamat: 'Jl. Sudirman No.5', rt: '01', rw: '03',
        kelurahan: 'Gambir', kecamatan: 'Gambir', kabupaten: 'Jakarta Pusat',
        provinsi: 'DKI Jakarta', kodepos: '10110',
        jenis_tinggal: 'Kost',
        jurusan: 'IPA', angkatan: '2025',
        kewarganegaraan: 'WNI', nik: '3173061006100002',
        no_kk: '3173060101200002', anak_ke: 2, jml_saudara: 3,
        hobby: 'Sepak Bola', cita_cita: 'Insinyur',
        asal_sekolah: 'SMP Negeri 2 Jakarta',
        no_reg: 'REG202500002', agama: 'Islam',
        bb: 65, tb: 172, gol_darah: 'A',
        riwayat_penyakit: '-', kebutuhan_khusus: 'Tidak',
        wali: 'Bp. Santoso',
        ayah: defaultAyah('Budi Santoso', '081234567802'),
        ibu: defaultIbu('Budi Santoso', '081234567802'),
        wali_detail: defaultWali('Bp. Santoso', '081234567802', 'Jl. Sudirman No.5'),
        dokumen: [
            { id: 'kk', nama: 'Kartu Keluarga (KK)', status: 'Terverifikasi', size: '0.9 MB' },
            { id: 'akte', nama: 'Akte Kelahiran', status: 'Belum Verifikasi', size: '1.1 MB' },
            { id: 'ijazah', nama: 'Ijazah Terakhir', status: 'Tidak Ada', size: '-' },
            { id: 'kip', nama: 'Kartu KIP/PIP', status: 'Terverifikasi', size: '0.5 MB' },
            { id: 'skl', nama: 'Surat Keterangan Lulus SMP', status: 'Tidak Ada', size: '-' },
        ]
    },
    {
        id: 3, nisn: '0012345603', nis: '25003', nama: 'Citra Dewi',
        kelas: 'X IPS 1', kelasId: 3, jk: 'P', status: 'aktif',
        tempatLahir: 'Bandung', tglLahir: '2010-01-08',
        telp: '081234567803', email: 'citra.dewi@student.pprq.sch.id',
        alamat: 'Jl. Anggrek No.7', rt: '03', rw: '05',
        kelurahan: 'Dago', kecamatan: 'Coblong', kabupaten: 'Bandung',
        provinsi: 'Jawa Barat', kodepos: '40135',
        jenis_tinggal: 'Bersama Orang Tua',
        jurusan: 'IPS', angkatan: '2025',
        kewarganegaraan: 'WNI', nik: '3273010801100003',
        no_kk: '3273010101200003', anak_ke: 1, jml_saudara: 1,
        hobby: 'Melukis', cita_cita: 'Seniman',
        asal_sekolah: 'SMP Negeri 5 Bandung',
        no_reg: 'REG202500003', agama: 'Islam',
        bb: 52, tb: 158, gol_darah: 'B',
        riwayat_penyakit: '-', kebutuhan_khusus: 'Tidak',
        wali: 'Ibu Dewi',
        ayah: defaultAyah('Citra Dewi', '081234567803'),
        ibu: defaultIbu('Citra Dewi', '081234567803'),
        wali_detail: defaultWali('Ibu Dewi', '081234567803', 'Jl. Anggrek No.7'),
        dokumen: [
            { id: 'kk', nama: 'Kartu Keluarga (KK)', status: 'Terverifikasi', size: '1.4 MB' },
            { id: 'akte', nama: 'Akte Kelahiran', status: 'Terverifikasi', size: '0.7 MB' },
            { id: 'ijazah', nama: 'Ijazah Terakhir', status: 'Terverifikasi', size: '1.9 MB' },
            { id: 'kip', nama: 'Kartu KIP/PIP', status: 'Tidak Ada', size: '-' },
            { id: 'skl', nama: 'Surat Keterangan Lulus SMP', status: 'Terverifikasi', size: '0.9 MB' },
        ]
    },
    {
        id: 4, nisn: '0012345604', nis: '24004', nama: 'Dewi Lestari',
        kelas: 'XI IPA 1', kelasId: 4, jk: 'P', status: 'aktif',
        tempatLahir: 'Surabaya', tglLahir: '2009-11-30',
        telp: '081234567804', email: 'dewi.lestari@student.pprq.sch.id',
        alamat: 'Jl. Kenari No.3', rt: '04', rw: '02',
        kelurahan: 'Genteng', kecamatan: 'Genteng', kabupaten: 'Surabaya',
        provinsi: 'Jawa Timur', kodepos: '60274',
        jenis_tinggal: 'Asrama',
        jurusan: 'IPA', angkatan: '2024',
        kewarganegaraan: 'WNI', nik: '3578013011090004',
        no_kk: '3578010101200004', anak_ke: 2, jml_saudara: 2,
        hobby: 'Menyanyi', cita_cita: 'Dokter',
        asal_sekolah: 'SMP Muhammadiyah 1 Surabaya',
        no_reg: 'REG202400004', agama: 'Islam',
        bb: 50, tb: 160, gol_darah: 'AB',
        riwayat_penyakit: 'Asma ringan', kebutuhan_khusus: 'Tidak',
        wali: 'Bp. Lestari',
        ayah: defaultAyah('Dewi Lestari', '081234567804'),
        ibu: defaultIbu('Dewi Lestari', '081234567804'),
        wali_detail: defaultWali('Bp. Lestari', '081234567804', 'Jl. Kenari No.3'),
        dokumen: [
            { id: 'kk', nama: 'Kartu Keluarga (KK)', status: 'Terverifikasi', size: '1.0 MB' },
            { id: 'akte', nama: 'Akte Kelahiran', status: 'Terverifikasi', size: '0.8 MB' },
            { id: 'ijazah', nama: 'Ijazah Terakhir', status: 'Terverifikasi', size: '2.1 MB' },
            { id: 'kip', nama: 'Kartu KIP/PIP', status: 'Tidak Ada', size: '-' },
            { id: 'skl', nama: 'Surat Keterangan Lulus SMP', status: 'Belum Verifikasi', size: '1.3 MB' },
        ]
    },
    {
        id: 5, nisn: '0012345605', nis: '23005', nama: 'Eko Prasetyo',
        kelas: 'XII IPA 1', kelasId: 6, jk: 'L', status: 'lulus',
        tempatLahir: 'Yogyakarta', tglLahir: '2008-07-12',
        telp: '081234567805', email: 'eko.prasetyo@student.pprq.sch.id',
        alamat: 'Jl. Flamboyan No.9', rt: '01', rw: '06',
        kelurahan: 'Danurejan', kecamatan: 'Danurejan', kabupaten: 'Yogyakarta',
        provinsi: 'DI Yogyakarta', kodepos: '55212',
        jenis_tinggal: 'Kost',
        jurusan: 'IPA', angkatan: '2023',
        kewarganegaraan: 'WNI', nik: '3471011207080005',
        no_kk: '3471010101200005', anak_ke: 1, jml_saudara: 0,
        hobby: 'Coding', cita_cita: 'Programmer',
        asal_sekolah: 'SMP Negeri 3 Yogyakarta',
        no_reg: 'REG202300005', agama: 'Islam',
        bb: 62, tb: 170, gol_darah: 'O',
        riwayat_penyakit: '-', kebutuhan_khusus: 'Tidak',
        wali: 'Bp. Prasetyo',
        ayah: defaultAyah('Eko Prasetyo', '081234567805'),
        ibu: defaultIbu('Eko Prasetyo', '081234567805'),
        wali_detail: defaultWali('Bp. Prasetyo', '081234567805', 'Jl. Flamboyan No.9'),
        dokumen: [
            { id: 'kk', nama: 'Kartu Keluarga (KK)', status: 'Terverifikasi', size: '1.1 MB' },
            { id: 'akte', nama: 'Akte Kelahiran', status: 'Terverifikasi', size: '0.9 MB' },
            { id: 'ijazah', nama: 'Ijazah Terakhir', status: 'Terverifikasi', size: '2.8 MB' },
            { id: 'kip', nama: 'Kartu KIP/PIP', status: 'Tidak Ada', size: '-' },
            { id: 'skl', nama: 'Surat Keterangan Lulus SMP', status: 'Terverifikasi', size: '1.0 MB' },
        ]
    },
    {
        id: 6, nisn: '0012345606', nis: '25006', nama: 'Fina Harahap',
        kelas: 'X IPA 2', kelasId: 2, jk: 'P', status: 'aktif',
        tempatLahir: 'Medan', tglLahir: '2010-09-05',
        telp: '081234567806', email: 'fina.harahap@student.pprq.sch.id',
        alamat: 'Jl. Cemara No.12', rt: '05', rw: '01',
        kelurahan: 'Petisah', kecamatan: 'Medan Petisah', kabupaten: 'Medan',
        provinsi: 'Sumatera Utara', kodepos: '20111',
        jenis_tinggal: 'Asrama',
        jurusan: 'IPA', angkatan: '2025',
        kewarganegaraan: 'WNI', nik: '1275014509100006',
        no_kk: '1275010101200006', anak_ke: 3, jml_saudara: 4,
        hobby: 'Memasak', cita_cita: 'Chef',
        asal_sekolah: 'MTs Negeri 1 Medan',
        no_reg: 'REG202500006', agama: 'Islam',
        bb: 48, tb: 155, gol_darah: 'A',
        riwayat_penyakit: '-', kebutuhan_khusus: 'Tidak',
        wali: 'Ibu Harahap',
        ayah: defaultAyah('Fina Harahap', '081234567806'),
        ibu: defaultIbu('Fina Harahap', '081234567806'),
        wali_detail: defaultWali('Ibu Harahap', '081234567806', 'Jl. Cemara No.12'),
        dokumen: [
            { id: 'kk', nama: 'Kartu Keluarga (KK)', status: 'Belum Verifikasi', size: '1.5 MB' },
            { id: 'akte', nama: 'Akte Kelahiran', status: 'Belum Verifikasi', size: '0.6 MB' },
            { id: 'ijazah', nama: 'Ijazah Terakhir', status: 'Tidak Ada', size: '-' },
            { id: 'kip', nama: 'Kartu KIP/PIP', status: 'Tidak Ada', size: '-' },
            { id: 'skl', nama: 'Surat Keterangan Lulus SMP', status: 'Tidak Ada', size: '-' },
        ]
    },
    {
        id: 7, nisn: '0012345607', nis: '25007', nama: 'Gunawan Sidiq',
        kelas: 'X IPA 2', kelasId: 2, jk: 'L', status: 'aktif',
        tempatLahir: 'Semarang', tglLahir: '2010-04-18',
        telp: '081234567807', email: 'gunawan.sidiq@student.pprq.sch.id',
        alamat: 'Jl. Melati No.8', rt: '06', rw: '03',
        kelurahan: 'Simpang Lima', kecamatan: 'Semarang Tengah', kabupaten: 'Semarang',
        provinsi: 'Jawa Tengah', kodepos: '50134',
        jenis_tinggal: 'Bersama Orang Tua',
        jurusan: 'IPA', angkatan: '2025',
        kewarganegaraan: 'WNI', nik: '3374011804100007',
        no_kk: '3374010101200007', anak_ke: 1, jml_saudara: 1,
        hobby: 'Olahraga', cita_cita: 'TNI',
        asal_sekolah: 'SMP Negeri 2 Semarang',
        no_reg: 'REG202500007', agama: 'Islam',
        bb: 60, tb: 169, gol_darah: 'B',
        riwayat_penyakit: '-', kebutuhan_khusus: 'Tidak',
        wali: 'Bp. Sidiq',
        ayah: defaultAyah('Gunawan Sidiq', '081234567807'),
        ibu: defaultIbu('Gunawan Sidiq', '081234567807'),
        wali_detail: defaultWali('Bp. Sidiq', '081234567807', 'Jl. Melati No.8'),
        dokumen: [
            { id: 'kk', nama: 'Kartu Keluarga (KK)', status: 'Terverifikasi', size: '0.8 MB' },
            { id: 'akte', nama: 'Akte Kelahiran', status: 'Terverifikasi', size: '1.0 MB' },
            { id: 'ijazah', nama: 'Ijazah Terakhir', status: 'Belum Verifikasi', size: '2.0 MB' },
            { id: 'kip', nama: 'Kartu KIP/PIP', status: 'Tidak Ada', size: '-' },
            { id: 'skl', nama: 'Surat Keterangan Lulus SMP', status: 'Belum Verifikasi', size: '1.2 MB' },
        ]
    },
    {
        id: 8, nisn: '0012345608', nis: '24008', nama: 'Hani Safitri',
        kelas: 'XI IPS 1', kelasId: 5, jk: 'P', status: 'aktif',
        tempatLahir: 'Depok', tglLahir: '2009-12-20',
        telp: '081234567808', email: 'hani.safitri@student.pprq.sch.id',
        alamat: 'Jl. Dahlia No.15', rt: '02', rw: '07',
        kelurahan: 'Beji', kecamatan: 'Beji', kabupaten: 'Depok',
        provinsi: 'Jawa Barat', kodepos: '16425',
        jenis_tinggal: 'Bersama Orang Tua',
        jurusan: 'IPS', angkatan: '2024',
        kewarganegaraan: 'WNI', nik: '3276012012090008',
        no_kk: '3276010101200008', anak_ke: 2, jml_saudara: 3,
        hobby: 'Membaca Novel', cita_cita: 'Penulis',
        asal_sekolah: 'SMP Negeri 7 Depok',
        no_reg: 'REG202400008', agama: 'Islam',
        bb: 49, tb: 157, gol_darah: 'O',
        riwayat_penyakit: '-', kebutuhan_khusus: 'Tidak',
        wali: 'Ibu Safitri',
        ayah: defaultAyah('Hani Safitri', '081234567808'),
        ibu: defaultIbu('Hani Safitri', '081234567808'),
        wali_detail: defaultWali('Ibu Safitri', '081234567808', 'Jl. Dahlia No.15'),
        dokumen: [
            { id: 'kk', nama: 'Kartu Keluarga (KK)', status: 'Terverifikasi', size: '1.3 MB' },
            { id: 'akte', nama: 'Akte Kelahiran', status: 'Terverifikasi', size: '0.65 MB' },
            { id: 'ijazah', nama: 'Ijazah Terakhir', status: 'Terverifikasi', size: '1.8 MB' },
            { id: 'kip', nama: 'Kartu KIP/PIP', status: 'Terverifikasi', size: '0.45 MB' },
            { id: 'skl', nama: 'Surat Keterangan Lulus SMP', status: 'Terverifikasi', size: '0.9 MB' },
        ]
    },
    {
        id: 9, nisn: '0012345609', nis: '25009', nama: 'Irfan Maulana',
        kelas: 'X TKJ 1', kelasId: 7, jk: 'L', status: 'aktif',
        tempatLahir: 'Tangerang', tglLahir: '2010-02-28',
        telp: '081234567809', email: 'irfan.maulana@student.pprq.sch.id',
        alamat: 'Jl. Sakura No.20', rt: '03', rw: '05',
        kelurahan: 'Karawaci', kecamatan: 'Karawaci', kabupaten: 'Tangerang',
        provinsi: 'Banten', kodepos: '15115',
        jenis_tinggal: 'Bersama Orang Tua',
        jurusan: 'TKJ', angkatan: '2025',
        kewarganegaraan: 'WNI', nik: '3603012802100009',
        no_kk: '3603010101200009', anak_ke: 1, jml_saudara: 2,
        hobby: 'Gaming', cita_cita: 'Game Developer',
        asal_sekolah: 'SMP Negeri 4 Tangerang',
        no_reg: 'REG202500009', agama: 'Islam',
        bb: 57, tb: 166, gol_darah: 'A',
        riwayat_penyakit: '-', kebutuhan_khusus: 'Tidak',
        wali: 'Bp. Maulana',
        ayah: defaultAyah('Irfan Maulana', '081234567809'),
        ibu: defaultIbu('Irfan Maulana', '081234567809'),
        wali_detail: defaultWali('Bp. Maulana', '081234567809', 'Jl. Sakura No.20'),
        dokumen: [
            { id: 'kk', nama: 'Kartu Keluarga (KK)', status: 'Belum Verifikasi', size: '1.6 MB' },
            { id: 'akte', nama: 'Akte Kelahiran', status: 'Belum Verifikasi', size: '0.7 MB' },
            { id: 'ijazah', nama: 'Ijazah Terakhir', status: 'Tidak Ada', size: '-' },
            { id: 'kip', nama: 'Kartu KIP/PIP', status: 'Tidak Ada', size: '-' },
            { id: 'skl', nama: 'Surat Keterangan Lulus SMP', status: 'Tidak Ada', size: '-' },
        ]
    },
    {
        id: 10, nisn: '0012345610', nis: '25010', nama: 'Jasmine Putri',
        kelas: 'X TKJ 2', kelasId: 8, jk: 'P', status: 'aktif',
        tempatLahir: 'Bekasi', tglLahir: '2010-05-14',
        telp: '081234567810', email: 'jasmine.putri@student.pprq.sch.id',
        alamat: 'Jl. Mawar No.6', rt: '04', rw: '02',
        kelurahan: 'Bekasi Jaya', kecamatan: 'Bekasi Timur', kabupaten: 'Bekasi',
        provinsi: 'Jawa Barat', kodepos: '17111',
        jenis_tinggal: 'Bersama Orang Tua',
        jurusan: 'TKJ', angkatan: '2025',
        kewarganegaraan: 'WNI', nik: '3275011405100010',
        no_kk: '3275010101200010', anak_ke: 2, jml_saudara: 2,
        hobby: 'Desain Grafis', cita_cita: 'UI Designer',
        asal_sekolah: 'SMP Negeri 3 Bekasi',
        no_reg: 'REG202500010', agama: 'Islam',
        bb: 46, tb: 153, gol_darah: 'B',
        riwayat_penyakit: '-', kebutuhan_khusus: 'Tidak',
        wali: 'Ibu Putri',
        ayah: defaultAyah('Jasmine Putri', '081234567810'),
        ibu: defaultIbu('Jasmine Putri', '081234567810'),
        wali_detail: defaultWali('Ibu Putri', '081234567810', 'Jl. Mawar No.6'),
        dokumen: [
            { id: 'kk', nama: 'Kartu Keluarga (KK)', status: 'Terverifikasi', size: '1.2 MB' },
            { id: 'akte', nama: 'Akte Kelahiran', status: 'Terverifikasi', size: '0.8 MB' },
            { id: 'ijazah', nama: 'Ijazah Terakhir', status: 'Belum Verifikasi', size: '2.3 MB' },
            { id: 'kip', nama: 'Kartu KIP/PIP', status: 'Tidak Ada', size: '-' },
            { id: 'skl', nama: 'Surat Keterangan Lulus SMP', status: 'Belum Verifikasi', size: '1.0 MB' },
        ]
    },
    {
        id: 11, nisn: '0012345611', nis: '24011', nama: 'Kurnia Adi',
        kelas: 'XI TKJ 1', kelasId: 9, jk: 'L', status: 'aktif',
        tempatLahir: 'Bogor', tglLahir: '2009-08-03',
        telp: '081234567811', email: 'kurnia.adi@student.pprq.sch.id',
        alamat: 'Jl. Tulip No.4', rt: '01', rw: '08',
        kelurahan: 'Taman Sari', kecamatan: 'Bogor Barat', kabupaten: 'Bogor',
        provinsi: 'Jawa Barat', kodepos: '16111',
        jenis_tinggal: 'Bersama Orang Tua',
        jurusan: 'TKJ', angkatan: '2024',
        kewarganegaraan: 'WNI', nik: '3201010308090011',
        no_kk: '3201010101200011', anak_ke: 1, jml_saudara: 1,
        hobby: 'Robotika', cita_cita: 'Engineer',
        asal_sekolah: 'SMP IT Bogor',
        no_reg: 'REG202400011', agama: 'Islam',
        bb: 63, tb: 171, gol_darah: 'O',
        riwayat_penyakit: '-', kebutuhan_khusus: 'Tidak',
        wali: 'Bp. Adi',
        ayah: defaultAyah('Kurnia Adi', '081234567811'),
        ibu: defaultIbu('Kurnia Adi', '081234567811'),
        wali_detail: defaultWali('Bp. Adi', '081234567811', 'Jl. Tulip No.4'),
        dokumen: [
            { id: 'kk', nama: 'Kartu Keluarga (KK)', status: 'Terverifikasi', size: '0.9 MB' },
            { id: 'akte', nama: 'Akte Kelahiran', status: 'Terverifikasi', size: '0.7 MB' },
            { id: 'ijazah', nama: 'Ijazah Terakhir', status: 'Terverifikasi', size: '2.2 MB' },
            { id: 'kip', nama: 'Kartu KIP/PIP', status: 'Tidak Ada', size: '-' },
            { id: 'skl', nama: 'Surat Keterangan Lulus SMP', status: 'Terverifikasi', size: '1.1 MB' },
        ]
    },
    {
        id: 12, nisn: '0012345612', nis: '25012', nama: 'Lina Marlina',
        kelas: 'X IPS 1', kelasId: 3, jk: 'P', status: 'pindah',
        tempatLahir: 'Cirebon', tglLahir: '2010-10-25',
        telp: '081234567812', email: 'lina.marlina@student.pprq.sch.id',
        alamat: 'Jl. Teratai No.11', rt: '07', rw: '04',
        kelurahan: 'Lemahwungkuk', kecamatan: 'Lemahwungkuk', kabupaten: 'Cirebon',
        provinsi: 'Jawa Barat', kodepos: '45114',
        jenis_tinggal: 'Bersama Orang Tua',
        jurusan: 'IPS', angkatan: '2025',
        kewarganegaraan: 'WNI', nik: '3274012510100012',
        no_kk: '3274010101200012', anak_ke: 4, jml_saudara: 5,
        hobby: 'Menari', cita_cita: 'Guru',
        asal_sekolah: 'MTs Negeri 2 Cirebon',
        no_reg: 'REG202500012', agama: 'Islam',
        bb: 44, tb: 152, gol_darah: 'A',
        riwayat_penyakit: '-', kebutuhan_khusus: 'Tidak',
        wali: 'Ibu Marlina',
        ayah: defaultAyah('Lina Marlina', '081234567812'),
        ibu: defaultIbu('Lina Marlina', '081234567812'),
        wali_detail: defaultWali('Ibu Marlina', '081234567812', 'Jl. Teratai No.11'),
        dokumen: [
            { id: 'kk', nama: 'Kartu Keluarga (KK)', status: 'Terverifikasi', size: '1.1 MB' },
            { id: 'akte', nama: 'Akte Kelahiran', status: 'Belum Verifikasi', size: '0.8 MB' },
            { id: 'ijazah', nama: 'Ijazah Terakhir', status: 'Tidak Ada', size: '-' },
            { id: 'kip', nama: 'Kartu KIP/PIP', status: 'Tidak Ada', size: '-' },
            { id: 'skl', nama: 'Surat Keterangan Lulus SMP', status: 'Tidak Ada', size: '-' },
        ]
    },
]

export const SEED_UNITS = [
    {
        id: 1, nama: 'SMA',
        kelas: [
            { id: 1, nama: 'X IPA 1', siswaCount: 3 },
            { id: 2, nama: 'X IPA 2', siswaCount: 2 },
            { id: 3, nama: 'X IPS 1', siswaCount: 2 },
            { id: 4, nama: 'XI IPA 1', siswaCount: 1 },
            { id: 5, nama: 'XI IPS 1', siswaCount: 1 },
            { id: 6, nama: 'XII IPA 1', siswaCount: 1 },
        ]
    },
    {
        id: 2, nama: 'SMK',
        kelas: [
            { id: 7, nama: 'X TKJ 1', siswaCount: 1 },
            { id: 8, nama: 'X TKJ 2', siswaCount: 1 },
            { id: 9, nama: 'XI TKJ 1', siswaCount: 1 },
        ]
    }
]

export const SEED_CATEGORIES = [
    { id: 1, kode: 'CAT-SPP', nama: 'SPP', nominal: 150000, tipe: 'bulanan', keterangan: 'Sumbangan Pembinaan Pendidikan bulanan' },
    { id: 2, kode: 'CAT-UAS', nama: 'Ujian Semester', nominal: 100000, tipe: 'semesteran', keterangan: 'Biaya ujian akhir semester' },
    { id: 3, kode: 'CAT-DU', nama: 'Daftar Ulang', nominal: 500000, tipe: 'tahunan', keterangan: 'Biaya daftar ulang tahun ajaran baru' },
    { id: 4, kode: 'CAT-SRG', nama: 'Seragam', nominal: 350000, tipe: 'tahunan', keterangan: 'Seragam sekolah baru' },
    { id: 5, kode: 'CAT-BKP', nama: 'Buku Paket', nominal: 200000, tipe: 'semesteran', keterangan: 'Peminjaman buku paket per semester' },
]

export const SEED_USERS = [
    { id: 1, nama: 'Pak Ahmad', username: 'ahmad@pprq', role: 'admin' },
    { id: 2, nama: 'Bu Siti', username: 'siti@pprq', role: 'kasir' },
    { id: 3, nama: 'Pak Budi', username: 'budi@pprq', role: 'kasir' },
]

export const SEED_TAHUN_AJARAN = [
    { id: 1, tahun: '2025/2026', status: 'aktif' },
    { id: 2, tahun: '2024/2025', status: 'nonaktif' },
    { id: 3, tahun: '2023/2024', status: 'nonaktif' },
]

export const ACTIVITY_LOG = [
    { text: 'Budi Santoso membayar SPP Feb 2026', time: '5 menit lalu' },
    { text: 'Tagihan Kelas X IPA 1 di-generate', time: '1 jam lalu' },
    { text: 'Pengeluaran: Beli ATK Rp 250.000', time: '2 jam lalu' },
    { text: 'Login: Pak Ahmad', time: '3 jam lalu' },
    { text: 'Citra Dewi membayar SPP Jan 2026', time: '5 jam lalu' },
]

/* =============================================
   Helper Generators
   ============================================= */

export function generateInitialBills() {
    const bills = []
    let id = 1
    const activeStudents = SEED_STUDENTS.filter(s => s.status === 'aktif')
    activeStudents.forEach(student => {
        for (let m = 0; m < 3; m++) {
            const isPaid = Math.random() > 0.5
            const nominalAsli = 150000
            bills.push({
                id: id++,
                siswaId: student.id,
                siswaName: student.nama,
                kelas: student.kelas,
                kategoriId: 1,
                kategori: 'SPP',
                bulan: MONTHS[m],
                tahun: 2026,
                tahunAjaran: '2025/2026',
                nominalAsli: nominalAsli,
                nominal: nominalAsli,
                isDiskon: false,
                status: isPaid ? 'lunas' : 'belum',
                paidAt: isPaid ? `2026-0${m + 1}-${10 + Math.floor(Math.random() * 15)}` : null,
            })
        }
    })
    return bills
}

export function generateInitialCashFlow(bills) {
    const flows = []
    let id = 1
    const paidBills = bills.filter(b => b.status === 'lunas')
    paidBills.forEach(bill => {
        flows.push({
            id: id++,
            tanggal: bill.paidAt,
            keterangan: `${bill.kategori} ${bill.siswaName} - ${bill.bulan}'${bill.tahun.toString().slice(-2)} (${bill.tahunAjaran})`,
            nominal: bill.nominal,
            tipe: 'masuk',
            ref: `#${String(bill.id).padStart(4, '0')}`,
        })
    })

    const expenses = [
        { keterangan: 'Beli Kertas A4 (5 rim)', nominal: 275000, tanggal: '2026-01-15' },
        { keterangan: 'Bayar Listrik Januari', nominal: 850000, tanggal: '2026-01-20' },
        { keterangan: 'Beli Toner Printer', nominal: 350000, tanggal: '2026-02-05' },
        { keterangan: 'Bayar Listrik Februari', nominal: 920000, tanggal: '2026-02-18' },
        { keterangan: 'Bayar Air PDAM', nominal: 180000, tanggal: '2026-02-20' },
        { keterangan: 'Beli Alat Kebersihan', nominal: 150000, tanggal: '2026-03-01' },
    ]

    expenses.forEach(exp => {
        flows.push({
            id: id++,
            tanggal: exp.tanggal,
            keterangan: exp.keterangan,
            nominal: exp.nominal,
            tipe: 'keluar',
            ref: '—',
        })
    })
    flows.sort((a, b) => b.tanggal.localeCompare(a.tanggal))
    return flows
}

export function generateInitialTransactions(bills) {
    const paidBills = bills.filter(b => b.status === 'lunas')
    const grouped = {}
    paidBills.forEach(b => {
        const key = `${b.siswaId}-${b.paidAt}`
        if (!grouped[key]) grouped[key] = []
        grouped[key].push(b)
    })

    const transactions = []
    let invNum = 1
    for (const key in grouped) {
        const items = grouped[key]
        const total = items.reduce((s, i) => s + i.nominal, 0)
        transactions.push({
            id: Date.now() + invNum * 100,
            invoiceNo: `INV-${items[0].paidAt.replace(/-/g, '')}-${String(invNum).padStart(4, '0')}`,
            tanggal: items[0].paidAt,
            siswaName: items[0].siswaName,
            kasir: 'Pak Ahmad',
            items,
            total,
            amountPaid: total,
            change: 0,
            status: 'success'
        })
        invNum++
    }
    transactions.sort((a, b) => b.tanggal.localeCompare(a.tanggal))
    return transactions
}
