// User system
export interface User {
	id: string;
	name: string;
	createdAt: number;
	lastActive: number;
}

// Problem types
export interface Problem {
	num1: number;
	num2: number;
	answer: number;
}

export type ProblemSet = 'all' | 'hard' | 'random' | 'custom';

export interface CustomProblemSet {
	id: string;
	name: string;
	selectedNumbers: number[];
	createdAt: number;
	userId: string;
}

// Session tracking
export interface SessionAnswer {
	problem: string; // e.g. "3×4"
	correct: boolean;
	spokenAnswer: number;
	responseTime: number;
	speedCategory: 'fast' | 'medium' | 'slow';
	timestamp: number;
}

export interface ProblemStats {
	attempts: number;
	totalTime: number;
	correct: number;
	num1: number;
	num2: number;
}

export interface SessionStats {
	answers: SessionAnswer[];
	problemStats: Record<string, ProblemStats>;
	totalProblems: number;
	startedAt: number;
	completedAt?: number;
	problemSetType?: ProblemSet | string; // 'all', 'hard', 'random', or custom set ID
	selectedNumbers?: number[]; // Which times tables were practiced
}

// High scores & history
export interface HighScore {
	userId: string;
	problemSet: ProblemSet;
	customSetId?: string;
	customSetName?: string;
	accuracy: number; // Percentage
	avgResponseTime: number; // Milliseconds
	totalProblems: number;
	completedAt: number;
}

export interface PracticeHistory {
	userId: string;
	sessions: SessionStats[];
}

// UI State
export type AppScreen = 'setup' | 'practice' | 'report' | 'history';

// Audio
export interface AudioState {
	isListening: boolean;
	volumeLevel: number;
	autoListen: boolean;
	error: string | null;
}
