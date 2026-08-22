import { describe, it, expect } from 'vitest';
import type { SessionAnswer } from '$lib/types';
import {
	sessionAccuracy,
	sessionAvgTime,
	correctCount,
	practiceProgress,
	selectionKey,
	classifySelection,
	describeSelection
} from './sessionStats';

function answer(correct: boolean, responseTime: number): SessionAnswer {
	return {
		problem: '3×4',
		correct,
		spokenAnswer: 12,
		responseTime,
		speedCategory: 'fast',
		timestamp: 0
	};
}

describe('sessionAccuracy', () => {
	it('is 0 for an empty session rather than NaN', () => {
		expect(sessionAccuracy([])).toBe(0);
	});

	it('computes a percentage', () => {
		expect(sessionAccuracy([answer(true, 0), answer(false, 0)])).toBe(50);
		expect(sessionAccuracy([answer(true, 0)])).toBe(100);
	});
});

describe('sessionAvgTime', () => {
	it('is 0 for an empty session rather than NaN', () => {
		expect(sessionAvgTime([])).toBe(0);
	});

	it('averages response times', () => {
		expect(sessionAvgTime([answer(true, 1000), answer(true, 3000)])).toBe(2000);
	});
});

describe('correctCount', () => {
	it('counts only correct answers', () => {
		expect(correctCount([answer(true, 0), answer(false, 0), answer(true, 0)])).toBe(2);
	});
});

describe('selectionKey', () => {
	it('is order independent', () => {
		expect(selectionKey([3, 1, 2])).toBe(selectionKey([1, 2, 3]));
	});

	it('ignores duplicates', () => {
		expect(selectionKey([2, 2, 5])).toBe('2,5');
	});

	it('distinguishes different selections', () => {
		expect(selectionKey([0])).not.toBe(selectionKey([0, 1]));
	});
});

describe('classifySelection', () => {
	it('recognises the presets regardless of order', () => {
		expect(classifySelection([12, 11, 9, 8, 7, 6])).toBe('hard');
		expect(classifySelection([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])).toBe('all');
	});

	it('treats anything else as custom', () => {
		expect(classifySelection([2, 3])).toBe('custom');
		expect(classifySelection([])).toBe('custom');
	});
});

describe('describeSelection', () => {
	it('names the presets', () => {
		expect(describeSelection([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])).toBe('All Tables');
		expect(describeSelection([6, 7, 8, 9, 11, 12])).toBe('Hard Tables');
	});

	it('prefers a saved set name for custom selections', () => {
		expect(describeSelection([2, 3], 'Twos and Threes')).toBe('Twos and Threes');
	});

	it('ignores a saved name for a preset selection', () => {
		expect(describeSelection([6, 7, 8, 9, 11, 12], 'My Set')).toBe('Hard Tables');
	});

	it('lists small custom selections and summarises large ones', () => {
		expect(describeSelection([2, 3])).toBe('2, 3 times tables');
		expect(describeSelection([1, 2, 3, 4, 5])).toBe('1, 2, 3… (5 tables)');
	});

	it('handles an empty selection', () => {
		expect(describeSelection([])).toBe('No tables');
	});
});

describe('practiceProgress', () => {
	it('is 0% with nothing answered', () => {
		const p = practiceProgress({ answered: 0, queued: 90, currentAwaitingAnswer: true });
		expect(p).toEqual({ answered: 0, total: 91, percent: 0 });
	});

	it('counts the on-screen problem while it awaits an answer', () => {
		const p = practiceProgress({ answered: 5, queued: 5, currentAwaitingAnswer: true });
		expect(p.total).toBe(11);
	});

	it('reaches 100% once the final problem is answered', () => {
		const p = practiceProgress({ answered: 10, queued: 0, currentAwaitingAnswer: false });
		expect(p.percent).toBe(100);
	});

	// The original bug: skipped problems stayed in a fixed denominator, so the bar
	// could never reach 100% again once anything had been skipped.
	it('still reaches 100% after problems were skipped', () => {
		const started = 10;
		const skipped = 3;
		const answered = started - skipped;
		const p = practiceProgress({ answered, queued: 0, currentAwaitingAnswer: false });
		expect(p.total).toBe(answered);
		expect(p.percent).toBe(100);
	});

	it('does not divide by zero for an empty session', () => {
		const p = practiceProgress({ answered: 0, queued: 0, currentAwaitingAnswer: false });
		expect(p.percent).toBe(0);
		expect(Number.isNaN(p.percent)).toBe(false);
	});
});
