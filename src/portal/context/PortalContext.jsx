import { createContext, useContext, useState, useCallback } from 'react'

const PortalContext = createContext()

const API_BASE = `http://${window.location.hostname}:3000/api/public`

export function PortalProvider({ children }) {
    const [settings, setSettings] = useState({})
    const [loading, setLoading] = useState(false)

    const fetchSettings = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/settings`)
            const data = await res.json()
            setSettings(data)
        } catch (err) {
            console.error('Failed to fetch settings:', err)
        }
    }, [])

    const fetchPublic = useCallback(async (endpoint) => {
        try {
            const res = await fetch(`${API_BASE}${endpoint}`)
            if (!res.ok) throw new Error('Request failed')
            return await res.json()
        } catch (err) {
            console.error(`Failed to fetch ${endpoint}:`, err)
            return null
        }
    }, [])

    const postPublic = useCallback(async (endpoint, body) => {
        try {
            const res = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })
            return await res.json()
        } catch (err) {
            console.error(`Failed to post ${endpoint}:`, err)
            return { error: err.message }
        }
    }, [])

    const value = {
        settings,
        loading,
        setLoading,
        fetchSettings,
        fetchPublic,
        postPublic,
        API_BASE
    }

    return (
        <PortalContext.Provider value={value}>
            {children}
        </PortalContext.Provider>
    )
}

export function usePortal() {
    const context = useContext(PortalContext)
    if (!context) throw new Error('usePortal must be used within PortalProvider')
    return context
}
