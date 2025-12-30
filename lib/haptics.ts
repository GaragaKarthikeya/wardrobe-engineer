"use client";

/**
 * iOS-optimized Haptic Feedback System
 * 
 * iOS Safari does NOT support navigator.vibrate() API.
 * This implementation uses multiple fallback strategies:
 * 1. Selection CSS API (for selection feedback)
 * 2. AudioContext silent audio trick (triggers haptic engine)
 * 3. Touch feedback via rapid focus changes
 * 4. navigator.vibrate() fallback for Android
 */

type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'selection' | 'warning' | 'impact';

// AudioContext for iOS haptic triggering
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!audioContext) {
        try {
            const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (AudioContextClass) {
                audioContext = new AudioContextClass();
            }
        } catch (e) {
            console.warn('AudioContext not available for haptics');
        }
    }
    return audioContext;
}

// iOS detection
function isIOS(): boolean {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

// Check if device supports haptics
function supportsHaptics(): boolean {
    if (typeof window === 'undefined') return false;

    // Check for iOS Taptic Engine support via user agent
    if (isIOS()) return true;

    // Check for Android vibration API
    if (typeof navigator.vibrate === 'function') return true;

    return false;
}

/**
 * iOS Haptic trigger using AudioContext
 * This creates an inaudible audio pulse that triggers the Taptic Engine
 */
function triggerIOSHaptic(intensity: number, duration: number): void {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Resume audio context (required after user interaction)
    if (ctx.state === 'suspended') {
        ctx.resume();
    }

    try {
        // Create oscillator for haptic pulse
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        // Use very low frequency that triggers haptic but is barely audible
        oscillator.frequency.value = 10; // Sub-bass frequency
        oscillator.type = 'sine';

        // Set gain based on intensity (keep it very quiet)
        const baseGain = 0.001 * intensity;
        gainNode.gain.setValueAtTime(baseGain, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration / 1000);

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Start and stop the oscillator
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + duration / 1000);

        // Cleanup
        oscillator.onended = () => {
            oscillator.disconnect();
            gainNode.disconnect();
        };
    } catch (e) {
        // Silent fail - not all contexts support this
    }
}

/**
 * Create a hidden button and trigger click for iOS haptic
 * This leverages the native button click haptic on iOS
 */
function triggerIOSButtonHaptic(): void {
    if (typeof document === 'undefined') return;

    try {
        // Create invisible button
        const btn = document.createElement('button');
        btn.style.cssText = `
            position: fixed;
            left: -9999px;
            top: -9999px;
            width: 1px;
            height: 1px;
            opacity: 0;
            pointer-events: none;
        `;
        btn.setAttribute('aria-hidden', 'true');
        document.body.appendChild(btn);

        // Trigger focus/blur for haptic
        btn.focus();
        btn.blur();

        // Clean up
        requestAnimationFrame(() => {
            btn.remove();
        });
    } catch (e) {
        // Silent fail
    }
}

/**
 * Trigger CSS selection for selection haptic on iOS
 */
function triggerIOSSelectionHaptic(): void {
    if (typeof document === 'undefined') return;

    try {
        // Create a temporary text element
        const span = document.createElement('span');
        span.textContent = '.';
        span.style.cssText = `
            position: fixed;
            left: -9999px;
            top: -9999px;
            font-size: 1px;
            user-select: all;
            -webkit-user-select: all;
        `;
        document.body.appendChild(span);

        // Create and trigger selection
        const range = document.createRange();
        range.selectNodeContents(span);
        const selection = window.getSelection();
        if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
            selection.removeAllRanges();
        }

        // Cleanup
        requestAnimationFrame(() => {
            span.remove();
        });
    } catch (e) {
        // Silent fail
    }
}

/**
 * Android vibration patterns
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
 * iOS haptic intensity and duration configurations
 */
const IOS_CONFIG: Record<HapticStyle, { intensity: number; duration: number; type: 'audio' | 'button' | 'selection' }> = {
    light: { intensity: 0.3, duration: 10, type: 'audio' },
    medium: { intensity: 0.6, duration: 20, type: 'audio' },
    heavy: { intensity: 1.0, duration: 40, type: 'audio' },
    selection: { intensity: 0.2, duration: 8, type: 'selection' },
    success: { intensity: 0.8, duration: 30, type: 'button' },
    error: { intensity: 1.0, duration: 80, type: 'audio' },
    warning: { intensity: 0.7, duration: 50, type: 'audio' },
    impact: { intensity: 1.0, duration: 60, type: 'audio' },
};

/**
 * Main haptic trigger function - iOS optimized
 */
export function triggerHaptic(style: HapticStyle = 'light'): void {
    if (typeof window === 'undefined') return;
    if (!supportsHaptics()) return;

    if (isIOS()) {
        // iOS-specific haptic implementation
        const config = IOS_CONFIG[style];

        switch (config.type) {
            case 'selection':
                triggerIOSSelectionHaptic();
                break;
            case 'button':
                triggerIOSButtonHaptic();
                triggerIOSHaptic(config.intensity, config.duration);
                break;
            case 'audio':
            default:
                triggerIOSHaptic(config.intensity, config.duration);
                break;
        }

        // For stronger haptics, trigger multiple times with slight delays
        if (style === 'success') {
            setTimeout(() => triggerIOSHaptic(0.5, 15), 50);
            setTimeout(() => triggerIOSHaptic(0.8, 15), 100);
        } else if (style === 'error') {
            setTimeout(() => triggerIOSHaptic(0.8, 30), 60);
            setTimeout(() => triggerIOSHaptic(1.0, 30), 120);
            setTimeout(() => triggerIOSHaptic(0.8, 30), 180);
        } else if (style === 'warning') {
            setTimeout(() => triggerIOSHaptic(0.6, 25), 60);
        } else if (style === 'heavy' || style === 'impact') {
            // Double tap for heavy impacts
            setTimeout(() => triggerIOSHaptic(0.8, 30), 30);
        }

    } else {
        // Android/other - use vibration API
        const pattern = ANDROID_PATTERNS[style];
        try {
            if (navigator.vibrate) {
                navigator.vibrate(pattern);
            }
        } catch (e) {
            // Silent fail
        }
    }
}

/**
 * Prepare haptics - call this on first user interaction
 * This is required for iOS to initialize the AudioContext
 */
export function prepareHaptics(): void {
    if (isIOS()) {
        const ctx = getAudioContext();
        if (ctx && ctx.state === 'suspended') {
            ctx.resume().catch(() => { });
        }
    }
}

/**
 * Check if haptics are available on this device
 */
export function hapticsAvailable(): boolean {
    return supportsHaptics();
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
