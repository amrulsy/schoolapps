import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../services/api';
import { useUi } from './UiContext';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
    const { addToast } = useUi();
    const [categories, setCategories] = useState([]);
    const [tahunAjaranList, setTahunAjaranList] = useState([]);

    const activeTahunAjaran = tahunAjaranList.find(t => t.status === 'aktif')?.tahun || '2025/2026';

    useEffect(() => {
        Promise.all([
            fetch(`${API_BASE}/categories`).then(r => r.ok ? r.json() : []),
            fetch(`${API_BASE}/tahun-ajaran`).then(r => r.ok ? r.json() : [])
        ]).then(([catData, taData]) => {
            setCategories(catData);
            setTahunAjaranList(taData);
        }).catch(err => console.error("Settings fetch error:", err));
    }, []);

    const addTahunAjaran = useCallback(async (tahun) => {
        try {
            const res = await fetch(`${API_BASE}/tahun-ajaran`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tahun })
            });
            if (res.ok) {
                const data = await res.json();
                setTahunAjaranList(prev => [data, ...prev]);
                addToast('success', 'Berhasil', `Tahun ajaran ${tahun} berhasil ditambahkan`);
            }
        } catch (err) { addToast('danger', 'Error', 'Gagal menambah tahun ajaran'); }
    }, [addToast]);

    const setTahunAjaranAktif = useCallback(async (id) => {
        try {
            const res = await fetch(`${API_BASE}/tahun-ajaran/${id}/status`, { method: 'PUT' });
            if (res.ok) {
                setTahunAjaranList(prev => prev.map(t => ({
                    ...t,
                    status: t.id === id ? 'aktif' : 'nonaktif'
                })));
                addToast('success', 'Berhasil', 'Tahun ajaran aktif berhasil diubah');
            }
        } catch (err) { addToast('danger', 'Error', 'Gagal mengubah status tahun ajaran'); }
    }, [addToast]);

    const addCategory = useCallback(async (cat) => {
        try {
            const res = await fetch(`${API_BASE}/categories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cat)
            });
            if (res.ok) {
                const data = await res.json();
                setCategories(prev => [...prev, data]);
                addToast('success', 'Berhasil', `Kategori "${cat.nama}" ditambahkan`);
            }
        } catch (err) { addToast('danger', 'Error', 'Gagal menambah kategori'); }
    }, [addToast]);

    const deleteCategory = useCallback(async (id) => {
        try {
            const res = await fetch(`${API_BASE}/categories/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setCategories(prev => prev.filter(c => c.id !== id));
                addToast('success', 'Berhasil', 'Kategori berhasil dihapus');
            }
        } catch (err) { addToast('danger', 'Error', 'Gagal menghapus kategori'); }
    }, [addToast]);

    const value = {
        categories, addCategory, deleteCategory,
        tahunAjaranList, activeTahunAjaran, addTahunAjaran, setTahunAjaranAktif
    };

    return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
    return useContext(SettingsContext);
}
