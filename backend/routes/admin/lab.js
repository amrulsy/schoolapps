const express = require('express');
const router = express.Router();
const InventoryController = require('../../controllers/InventoryController');

// Settings
router.get('/settings', InventoryController.getSettings);
router.post('/settings', InventoryController.updateSettings);

// Dashboard
router.get('/dashboard', InventoryController.getDashboard);

// Kategori
router.get('/kategori', InventoryController.getKategori);
router.post('/kategori', InventoryController.createKategori);
router.put('/kategori/:id', InventoryController.updateKategori);
router.delete('/kategori/:id', InventoryController.deleteKategori);

// Inventaris
router.get('/inventaris', InventoryController.getInventaris);
router.post('/inventaris', InventoryController.createInventaris);
router.put('/inventaris/:id', InventoryController.updateInventaris);
router.delete('/inventaris/:id', InventoryController.deleteInventaris);

// Peminjaman
router.get('/peminjaman', InventoryController.getPeminjaman);
router.post('/peminjaman', InventoryController.createPeminjaman);
router.put('/peminjaman/:id/return', InventoryController.returnPeminjaman);

module.exports = router;
