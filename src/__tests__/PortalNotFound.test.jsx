import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, test, expect, vi } from 'vitest'
import { HelmetProvider } from 'react-helmet-async'

import PortalApp from '../portal/PortalApp'
import PortalNotFound from '../portal/pages/PortalNotFound'

// Mock context and dependencies to prevent rendering issues in PortalApp
vi.mock('../portal/context/PortalContext', () => ({
    PortalProvider: ({ children }) => <>{children}</>,
    usePortal: () => ({
        fetchPublic: vi.fn().mockResolvedValue([]),
        postPublic: vi.fn().mockResolvedValue({})
    })
}))

// Mock matchMedia for interactive components that might rely on it
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
})

describe('Portal 404 Error Handling', () => {
    test('Should display PortalNotFound component when navigating to an invalid route', async () => {
        render(
            <HelmetProvider>
                <MemoryRouter initialEntries={['/invalid-route-that-does-not-exist']}>
                    <PortalApp />
                </MemoryRouter>
            </HelmetProvider>
        )

        await waitFor(() => {
            // Check for the 404 header and description text
            expect(screen.getByRole('heading', { level: 1, name: /404/i })).toBeDefined()
            expect(screen.getByText(/Halaman Tidak Ditemukan/i)).toBeDefined()
            expect(screen.getByText(/Maaf, halaman yang Anda tuju mungkin telah dipindahkan/i)).toBeDefined()
        }, { timeout: 3000 })
    })

    test('PortalNotFound isolated component should render interactive buttons', () => {
        render(
            <HelmetProvider>
                <MemoryRouter>
                    <PortalNotFound />
                </MemoryRouter>
            </HelmetProvider>
        )

        // Verify the navigation buttons exist
        expect(screen.getByRole('button', { name: /Kembali/i })).toBeDefined()
        expect(screen.getByRole('link', { name: /Halaman Utama/i })).toBeDefined()

        // Verify link points to the home page
        const homeLink = screen.getByRole('link', { name: /Halaman Utama/i })
        expect(homeLink.getAttribute('href')).toBe('/')
    })
})
