import type {
	User,
	SessionStats,
	HighScore,
	CustomProblemSet,
	PracticeHistory
} from '$lib/types';
import { sessionAccuracy, sessionAvgTime } from './sessionStats';

// Storage keys
export const KEYS = {
	USERS: 'ttvapp_users',
	THEME: 'ttvapp_theme',
	CURRENT_USER: 'ttvapp_currentUser',
	HIGHSCORES: 'ttvapp_highscores',
	history: (userId: string) => `ttvapp_history_${userId}`,
	customSets: (userId: string) => `ttvapp_customsets_${userId}`
};

// Helper to safely parse JSON from localStorage
function getFromStorage<T>(key: string, defaultValue: T): T {
	if (typeof window === 'undefined') return defaultValue;
	try {
		const item = localStorage.getItem(key);
		return item ? JSON.parse(item) : defaultValue;
	} catch (error) {
		console.error(`Error parsing localStorage key ${key}:`, error);
		return defaultValue;
	}
}

// Helper to safely set JSON to localStorage
function setToStorage<T>(key: string, value: T): void {
	if (typeof window === 'undefined') return;
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch (error) {
		console.error(`Error setting localStorage key ${key}:`, error);
	}
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

export function getUsers(): User[] {
	return getFromStorage<User[]>(KEYS.USERS, []);
}

export function getCurrentUser(): User | null {
	const userId = getFromStorage<string | null>(KEYS.CURRENT_USER, null);
	if (!userId) return null;

	const users = getUsers();
	const user = users.find((u) => u.id === userId);
	if (!user) {
		// Clean up invalid reference
		setToStorage(KEYS.CURRENT_USER, null);
		return null;
	}

	// Update last active
	user.lastActive = Date.now();
	setCurrentUser(userId);
	return user;
}

export function setCurrentUser(userId: string): void {
	setToStorage(KEYS.CURRENT_USER, userId);

	// Update last active time
	const users = getUsers();
	const user = users.find((u) => u.id === userId);
	if (user) {
		user.lastActive = Date.now();
		setToStorage(KEYS.USERS, users);
	}
}

export function createUser(name: string): User {
	const newUser: User = {
		id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
		name,
		createdAt: Date.now(),
		lastActive: Date.now()
	};

	const users = getUsers();
	users.push(newUser);
	setToStorage(KEYS.USERS, users);

	return newUser;
}

export function deleteUser(userId: string): void {
	// Remove from users list
	const users = getUsers().filter((u) => u.id !== userId);
	setToStorage(KEYS.USERS, users);

	// Clear current user if it was this user
	const currentUserId = getFromStorage<string | null>(KEYS.CURRENT_USER, null);
	if (currentUserId === userId) {
		setToStorage(KEYS.CURRENT_USER, null);
	}

	// Remove user's data
	if (typeof window !== 'undefined') {
		localStorage.removeItem(KEYS.history(userId));
		localStorage.removeItem(KEYS.customSets(userId));
	}

	// Remove high scores
	const highScores = getHighScores().filter((s) => s.userId !== userId);
	setToStorage(KEYS.HIGHSCORES, highScores);
}

// ============================================================================
// SESSION HISTORY
// ============================================================================

export function saveSession(userId: string, session: SessionStats): void {
	const history = getUserHistory(userId);
	// Copy rather than stamp: the caller hands us the live session store object.
	history.sessions.push({ ...session, completedAt: session.completedAt ?? Date.now() });
	setToStorage(KEYS.history(userId), history);
}

export function getUserHistory(userId: string): PracticeHistory {
	return getFromStorage<PracticeHistory>(KEYS.history(userId), {
		userId,
		sessions: []
	});
}

// ============================================================================
// HIGH SCORES
// ============================================================================

export function getHighScores(userId?: string): HighScore[] {
	const allScores = getFromStorage<HighScore[]>(KEYS.HIGHSCORES, []);
	if (userId) {
		return allScores.filter((s) => s.userId === userId);
	}
	return allScores;
}

export function updateHighScore(userId: string, score: HighScore): void {
	const scores = getHighScores();
	const existingIndex = scores.findIndex(
		(s) => s.userId === userId && s.selectionKey === score.selectionKey
	);

	if (existingIndex >= 0) {
		scores[existingIndex] = score;
	} else {
		scores.push(score);
	}

	setToStorage(KEYS.HIGHSCORES, scores);
}

export function getPersonalBest(userId: string, selectionKey: string): HighScore | null {
	const matchingScores = getHighScores(userId).filter((s) => s.selectionKey === selectionKey);

	if (matchingScores.length === 0) return null;

	// Return the best score (highest accuracy, then fastest time)
	return matchingScores.reduce((best, current) => {
		if (current.accuracy > best.accuracy) return current;
		if (current.accuracy === best.accuracy && current.avgResponseTime < best.avgResponseTime) {
			return current;
		}
		return best;
	});
}

export function isNewHighScore(
	userId: string,
	selectionKey: string,
	session: SessionStats
): boolean {
	if (session.answers.length === 0) return false;

	const currentBest = getPersonalBest(userId, selectionKey);
	if (!currentBest) return true;

	const accuracy = sessionAccuracy(session.answers);
	const avgTime = sessionAvgTime(session.answers);

	// Higher accuracy wins, or same accuracy with faster time
	return (
		accuracy > currentBest.accuracy ||
		(accuracy === currentBest.accuracy && avgTime < currentBest.avgResponseTime)
	);
}

// ============================================================================
// CUSTOM PROBLEM SETS
// ============================================================================

export function getCustomProblemSets(userId: string): CustomProblemSet[] {
	return getFromStorage<CustomProblemSet[]>(KEYS.customSets(userId), []);
}

export function saveCustomProblemSet(userId: string, set: Omit<CustomProblemSet, 'id' | 'createdAt' | 'userId'>): CustomProblemSet {
	const sets = getCustomProblemSets(userId);

	const newSet: CustomProblemSet = {
		id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
		createdAt: Date.now(),
		userId,
		...set
	};

	sets.push(newSet);
	setToStorage(KEYS.customSets(userId), sets);

	return newSet;
}

export function updateCustomProblemSet(userId: string, setId: string, updates: Partial<CustomProblemSet>): void {
	const sets = getCustomProblemSets(userId);
	const index = sets.findIndex((s) => s.id === setId);

	if (index >= 0) {
		sets[index] = { ...sets[index], ...updates };
		setToStorage(KEYS.customSets(userId), sets);
	}
}

export function deleteCustomProblemSet(userId: string, setId: string): void {
	const sets = getCustomProblemSets(userId).filter((s) => s.id !== setId);
	setToStorage(KEYS.customSets(userId), sets);

	// Also remove associated high scores
	const highScores = getHighScores().filter((s) => s.customSetId !== setId);
	setToStorage(KEYS.HIGHSCORES, highScores);
}
