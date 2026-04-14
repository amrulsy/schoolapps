import { useEffect, useState } from 'react';
import { AppContext } from './AppContext';
import { UiProvider } from './UiProvider';
import { useUi } from './UiContext';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './AuthContext';
import { SettingsProvider } from './SettingsProvider';
import { useSettings } from './SettingsContext';
import { SiswaProvider } from './SiswaProvider';
import { useSiswa } from './SiswaContext';
import { KeuanganProvider } from './KeuanganProvider';
import { useKeuangan } from './KeuanganContext';

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
