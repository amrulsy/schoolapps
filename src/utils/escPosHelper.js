/**
 * ESC/POS Command Helper for Web Bluetooth Thermal Printing
 */
export class EscPosEncoder {
    constructor() {
        this.buffer = []
    }

    // Initialize printer
    initialize() {
        this.buffer.push(0x1B, 0x40)
        return this
    }

    // Set alignment: 0=Left, 1=Center, 2=Right
    align(value) {
        this.buffer.push(0x1B, 0x61, value)
        return this
    }

    // Set text size: 0=Normal, 1=Double Height, 2=Double Width, 3=Large
    size(value) {
        let n = 0
        if (value === 1) n = 0x01 // Double height
        if (value === 2) n = 0x10 // Double width
        if (value === 3) n = 0x11 // Both
        this.buffer.push(0x1B, 0x21, n)
        return this
    }

    // Toggle bold
    bold(on = true) {
        this.buffer.push(0x1B, 0x45, on ? 0x01 : 0x00)
        return this
    }

    // Add text
    text(content) {
        const bytes = new TextEncoder().encode(content)
        this.buffer.push(...bytes)
        return this
    }

    // Add text with newline
    line(content = '') {
        this.text(content + '\n')
        return this
    }

    // Add multiple newlines
    feed(n = 1) {
        for (let i = 0; i < n; i++) {
            this.buffer.push(0x0A)
        }
        return this
    }

    // Cut paper (if supported)
    cut() {
        this.buffer.push(0x1D, 0x56, 0x00)
        return this
    }

    // Get final Uint8Array
    encode() {
        return new Uint8Array(this.buffer)
    }

    // Helper to format currency
    static formatRp(val) {
        return 'Rp ' + val.toLocaleString('id-ID')
    }
}

/**
 * Example Bluetooth Print Function
 */
export async function printToBluetooth(device, data) {
    if (!device || !device.gatt.connected) {
        await device.gatt.connect()
    }

    const service = await device.gatt.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb')
    const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb')

    // Split data into chunks (Bluetooth has MTU limits, usually ~20-512 bytes)
    const chunkSize = 512
    for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize)
        await characteristic.writeValue(chunk)
    }
}
