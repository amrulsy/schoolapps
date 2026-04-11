/**
 * Timezone Utility — WIB (Asia/Jakarta) helpers
 * Centralized timezone logic to avoid copy-pasting the Intl.DateTimeFormat pattern
 */

/**
 * Get current date in WIB as 'YYYY-MM-DD'
 * @returns {string} e.g. '2026-04-11'
 */
function getWIBDate() {
    const rawNow = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric', month: '2-digit', day: '2-digit', hour12: false
    });
    const parts = formatter.formatToParts(rawNow);
    const p = {};
    parts.forEach(part => p[part.type] = part.value);
    return `${p.year}-${p.month}-${p.day}`;
}

/**
 * Get current date+time in WIB as { date, time, dateTime }
 * @returns {{ date: string, time: string, dateTime: string }}
 *   date = 'YYYY-MM-DD', time = 'HH:MM:SS', dateTime = 'YYYY-MM-DD HH:MM:SS'
 */
function getWIBDateTime() {
    const rawNow = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });
    const parts = formatter.formatToParts(rawNow);
    const p = {};
    parts.forEach(part => p[part.type] = part.value);

    const date = `${p.year}-${p.month}-${p.day}`;
    const hr = p.hour === '24' ? '00' : p.hour;
    const time = `${hr}:${p.minute}:${p.second}`;
    return { date, time, dateTime: `${date} ${time}` };
}

/**
 * Get a Date object representing current WIB moment for comparison
 * @returns {Date}
 */
function getWIBNow() {
    const { date, time } = getWIBDateTime();
    return new Date(`${date}T${time}+07:00`);
}

/**
 * Format a WIB date string for display in Indonesian locale
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @returns {string} e.g. 'Jumat, 11 April 2026'
 */
function formatDateID(dateStr) {
    return new Date(dateStr).toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
}

/**
 * Validate a date string matches YYYY-MM-DD format
 * @param {string} dateStr
 * @returns {boolean}
 */
function isValidDateFormat(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return false;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;
    const d = new Date(dateStr);
    return !isNaN(d.getTime());
}

module.exports = {
    getWIBDate,
    getWIBDateTime,
    getWIBNow,
    formatDateID,
    isValidDateFormat
};
