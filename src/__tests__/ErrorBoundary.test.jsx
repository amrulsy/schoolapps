import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, test, expect, vi } from 'vitest'
import ErrorBoundary from '../components/ErrorBoundary'

// Component that purposely throws an error
const BuggyComponent = () => {
    throw new Error('Test Crash')
}

describe('ErrorBoundary', () => {
    test('renders children if there is no error', () => {
        render(
            <ErrorBoundary>
                <div data-testid="safe-child">Safe Content</div>
            </ErrorBoundary>
        )
        expect(screen.getByTestId('safe-child')).toBeDefined()
    })

    test('renders fallback UI when a child crashes', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => { })

        render(
            <ErrorBoundary>
                <BuggyComponent />
            </ErrorBoundary>
        )

        expect(screen.getByText(/Oops, Terjadi Kesalahan!/i)).toBeDefined()
        expect(screen.getByRole('button', { name: /Muat Ulang Halaman/i })).toBeDefined()

        spy.mockRestore()
    })

    test('refresh button calls window.location.reload', () => {
        const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => { })

        // Mock location.reload safely
        const originalLocation = window.location
        delete window.location
        window.location = { ...originalLocation, reload: vi.fn() }

        render(
            <ErrorBoundary>
                <BuggyComponent />
            </ErrorBoundary>
        )

        const btn = screen.getByRole('button', { name: /Muat Ulang Halaman/i })
        fireEvent.click(btn)

        expect(window.location.reload).toHaveBeenCalled()

        window.location = originalLocation
        spyConsole.mockRestore()
    })
})
