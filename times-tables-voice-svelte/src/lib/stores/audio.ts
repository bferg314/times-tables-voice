import { writable } from 'svelte/store';
import type { AudioState } from '$lib/types';

export const audioState = writable<AudioState>({
	isListening: false,
	volumeLevel: 0,
	autoListen: true,
	error: null
});
