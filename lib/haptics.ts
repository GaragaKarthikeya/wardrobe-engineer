"use client";

/**
 * Simplified Haptic Feedback for iOS Safari
 * 
 * iOS Safari only supports ONE haptic type via the <input type="checkbox" switch> workaround.
 * This simplified version just provides a single consistent haptic for all interactions.
 */

// DOM elements for iOS haptic
let hapticLabel: HTMLLabelElement | null = null;
let hapticCheckbox: HTMLInputElement | null = null;
let isSetup = false;

function isIOS(): boolean {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function setupHaptic(): boolean {
    if (typeof document === 'undefined') return false;
    if (isSetup && hapticLabel) return true;

    const existing = document.getElementById('haptic-checkbox');
    if (existing) {
        hapticCheckbox = existing as HTMLInputElement;
        hapticLabel = document.getElementById('haptic-label') as HTMLLabelElement;
        isSetup = true;
        return true;
    }

    try {
        const container = document.createElement('div');
        container.style.cssText = 'position:fixed;top:-100px;left:-100px;width:1px;height:1px;overflow:hidden;pointer-events:none;opacity:0;';
        container.setAttribute('aria-hidden', 'true');

        hapticCheckbox = document.createElement('input');
        hapticCheckbox.type = 'checkbox';
        hapticCheckbox.id = 'haptic-checkbox';
        hapticCheckbox.setAttribute('switch', '');

        hapticLabel = document.createElement('label');
        hapticLabel.htmlFor = 'haptic-checkbox';
        hapticLabel.id = 'haptic-label';
        hapticLabel.textContent = ' ';

        container.appendChild(hapticCheckbox);
        container.appendChild(hapticLabel);
        document.body.appendChild(container);

        isSetup = true;
        return true;
    } catch {
        return false;
    }
}

/**
 * Trigger a haptic vibration
 * On iOS: Uses switch checkbox workaround (single type)
 * On Android: Uses navigator.vibrate
 */
export function triggerHaptic(): void {
    if (typeof window === 'undefined') return;

    if (isIOS()) {
        if (!hapticLabel) setupHaptic();
        try {
            hapticLabel?.click();
        } catch {
            // Silent fail
        }
    } else {
        try {
            if (typeof navigator?.vibrate === 'function') {
                navigator.vibrate(15);
            }
        } catch {
            // Silent fail
        }
    }
}

/**
 * Initialize haptics - call on first user interaction
 */
export function prepareHaptics(): void {
    if (isIOS()) {
        setupHaptic();
        hapticLabel?.click();
    }
}

export function hapticsAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    if (isIOS()) return true;
    if (typeof navigator?.vibrate === 'function') return true;
    return false;
}

export default { trigger: triggerHaptic, prepare: prepareHaptics, available: hapticsAvailable };
