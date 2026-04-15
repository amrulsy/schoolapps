/**
 * RBAC Permissions — Single Source of Truth
 * Defines which paths each role can access.
 * Used by: Sidebar, BottomNav, MobileDrawer, CommandPalette, RoleGuard
 */

export const STAFF_ROLES = ['admin', 'staf_tu', 'staf_keuangan', 'staf_perbankan', 'staf_infaq']

export const ROLE_PERMISSIONS = {
    staf_tu: [
        '/admin/siswa', '/admin/guru', '/admin/unit-kelas', '/admin/tahun-ajaran',
        '/admin/jadwal', '/admin/presensi', '/admin/bk', '/admin/akademik',
        '/admin/pesan', '/admin/gate-monitor',
        '/admin/lab-inventaris', '/admin/lab-scan',
        '/admin/cms/home', '/admin/cms/ppdb', '/admin/cms/contacts',
    ],
    staf_keuangan: [
        '/admin/keuangan-dashboard', '/admin/pembayaran', '/admin/riwayat',
        '/admin/generate-tagihan', '/admin/kartu-spp', '/admin/arus-kas',
        '/admin/kategori-tagihan', '/admin/rekening',
    ],
    staf_perbankan: [
        '/admin/tabungan',
    ],
    staf_infaq: [
        '/admin/infaq', '/admin/infaq-settings'
    ],
}

/**
 * Check if a specific path is allowed for a given role.
 * Admin always has full access.
 * Dashboard (/admin exact) is always accessible.
 */
export function isPathAllowed(role, path) {
    if (role === 'admin') return true
    if (path === '/admin') return true // Dashboard always accessible

    const allowedPaths = ROLE_PERMISSIONS[role] || []
    return allowedPaths.some(p => path === p || path.startsWith(p + '/'))
}

/**
 * Filter menu items based on role permissions.
 * Takes an array of items with `to` property and returns only allowed items.
 */
export function filterMenuItems(role, items) {
    if (role === 'admin') return items
    return items.filter(item => isPathAllowed(role, item.to))
}

/**
 * Filter menu sections (groups of items) and remove empty sections.
 */
export function filterMenuSections(role, sections) {
    return sections
        .map(section => ({
            ...section,
            items: filterMenuItems(role, section.items),
        }))
        .filter(section => section.items.length > 0)
}

/**
 * Format role display name with emoji.
 */
export function getRoleDisplay(role) {
    const map = {
        admin: '🟣 Super Admin',
        staf_tu: '🟠 Staf TU',
        staf_keuangan: '🟢 Staf Keuangan',
        staf_perbankan: '🏦 Staf Perbankan',
        staf_infaq: '🕌 Staf Infaq',
        guru: '🔵 Guru',
    }
    return map[role] || 'Staff'
}
