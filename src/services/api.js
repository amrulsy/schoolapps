// Central API configuration — single source of truth for all base URLs and auth headers

const origin = `${window.location.protocol}//${window.location.hostname}:3000`

export const API_BASE        = `${origin}/api`
export const API_BASE_CMS    = `${origin}/api/admin/cms`
export const API_BASE_PUBLIC = `${origin}/api/public`

/** Build a full URL for server-hosted media, e.g. getMediaUrl('/uploads/img.jpg') */
export const getMediaUrl = (path) => `${origin}${path}`

/** JSON + Bearer auth headers for CMS admin requests */
export const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
})

/** Bearer-only header for requests that set their own Content-Type (e.g. FormData) */
export const getBearerHeader = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`
})
