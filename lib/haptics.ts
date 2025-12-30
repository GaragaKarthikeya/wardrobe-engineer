"use client";

/**
 * iOS Safari Haptic Feedback System
 * 
 * IMPORTANT: iOS Safari does NOT support navigator.vibrate() API.
 * 
 * As of iOS 18+, WebKit introduced haptic feedback for <input type="checkbox" switch> elements.
 * This is the ONLY way to trigger haptic feedback in Safari PWAs.
 * 
 * How it works:
 * 1. Create a hidden <input type="checkbox" switch> with a <label>
 * 2. Programmatically click the LABEL (not the input) to trigger haptic
 * 3. The checkbox toggle triggers the native iOS switch haptic
 * 
 * For Android, we fall back to navigator.vibrate()
 */

type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'selection' | 'warning' | 'impact';

// Hidden haptic trigger elements
let hapticCheckbox: HTMLInputElement | null = null;
let hapticLabel: HTMLLabelElement | null = null;
let isInitialized = false;

// iOS detection
function isIOS(): boolean {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/**
 * Initialize the hidden haptic trigger elements for iOS
 * Must be called before any haptic can work on iOS
 */
function initializeHapticElements(): void {
    if (typeof document === 'undefined') return;
    if (isInitialized) return;

    try {
        // Create container
        const container = document.createElement('div');
        container.id = 'haptic-trigger-container';
        container.setAttribute('aria-hidden', 'true');
        container.style.cssText = `
            position: fixed !important;
            left: -9999px !important;
            top: -9999px !important;
            width: 1px !important;
            height: 1px !important;
            overflow: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
            z-index: -9999 !important;
        `;

        // Create the switch checkbox - iOS 18+ syntax
        hapticCheckbox = document.createElement('input');
        hapticCheckbox.type = 'checkbox';
        hapticCheckbox.id = 'haptic-switch-trigger';
        hapticCheckbox.setAttribute('switch', ''); // The key attribute for iOS haptic
        hapticCheckbox.style.cssText = `
            position: absolute !important;
            opacity: 0 !important;
            pointer-events: none !important;
        `;

        // Create label that we'll click to trigger haptic
        hapticLabel = document.createElement('label');
        hapticLabel.htmlFor = 'haptic-switch-trigger';
        hapticLabel.id = 'haptic-label-trigger';
        hapticLabel.style.cssText = `
            position: absolute !important;
            width: 1px !important;
            height: 1px !important;
            opacity: 0 !important;
        `;
        hapticLabel.textContent = '';

        container.appendChild(hapticCheckbox);
        container.appendChild(hapticLabel);
        document.body.appendChild(container);

        isInitialized = true;
        console.log('[Haptics] iOS haptic trigger initialized');
    } catch (e) {
        console.warn('[Haptics] Failed to initialize haptic elements:', e);
    }
}

/**
 * Trigger iOS haptic by clicking the hidden switch label
 */
function triggerIOSSwitchHaptic(): void {
    if (!hapticLabel || !hapticCheckbox) {
        initializeHapticElements();
    }

    if (hapticLabel) {
        try {
            // Click the label to trigger the switch haptic
            hapticLabel.click();
        } catch (e) {
            // Silent fail
        }
    }
}

/**
 * Android vibration patterns (in milliseconds)
 */
const ANDROID_PATTERNS: Record<HapticStyle, number | number[]> = {
    light: 10,
    medium: 25,
    heavy: 50,
    selection: 8,
    success: [15, 40, 15],
    error: [40, 30, 40, 30, 40],
    warning: [30, 50, 30],
    impact: 75,
};

/**
 * iOS haptic repeat counts for different styles
 * Since we only have one haptic type (switch toggle), we repeat for intensity
 */
const IOS_REPEAT: Record<HapticStyle, { count: number; delay: number }> = {
    light: { count: 1, delay: 0 },
    medium: { count: 1, delay: 0 },
    heavy: { count: 2, delay: 50 },
    selection: { count: 1, delay: 0 },
    success: { count: 2, delay: 100 },
    error: { count: 3, delay: 80 },
    warning: { count: 2, delay: 100 },
    impact: { count: 2, delay: 40 },
};

/**
 * Main haptic trigger function
 */
export function triggerHaptic(style: HapticStyle = 'light'): void {
    if (typeof window === 'undefined') return;

    if (isIOS()) {
        // iOS - use the switch checkbox workaround
        const config = IOS_REPEAT[style];

        // Initial haptic
        triggerIOSSwitchHaptic();

        // Additional haptics for stronger feedback
        for (let i = 1; i < config.count; i++) {
            setTimeout(() => {
                triggerIOSSwitchHaptic();
            }, config.delay * i);
        }
    } else {
        // Android/other - use vibration API
        try {
            if (typeof navigator.vibrate === 'function') {
                navigator.vibrate(ANDROID_PATTERNS[style]);
            }
        } catch (e) {
            // Silent fail
        }
    }
}

/**
 * Prepare haptics - MUST be called on first user interaction for iOS
 * This initializes the hidden switch elements
 */
export function prepareHaptics(): void {
    if (isIOS()) {
        initializeHapticElements();
    }
}

/**
 * Check if haptics are available
 */
export function hapticsAvailable(): boolean {
    if (typeof window === 'undefined') return false;

    // iOS 18+ with switch element support
    if (isIOS()) return true;

    // Android with vibration API
    if (typeof navigator.vibrate === 'function') return true;

    return false;
}

/**
 * Convenience functions for common haptic patterns
 */
export const Haptics = {
    light: () => triggerHaptic('light'),
    medium: () => triggerHaptic('medium'),
    heavy: () => triggerHaptic('heavy'),
    selection: () => triggerHaptic('selection'),
    success: () => triggerHaptic('success'),
    error: () => triggerHaptic('error'),
    warning: () => triggerHaptic('warning'),
    impact: () => triggerHaptic('impact'),
    prepare: prepareHaptics,
    available: hapticsAvailable,
};

export default Haptics;
