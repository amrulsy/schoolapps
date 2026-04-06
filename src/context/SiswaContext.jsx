import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../services/api';
import { useUi } from './UiContext';

const SiswaContext = createContext();

export function SiswaProvider({ children }) {
    const { addToast } = useUi();
    const [students, setStudents] = useState([]);
    const [units, setUnits] = useState([]);

    useEffect(() => {
        Promise.all([
            fetch(`${API_BASE}/siswa`).then(r => r.ok ? r.json() : []),
            fetch(`${API_BASE}/units`).then(r => r.ok ? r.json() : []),
            fetch(`${API_BASE}/kelas`).then(r => r.ok ? r.json() : [])
        ]).then(([sData, uData, kData]) => {
            const mappedStudents = sData.map(s => ({
                ...s,
                kelasId: s.kelas_id,
                kelas: s.kelas_nama,
                tempatLahir: s.tempat_lahir,
                tglLahir: s.tgl_lahir,
                jenisTinggal: s.jenis_tinggal,
                jenisPendaftaran: s.jenis_pendaftaran,
                tanggalMulaiSekolah: s.tanggal_mulai_sekolah
            }));
            const nestedUnits = uData.map(unit => ({
                ...unit,
                kelas: kData.filter(k => k.unit_id === unit.id) || []
            }));
            setStudents(mappedStudents);
            setUnits(nestedUnits);
        }).catch(err => console.error("Siswa fetch error:", err));
    }, []);

    const addStudent = useCallback(async (student) => {
        try {
            const res = await fetch(`${API_BASE}/siswa`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(student)
            });
            const data = await res.json();
            if (res.ok) {
                const kelasName = units.flatMap(u => u.kelas).find(k => k.id == student.kelasId)?.nama || '';
                setStudents(prev => [...prev, { ...student, id: data.id, kelas: kelasName }]);
                addToast('success', 'Berhasil', `Siswa ${student.nama} ditambahkan`);
                return true;
            } else {
                addToast('danger', 'Gagal Menambah', data.error || 'Server error');
                return false;
            }
        } catch (err) { 
            addToast('danger', 'Error Koneksi', err.message); 
            return false;
        }
    }, [addToast, units]);

    const updateStudent = useCallback(async (id, data) => {
        try {
            const res = await fetch(`${API_BASE}/siswa/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const resData = await res.json();
            if (res.ok) {
                const kelasName = units.flatMap(u => u.kelas).find(k => k.id == data.kelasId)?.nama || '';
                setStudents(prev => prev.map(s => s.id === id ? {
                    ...s, ...data, kelas: kelasName,
                    ayah: { ...(s.ayah || {}), ...(data.ayah || {}) },
                    ibu: { ...(s.ibu || {}), ...(data.ibu || {}) },
                    wali_detail: { ...(s.wali_detail || {}), ...(data.wali_detail || {}) }
                } : s));
                addToast('success', 'Berhasil', 'Data siswa diperbarui');
                return true;
            } else {
                addToast('danger', 'Gagal Update', resData.error || 'Server error');
                return false;
            }
        } catch (err) { 
            addToast('danger', 'Error Koneksi', err.message); 
            return false;
        }
    }, [addToast, units]);

    const deleteStudent = useCallback(async (id, force = false) => {
        try {
            const url = force ? `${API_BASE}/siswa/${id}?force=true` : `${API_BASE}/siswa/${id}`;
            const res = await fetch(url, { method: 'DELETE' });
            
            if (res.ok) {
                setStudents(prev => prev.filter(s => s.id !== id));
                addToast('success', 'Berhasil', 'Data siswa dihapus');
                return { success: true };
            } else {
                const data = await res.json();
                if (res.status === 409) {
                    return { success: false, conflict: true, message: data.message };
                }
                throw new Error(data.error || 'Gagal menghapus siswa');
            }
        } catch (err) { 
            addToast('danger', 'Error', err.message); 
            return { success: false, error: err.message };
        }
    }, [addToast]);

    const importStudents = useCallback(async (formData) => {
        try {
            const res = await fetch(`${API_BASE}/siswa/import`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (res.ok) {
                // Refresh list
                const sRes = await fetch(`${API_BASE}/siswa`);
                if (sRes.ok) {
                    const sData = await sRes.json();
                    const mappedStudents = sData.map(s => ({
                        ...s,
                        kelasId: s.kelas_id,
                        kelas: s.kelas_nama,
                        tempatLahir: s.tempat_lahir,
                        tglLahir: s.tgl_lahir,
                        jenisTinggal: s.jenis_tinggal,
                        jenisPendaftaran: s.jenis_pendaftaran,
                        tanggalMulaiSekolah: s.tanggal_mulai_sekolah
                    }));
                    setStudents(mappedStudents);
                }
                addToast('success', 'Import Berhasil', `${data.count} data siswa berhasil diimpor`);
                return { success: true, count: data.count };
            } else {
                throw new Error(data.error || 'Server error');
            }
        } catch (err) {
            addToast('danger', 'Import Gagal', err.message);
            return { success: false, error: err.message };
        }
    }, [addToast]);

    const addUnit = useCallback(async (nama) => {
        try {
            const res = await fetch(`${API_BASE}/units`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nama })
            });
            if (res.ok) {
                const data = await res.json();
                setUnits(prev => [...prev, { ...data, kelas: [] }]);
                addToast('success', 'Berhasil', `Unit ditambahkan`);
            }
        } catch (err) { addToast('danger', 'Error', 'Gagal menambah unit'); }
    }, [addToast]);

    const updateUnit = useCallback(async (id, nama) => {
        try {
            const res = await fetch(`${API_BASE}/units/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nama })
            });
            if (res.ok) {
                setUnits(prev => prev.map(u => u.id === id ? { ...u, nama } : u));
                addToast('success', 'Berhasil', 'Unit diperbarui');
            }
        } catch (err) { addToast('danger', 'Error', 'Gagal memperbarui unit'); }
    }, [addToast]);

    const deleteUnit = useCallback(async (id) => {
        try {
            const res = await fetch(`${API_BASE}/units/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setUnits(prev => prev.filter(u => u.id !== id));
                addToast('success', 'Berhasil', 'Unit dihapus');
            }
        } catch (err) { addToast('danger', 'Error', 'Gagal menghapus unit'); }
    }, [addToast]);

    const addKelas = useCallback(async (unit_id, nama) => {
        try {
            const res = await fetch(`${API_BASE}/kelas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ unit_id, nama })
            });
            if (res.ok) {
                const data = await res.json();
                setUnits(prev => prev.map(u => u.id === unit_id ? { ...u, kelas: [...u.kelas, data] } : u));
                addToast('success', 'Berhasil', `Kelas ditambahkan`);
            }
        } catch (err) { addToast('danger', 'Error', 'Gagal menambah kelas'); }
    }, [addToast]);

    const updateKelas = useCallback(async (unit_id, kelas_id, nama) => {
        try {
            const res = await fetch(`${API_BASE}/kelas/${kelas_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nama })
            });
            if (res.ok) {
                setUnits(prev => prev.map(u => u.id === unit_id ? {
                    ...u, kelas: u.kelas.map(k => k.id === kelas_id ? { ...k, nama } : k)
                } : u));
                addToast('success', 'Berhasil', 'Kelas diperbarui');
            }
        } catch (err) { addToast('danger', 'Error', 'Gagal memperbarui kelas'); }
    }, [addToast]);

    const deleteKelas = useCallback(async (unit_id, kelas_id) => {
        try {
            const res = await fetch(`${API_BASE}/kelas/${kelas_id}`, { method: 'DELETE' });
            if (res.ok) {
                setUnits(prev => prev.map(u => u.id === unit_id ? {
                    ...u, kelas: u.kelas.filter(k => k.id !== kelas_id)
                } : u));
                addToast('success', 'Berhasil', 'Kelas dihapus');
            }
        } catch (err) { addToast('danger', 'Error', 'Gagal menghapus kelas'); }
    }, [addToast]);

    const kelasSiswaCount = students.reduce((acc, student) => {
        if (student.status === 'aktif' && student.kelasId) {
            acc[student.kelasId] = (acc[student.kelasId] || 0) + 1;
        }
        return acc;
    }, {});

    const unitsWithDynamicCount = units.map(unit => ({
        ...unit,
        kelas: unit.kelas.map(k => ({ ...k, siswaCount: kelasSiswaCount[k.id] || 0 }))
    }));

    const value = {
        students, setStudents, addStudent, updateStudent, deleteStudent, importStudents,
        units: unitsWithDynamicCount, setUnits, addUnit, updateUnit, deleteUnit,
        addKelas, updateKelas, deleteKelas
    };

    return <SiswaContext.Provider value={value}>{children}</SiswaContext.Provider>;
}

export function useSiswa() {
    return useContext(SiswaContext);
}
