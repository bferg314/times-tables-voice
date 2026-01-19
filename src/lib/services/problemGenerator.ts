import type { Problem } from '$lib/types';

/**
 * Generate all multiplication problems for selected numbers (0-12)
 * Deduplicates combinations (e.g., 3×5 and 5×3 are the same) and shuffles
 */
export function generateProblems(selectedNumbers: number[]): Problem[] {
	const problems: Problem[] = [];
	const allNumbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
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

	// Fisher-Yates shuffle for true randomization
	for (let i = problems.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[problems[i], problems[j]] = [problems[j], problems[i]];
	}

	return problems;
}

/**
 * Parse spoken text into a number
 * Handles word numbers, alternatives (oh/zero, for/four, ate/eight), and digit strings
 */
export function parseSpokenNumber(text: string): number | null {
	const cleanText = text.toLowerCase().trim();

	// First try to extract digits
	const digitMatch = cleanText.match(/\d+/);
	if (digitMatch) return parseInt(digitMatch[0]);

	// Word to number mapping with all alternatives from original
	const wordNumbers: Record<string, number> = {
		zero: 0,
		oh: 0,
		o: 0,
		zilch: 0,
		nothing: 0,
		zed: 0,
		none: 0,
		zedd: 0,
		one: 1,
		two: 2,
		three: 3,
		four: 4,
		for: 4,
		five: 5,
		six: 6,
		seven: 7,
		eight: 8,
		ate: 8,
		nine: 9,
		ten: 10,
		eleven: 11,
		twelve: 12,
		thirteen: 13,
		fourteen: 14,
		fifteen: 15,
		sixteen: 16,
		seventeen: 17,
		eighteen: 18,
		nineteen: 19,
		twenty: 20,
		thirty: 30,
		forty: 40,
		fifty: 50,
		sixty: 60,
		seventy: 70,
		eighty: 80,
		ninety: 90,
		hundred: 100
	};

	// Try exact match first
	if (wordNumbers[cleanText] !== undefined) {
		return wordNumbers[cleanText];
	}

	// Try summing multiple words (e.g., "twenty three" = 20 + 3)
	const words = cleanText.split(/\s+/);
	let total = 0;
	let foundNumber = false;

	for (const word of words) {
		if (wordNumbers[word] !== undefined) {
			total += wordNumbers[word];
			foundNumber = true;
		}
	}

	return foundNumber ? total : null;
}

/**
 * Categorize response time into speed category
 * < 2s = fast, 2-4s = medium, > 4s = slow
 */
export function categorizeSpeed(responseTime: number): 'fast' | 'medium' | 'slow' {
	if (responseTime < 2000) return 'fast';
	if (responseTime < 4000) return 'medium';
	return 'slow';
}

/**
 * Get preset number selections
 */
export function getPresetNumbers(preset: 'all' | 'hard' | 'random'): number[] {
	switch (preset) {
		case 'all':
			return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
		case 'hard':
			// Traditionally harder times tables
			return [6, 7, 8, 9, 11, 12];
		case 'random':
			// Random 3-7 numbers
			const count = Math.floor(Math.random() * 5) + 3;
			const allNumbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
			const shuffled = [...allNumbers].sort(() => Math.random() - 0.5);
			return shuffled.slice(0, count).sort((a, b) => a - b);
		default:
			return [];
	}
}
