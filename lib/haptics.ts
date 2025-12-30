"use client";

/**
 * Triggers a haptic feedback vibration if supported.
 * Tries to mimic iOS Taptic Engine patterns using navigator.vibrate.
 */

type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'selection';

export function triggerHaptic(style: HapticStyle = 'light') {
    if (typeof window === 'undefined' || !window.navigator?.vibrate) return;

    switch (style) {
        case 'light':
            // Sharp, quick tap
            window.navigator.vibrate(20);
            break;
        case 'medium':
            // Standard tap
            window.navigator.vibrate(40);
            break;
        case 'heavy':
            // Firmer tap
            window.navigator.vibrate(60);
            break;
        case 'selection':
            // Very light tick
            window.navigator.vibrate(15);
            break;
        case 'success':
            // Double tap pattern
            window.navigator.vibrate([30, 50, 30]);
            break;
        case 'error':
            // Long buzz
            window.navigator.vibrate([50, 60, 50, 60, 50]);
            break;
    }
}
