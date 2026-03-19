import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MONTHS, ACTIVITY_LOG } from '../data/seedData';
import { API_BASE } from '../services/api';
import { useUi } from './UiContext';
import { useAuth } from './AuthContext';
import { useSiswa } from './SiswaContext';
import { useSettings } from './SettingsContext';

const KeuanganContext = createContext();

export function KeuanganProvider({ children }) {
    const { addToast } = useUi();
    const { currentUser } = useAuth();
    const { students } = useSiswa();
    const { categories, tahunAjaranList } = useSettings();

    const [bills, setBills] = useState([]);
    const [cashFlow, setCashFlow] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [generateLogs, setGenerateLogs] = useState([]);

    const fetchBills = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/tagihan`);
            const data = await res.json();
            setBills(data);
        } catch (err) { console.error("Fetch bills error:", err); }
    }, []);

    useEffect(() => {
        Promise.all([
            fetch(`${API_BASE}/tagihan`).then(r => r.ok ? r.json() : []),
            fetch(`${API_BASE}/transactions`).then(r => r.ok ? r.json() : []),
            fetch(`${API_BASE}/cashflow`).then(r => r.ok ? r.json() : []),
            fetch(`${API_BASE}/log-generate`).then(r => r.ok ? r.json() : [])
        ]).then(([bData, txData, cfData, logData]) => {
            setBills(bData);
            setTransactions(txData);
            setCashFlow(cfData);
            setGenerateLogs(logData);
        }).catch(err => console.error("Keuangan fetch error:", err));
    }, []);

    const generateBulkBills = useCallback(async (kelasIds, kategoriId, mIndices, inputTAId = null) => {
        const category = categories.find(c => c.id === kategoriId);
        if (!category) return 0;
        const taObj = inputTAId ? tahunAjaranList.find(t => t.id === Number(inputTAId)) : tahunAjaranList.find(t => t.status === 'aktif');
        const targetStudents = students.filter(s => kelasIds.includes(s.kelasId) && s.status === 'aktif');
        const [y1, y2] = (taObj?.tahun || "2025/2026").split('/').map(Number);
        const newBills = [];

        targetStudents.forEach(student => {
            mIndices.forEach(m => {
                const exists = bills.some(b =>
                    Number(b.siswa_id) === Number(student.id) &&
                    b.kategori_id && Number(b.kategori_id) === Number(kategoriId) &&
                    b.bulan === MONTHS[m] &&
                    Number(b.tahun_ajaran_id) === Number(taObj?.id)
                );
                if (!exists) {
                    const billYear = m <= 5 ? y1 : y2;
                    newBills.push({
                        siswa_id: student.id,
                        kategori_id: kategoriId,
                        tahun_ajaran_id: taObj?.id || null,
                        bulan: MONTHS[m],
                        tahun: billYear,
                        nominal_asli: category.nominal,
                        nominal: category.nominal,
                        status: 'belum',
                        kelas_id: student.kelasId
                    });
                }
            });
        });

        if (newBills.length === 0) return 0;

        try {
            const logData = {
                tipe: 'bulk',
                keterangan: `Generate ${category.nama} untuk ${kelasIds.length} kelas`,
                operator: currentUser.nama
            };

            const res = await fetch(`${API_BASE}/tagihan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tagihanList: newBills, logData })
            });
            if (res.ok) {
                await fetchBills();
                const freshLogs = await (await fetch(`${API_BASE}/log-generate`)).json();
                setGenerateLogs(freshLogs);
                addToast('success', 'Generate Berhasil', `${newBills.length} tagihan berhasil di-generate`);
                return newBills.length;
            }
        } catch (err) { addToast('danger', 'Error', 'Gagal generate tagihan massal'); }
        return 0;
    }, [bills, categories, students, addToast, MONTHS, tahunAjaranList, fetchBills, currentUser]);

    const generateSingleBill = useCallback(async (siswaId, inputKategori, customNominal, mIndices, inputTAId = null) => {
        const student = students.find(s => Number(s.id) === Number(siswaId));
        if (!student || student.status !== 'aktif') return 0;

        const taObj = inputTAId ? tahunAjaranList.find(t => t.id === Number(inputTAId)) : tahunAjaranList.find(t => t.status === 'aktif');
        const isCustom = typeof inputKategori === 'string';
        const categoryMaster = !isCustom ? categories.find(c => c.id === inputKategori) : null;
        const kategoriName = isCustom ? inputKategori : (categoryMaster?.nama || 'Lain-lain');
        const nominalTagihan = isCustom ? Number(customNominal) : (categoryMaster?.nominal || 0);
        const [y1, y2] = (taObj?.tahun || "2025/2026").split('/').map(Number);
        const newBills = [];

        mIndices.forEach(m => {
            let exists = isCustom
                ? bills.some(b => Number(b.siswa_id) === Number(student.id) && (b.kategori_nama === kategoriName || b.kategori === kategoriName) && b.bulan === MONTHS[m] && Number(b.tahun_ajaran_id) === Number(taObj?.id))
                : bills.some(b => Number(b.siswa_id) === Number(student.id) && b.kategori_id && Number(b.kategori_id) === Number(inputKategori) && b.bulan === MONTHS[m] && Number(b.tahun_ajaran_id) === Number(taObj?.id));

            if (!exists && nominalTagihan > 0) {
                const billYear = m <= 5 ? y1 : y2;
                newBills.push({
                    siswa_id: student.id,
                    kategori_id: isCustom ? null : inputKategori,
                    tahun_ajaran_id: taObj?.id || null,
                    bulan: MONTHS[m],
                    tahun: billYear,
                    nominal_asli: nominalTagihan,
                    nominal: nominalTagihan,
                    status: 'belum',
                    kelas_id: student.kelasId
                });
            }
        });

        if (newBills.length === 0) return 0;

        try {
            const logData = {
                tipe: 'single',
                keterangan: `Generate ${kategoriName} untuk ${student.nama}`,
                operator: currentUser.nama
            };
            const res = await fetch(`${API_BASE}/tagihan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tagihanList: newBills, logData })
            });
            if (res.ok) {
                await fetchBills();
                const freshLogs = await (await fetch(`${API_BASE}/log-generate`)).json();
                setGenerateLogs(freshLogs);
                addToast('success', 'Berhasil', `${newBills.length} tagihan berhasil dibuat`);
                return newBills.length;
            }
        } catch (err) { addToast('danger', 'Error', 'Gagal membuat tagihan tunggal'); }
        return 0;
    }, [bills, categories, students, addToast, MONTHS, tahunAjaranList, fetchBills, currentUser]);

    const rollbackGeneration = useCallback(async (logId) => {
        try {
            const res = await fetch(`${API_BASE}/log-generate/${logId}`, { method: 'DELETE' });
            if (res.ok) {
                await fetchBills();
                const freshLogs = await (await fetch(`${API_BASE}/log-generate`)).json();
                setGenerateLogs(freshLogs);
                addToast('success', 'Rollback Berhasil', 'Tagihan dibatalkan.');
                return true;
            } else {
                const errData = await res.json();
                addToast('danger', 'Gagal Rollback', errData.error || 'Terjadi kesalahan.');
                return false;
            }
        } catch (err) { addToast('danger', 'Error', 'Gagal melakukan rollback.'); return false; }
    }, [fetchBills, addToast]);

    const applyDiscountToBills = useCallback(async (billIds, type, value) => {
        try {
            const res = await fetch(`${API_BASE}/tagihan/discount`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ billIds, type, value })
            });
            if (res.ok) {
                await fetchBills();
                addToast('success', 'Berhasil', `Diskon diterapkan pada ${billIds.length} tagihan.`);
            }
        } catch (err) { addToast('danger', 'Error', 'Gagal menerapkan diskon'); }
    }, [addToast, fetchBills]);

    const processPayment = useCallback(async (selectedBillIds, amountPaid, partialPayMap = {}) => {
        const billsToPay = bills.filter(b => selectedBillIds.includes(b.id));
        if (billsToPay.length === 0) return null;
        const total = billsToPay.reduce((s, b) => s + (Number(partialPayMap[b.id] ?? b.nominal) || 0), 0);

        if (amountPaid < total) return null;

        try {
            const res = await fetch(`${API_BASE}/pembayaran`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    siswaId: billsToPay[0].siswa_id || billsToPay[0].siswaId,
                    selectedBillIds,
                    amountPaid,
                    total,
                    change: amountPaid - total,
                    partialPayMap,
                    kasir: currentUser.nama
                })
            });

            if (res.ok) {
                const data = await res.json();
                await Promise.all([
                    fetchBills(),
                    fetch(`${API_BASE}/transactions`).then(r => r.json()).then(setTransactions),
                    fetch(`${API_BASE}/cashflow`).then(r => r.json()).then(setCashFlow)
                ]);

                addToast('success', 'Berhasil', 'Pembayaran diproses');

                return {
                    id: data.id,
                    invoiceNo: data.invoiceNo,
                    tanggal: new Date().toISOString(),
                    total, amountPaid, change: amountPaid - total,
                    kasir: currentUser.nama,
                    items: billsToPay.map(b => ({
                        ...b,
                        kategori: b.kategori_nama || b.kategori || 'Tagihan',
                        nominal: Number(partialPayMap[b.id] ?? b.nominal) || 0
                    }))
                };
            }
        } catch (err) { addToast('danger', 'Error', 'Gagal memproses pembayaran'); }
        return null;
    }, [bills, currentUser, addToast, fetchBills]);

    const revertTransaction = useCallback(async (id) => {
        try {
            const res = await fetch(`${API_BASE}/transactions/${id}/void`, { method: 'PUT' });
            if (res.ok) {
                await Promise.all([
                    fetch(`${API_BASE}/transactions`).then(r => r.json()).then(setTransactions),
                    fetch(`${API_BASE}/cashflow`).then(r => r.json()).then(setCashFlow)
                ]);
                addToast('success', 'Berhasil', 'Transaksi dibatalkan (Void)');
            }
        } catch (err) { addToast('danger', 'Error', 'Gagal membatalkan transaksi'); }
    }, [addToast]);

    const addExpense = useCallback(async (keterangan, nominal, tanggal) => {
        try {
            const res = await fetch(`${API_BASE}/cashflow`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keterangan, nominal, tipe: 'keluar', tanggal })
            });
            if (res.ok) {
                const data = await res.json();
                setCashFlow(prev => [data, ...prev]);
                addToast('success', 'Berhasil', 'Catatan pengeluaran disimpan');
            }
        } catch (err) { addToast('danger', 'Error', 'Gagal menyimpan pengeluaran'); }
    }, [addToast]);

    const value = {
        bills, generateBulkBills, generateSingleBill, fetchBills,
        generateLogs, rollbackGeneration,
        cashFlow, addExpense, transactions, revertTransaction,
        processPayment, applyDiscountToBills,
        ACTIVITY_LOG, MONTHS
    };

    return <KeuanganContext.Provider value={value}>{children}</KeuanganContext.Provider>;
}

export function useKeuangan() {
    return useContext(KeuanganContext);
}
