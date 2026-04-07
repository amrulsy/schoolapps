// Central API configuration — single source of truth for all base URLs and auth headers
// Set VITE_API_URL di .env untuk production (misal: https://api.domain.com)
const origin = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:3005`


export const API_BASE = `${origin}/api`
export const API_BASE_CMS = `${origin}/api/admin/cms`
export const API_BASE_PUBLIC = `${origin}/api/public`

/** Build a full URL for server-hosted media, e.g. getMediaUrl('/uploads/img.jpg') */
export const getMediaUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    if (path.startsWith('/uploads/')) return `${origin}/api${path}`;
    return `${origin}${path}`;
}

export const getActiveToken = () => {
    if (window.location.pathname.startsWith('/guru')) {
        return localStorage.getItem('guru_token');
    }
    return localStorage.getItem('token');
}

/** JSON + Bearer auth headers for CMS admin requests */
export const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getActiveToken()}`
})

/** Bearer-only header for requests that set their own Content-Type (e.g. FormData) */
export const getBearerHeader = () => ({
    'Authorization': `Bearer ${getActiveToken()}`
})

// Lightweight axios-like wrapper using fetch
const api = {
    async request(url, options = {}) {
        const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
        const headers = { ...getAuthHeaders(), ...options.headers };

        // If it's a GET, handle params
        let finalUrl = fullUrl;
        if (options.params) {
            const searchParams = new URLSearchParams(options.params);
            finalUrl += (finalUrl.includes('?') ? '&' : '?') + searchParams.toString();
        }

        const response = await fetch(finalUrl, {
            ...options,
            headers,
            body: options.body ? JSON.stringify(options.body) : undefined
        });

        const data = await response.json();
        if (!response.ok) {
            const error = new Error(data.error || 'API Request Failed');
            error.response = { data };
            throw error;
        }
        return { data };
    },

    get(url, config = {}) { return this.request(url, { ...config, method: 'GET' }); },
    post(url, body, config = {}) { return this.request(url, { ...config, method: 'POST', body }); },
    put(url, body, config = {}) { return this.request(url, { ...config, method: 'PUT', body }); },
    delete(url, config = {}) { return this.request(url, { ...config, method: 'DELETE' }); }
};

export default api;

