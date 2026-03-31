/**
 * bluetoothHelper.js
 * Utilitas pusat untuk menangani komunikasi ESC/POS Bluetooth
 * dan manajemen printer default.
 */

const STORAGE_KEY = 'schoolapps_default_printer_id'
const SERVICE_UUIDS = [
    '000018f0-0000-1000-8000-00805f9b34fb', // Standard ESC/POS
    '0000ff00-0000-1000-8000-00805f9b34fb', // Common Thermal
    '49535343-fe7d-4ae5-8fa9-9fafd205e455'  // ISCC
]

export const bluetoothHelper = {
    _activeDevice: null,

    /**
     * Set active device di memory (hilang jika browser di refresh)
     */
    setActiveDevice(device) {
        this._activeDevice = device
        if (device && device.id) {
            this.setDefaultPrinterId(device.id)
        }
    },

    /**
     * Get active device dari memory
     */
    getActiveDevice() {
        return this._activeDevice
    },

    /**
     * Cek apakah Web Bluetooth didukung
     */
    isSupported() {
        return !!navigator.bluetooth
    },

    /**
     * Ambil ID printer default dari localStorage
     */
    getDefaultPrinterId() {
        return localStorage.getItem(STORAGE_KEY)
    },

    /**
     * Simpan ID printer sebagai default
     */
    setDefaultPrinterId(id) {
        if (id) localStorage.setItem(STORAGE_KEY, id)
        else localStorage.removeItem(STORAGE_KEY)
    },

    /**
     * Ambil daftar perangkat yang sudah pernah diizinkan (authorized)
     */
    async getAuthorizedDevices() {
        if (!this.isSupported() || !navigator.bluetooth.getDevices) return []
        try {
            return await navigator.bluetooth.getDevices()
        } catch (err) {
            console.error('Error getDevices:', err)
            return []
        }
    },

    /**
     * Cari perangkat baru via browser popup
     */
    async requestPrinter() {
        const device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: SERVICE_UUIDS
        })
        if (device) this.setActiveDevice(device)
        return device
    },

    /**
     * Hubungkan ke perangkat GATT dan cari writer characteristic
     */
    async connectAndGetWriter(device) {
        if (!device.gatt.connected) {
            await device.gatt.connect()
        }
        
        const services = await device.gatt.getPrimaryServices()
        let writer = null
        
        for (const service of services) {
            try {
                const characteristics = await service.getCharacteristics()
                writer = characteristics.find(c => c.properties.write || c.properties.writeWithoutResponse)
                if (writer) break
            } catch (e) {
                // Skip restricted/incompatible services
            }
        }
        
        if (!writer) throw new Error("Printer ini tidak mendukung fitur cetak (ESC/POS).")
        return writer
    },

    /**
     * Kirim data Uint8Array ke printer dalam bentuk chunk
     */
    async sendData(writer, data) {
        const chunkSize = 20
        for (let i = 0; i < data.length; i += chunkSize) {
            await writer.writeValue(data.slice(i, i + chunkSize))
        }
    }
}
