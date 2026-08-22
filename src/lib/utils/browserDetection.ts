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

	// Detect browser. Order matters: Chromium forks all carry 'chrome' in their
	// user agent, so every fork must be tested before the generic Chrome check.
	let browserName = 'Unknown';

	if (userAgent.includes('edg/')) {
		browserName = 'Edge';
	} else if (userAgent.includes('opr/') || userAgent.includes('opera')) {
		browserName = 'Opera';
	} else if ('brave' in navigator || userAgent.includes('brave')) {
		// Brave omits itself from the user agent, so navigator.brave is the real signal.
		browserName = 'Brave';
	} else if (userAgent.includes('firefox')) {
		browserName = 'Firefox';
	} else if (userAgent.includes('chrome')) {
		browserName = 'Chrome';
	} else if (userAgent.includes('safari')) {
		browserName = 'Safari';
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

