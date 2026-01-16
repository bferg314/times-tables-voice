import { audioState } from '$lib/stores/audio';
import { transcript } from '$lib/stores/session';
import { parseSpokenNumber } from './problemGenerator';

type ResultCallback = (text: string, number: number | null) => void;

export class SpeechRecognitionService {
	private recognition: SpeechRecognition | null = null;
	private onResultCallback: ResultCallback | null = null;
	private pendingRestart: boolean = false;
	private gotResult: boolean = false;

	constructor() {
		this.initRecognition();
	}

	private initRecognition() {
		if (typeof window === 'undefined') return;

		const SpeechRecognitionAPI =
			window.SpeechRecognition || window.webkitSpeechRecognition;

		if (!SpeechRecognitionAPI) {
			audioState.update((s) => ({
				...s,
				error: 'Speech recognition not supported. This app requires Chrome, Edge, Brave, or another Chromium-based browser. Firefox and Safari are not supported.'
			}));
			return;
		}

		this.recognition = new SpeechRecognitionAPI();
		this.recognition.continuous = false;
		this.recognition.interimResults = false;
		this.recognition.lang = 'en-US';

		this.recognition.onresult = (event: SpeechRecognitionEvent) => {
			const spokenText = event.results[0][0].transcript;
			console.log('Speech recognized:', spokenText);

			this.gotResult = true; // Mark that we got a result
			transcript.set(spokenText);
			audioState.update((s) => ({ ...s, error: null }));

			const spokenNumber = parseSpokenNumber(spokenText);

			if (this.onResultCallback) {
				setTimeout(() => {
					if (this.onResultCallback) {
						this.onResultCallback(spokenText, spokenNumber);
					}
				}, 500);
			}
		};

		this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
			console.error('Speech recognition error:', event.error);
			audioState.update((s) => ({ ...s, isListening: false }));

			if (event.error === 'not-allowed' || event.error === 'permission-denied') {
				audioState.update((s) => ({
					...s,
					error: 'Microphone access denied. Please allow microphone access.'
				}));
			} else if (event.error === 'no-speech') {
				// Auto-retry on no-speech
				setTimeout(() => this.start(), 1000);
			} else if (event.error === 'network') {
				audioState.update((s) => ({
					...s,
					error: 'Network error. Please check your connection.'
				}));
			} else if (event.error === 'aborted') {
				// Silently handle aborted (happens on manual stop)
			} else {
				audioState.update((s) => ({
					...s,
					error: `Speech recognition error: ${event.error}`
				}));
			}
		};

		this.recognition.onstart = () => {
			console.log('Speech recognition started');
			audioState.update((s) => ({ ...s, isListening: true, error: null }));
		};

		this.recognition.onend = () => {
			console.log('Speech recognition ended, gotResult:', this.gotResult);
			audioState.update((s) => ({ ...s, isListening: false }));

			// If we ended without getting a result, treat it like we heard nothing
			if (!this.gotResult && this.onResultCallback) {
				console.log('No result received - calling callback with empty string');
				// Call the callback with an empty string to trigger retry logic
				if (this.onResultCallback) {
					this.onResultCallback('', null);
				}
			}

			// If a restart was requested while recognition was running, restart now
			if (this.pendingRestart) {
				this.pendingRestart = false;
				console.log('Executing pending restart');
				this.gotResult = false; // Reset flag before restarting
				setTimeout(() => {
					try {
						this.recognition!.start();
					} catch (error: any) {
						console.error('Error in pending restart:', error);
						// If restart fails, clear the pending flag
						this.pendingRestart = false;
					}
				}, 100);
			}
		};
	}

	start() {
		if (!this.recognition) {
			audioState.update((s) => ({
				...s,
				error: 'Speech recognition not supported'
			}));
			return;
		}

		try {
			this.gotResult = false; // Reset the flag when starting
			this.recognition.start();
			this.pendingRestart = false; // Clear any pending restart
		} catch (error: any) {
			if (error.message?.includes('already started')) {
				// Recognition is still running, schedule a restart for when it ends
				// Don't log error - this is expected behavior during retries
				console.log('Recognition already running, will restart when it ends');
				this.pendingRestart = true;
			} else {
				console.error('Error starting recognition:', error);
				audioState.update((s) => ({
					...s,
					error: 'Failed to start speech recognition'
				}));
			}
		}
	}

	stop() {
		if (this.recognition) {
			this.recognition.stop();
		}
	}

	onResult(callback: ResultCallback) {
		this.onResultCallback = callback;
	}
}

// Singleton instance
export const speechService = new SpeechRecognitionService();
