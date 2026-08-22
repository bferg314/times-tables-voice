import { audioState } from '$lib/stores/audio';
import { transcript } from '$lib/stores/session';
import { parseSpokenNumber } from './problemGenerator';
import { detectBrowserSupport } from '$lib/utils/browserDetection';

/** Delay before dispatching a result, so the user can read what was heard. */
const RESULT_DISPATCH_MS = 500;

type ResultCallback = (text: string, number: number | null) => void;

/**
 * Wraps the Web Speech API in a one-shot recognizer with a deterministic lifecycle.
 *
 * The service reports *what it heard* and nothing more: retry policy lives in the
 * caller. A deliberate stop() is never reported as a failed listen, which is what
 * lets callers tear the service down without it re-arming itself.
 */
export class SpeechRecognitionService {
	private recognition: SpeechRecognition | null = null;
	private onResultCallback: ResultCallback | null = null;
	private timers = new Set<ReturnType<typeof setTimeout>>();
	/** Set by stop()/destroy() so the resulting onend is not reported as "heard nothing". */
	private intentionalStop = false;
	private gotResult = false;
	/** Permanent failures (denied permission) must not be retried. */
	private fatal = false;

	constructor() {
		this.initRecognition();
	}

	private initRecognition() {
		if (typeof window === 'undefined') return;

		const support = detectBrowserSupport();
		if (!support.isSupported) {
			this.fatal = true;
			audioState.update((s) => ({
				...s,
				error: `${support.reason}. This app requires Chrome, Edge, Brave, or another Chromium-based browser.`
			}));
			return;
		}

		const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
		this.recognition = new SpeechRecognitionAPI();
		this.recognition.continuous = false;
		this.recognition.interimResults = false;
		this.recognition.lang = 'en-US';

		this.recognition.onresult = (event: SpeechRecognitionEvent) => {
			const spokenText = event.results[0][0].transcript;

			this.gotResult = true;
			transcript.set(spokenText);
			audioState.update((s) => ({ ...s, error: null }));

			const spokenNumber = parseSpokenNumber(spokenText);
			this.schedule(() => this.onResultCallback?.(spokenText, spokenNumber), RESULT_DISPATCH_MS);
		};

		this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
			audioState.update((s) => ({ ...s, isListening: false }));

			if (event.error === 'not-allowed' || event.error === 'permission-denied') {
				// Permanent: retrying would loop forever behind a denied permission prompt.
				this.fatal = true;
				audioState.update((s) => ({
					...s,
					error: 'Microphone access denied. Please allow microphone access and reload.'
				}));
			} else if (event.error === 'network') {
				this.fatal = true;
				audioState.update((s) => ({ ...s, error: 'Network error. Please check your connection.' }));
			} else if (event.error === 'no-speech' || event.error === 'aborted') {
				// Expected. onend reports the empty listen; the caller decides whether to retry.
			} else {
				console.error('Speech recognition error:', event.error);
				audioState.update((s) => ({ ...s, error: `Speech recognition error: ${event.error}` }));
			}
		};

		this.recognition.onstart = () => {
			audioState.update((s) => ({ ...s, isListening: true, error: null }));
		};

		this.recognition.onend = () => {
			audioState.update((s) => ({ ...s, isListening: false }));

			const heardNothing = !this.gotResult && !this.intentionalStop && !this.fatal;
			this.intentionalStop = false;

			if (heardNothing) {
				this.onResultCallback?.('', null);
			}
		};
	}

	/** Track every timer so stop()/destroy() can guarantee nothing fires later. */
	private schedule(fn: () => void, delay: number) {
		const id = setTimeout(() => {
			this.timers.delete(id);
			fn();
		}, delay);
		this.timers.add(id);
	}

	private clearTimers() {
		for (const id of this.timers) clearTimeout(id);
		this.timers.clear();
	}

	/** True once a permanent error has occurred; callers should stop retrying. */
	get isFatal() {
		return this.fatal;
	}

	start() {
		if (this.fatal) return;

		if (!this.recognition) {
			audioState.update((s) => ({ ...s, error: 'Speech recognition not supported' }));
			return;
		}

		this.gotResult = false;
		this.intentionalStop = false;

		try {
			this.recognition.start();
		} catch {
			// Already running: the existing session is equivalent to the one requested.
		}
	}

	stop() {
		this.clearTimers();
		if (!this.recognition) return;
		this.intentionalStop = true;
		this.recognition.abort();
	}

	onResult(callback: ResultCallback) {
		this.onResultCallback = callback;
	}

	/** Detach the listener and silence the recognizer. Safe to call more than once. */
	destroy() {
		this.stop();
		this.onResultCallback = null;
	}
}

// Singleton instance
export const speechService = new SpeechRecognitionService();
