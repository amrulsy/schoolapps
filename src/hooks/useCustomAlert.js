import { useCallback, useMemo } from 'react'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import { useApp } from '../context/AppContext'

const MySwal = withReactContent(Swal)

export function useCustomAlert() {
    const { theme } = useApp()

    // Base config that respects the current theme
    const baseConfig = useMemo(() => ({
        background: theme === 'dark' ? '#1f2937' : '#ffffff',
        color: theme === 'dark' ? '#ffffff' : '#111827',
        customClass: {
            confirmButton: 'btn btn-primary',
            cancelButton: 'btn btn-ghost',
            popup: 'swal-custom-popup'
        },
        buttonsStyling: false
    }), [theme])

    const confirmDelete = useCallback(async (title, text) => {
        const result = await MySwal.fire({
            ...baseConfig,
            title: title || 'Apakah Anda Yakin?',
            text: text || 'Data ini tidak dapat dikembalikan!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Hapus',
            cancelButtonText: 'Batal',
            reverseButtons: true
        })
        return result.isConfirmed
    }, [baseConfig])

    const showError = useCallback((title, text) => {
        MySwal.fire({
            ...baseConfig,
            title: title || 'Error',
            text: text || 'Terjadi kesalahan sistem',
            icon: 'error',
            confirmButtonText: 'Tutup'
        })
    }, [baseConfig])

    const showSuccess = useCallback((title, text) => {
        MySwal.fire({
            ...baseConfig,
            title: title || 'Berhasil',
            text: text || 'Aksi berhasil dilakukan',
            icon: 'success',
            confirmButtonText: 'Mantap'
        })
    }, [baseConfig])

    return { confirmDelete, showError, showSuccess, MySwal }
}
