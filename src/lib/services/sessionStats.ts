import type { SessionStats, SessionAnswer, ProblemSet } from '$lib/types';
import { ALL_NUMBERS, getPresetNumbers } from './problemGenerator';

/** Percentage of answers that were correct. 0 for an empty session. */
export function sessionAccuracy(answers: SessionAnswer[]): number {
	if (answers.length === 0) return 0;
	return (answers.filter((a) => a.correct).length / answers.length) * 100;
}

/** Mean response time in ms. 0 for an empty session. */
export function sessionAvgTime(answers: SessionAnswer[]): number {
	if (answers.length === 0) return 0;
	return answers.reduce((sum, a) => sum + a.responseTime, 0) / answers.length;
}

export function correctCount(answers: SessionAnswer[]): number {
	return answers.filter((a) => a.correct).length;
}

/**
 * Canonical identity for a set of times tables.
 *
 * High scores are bucketed on this rather than on which preset button was pressed:
 * a user can click HARD and then toggle a number, and a 0-only session must not
 * compete with a full 0-12 run.
 */
export function selectionKey(numbers: number[]): string {
	return [...new Set(numbers)].sort((a, b) => a - b).join(',');
}

/** Which preset, if any, a selection corresponds to. */
export function classifySelection(numbers: number[]): ProblemSet {
	const key = selectionKey(numbers);
	if (key === selectionKey(ALL_NUMBERS)) return 'all';
	if (key === selectionKey(getPresetNumbers('hard'))) return 'hard';
	return 'custom';
}

/** Human-readable name for a selection, e.g. for history cards. */
export function describeSelection(numbers: number[], customSetName?: string): string {
	const kind = classifySelection(numbers);
	if (kind === 'all') return 'All Tables';
	if (kind === 'hard') return 'Hard Tables';
	if (customSetName) return customSetName;

	const sorted = [...new Set(numbers)].sort((a, b) => a - b);
	if (sorted.length === 0) return 'No tables';
	if (sorted.length <= 4) return `${sorted.join(', ')} times tables`;
	return `${sorted.slice(0, 3).join(', ')}… (${sorted.length} tables)`;
}

/**
 * Progress through a practice session.
 *
 * The denominator is derived, not the original problem count: a skipped problem
 * leaves the session entirely, so counting it would leave the bar short of 100%
 * for the rest of the run. The problem on screen has already been shifted off the
 * queue, so it is counted as remaining only while it is still unanswered.
 */
export function practiceProgress(opts: {
	answered: number;
	queued: number;
	currentAwaitingAnswer: boolean;
}): { answered: number; total: number; percent: number } {
	const remaining = opts.queued + (opts.currentAwaitingAnswer ? 1 : 0);
	const total = opts.answered + remaining;
	return {
		answered: opts.answered,
		total,
		percent: total > 0 ? (opts.answered / total) * 100 : 0
	};
}

/** The selection a completed session was practised with. */
export function sessionSelection(session: SessionStats): number[] {
	return session.selectedNumbers ?? [];
}
