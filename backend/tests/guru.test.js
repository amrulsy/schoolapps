const request = require('supertest');
const express = require('express');
const guruRoutes = require('../routes/admin/guru');
const pool = require('../db');

jest.mock('../db', () => ({
    query: jest.fn(),
    getConnection: jest.fn()
}));

const app = express();
app.use(express.json());
app.use('/api/admin/guru', guruRoutes);

describe('Admin Guru API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('GET /api/admin/guru should return list of gurus', async () => {
        pool.query.mockResolvedValue([[{ id: 1, nama: 'Budi' }]]);
        const res = await request(app).get('/api/admin/guru');
        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].nama).toBe('Budi');
    });

    it('POST /api/admin/guru should create guru successfully', async () => {
        const mockConnection = {
            beginTransaction: jest.fn(),
            query: jest.fn(),
            commit: jest.fn(),
            rollback: jest.fn(),
            release: jest.fn()
        };
        pool.getConnection.mockResolvedValue(mockConnection);
        mockConnection.query.mockResolvedValueOnce([[]]); // check username
        mockConnection.query.mockResolvedValueOnce([{ insertId: 1 }]); // insert users
        mockConnection.query.mockResolvedValueOnce([{ insertId: 1 }]); // insert guru

        const payload = { nip: '123', nama: 'Budi', username: 'budi', password: '123' };
        const res = await request(app).post('/api/admin/guru').send(payload);

        expect(res.status).toBe(201);
        expect(mockConnection.commit).toHaveBeenCalled();
    });
});
