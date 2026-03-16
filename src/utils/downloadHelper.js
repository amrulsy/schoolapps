export async function downloadFile(blob, filename) {
    // Gunakan File System Access API jika tersedia (bypasses masalah WebView/blob: uuid filename)
    if (window.showSaveFilePicker) {
        try {
            const ext = filename.split('.').pop().toLowerCase();
            let types = [];
            if (ext === 'xlsx') {
                types = [{
                    description: 'Excel File',
                    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
                }];
            } else if (ext === 'pdf') {
                types = [{
                    description: 'PDF Document',
                    accept: { 'application/pdf': ['.pdf'] },
                }];
            } else if (ext === 'csv') {
                types = [{
                    description: 'CSV File',
                    accept: { 'text/csv': ['.csv'] },
                }];
            }

            const handle = await window.showSaveFilePicker({
                suggestedName: filename,
                types,
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            return;
        } catch (err) {
            // Jika user cancel dialog save, "AbortError" dilempar. Tidak perlu fallback.
            if (err.name === 'AbortError') return;
            console.error('showSaveFilePicker error:', err);
            // Lanjut ke fallback jika gagal bukan karena dicancel
        }
    }

    // Fallback standard HTML5 a.download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}
