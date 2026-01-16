import { audioState } from '$lib/stores/audio';

export class AudioVisualizationService {
	private audioContext: AudioContext | null = null;
	private analyser: AnalyserNode | null = null;
	private microphone: MediaStreamAudioSourceNode | null = null;
	private gainNode: GainNode | null = null;
	private animationId: number | null = null;

	async init() {
		if (typeof window === 'undefined') return;

		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
			this.analyser = this.audioContext.createAnalyser();
			this.gainNode = this.audioContext.createGain();
			this.microphone = this.audioContext.createMediaStreamSource(stream);

			this.analyser.smoothingTimeConstant = 0.8;
			this.analyser.fftSize = 256;

			// Set initial gain boost (2.0 = 2x amplification)
			this.gainNode.gain.value = 2.0;

			// Connect: microphone -> gain -> analyser
			this.microphone.connect(this.gainNode);
			this.gainNode.connect(this.analyser);

			this.updateVolume();
		} catch (err) {
			console.error('Audio visualization error:', err);
		}
	}

	private updateVolume() {
		if (!this.analyser) return;

		const bufferLength = this.analyser.frequencyBinCount;
		const dataArray = new Uint8Array(bufferLength);
		this.analyser.getByteFrequencyData(dataArray);

		let sum = 0;
		for (let i = 0; i < bufferLength; i++) {
			sum += dataArray[i];
		}
		const average = sum / bufferLength;
		const volumeLevel = Math.min(100, (average / 128) * 100);

		// Update store instead of DOM
		audioState.update((s) => ({ ...s, volumeLevel }));

		this.animationId = requestAnimationFrame(() => this.updateVolume());
	}

	stop() {
		if (this.animationId) {
			cancelAnimationFrame(this.animationId);
			this.animationId = null;
		}
		if (this.gainNode) {
			this.gainNode.disconnect();
			this.gainNode = null;
		}
		if (this.microphone) {
			this.microphone.disconnect();
			this.microphone = null;
		}
		if (this.audioContext) {
			this.audioContext.close();
			this.audioContext = null;
		}
		this.analyser = null;
		audioState.update((s) => ({ ...s, volumeLevel: 0 }));
	}
}

// Singleton instance
export const audioService = new AudioVisualizationService();
