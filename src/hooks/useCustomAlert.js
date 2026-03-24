import { useCallback, useMemo } from 'react'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import { useApp } from '../context/AppContext'

const MySwal = withReactContent(Swal)

export function useCustomAlert() {
    const { theme } = useApp()

    // Base config that respects the current theme
    const baseConfig = useMemo(() => ({
        background: theme === 'dark' ? '#1e293b' : '#ffffff',
        color: theme === 'dark' ? '#f8fafc' : '#0f172a',
        customClass: {
            confirmButton: 'btn btn-primary px-4 py-2 rounded-xl fw-bold mx-2',
            cancelButton: 'btn btn-outline-secondary px-4 py-2 rounded-xl fw-bold mx-2',
            popup: 'premium-swal-popup',
            title: 'fw-black tracking-tight',
            htmlContainer: 'fw-medium text-muted'
        },
        buttonsStyling: false,
        showClass: {
            popup: 'animate__animated animate__fadeInUp animate__faster'
        },
        hideClass: {
            popup: 'animate__animated animate__fadeOutDown animate__faster'
        }
    }), [theme])

    const confirmAction = useCallback(async ({ title, text, confirmText, cancelText, icon = 'question' }) => {
        const result = await MySwal.fire({
            ...baseConfig,
            title: title || 'Konfirmasi Tindakan',
            text: text || 'Apakah Anda yakin ingin melanjutkan?',
            icon: icon,
            showCancelButton: true,
            confirmButtonText: confirmText || 'Ya, Lanjutkan',
            cancelButtonText: cancelText || 'Batal',
            reverseButtons: true,
            backdrop: `rgba(15, 23, 42, 0.4)`,
            padding: '2rem'
        })
        return result.isConfirmed
    }, [baseConfig])

    const confirmDelete = useCallback(async (title, text) => {
        return confirmAction({
            title: title || 'Hapus Data?',
            text: text || 'Data yang dihapus tidak dapat dikembalikan.',
            confirmText: 'Ya, Hapus',
            icon: 'warning'
        })
    }, [confirmAction])

    const showError = useCallback((title, text) => {
        MySwal.fire({
            ...baseConfig,
            title: title || 'Terjadi Kesalahan',
            text: text || 'Gagal memproses permintaan Anda.',
            icon: 'error',
            confirmButtonText: 'Tutup'
        })
    }, [baseConfig])

    const showSuccess = useCallback((title, text) => {
        MySwal.fire({
            ...baseConfig,
            title: title || 'Berhasil!',
            text: text || 'Aksi telah sukses dilakukan.',
            icon: 'success',
            confirmButtonText: 'Selesai',
            timer: 2000,
            timerProgressBar: true
        })
    }, [baseConfig])

    return { confirmAction, confirmDelete, showError, showSuccess, MySwal }
}
