import { createContext, useContext, useEffect, useState } from 'react';
import { UiProvider, useUi } from './UiContext';
import { AuthProvider, useAuth } from './AuthContext';
import { SettingsProvider, useSettings } from './SettingsContext';
import { SiswaProvider, useSiswa } from './SiswaContext';
import { KeuanganProvider, useKeuangan } from './KeuanganContext';

const AppContext = createContext();

export function LegacyAppProvider({ children }) {
    const ui = useUi();
    const auth = useAuth();
    const settings = useSettings();
    const siswa = useSiswa();
    const keuangan = useKeuangan();

    // Simulasi global loading seolah-olah semua termuat bersamaan
    const [globalLoading, setGlobalLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setGlobalLoading(false), 600);
        return () => clearTimeout(timer);
    }, []);

    const value = {
        ...ui,
        ...auth,
        ...settings,
        ...siswa,
        ...keuangan,
        tahunAjaran: settings.activeTahunAjaran, // mapping legacy name
        loading: globalLoading
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function AppProvider({ children }) {
    return (
        <UiProvider>
            <AuthProvider>
                <SettingsProvider>
                    <SiswaProvider>
                        <KeuanganProvider>
                            <LegacyAppProvider>{children}</LegacyAppProvider>
                        </KeuanganProvider>
                    </SiswaProvider>
                </SettingsProvider>
            </AuthProvider>
        </UiProvider>
    );
}

export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used within AppProvider');
    return ctx;
}
