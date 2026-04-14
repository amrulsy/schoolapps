@echo off
echo =======================================================
echo Memulai Proses Build untuk Server Hosting cPanel
echo =======================================================
echo.

echo [1/3] Menjalankan npm run build pada Frontend...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Build frontend gagal! Silakan cek kembali error di atas.
    pause
    exit /b %errorlevel%
)

echo [2/3] Memicu pembuatan file zip Frontend (frontend_cpanel.zip)...
del frontend_cpanel.zip 2>nul
powershell -Command "Compress-Archive -Path 'dist\*' -DestinationPath 'frontend_cpanel.zip' -Force"

echo [3/3] Memicu pembuatan file zip Backend (backend_cpanel.zip)...
del backend_cpanel.zip 2>nul
tar -a -c -f backend_cpanel.zip --exclude=node_modules --exclude=.git --exclude=.env --exclude=uploads --exclude=sessions --exclude=wa_session -C backend .

echo.
echo =======================================================
echo SELESAI! File zip telah berhasil dibuat.
echo -------------------------------------------------------
echo Silakan upload 2 file berikut ke Hosting (cPanel) Anda:
echo 1. frontend_cpanel.zip (Upload ke dalam public_html atau folder root website, lalu ekstrak)
echo 2. backend_cpanel.zip (Upload ke folder backend aplikasi Node.js, lalu ekstrak)
echo.
echo Catatan: 
echo - Jangan lupa "Run NPM Install" dari cPanel di Setup Node.js App.
echo - Jika menggunakan .env, pastikan variables sudah diset di cPanel.
echo =======================================================
pause
