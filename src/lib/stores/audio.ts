import { writable } from 'svelte/store';
import type { AudioState } from '#lib/types/index.ts';

export const audioState = writable<AudioState>({
	isListening: false,
	volumeLevel: 0,
	autoListen: true,
	error: null
});
