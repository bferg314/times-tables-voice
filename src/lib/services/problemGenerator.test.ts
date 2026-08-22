import { describe, it, expect } from 'vitest';
import {
	countProblems,
	generateProblems,
	parseSpokenNumber,
	categorizeSpeed,
	getPresetNumbers
} from './problemGenerator';

describe('generateProblems', () => {
	it('deduplicates commutative pairs', () => {
		// 2 pairs with 0-12 (13) + 3 pairs with 0-12 (13) minus the shared 2x3 = 25
		expect(generateProblems([2, 3])).toHaveLength(25);
	});

	it('produces 91 problems for all 13 tables', () => {
		// 13 choose 2 with repetition = 13*14/2
		expect(generateProblems(getPresetNumbers('all'))).toHaveLength(91);
	});

	it('always computes the correct answer', () => {
		for (const p of generateProblems([0, 7, 12])) {
			expect(p.answer).toBe(p.num1 * p.num2);
		}
	});

	it('includes every selected number in at least one problem', () => {
		const problems = generateProblems([4, 9]);
		for (const n of [4, 9]) {
			expect(problems.some((p) => p.num1 === n || p.num2 === n)).toBe(true);
		}
	});

	it('matches countProblems for every selection size', () => {
		const all = getPresetNumbers('all');
		for (let n = 0; n <= all.length; n++) {
			const selection = all.slice(0, n);
			expect(countProblems(selection)).toBe(generateProblems(selection).length);
		}
	});

	it('returns nothing for an empty selection', () => {
		expect(generateProblems([])).toHaveLength(0);
	});

	it('never emits the same pair twice', () => {
		const keys = generateProblems(getPresetNumbers('all')).map((p) =>
			p.num1 <= p.num2 ? `${p.num1}x${p.num2}` : `${p.num2}x${p.num1}`
		);
		expect(new Set(keys).size).toBe(keys.length);
	});
});

describe('parseSpokenNumber', () => {
	it('parses digit strings', () => {
		expect(parseSpokenNumber('42')).toBe(42);
		expect(parseSpokenNumber('0')).toBe(0);
	});

	it('parses single number words', () => {
		expect(parseSpokenNumber('zero')).toBe(0);
		expect(parseSpokenNumber('seven')).toBe(7);
		expect(parseSpokenNumber('twelve')).toBe(12);
	});

	it('is case and whitespace insensitive', () => {
		expect(parseSpokenNumber('  Twelve  ')).toBe(12);
	});

	it('accepts the deliberate homophones a child might say', () => {
		expect(parseSpokenNumber('oh')).toBe(0);
		expect(parseSpokenNumber('for')).toBe(4);
		expect(parseSpokenNumber('ate')).toBe(8);
	});

	it('parses compound tens', () => {
		expect(parseSpokenNumber('twenty four')).toBe(24);
		expect(parseSpokenNumber('ninety nine')).toBe(99);
	});

	it('returns null when nothing numeric is present', () => {
		expect(parseSpokenNumber('hello there')).toBeNull();
		expect(parseSpokenNumber('')).toBeNull();
	});

	// BUG (fixed in Phase 4): 'hundred' is summed rather than used as a multiplier,
	// which makes 12x12 = 144 impossible to answer in words.
	it('handles hundreds as a multiplier', () => {
		expect(parseSpokenNumber('one hundred forty four')).toBe(144);
		expect(parseSpokenNumber('one hundred twenty')).toBe(120);
	});

	// BUG (fixed in Phase 4): any utterance containing a number-word token scored.
	it('rejects utterances that are not purely a number', () => {
		expect(parseSpokenNumber('for sure')).toBeNull();
		expect(parseSpokenNumber('i think its nine')).toBe(9);
	});

	// BUG (fixed in Phase 4): only the first digit run was read.
	it('rejects ambiguous multi-number digit input', () => {
		expect(parseSpokenNumber('3 4')).toBeNull();
	});
});

describe('categorizeSpeed', () => {
	it('classifies at the boundaries', () => {
		expect(categorizeSpeed(0)).toBe('fast');
		expect(categorizeSpeed(1999)).toBe('fast');
		expect(categorizeSpeed(2000)).toBe('medium');
		expect(categorizeSpeed(3999)).toBe('medium');
		expect(categorizeSpeed(4000)).toBe('slow');
	});
});

describe('getPresetNumbers', () => {
	it('returns all 13 tables for "all"', () => {
		expect(getPresetNumbers('all')).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
	});

	it('returns the traditionally harder tables for "hard"', () => {
		expect(getPresetNumbers('hard')).toEqual([6, 7, 8, 9, 11, 12]);
	});

	it('returns 3-7 sorted, unique, in-range numbers for "random"', () => {
		for (let i = 0; i < 50; i++) {
			const result = getPresetNumbers('random');
			expect(result.length).toBeGreaterThanOrEqual(3);
			expect(result.length).toBeLessThanOrEqual(7);
			expect(new Set(result).size).toBe(result.length);
			expect([...result].sort((a, b) => a - b)).toEqual(result);
			expect(result.every((n) => n >= 0 && n <= 12)).toBe(true);
		}
	});
});
