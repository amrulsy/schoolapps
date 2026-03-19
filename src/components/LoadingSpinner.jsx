import React from 'react';
import { Loader2 } from 'lucide-react';
import './LoadingSpinner.css';

export default function LoadingSpinner({
    fullScreen = false,
    message = 'Memuat data...',
    size = 'default',
    transparent = false
}) {
    // Ukuran spinner: small, default, large
    const sizeClasses = {
        small: 'spinner-sm',
        default: 'spinner-md',
        large: 'spinner-lg'
    };

    const spinnerClass = sizeClasses[size] || sizeClasses.default;

    const content = (
        <div className="modern-spinner-container">
            <div className={`spinner-ring-wrapper ${spinnerClass}`}>
                <div className="spinner-ring-outer"></div>
                <div className="spinner-ring-inner"></div>
                <div className="spinner-center">
                    <div className="spinner-pulse"></div>
                    <Loader2 className="spinner-icon" />
                </div>
            </div>
            {message && <div className="spinner-message fade-in-up">{message}</div>}
        </div>
    );

    if (fullScreen) {
        return (
            <div className={`fullscreen-loader-overlay ${transparent ? 'bg-transparent' : 'bg-glass'}`}>
                {content}
            </div>
        );
    }

    return content;
}
