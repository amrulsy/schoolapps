import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { API_BASE } from '../services/api';
import { useUi } from './UiContext';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
    const { addToast } = useUi();
    const [categories, setCategories] = useState([]);
    const [tahunAjaranList, setTahunAjaranList] = useState([]);
    const [schoolSettings, setSchoolSettings] = useState({});

    const activeTahunAjaran = tahunAjaranList.find(t => t.status === 'aktif')?.tahun || '2025/2026';

    useEffect(() => {
        Promise.all([
            api.get('/categories').then(res => res.data).catch(() => []),
            api.get('/tahun-ajaran').then(res => res.data).catch(() => []),
            api.get('/admin/school-settings').then(res => res.data).catch(() => ({}))
        ]).then(([catData, taData, schoolData]) => {
            setCategories(catData);
            setTahunAjaranList(taData);
            setSchoolSettings(schoolData);
        }).catch(err => console.error("Settings fetch error:", err));
    }, []);

    const updateSchoolSettings = useCallback(async (newSettings) => {
        try {
            const { data } = await api.post('/admin/school-settings', newSettings);
            setSchoolSettings(prev => ({ ...prev, ...newSettings }));
            addToast('success', 'Berhasil', 'Pengaturan sekolah diperbarui');
        } catch (err) { addToast('danger', 'Error', 'Gagal memperbarui pengaturan sekolah'); }
    }, [addToast]);

    const addTahunAjaran = useCallback(async (tahun) => {
        try {
            const { data } = await api.post('/tahun-ajaran', { tahun });
            setTahunAjaranList(prev => [data, ...prev]);
            addToast('success', 'Berhasil', `Tahun ajaran ${tahun} berhasil ditambahkan`);
        } catch (err) { addToast('danger', 'Error', 'Gagal menambah tahun ajaran'); }
    }, [addToast]);

    const setTahunAjaranAktif = useCallback(async (id) => {
        try {
            await api.put(`/tahun-ajaran/${id}/status`);
            setTahunAjaranList(prev => prev.map(t => ({
                ...t,
                status: t.id === id ? 'aktif' : 'nonaktif'
            })));
            addToast('success', 'Berhasil', 'Tahun ajaran aktif berhasil diubah');
        } catch (err) { addToast('danger', 'Error', 'Gagal mengubah status tahun ajaran'); }
    }, [addToast]);

    const addCategory = useCallback(async (cat) => {
        try {
            const { data } = await api.post('/categories', cat);
            setCategories(prev => [...prev, data]);
            addToast('success', 'Berhasil', `Kategori "${cat.nama}" ditambahkan`);
        } catch (err) { addToast('danger', 'Error', 'Gagal menambah kategori'); }
    }, [addToast]);

    const deleteCategory = useCallback(async (id) => {
        try {
            await api.delete(`/categories/${id}`);
            setCategories(prev => prev.filter(c => c.id !== id));
            addToast('success', 'Berhasil', 'Kategori berhasil dihapus');
        } catch (err) { addToast('danger', 'Error', 'Gagal menghapus kategori'); }
    }, [addToast]);

    const value = {
        categories, addCategory, deleteCategory,
        tahunAjaranList, activeTahunAjaran, addTahunAjaran, setTahunAjaranAktif,
        schoolSettings, updateSchoolSettings
    };

    return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
    return useContext(SettingsContext);
}
