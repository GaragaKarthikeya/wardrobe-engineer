"use client";

/**
 * iOS Safari Haptic Feedback System - Simplified & Correct
 * 
 * REALITY CHECK: iOS Safari has SEVERE limitations:
 * - navigator.vibrate() is NOT supported
 * - AudioContext tricks do NOT trigger haptics
 * - ONLY method: <input type="checkbox" switch> label click (iOS 18+)
 * - ONLY ONE haptic intensity exists (light switch toggle)
 * - Programmatic triggers ONLY work if called from real user gesture
 * 
 * Strategy:
 * - Use single haptic type, vary only repetition count
 * - Ensure haptic trigger is SYNCHRONOUS from user gesture
 * - For Android, use navigator.vibrate() normally
 */

type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'selection' | 'warning' | 'impact';

// DOM elements for iOS haptic trick
let hapticLabel: HTMLLabelElement | null = null;
let hapticCheckbox: HTMLInputElement | null = null;
let isSetup = false;

/**
 * Detect iOS (iPhone, iPad, iPod)
 */
function isIOS(): boolean {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;

    // Check for iOS devices
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);

    // Check for iPad on iOS 13+ (reports as MacIntel but has touch)
    const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;

    return isIOSDevice || isIPadOS;
}

/**
 * Setup the hidden switch checkbox elements
 * This creates the iOS haptic trigger mechanism
 */
function setupHapticElements(): boolean {
    if (typeof document === 'undefined') return false;
    if (isSetup && hapticLabel && hapticCheckbox) return true;

    try {
        // Check if already exists
        const existing = document.getElementById('ios-haptic-checkbox');
        if (existing) {
            hapticCheckbox = existing as HTMLInputElement;
            hapticLabel = document.getElementById('ios-haptic-label') as HTMLLabelElement;
            isSetup = true;
            return true;
        }

        // Create hidden container
        const container = document.createElement('div');
        container.style.cssText = 'position:fixed;top:-100px;left:-100px;width:1px;height:1px;overflow:hidden;pointer-events:none;opacity:0;';
        container.setAttribute('aria-hidden', 'true');

        // Create the switch checkbox (iOS 18+ feature)
        hapticCheckbox = document.createElement('input');
        hapticCheckbox.type = 'checkbox';
        hapticCheckbox.id = 'ios-haptic-checkbox';
        hapticCheckbox.setAttribute('switch', ''); // Key iOS 18 attribute!

        // Create label (clicking this triggers the haptic)
        hapticLabel = document.createElement('label');
        hapticLabel.htmlFor = 'ios-haptic-checkbox';
        hapticLabel.id = 'ios-haptic-label';
        hapticLabel.textContent = ' ';

        container.appendChild(hapticCheckbox);
        container.appendChild(hapticLabel);
        document.body.appendChild(container);

        isSetup = true;
        return true;
    } catch (e) {
        console.warn('[Haptics] Setup failed:', e);
        return false;
    }
}

/**
 * Fire the iOS haptic (single pulse)
 * MUST be called synchronously from a user gesture!
 */
function fireIOSHaptic(): void {
    if (!hapticLabel) {
        if (!setupHapticElements()) return;
    }

    try {
        hapticLabel?.click();
    } catch (e) {
        // Silent fail
    }
}

/**
 * Fire Android haptic
 */
function fireAndroidHaptic(pattern: number | number[]): void {
    try {
        if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
            navigator.vibrate(pattern);
        }
    } catch (e) {
        // Silent fail
    }
}

/**
 * Android vibration patterns (milliseconds)
 */
const ANDROID_PATTERNS: Record<HapticStyle, number | number[]> = {
    light: 10,
    selection: 8,
    medium: 25,
    heavy: 45,
    success: [20, 60, 20],
    error: [30, 40, 30, 40, 30],
    warning: [25, 50, 25],
    impact: 60,
};

/**
 * iOS haptic repetition (since only 1 intensity exists)
 * More taps = perceived stronger haptic
 */
const IOS_TAPS: Record<HapticStyle, number> = {
    light: 1,
    selection: 1,
    medium: 1,
    heavy: 2,
    success: 2,
    error: 3,
    warning: 2,
    impact: 2,
};

/**
 * Main haptic trigger function
 * 
 * IMPORTANT: For iOS, this MUST be called synchronously from user interaction!
 * Async calls (setTimeout, promises) will NOT trigger haptics.
 */
export function triggerHaptic(style: HapticStyle = 'light'): void {
    if (typeof window === 'undefined') return;

    if (isIOS()) {
        // iOS: Use switch checkbox trick
        const taps = IOS_TAPS[style] || 1;

        // Fire immediately (first tap - this one works from user gesture)
        fireIOSHaptic();

        // Additional taps for emphasis (these may or may not fire depending on context)
        for (let i = 1; i < taps; i++) {
            setTimeout(() => fireIOSHaptic(), i * 50);
        }
    } else {
        // Android/Desktop: Use Vibration API
        fireAndroidHaptic(ANDROID_PATTERNS[style]);
    }
}

/**
 * Initialize haptics - call on first user interaction
 * Required for iOS to create the hidden elements
 */
export function prepareHaptics(): void {
    if (isIOS()) {
        setupHapticElements();
        // Also fire a silent haptic to "warm up" the system
        fireIOSHaptic();
    }
}

/**
 * Check if haptics are likely available
 */
export function hapticsAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    if (isIOS()) return true; // iOS 18+ should work
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') return true;
    return false;
}

// Convenience exports
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
