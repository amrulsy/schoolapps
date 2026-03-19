import { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE, getAuthHeaders } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [users, setUsers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Initial auth check
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetch(`${API_BASE}/auth/me`, { headers: getAuthHeaders() })
                .then(res => res.ok ? res.json() : null)
                .then(user => {
                    if (user && !user.error) {
                        setCurrentUser(user);
                    } else {
                        localStorage.removeItem('token');
                    }
                })
                .catch(() => localStorage.removeItem('token'))
                .finally(() => setIsLoaded(true));
        } else {
            setIsLoaded(true);
        }
    }, []);

    // Load users list if logged in
    useEffect(() => {
        if (currentUser) {
            fetch(`${API_BASE}/users`, { headers: getAuthHeaders() })
                .then(res => res.ok ? res.json() : [])
                .then(data => setUsers(data))
                .catch(() => setUsers([]));
        }
    }, [currentUser]);

    const login = (token, user) => {
        localStorage.setItem('token', token);
        setCurrentUser(user);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setCurrentUser(null);
        // Refresh page to clear side-effects
        window.location.href = '/admin';
    };

    const value = {
        users, setUsers,
        currentUser, isLoaded,
        login, logout
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    return useContext(AuthContext);
}
