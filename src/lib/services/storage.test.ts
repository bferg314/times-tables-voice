import { describe, it, expect, beforeEach } from 'vitest';
import type { HighScore, SessionStats, SessionAnswer } from '$lib/types';

// storage.ts guards every call on `typeof window`, so both must exist before import.
class MemoryStorage {
	private data = new Map<string, string>();
	getItem(key: string) {
		return this.data.has(key) ? this.data.get(key)! : null;
	}
	setItem(key: string, value: string) {
		this.data.set(key, value);
	}
	removeItem(key: string) {
		this.data.delete(key);
	}
	clear() {
		this.data.clear();
	}
}

const store = new MemoryStorage();
(globalThis as any).window = globalThis;
(globalThis as any).localStorage = store;

const {
	createUser,
	getUsers,
	deleteUser,
	saveSession,
	getUserHistory,
	getHighScores,
	updateHighScore,
	getPersonalBest,
	isNewHighScore
} = await import('./storage');

function answer(correct: boolean, responseTime: number): SessionAnswer {
	return {
		problem: '3×4',
		correct,
		spokenAnswer: correct ? 12 : 11,
		responseTime,
		speedCategory: 'fast',
		timestamp: Date.now()
	};
}

function session(answers: SessionAnswer[]): SessionStats {
	return { answers, problemStats: {}, totalProblems: answers.length, startedAt: Date.now() };
}

const ALL_KEY = '0,1,2,3,4,5,6,7,8,9,10,11,12';
const HARD_KEY = '6,7,8,9,11,12';

function highScore(over: Partial<HighScore> = {}): HighScore {
	return {
		userId: 'u1',
		selectionKey: ALL_KEY,
		selectedNumbers: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
		problemSet: 'all',
		accuracy: 80,
		avgResponseTime: 2000,
		totalProblems: 10,
		completedAt: Date.now(),
		...over
	};
}

beforeEach(() => store.clear());

describe('user management', () => {
	it('creates and lists users', () => {
		const user = createUser('Ada');
		expect(user.name).toBe('Ada');
		expect(getUsers().map((u) => u.name)).toEqual(['Ada']);
	});

	it('assigns distinct ids', () => {
		expect(createUser('Ada').id).not.toBe(createUser('Grace').id);
	});

	it('deletes a user along with their history and high scores', () => {
		const user = createUser('Ada');
		saveSession(user.id, session([answer(true, 1000)]));
		updateHighScore(user.id, highScore({ userId: user.id }));

		deleteUser(user.id);

		expect(getUsers()).toHaveLength(0);
		expect(getUserHistory(user.id).sessions).toHaveLength(0);
		expect(getHighScores()).toHaveLength(0);
	});
});

describe('session history', () => {
	it('appends sessions and stamps completedAt', () => {
		saveSession('u1', session([answer(true, 1000)]));
		saveSession('u1', session([answer(false, 5000)]));

		const { sessions } = getUserHistory('u1');
		expect(sessions).toHaveLength(2);
		expect(sessions[0].completedAt).toBeGreaterThan(0);
	});

	it('keeps each user history separate', () => {
		saveSession('u1', session([answer(true, 1000)]));
		expect(getUserHistory('u2').sessions).toHaveLength(0);
	});
});

describe('getPersonalBest', () => {
	it('returns null when the user has no scores', () => {
		expect(getPersonalBest('u1', ALL_KEY)).toBeNull();
	});

	it('prefers higher accuracy', () => {
		updateHighScore('u1', highScore({ accuracy: 70, avgResponseTime: 500 }));
		updateHighScore('u1', highScore({ accuracy: 95, avgResponseTime: 9000 }));
		expect(getPersonalBest('u1', ALL_KEY)?.accuracy).toBe(95);
	});

	it('breaks accuracy ties on the faster time', () => {
		updateHighScore('u1', highScore({ accuracy: 90, avgResponseTime: 3000 }));
		updateHighScore('u1', highScore({ accuracy: 90, avgResponseTime: 1200 }));
		expect(getPersonalBest('u1', ALL_KEY)?.avgResponseTime).toBe(1200);
	});

	it('ignores other users scores', () => {
		updateHighScore('u2', highScore({ userId: 'u2', accuracy: 100 }));
		expect(getPersonalBest('u1', ALL_KEY)).toBeNull();
	});

	// A 0-only session is trivially perfect and must never outrank a real run.
	it('keeps different table selections in separate buckets', () => {
		updateHighScore('u1', highScore({ selectionKey: '0', accuracy: 100, avgResponseTime: 300 }));
		expect(getPersonalBest('u1', ALL_KEY)).toBeNull();
		expect(getPersonalBest('u1', '0')?.accuracy).toBe(100);
	});

	it('replaces rather than appends a score for the same selection', () => {
		updateHighScore('u1', highScore({ selectionKey: HARD_KEY, accuracy: 60 }));
		updateHighScore('u1', highScore({ selectionKey: HARD_KEY, accuracy: 80 }));
		expect(getHighScores('u1').filter((s) => s.selectionKey === HARD_KEY)).toHaveLength(1);
	});
});

describe('isNewHighScore', () => {
	it('is true when no prior best exists', () => {
		expect(isNewHighScore('u1', ALL_KEY, session([answer(true, 1000)]))).toBe(true);
	});

	it('is false for a session with no answers', () => {
		expect(isNewHighScore('u1', ALL_KEY, session([]))).toBe(false);
	});

	it('does not compare against a different selection', () => {
		updateHighScore('u1', highScore({ selectionKey: '0', accuracy: 100, avgResponseTime: 1 }));
		expect(isNewHighScore('u1', ALL_KEY, session([answer(false, 9000)]))).toBe(true);
	});

	it('is true on strictly better accuracy', () => {
		updateHighScore('u1', highScore({ accuracy: 50, avgResponseTime: 100 }));
		expect(isNewHighScore('u1', ALL_KEY, session([answer(true, 9000)]))).toBe(true);
	});

	it('is false on worse accuracy', () => {
		updateHighScore('u1', highScore({ accuracy: 100, avgResponseTime: 5000 }));
		expect(isNewHighScore('u1', ALL_KEY, session([answer(false, 100)]))).toBe(false);
	});

	it('is true on equal accuracy with a faster time', () => {
		updateHighScore('u1', highScore({ accuracy: 100, avgResponseTime: 5000 }));
		expect(isNewHighScore('u1', ALL_KEY, session([answer(true, 1000)]))).toBe(true);
	});

	it('is false on equal accuracy with a slower time', () => {
		updateHighScore('u1', highScore({ accuracy: 100, avgResponseTime: 1000 }));
		expect(isNewHighScore('u1', ALL_KEY, session([answer(true, 5000)]))).toBe(false);
	});
});
