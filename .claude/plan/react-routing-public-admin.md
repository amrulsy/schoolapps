# Implementation Plan: React Router — Public & Admin URL Groups

## Requirement
Mengatur navigasi React + Vite dengan dua kelompok URL:
- **Root (`/`)**: Halaman publik — Beranda (`/`), Berita (`/berita`), Tentang (`/tentang`)
- **Admin (`/admin/...`)**: Halaman admin — Dashboard (`/admin`), Input Data (`/admin/input-data`), Pengaturan (`/admin/pengaturan`)

---

## Task Type
- [x] Frontend (React Router)

---

## Technical Solution

### Pola Arsitektur: Nested Routes + Layout Components

Gunakan **Nested Routes** dari React Router v6 dengan **Layout Components** terpisah:

```
BrowserRouter
├── PublicLayout (Navbar publik)
│   ├── / → BerandaPage
│   ├── /berita → BeritaPage
│   └── /tentang → TentangPage
│
└── AdminLayout (Sidebar + Header admin)
    ├── /admin → DashboardPage
    ├── /admin/input-data → InputDataPage
    └── /admin/pengaturan → PengaturanPage
```

**Mengapa layout-based nested routes?**
- Satu definisi layout, berlaku untuk semua child routes
- URL bersih sesuai permintaan (`/berita`, `/admin/input-data`)
- Mudah tambah route baru tanpa mengubah App.jsx
- Auth guard bisa diterapkan di level `AdminLayout` saja

---

## Implementation Steps

### Step 1 — Install react-router-dom (jika belum ada)

```bash
npm install react-router-dom
```

Cek `package.json`:
```json
{
  "dependencies": {
    "react-router-dom": "^6.x.x"
  }
}
```

---

### Step 2 — Buat Struktur Folder

```
src/
├── layouts/
│   ├── PublicLayout.jsx      ← Navbar + <Outlet />
│   └── AdminLayout.jsx       ← Sidebar + Header + Auth guard + <Outlet />
│
├── pages/
│   ├── public/
│   │   ├── BerandaPage.jsx
│   │   ├── BeritaPage.jsx
│   │   └── TentangPage.jsx
│   │
│   └── admin/
│       ├── DashboardPage.jsx
│       ├── InputDataPage.jsx
│       └── PengaturanPage.jsx
│
├── App.jsx
└── main.jsx
```

---

### Step 3 — main.jsx: Wrap dengan BrowserRouter

```jsx
// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
```

---

### Step 4 — PublicLayout.jsx

```jsx
// src/layouts/PublicLayout.jsx
import { Outlet, NavLink } from 'react-router-dom'

export default function PublicLayout() {
  return (
    <div>
      {/* Navbar Publik */}
      <nav style={{ padding: '16px', background: '#f8f9fa', display: 'flex', gap: 16 }}>
        <NavLink to="/">Beranda</NavLink>
        <NavLink to="/berita">Berita</NavLink>
        <NavLink to="/tentang">Tentang</NavLink>
        <NavLink to="/admin" style={{ marginLeft: 'auto' }}>Admin →</NavLink>
      </nav>

      {/* Konten halaman yang aktif */}
      <main style={{ padding: 24 }}>
        <Outlet />
      </main>
    </div>
  )
}
```

> **`<Outlet />`** adalah tempat dimana child route akan dirender.
> `<NavLink>` secara otomatis menambahkan class `active` pada link yang sedang aktif.

---

### Step 5 — AdminLayout.jsx (dengan Auth Guard)

```jsx
// src/layouts/AdminLayout.jsx
import { Outlet, NavLink, Navigate } from 'react-router-dom'

export default function AdminLayout() {
  // Auth Guard: cek apakah sudah login
  const isLoggedIn = !!localStorage.getItem('token')
  if (!isLoggedIn) {
    return <Navigate to="/" replace />  // redirect ke halaman publik
  }

  return (
    <div style={{ display: 'flex' }}>
      {/* Sidebar Admin */}
      <aside style={{ width: 240, minHeight: '100vh', background: '#1e293b', padding: 16 }}>
        <h3 style={{ color: 'white', marginBottom: 16 }}>Admin Panel</h3>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <NavLink to="/admin" end style={navStyle}>Dashboard</NavLink>
          <NavLink to="/admin/input-data" style={navStyle}>Input Data</NavLink>
          <NavLink to="/admin/pengaturan" style={navStyle}>Pengaturan</NavLink>
        </nav>
      </aside>

      {/* Konten utama */}
      <main style={{ flex: 1, padding: 24 }}>
        <Outlet />
      </main>
    </div>
  )
}

const navStyle = ({ isActive }) => ({
  color: isActive ? '#818cf8' : 'white',
  textDecoration: 'none',
  padding: '8px 12px',
  borderRadius: 6,
  background: isActive ? 'rgba(129,140,248,0.15)' : 'transparent'
})
```

> **`end` prop** pada `NavLink to="/admin" end` mencegah link Dashboard selalu aktif
> karena `/admin/input-data` juga dimulai dengan `/admin`.

---

### Step 6 — App.jsx: Konfigurasi Route

```jsx
// src/App.jsx
import { Routes, Route } from 'react-router-dom'

// Layouts
import PublicLayout from './layouts/PublicLayout'
import AdminLayout from './layouts/AdminLayout'

// Public Pages
import BerandaPage from './pages/public/BerandaPage'
import BeritaPage from './pages/public/BeritaPage'
import TentangPage from './pages/public/TentangPage'

// Admin Pages
import DashboardPage from './pages/admin/DashboardPage'
import InputDataPage from './pages/admin/InputDataPage'
import PengaturanPage from './pages/admin/PengaturanPage'

export default function App() {
  return (
    <Routes>
      {/* ======= KELOMPOK PUBLIK (/) ======= */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<BerandaPage />} />
        <Route path="/berita" element={<BeritaPage />} />
        <Route path="/tentang" element={<TentangPage />} />
      </Route>

      {/* ======= KELOMPOK ADMIN (/admin/...) ======= */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />        {/* /admin */}
        <Route path="input-data" element={<InputDataPage />} />   {/* /admin/input-data */}
        <Route path="pengaturan" element={<PengaturanPage />} />  {/* /admin/pengaturan */}
      </Route>
    </Routes>
  )
}
```

> **`<Route index>`** adalah shorthand untuk route tanpa path yang menjadi default
> child dari parent — merender di `/admin` persis.

---

### Step 7 — Buat Halaman (Contoh Minimal)

```jsx
// src/pages/public/BerandaPage.jsx
export default function BerandaPage() {
  return <h1>🏠 Beranda</h1>
}

// src/pages/public/BeritaPage.jsx
export default function BeritaPage() {
  return <h1>📰 Berita</h1>
}

// src/pages/public/TentangPage.jsx
export default function TentangPage() {
  return <h1>ℹ️ Tentang Kami</h1>
}

// src/pages/admin/DashboardPage.jsx
export default function DashboardPage() {
  return <h1>📊 Dashboard Admin</h1>
}

// src/pages/admin/InputDataPage.jsx
export default function InputDataPage() {
  return <h1>✏️ Input Data</h1>
}

// src/pages/admin/PengaturanPage.jsx
export default function PengaturanPage() {
  return <h1>⚙️ Pengaturan</h1>
}
```

---

### Step 8 — (Opsional) Lazy Loading untuk Performance

```jsx
// src/App.jsx
import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'

const PublicLayout  = lazy(() => import('./layouts/PublicLayout'))
const AdminLayout   = lazy(() => import('./layouts/AdminLayout'))
const BerandaPage   = lazy(() => import('./pages/public/BerandaPage'))
const BeritaPage    = lazy(() => import('./pages/public/BeritaPage'))
const TentangPage   = lazy(() => import('./pages/public/TentangPage'))
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'))
const InputDataPage = lazy(() => import('./pages/admin/InputDataPage'))
const PengaturanPage = lazy(() => import('./pages/admin/PengaturanPage'))

export default function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<BerandaPage />} />
          <Route path="/berita" element={<BeritaPage />} />
          <Route path="/tentang" element={<TentangPage />} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="input-data" element={<InputDataPage />} />
          <Route path="pengaturan" element={<PengaturanPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
```

---

## Key Files

| File | Operasi | Keterangan |
|------|---------|------------|
| `src/main.jsx` | Modify | Wrap dengan `BrowserRouter` |
| `src/App.jsx` | Rewrite | Konfigurasi semua Routes |
| `src/layouts/PublicLayout.jsx` | Create | Navbar publik + `<Outlet />` |
| `src/layouts/AdminLayout.jsx` | Create | Sidebar admin + auth guard + `<Outlet />` |
| `src/pages/public/BerandaPage.jsx` | Create | Halaman Beranda |
| `src/pages/public/BeritaPage.jsx` | Create | Halaman Berita |
| `src/pages/public/TentangPage.jsx` | Create | Halaman Tentang |
| `src/pages/admin/DashboardPage.jsx` | Create | Dashboard admin |
| `src/pages/admin/InputDataPage.jsx` | Create | Halaman input data |
| `src/pages/admin/PengaturanPage.jsx` | Create | Pengaturan admin |

---

## URL Mapping Hasil Akhir

| URL | Komponen | Layout |
|-----|----------|--------|
| `http://localhost:5173/` | `BerandaPage` | `PublicLayout` |
| `http://localhost:5173/berita` | `BeritaPage` | `PublicLayout` |
| `http://localhost:5173/tentang` | `TentangPage` | `PublicLayout` |
| `http://localhost:5173/admin` | `DashboardPage` | `AdminLayout` |
| `http://localhost:5173/admin/input-data` | `InputDataPage` | `AdminLayout` |
| `http://localhost:5173/admin/pengaturan` | `PengaturanPage` | `AdminLayout` |

---

## Konsep Kunci React Router v6

| Konsep | Penjelasan |
|--------|-----------|
| `<Routes>` | Container semua Route, hanya merender route yang cocok |
| `<Route element={<Layout />}>` | Layout route — tidak punya path sendiri, hanya menyediakan wrapper |
| `<Route path="/admin" element={<AdminLayout />}>` | Parent route dengan path prefix |
| `<Route index>` | Default child route (merender di path parent persis) |
| `<Outlet />` | Placeholder di dalam layout dimana child routes dirender |
| `<NavLink>` | Link dengan class `active` otomatis saat URL cocok |
| `<Navigate to="/" replace>` | Redirect programatik (dipakai untuk auth guard) |

---

## Risks and Mitigation

| Risiko | Mitigasi |
|--------|----------|
| `NavLink to="/admin"` selalu aktif di semua `/admin/*` | Gunakan prop `end` pada link Dashboard |
| Auth guard terlewati dengan akses URL langsung | Selalu cek token di `AdminLayout`, bukan hanya di komponen halaman |
| Vite dev server 404 saat refresh di URL seperti `/berita` | Tambahkan `historyApiFallback` di `vite.config.js` atau konfigurasi server |
| Bundle besar karena semua halaman dimuat sekaligus | Gunakan `lazy()` + `<Suspense>` (Step 8) |

**Vite config untuk SPA fallback (hindari 404 saat refresh):**
```js
// vite.config.js
export default {
  server: {
    historyApiFallback: true   // dev server
  }
}
```

---

## SESSION_ID
- CODEX_SESSION: N/A (multi-model tools not available)
- GEMINI_SESSION: N/A (multi-model tools not available)
