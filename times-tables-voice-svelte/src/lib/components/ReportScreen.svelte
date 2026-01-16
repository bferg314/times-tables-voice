<script lang="ts">
	import { onMount } from 'svelte';
	import { sessionStats, currentScreen, resetSession } from '$lib/stores/session';
	import { currentUser } from '$lib/stores/users';
	import { saveSession, isNewHighScore, updateHighScore, getPersonalBest } from '$lib/services/storage';
	import type { ProblemStats, HighScore } from '$lib/types';

	let isHighScore = false;
	let previousBest: HighScore | null = null;
	let sessionSaved = false;

	onMount(() => {
		// Set completion time if not already set
		if (!$sessionStats.completedAt) {
			sessionStats.update(s => ({ ...s, completedAt: Date.now() }));
		}

		// Check if this is a new high score
		if ($currentUser && $sessionStats.answers.length > 0) {
			const problemSetType = 'all'; // TODO: Track actual problem set type
			isHighScore = isNewHighScore($currentUser.id, problemSetType, $sessionStats);
			previousBest = getPersonalBest($currentUser.id, problemSetType);

			// Auto-save session if user is logged in
			if (!sessionSaved) {
				saveSession($currentUser.id, $sessionStats);
				sessionSaved = true;

				// Update high score if this is a new best
				if (isHighScore) {
					const accuracy = (correctAnswers / totalProblems) * 100;
					const newHighScore: HighScore = {
						userId: $currentUser.id,
						problemSet: 'all',
						accuracy,
						avgResponseTime: avgTime,
						totalProblems,
						completedAt: Date.now()
					};
					updateHighScore($currentUser.id, newHighScore);
				}
			}
		}
	});

	function getProblemChildren(): Array<ProblemStats & { problem: string; accuracy: number; avgTime: number }> {
		const statsArray = Object.entries($sessionStats.problemStats).map(([problem, stats]) => ({
			...stats,
			problem,
			accuracy: (stats.correct / stats.attempts) * 100,
			avgTime: stats.totalTime / stats.attempts
		}));

		// Sort by accuracy (ascending) then by avg time (descending)
		return statsArray
			.sort((a, b) => {
				if (Math.abs(a.accuracy - b.accuracy) > 10) {
					return a.accuracy - b.accuracy;
				}
				return b.avgTime - a.avgTime;
			})
			.slice(0, 5);
	}

	function startNewSession() {
		resetSession();
		currentScreen.set('setup');
	}

	function viewHistory() {
		currentScreen.set('history');
	}

	$: totalProblems = $sessionStats.answers.length;
	$: correctAnswers = $sessionStats.answers.filter((s) => s.correct).length;
	$: avgTime =
		totalProblems > 0
			? $sessionStats.answers.reduce((sum, s) => sum + s.responseTime, 0) / totalProblems
			: 0;
	$: totalSessionTime = $sessionStats.completedAt
		? $sessionStats.completedAt - $sessionStats.startedAt
		: Date.now() - $sessionStats.startedAt;
	$: problemChildren = getProblemChildren();

	function formatSessionTime(ms: number): string {
		const totalSeconds = Math.floor(ms / 1000);
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		if (minutes > 0) {
			return `${minutes}m ${seconds}s`;
		}
		return `${seconds}s`;
	}
</script>

<div class="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 transition-colors">
	<h1 class="text-4xl font-bold text-indigo-900 dark:text-indigo-300 mb-8 text-center transition-colors">Session Complete! 🎉</h1>

	<!-- High Score Celebration -->
	{#if isHighScore && $currentUser}
		<div class="mb-8 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/40 dark:to-orange-900/40 border-4 border-yellow-400 dark:border-yellow-600 rounded-2xl p-6 animate-pulse transition-colors">
			<div class="text-center">
				<div class="text-5xl mb-2">🏆</div>
				<div class="text-2xl font-bold text-orange-900 dark:text-orange-200 mb-2 transition-colors">NEW HIGH SCORE!</div>
				<div class="text-gray-700 dark:text-gray-300 transition-colors">
					{#if previousBest}
						Beat your previous best of {Math.round(previousBest.accuracy)}% accuracy!
					{:else}
						Your first high score!
					{/if}
				</div>
			</div>
		</div>
	{/if}

	<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
		<div class="text-center p-6 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl transition-colors">
			<div class="text-4xl font-bold text-indigo-900 dark:text-indigo-300 transition-colors">
				{totalProblems > 0 ? Math.round((correctAnswers / totalProblems) * 100) : 0}%
			</div>
			<div class="text-gray-600 dark:text-gray-400 mt-2 transition-colors">Accuracy</div>
		</div>

		<div class="text-center p-6 bg-green-50 dark:bg-green-900/30 rounded-xl transition-colors">
			<div class="text-4xl font-bold text-green-900 dark:text-green-300 transition-colors">{correctAnswers}/{totalProblems}</div>
			<div class="text-gray-600 dark:text-gray-400 mt-2 transition-colors">Correct</div>
		</div>

		<div class="text-center p-6 bg-purple-50 dark:bg-purple-900/30 rounded-xl transition-colors">
			<div class="text-4xl font-bold text-purple-900 dark:text-purple-300 transition-colors">{(avgTime / 1000).toFixed(1)}s</div>
			<div class="text-gray-600 dark:text-gray-400 mt-2 transition-colors">Avg Time</div>
		</div>

		<div class="text-center p-6 bg-blue-50 dark:bg-blue-900/30 rounded-xl transition-colors">
			<div class="text-4xl font-bold text-blue-900 dark:text-blue-300 transition-colors">{formatSessionTime(totalSessionTime)}</div>
			<div class="text-gray-600 dark:text-gray-400 mt-2 transition-colors">Total Time</div>
		</div>
	</div>

	{#if problemChildren.length > 0}
		<div class="mb-8">
			<h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 transition-colors">Problems to Practice 📚</h2>
			<div class="space-y-3">
				{#each problemChildren as stat}
					<div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg flex justify-between items-center transition-colors">
						<div>
							<span class="text-xl font-bold text-indigo-900 dark:text-indigo-300 transition-colors">{stat.problem}</span>
							<span class="text-gray-500 dark:text-gray-400 ml-4 transition-colors"
								>{stat.correct}/{stat.attempts} correct ({Math.round(stat.accuracy)}%)</span
							>
						</div>
						<div class="text-gray-500 dark:text-gray-400 text-sm transition-colors">{(stat.avgTime / 1000).toFixed(1)}s avg</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<div class="flex gap-4">
		<button
			onclick={startNewSession}
			class="flex-1 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-bold py-4 px-6 rounded-xl transition-colors"
		>
			🔄 New Session
		</button>
		{#if $currentUser}
			<button
				onclick={viewHistory}
				class="flex-1 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/40 dark:hover:bg-purple-800/50 text-purple-700 dark:text-purple-300 font-bold py-4 px-6 rounded-xl transition-colors"
			>
				📊 View History
			</button>
		{/if}
	</div>
</div>
