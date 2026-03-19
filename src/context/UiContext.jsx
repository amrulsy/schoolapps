import { createContext, useContext, useState, useCallback } from 'react';

const UiContext = createContext();

export function UiProvider({ children }) {
    const [theme, setTheme] = useState('light');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [toasts, setToasts] = useState([]);
    const [loading, setLoading] = useState(true);

    const toggleTheme = useCallback(() => {
        setTheme(prev => {
            const next = prev === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', next);
            return next;
        });
    }, []);

    const addToast = useCallback((type, title, message) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, type, title, message }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const formatRupiah = useCallback((num) => {
        return 'Rp ' + Number(num).toLocaleString('id-ID');
    }, []);

    const value = {
        theme, toggleTheme,
        sidebarCollapsed, setSidebarCollapsed,
        toasts, addToast, removeToast,
        loading, setLoading,
        formatRupiah
    };

    return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi() {
    return useContext(UiContext);
}
