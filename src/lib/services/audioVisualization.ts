import { get } from 'svelte/store';
import { audioState } from '$lib/stores/audio';

const SMOOTHING = 0.8;
const FFT_SIZE = 256;
/** Children speak quietly; amplify so the meter is legible. */
const GAIN_BOOST = 2.0;
/** Byte frequency data is 0-255; half-scale reads as "full" on the meter. */
const VOLUME_SCALE = 128;

export class AudioVisualizationService {
	private audioContext: AudioContext | null = null;
	private analyser: AnalyserNode | null = null;
	private microphone: MediaStreamAudioSourceNode | null = null;
	private gainNode: GainNode | null = null;
	private stream: MediaStream | null = null;
	private frequencyData: Uint8Array<ArrayBuffer> | null = null;
	private animationId: number | null = null;

	async init() {
		if (typeof window === 'undefined' || this.audioContext) return;

		try {
			this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
			this.analyser = this.audioContext.createAnalyser();
			this.gainNode = this.audioContext.createGain();
			this.microphone = this.audioContext.createMediaStreamSource(this.stream);

			this.analyser.smoothingTimeConstant = SMOOTHING;
			this.analyser.fftSize = FFT_SIZE;
			this.gainNode.gain.value = GAIN_BOOST;

			// microphone -> gain -> analyser
			this.microphone.connect(this.gainNode);
			this.gainNode.connect(this.analyser);

			this.frequencyData = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));
			this.updateVolume();
		} catch (err) {
			// The volume meter is decorative. Speech recognition owns microphone error
			// reporting, so failing here must not clobber its message with a second one.
			console.debug('[volume-meter] disabled:', err);
			this.stop();
		}
	}

	private updateVolume() {
		if (!this.analyser || !this.frequencyData) return;

		// Only publish while listening: this runs ~60x/sec and every write notifies
		// every $audioState subscriber in the practice screen.
		if (get(audioState).isListening) {
			this.analyser.getByteFrequencyData(this.frequencyData);

			let sum = 0;
			for (let i = 0; i < this.frequencyData.length; i++) {
				sum += this.frequencyData[i];
			}
			const average = sum / this.frequencyData.length;
			const volumeLevel = Math.min(100, (average / VOLUME_SCALE) * 100);

			audioState.update((s) => ({ ...s, volumeLevel }));
		}

		this.animationId = requestAnimationFrame(() => this.updateVolume());
	}

	stop() {
		if (this.animationId) {
			cancelAnimationFrame(this.animationId);
			this.animationId = null;
		}
		this.gainNode?.disconnect();
		this.gainNode = null;
		this.microphone?.disconnect();
		this.microphone = null;

		// Releasing the nodes is not enough - without stopping the tracks the
		// browser's microphone indicator stays lit for the lifetime of the tab.
		this.stream?.getTracks().forEach((track) => track.stop());
		this.stream = null;

		this.audioContext?.close().catch(() => {});
		this.audioContext = null;

		this.analyser = null;
		this.frequencyData = null;
		audioState.update((s) => ({ ...s, volumeLevel: 0 }));
	}
}

// Singleton instance
export const audioService = new AudioVisualizationService();
