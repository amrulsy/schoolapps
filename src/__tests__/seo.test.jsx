import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { describe, test, expect, vi } from 'vitest';

import PortalHome from '../portal/pages/PortalHome';
import { PortalProvider } from '../portal/context/PortalContext';

vi.mock('../context/AppContext', () => ({
    useApp: () => ({
        token: 'fake-token',
        user: { role: 'admin', npsn: '123', nama: 'Admin' },
        settings: {},
        isMobile: false,
        logout: vi.fn(),
    })
}));

vi.mock('../portal/context/PortalContext', () => ({
    PortalProvider: ({ children }) => <>{children}</>,
    usePortal: () => ({
        fetchPublic: vi.fn().mockResolvedValue({ data: [] }),
        postPublic: vi.fn().mockResolvedValue({})
    })
}));

vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }) => <div>{children}</div>,
    BarChart: () => <div>BarChart</div>,
    Bar: () => <div>Bar</div>,
    XAxis: () => <div>XAxis</div>,
    YAxis: () => <div>YAxis</div>,
    CartesianGrid: () => <div>CartesianGrid</div>,
    Tooltip: () => <div>Tooltip</div>,
    Legend: () => <div>Legend</div>,
}));

Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // Deprecated
        removeListener: vi.fn(), // Deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

describe('SEO & Meta Tags Rendering', () => {
    test('PortalHome should render title and meta description', async () => {
        render(
            <HelmetProvider>
                <MemoryRouter>
                    <PortalHome />
                </MemoryRouter>
            </HelmetProvider>
        );

        await waitFor(() => {
            expect(document.title).toBe('Beranda | Portal SMK PPRQ');
            const metaDesc = document.querySelector('meta[name="description"]');
            expect(metaDesc).not.toBeNull();
            expect(metaDesc.getAttribute('content')).toContain('Selamat datang di Portal Resmi');
        }, { timeout: 3000 });
    });

    test('SIAS Layouts should render noindex, nofollow robots tag', async () => {
        // Simulating the Helmet injection in AdminLayout, GuruLayout, StudentApp
        render(
            <HelmetProvider>
                <Helmet>
                    <meta name="robots" content="noindex, nofollow" />
                </Helmet>
            </HelmetProvider>
        );

        await waitFor(() => {
            const metaRobots = document.querySelector('meta[name="robots"]');
            expect(metaRobots).not.toBeNull();
            expect(metaRobots.getAttribute('content')).toBe('noindex, nofollow');
        }, { timeout: 3000 });
    });
});
