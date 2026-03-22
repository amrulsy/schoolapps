const request = require('supertest');
const express = require('express');
const sessionRoutes = require('../routes/guru/session');
const pool = require('../db');

jest.mock('../db', () => ({
    query: jest.fn(),
    getConnection: jest.fn()
}));

const app = express();
app.use(express.json());

// Mock auth middleware to inject guru_id directly
app.use((req, res, next) => {
    req.user = { id: 1, role: 'guru' };
    next();
});
app.use('/api/guru/session', sessionRoutes);

describe('Guru Session Interlocking API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('POST /api/guru/session/start sets waktu_masuk_aktual', async () => {
        pool.query.mockImplementation((query) => {
            if (query.includes('FROM guru')) return Promise.resolve([[{ id: 10 }]]);
            if (query.includes('FROM jurnal_mengajar')) return Promise.resolve([[]]); // no existing
            if (query.includes('FROM jadwal_pelajaran')) return Promise.resolve([[{ kelas_id: 1, mapel_id: 1 }]]); // jadwal info
            if (query.includes('INSERT INTO jurnal_mengajar')) return Promise.resolve([{ insertId: 5 }]);
            return Promise.resolve([[]]);
        });

        const res = await request(app).post('/api/guru/session/start').send({ jadwal_id: 1 });
        expect(res.status).toBe(201);
        expect(res.body.id).toBe(5);
    });

    it('GET /api/guru/session/:id/students applies logic', async () => {
        pool.query.mockImplementation((query) => {
            if (query.includes('FROM guru')) return Promise.resolve([[{ id: 10 }]]);
            if (query.includes('FROM jurnal_mengajar')) return Promise.resolve([[{ kelas_id: 1, tanggal: '2026-03-22' }]]);
            if (query.includes('FROM siswa WHERE')) return Promise.resolve([[{ id: 100, nama: 'Andi' }, { id: 101, nama: 'Budi' }]]);
            if (query.includes('FROM siswa_presensi')) return Promise.resolve([[]]);
            if (query.includes('FROM presensi_sesi')) return Promise.resolve([[]]);
            return Promise.resolve([[]]);
        });

        const res = await request(app).get('/api/guru/session/1/students');
        expect(res.status).toBe(200);
        expect(res.body.students.length).toBe(2);
    });
});
