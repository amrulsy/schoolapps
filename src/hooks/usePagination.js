import { useState, useMemo } from 'react'

/**
 * Reusable pagination hook.
 *
 * @param {Array}  items    - The full (already-filtered) array to paginate
 * @param {number} perPage  - Items per page (default 10)
 * @returns {{ page, setPage, totalPages, paginated, resetPage }}
 */
export function usePagination(items, perPage = 10) {
    const [page, setPage] = useState(1)

    const totalPages = Math.max(1, Math.ceil(items.length / perPage))

    const paginated = useMemo(
        () => items.slice((page - 1) * perPage, page * perPage),
        [items, page, perPage]
    )

    const resetPage = () => setPage(1)

    return { page, setPage, totalPages, paginated, resetPage, perPage }
}
