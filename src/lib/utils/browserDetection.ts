/**
 * Browser detection utilities for checking Web Speech API support
 */

export interface BrowserInfo {
	isSupported: boolean;
	browserName: string;
	reason?: string;
	recommendedBrowsers: string[];
}

/**
 * Detects if the current browser supports Web Speech Recognition API
 *
 * Web Speech Recognition is currently only supported in Chromium-based browsers:
 * - Google Chrome
 * - Microsoft Edge
 * - Brave
 * - Opera
 * - Vivaldi
 *
 * NOT supported in:
 * - Firefox (no native support)
 * - Safari (limited/no support)
 */
export function detectBrowserSupport(): BrowserInfo {
	if (typeof window === 'undefined') {
		return {
			isSupported: false,
			browserName: 'Unknown',
			reason: 'Server-side rendering',
			recommendedBrowsers: ['Chrome', 'Edge', 'Brave']
		};
	}

	const userAgent = navigator.userAgent.toLowerCase();
	const recommendedBrowsers = ['Chrome', 'Edge', 'Brave', 'Opera'];

	// Check for Web Speech Recognition API
	const hasSpeechRecognition =
		'SpeechRecognition' in window ||
		'webkitSpeechRecognition' in window;

	// Detect browser
	let browserName = 'Unknown';

	if (userAgent.includes('edg/')) {
		browserName = 'Edge';
	} else if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
		browserName = 'Chrome';
	} else if (userAgent.includes('firefox')) {
		browserName = 'Firefox';
	} else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
		browserName = 'Safari';
	} else if (userAgent.includes('opr/') || userAgent.includes('opera')) {
		browserName = 'Opera';
	} else if (userAgent.includes('brave')) {
		browserName = 'Brave';
	}

	// Determine support
	if (!hasSpeechRecognition) {
		let reason = 'Web Speech Recognition API is not available';

		if (browserName === 'Firefox') {
			reason = 'Firefox does not support the Web Speech Recognition API';
		} else if (browserName === 'Safari') {
			reason = 'Safari has limited/no support for Web Speech Recognition';
		}

		return {
			isSupported: false,
			browserName,
			reason,
			recommendedBrowsers
		};
	}

	return {
		isSupported: true,
		browserName,
		recommendedBrowsers
	};
}

/**
 * Check if running in Firefox specifically
 */
export function isFirefox(): boolean {
	if (typeof window === 'undefined') return false;
	return navigator.userAgent.toLowerCase().includes('firefox');
}

/**
 * Check if running in Safari specifically
 */
export function isSafari(): boolean {
	if (typeof window === 'undefined') return false;
	const ua = navigator.userAgent.toLowerCase();
	return ua.includes('safari') && !ua.includes('chrome');
}

/**
 * Get a user-friendly message about browser compatibility
 */
export function getCompatibilityMessage(): string {
	const info = detectBrowserSupport();

	if (info.isSupported) {
		return `Great! ${info.browserName} supports voice recognition.`;
	}

	return `${info.browserName} is not supported. Please use ${info.recommendedBrowsers.join(', ')}, or another Chromium-based browser.`;
}
