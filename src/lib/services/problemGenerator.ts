import type { Problem } from '$lib/types';

/** The times tables this app covers. */
export const ALL_NUMBERS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/** Response-time thresholds, in ms, for the speed categories. */
const FAST_MS = 2000;
const MEDIUM_MS = 4000;

/** Fisher-Yates. Mutates and returns the array. */
function shuffle<T>(items: T[]): T[] {
	for (let i = items.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[items[i], items[j]] = [items[j], items[i]];
	}
	return items;
}

/**
 * Generate all multiplication problems for selected numbers (0-12)
 * Deduplicates combinations (e.g., 3×5 and 5×3 are the same) and shuffles
 */
export function generateProblems(selectedNumbers: number[]): Problem[] {
	const problems: Problem[] = [];
	const allNumbers = ALL_NUMBERS;
	const seen = new Set<string>();

	for (const selectedNum of selectedNumbers) {
		for (const num of allNumbers) {
			// Create a normalized key (smaller number first) to avoid duplicates like 0×1 and 1×0
			const normalizedKey =
				selectedNum <= num ? `${selectedNum}×${num}` : `${num}×${selectedNum}`;

			// Only add if we haven't seen this combination before
			if (!seen.has(normalizedKey)) {
				seen.add(normalizedKey);
				problems.push({
					num1: selectedNum,
					num2: num,
					answer: selectedNum * num
				});
			}
		}
	}

	return shuffle(problems);
}

/**
 * Words the recognizer commonly picks up around an answer. They carry no value,
 * but their presence must not stop an otherwise-valid answer from being accepted.
 */
const FILLER_WORDS = new Set([
	'a', 'about', 'and', 'answer', 'em', 'equals', 'er', 'i', 'is', 'it', "it's", 'its',
	'like', 'maybe', 'my', 'okay', 'ok', 'guess', 'say', 'the', 'think', 'thats', "that's",
	'uh', 'um', 'well'
]);

/** Word to number mapping, including homophones the recognizer returns for spoken digits. */
const WORD_NUMBERS: Record<string, number> = {
	zero: 0, oh: 0, o: 0, zilch: 0, nothing: 0, zed: 0, none: 0, zedd: 0,
	one: 1,
	two: 2,
	three: 3,
	four: 4, for: 4,
	five: 5,
	six: 6,
	seven: 7,
	eight: 8, ate: 8,
	nine: 9,
	ten: 10,
	eleven: 11,
	twelve: 12,
	thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
	eighteen: 18, nineteen: 19,
	twenty: 20, thirty: 30, forty: 40, fifty: 50,
	sixty: 60, seventy: 70, eighty: 80, ninety: 90,
	hundred: 100
};

/**
 * How many problems a selection yields, without building them.
 *
 * Each of the n selected numbers pairs with all 13 tables, minus the commutative
 * duplicates that arise when both halves of a pair are selected.
 */
export function countProblems(selectedNumbers: number[]): number {
	const n = new Set(selectedNumbers).size;
	return n * ALL_NUMBERS.length - (n * (n - 1)) / 2;
}

/**
 * Parse spoken text into a number.
 *
 * Returns null unless the whole utterance reads as a single number, so stray
 * speech like "for sure" is not scored as the answer 4. "hundred" multiplies what
 * precedes it, so "one hundred forty four" is 144 rather than 1 + 100 + 40 + 4.
 */
export function parseSpokenNumber(text: string): number | null {
	const cleanText = text.toLowerCase().trim();
	if (!cleanText) return null;

	// A recognizer that returned digits is unambiguous - unless it returned several,
	// in which case we cannot tell which one was meant.
	const digitMatches = cleanText.match(/\d+/g);
	if (digitMatches) {
		return digitMatches.length === 1 ? parseInt(digitMatches[0], 10) : null;
	}

	let value = 0;
	let foundNumber = false;

	for (const word of cleanText.split(/\s+/)) {
		if (FILLER_WORDS.has(word)) continue;

		const wordValue = WORD_NUMBERS[word];
		if (wordValue === undefined) return null;

		foundNumber = true;
		if (wordValue === 100) {
			value = (value || 1) * 100;
		} else {
			value += wordValue;
		}
	}

	return foundNumber ? value : null;
}

/**
 * Categorize response time into speed category
 * < 2s = fast, 2-4s = medium, > 4s = slow
 */
export function categorizeSpeed(responseTime: number): 'fast' | 'medium' | 'slow' {
	if (responseTime < FAST_MS) return 'fast';
	if (responseTime < MEDIUM_MS) return 'medium';
	return 'slow';
}

/**
 * Get preset number selections
 */
export function getPresetNumbers(preset: 'all' | 'hard' | 'random'): number[] {
	switch (preset) {
		case 'all':
			return [...ALL_NUMBERS];
		case 'hard':
			// Traditionally harder times tables
			return [6, 7, 8, 9, 11, 12];
		case 'random': {
			// Random 3-7 numbers
			const count = Math.floor(Math.random() * 5) + 3;
			return shuffle([...ALL_NUMBERS])
				.slice(0, count)
				.sort((a, b) => a - b);
		}
		default:
			return [];
	}
}
