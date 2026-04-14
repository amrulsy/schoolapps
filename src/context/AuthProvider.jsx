import { useState, useEffect } from 'react';
import { API_BASE } from '../services/api';
import { AuthContext } from './AuthContext';

export function AuthProvider({ children }) {
    const [users, setUsers] = useState([]);
    // Dual-session: separate state for admin & guru so both can be logged in simultaneously
    const [adminUser, setAdminUser] = useState(null);
    const [guruUser, setGuruUser] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Initial auth check — verify BOTH tokens independently
    useEffect(() => {
        let mounted = true;
        let pending = 0;
        const done = () => { if (mounted && --pending <= 0) setIsLoaded(true); };

        const adminToken = localStorage.getItem('token');
        const guruToken = localStorage.getItem('guru_token');

        // Count how many tokens we need to verify
        if (adminToken) pending++;
        if (guruToken) pending++;
        if (pending === 0) { setIsLoaded(true); return; }

        // Verify admin token
        if (adminToken) {
            fetch(`${API_BASE}/auth/me`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                }
            })
                .then(res => res.ok ? res.json() : null)
                .then(user => {
                    if (mounted && user && !user.error) {
                        setAdminUser(user);
                    } else {
                        console.warn('Admin token fetch failed or user.error, but keeping token to prevent race condition wipe.', user);
                        // localStorage.removeItem('token');
                    }
                })
                .catch((err) => console.error('Admin token fetch catch:', err))
                .finally(done);
        }

        // Verify guru token
        if (guruToken) {
            fetch(`${API_BASE}/auth/me`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${guruToken}`
                }
            })
                .then(res => res.ok ? res.json() : null)
                .then(user => {
                    if (mounted && user && !user.error) {
                        setGuruUser(user);
                    } else {
                        console.warn('Guru token fetch failed or user.error, but keeping token.', user);
                        // localStorage.removeItem('guru_token');
                    }
                })
                .catch((err) => console.error('Guru token fetch catch:', err))
                .finally(done);
        }

        return () => { mounted = false; };
    }, []);

    // Load users list if any admin user is logged in (for admin panel features)
    useEffect(() => {
        if (adminUser) {
            fetch(`${API_BASE}/users`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
                .then(res => res.ok ? res.json() : [])
                .then(data => setUsers(data))
                .catch(() => setUsers([]));
        }
    }, [adminUser]);

    // Derived currentUser — path-aware: returns the correct user based on current route
    const currentUser = window.location.pathname.startsWith('/guru') ? guruUser : adminUser;

    const login = (token, user) => {
        if (user.role === 'guru') {
            localStorage.setItem('guru_token', token);
            setGuruUser(user);
        } else {
            localStorage.setItem('token', token);
            setAdminUser(user);
        }
    };

    const logout = () => {
        const isGuru = window.location.pathname.startsWith('/guru');
        if (isGuru) {
            localStorage.removeItem('guru_token');
            setGuruUser(null);
        } else {
            localStorage.removeItem('token');
            setAdminUser(null);
        }
    };

    const value = {
        users, setUsers,
        adminUser, guruUser,
        currentUser, isLoaded,
        login, logout
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
