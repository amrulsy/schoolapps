import React from 'react'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { describe, test, expect, beforeEach } from 'vitest'
import OfflineBanner from '../components/OfflineBanner'

describe('OfflineBanner', () => {
    beforeEach(() => {
        // Default to online
        Object.defineProperty(navigator, 'onLine', {
            configurable: true,
            value: true
        })
    })

    test('does not render when online', () => {
        const { container } = render(<OfflineBanner />)
        expect(container.firstChild).toBeNull()
    })

    test('renders when offline event fires', () => {
        render(<OfflineBanner />)

        act(() => {
            window.dispatchEvent(new Event('offline'))
        })

        const bannerText = screen.getByText(/Anda sedang offline/i)
        expect(bannerText).toBeDefined()
    })

    test('disappears when online event fires', () => {
        Object.defineProperty(navigator, 'onLine', {
            configurable: true,
            value: false
        })

        const { container } = render(<OfflineBanner />)
        expect(screen.getByText(/Anda sedang offline/i)).toBeDefined()

        act(() => {
            window.dispatchEvent(new Event('online'))
        })

        expect(container.firstChild).toBeNull()
    })

    test('dismiss button hides the banner even when offline', () => {
        Object.defineProperty(navigator, 'onLine', {
            configurable: true,
            value: false
        })

        const { container } = render(<OfflineBanner />)

        const dismissBtn = screen.getByRole('button')
        fireEvent.click(dismissBtn)

        expect(container.firstChild).toBeNull()
    })
})
