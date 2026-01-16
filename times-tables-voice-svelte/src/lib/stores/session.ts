import { writable } from 'svelte/store';
import type { SessionStats, Problem, SessionAnswer, AppScreen } from '$lib/types';

// Current screen state
export const currentScreen = writable<AppScreen>('setup');

// Session state
export const sessionStats = writable<SessionStats>({
	answers: [],
	problemStats: {},
	totalProblems: 0,
	startedAt: Date.now()
});

// Problem state
export const currentProblem = writable<Problem | null>(null);
export const availableProblems = writable<Problem[]>([]);
export const selectedNumbers = writable<number[]>([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

// UI state
export const feedback = writable<SessionAnswer | null>(null);
export const transcript = writable<string>('');
export const startTime = writable<number | null>(null);
export const helpMessage = writable<string>('');
export const autoAdvanceCountdown = writable<number>(0);

// Reset session
export function resetSession() {
	sessionStats.set({
		answers: [],
		problemStats: {},
		totalProblems: 0,
		startedAt: Date.now()
	});
	currentProblem.set(null);
	availableProblems.set([]);
	feedback.set(null);
	transcript.set('');
	startTime.set(null);
	helpMessage.set('');
	autoAdvanceCountdown.set(0);
}
