<script lang="ts">
	import { sessionStats, currentScreen, resetSession, availableProblems } from '$lib/stores/session';
	import { currentUser } from '$lib/stores/users';
	import { saveSession, isNewHighScore, updateHighScore, getPersonalBest } from '$lib/services/storage';
	import {
		sessionAccuracy,
		sessionAvgTime,
		correctCount,
		selectionKey,
		classifySelection,
		describeSelection
	} from '$lib/services/sessionStats';
	import { customSets, findSetForSelection } from '$lib/stores/problemSets';
	import type { ProblemStats, HighScore } from '$lib/types';

	/** How many of the weakest problems to surface for more practice. */
	const WEAKEST_PROBLEM_COUNT = 5;

	let isHighScore = $state(false);
	let previousBest = $state<HighScore | null>(null);

	const answers = $derived($sessionStats.answers);
	const totalProblems = $derived(answers.length);
	const correctAnswers = $derived(correctCount(answers));
	const accuracy = $derived(sessionAccuracy(answers));
	const avgTime = $derived(sessionAvgTime(answers));
	const selectedNumbers = $derived($sessionStats.selectedNumbers ?? []);

	const totalSessionTime = $derived(
		$sessionStats.completedAt
			? $sessionStats.completedAt - $sessionStats.startedAt
			: Date.now() - $sessionStats.startedAt
	);

	const weakestProblems = $derived.by(() =>
		Object.entries($sessionStats.problemStats)
			.map(([problem, stats]) => ({
				...stats,
				problem,
				accuracy: (stats.correct / stats.attempts) * 100,
				avgTime: stats.totalTime / stats.attempts
			}))
			// Weakest first: lowest accuracy, and among equals the slowest.
			.sort((a, b) => a.accuracy - b.accuracy || b.avgTime - a.avgTime)
			.slice(0, WEAKEST_PROBLEM_COUNT) satisfies Array<
			ProblemStats & { problem: string; accuracy: number; avgTime: number }
		>
	);

	// Only a session that actually ran out of problems counts. The Report button is
	// reachable mid-session, and recording a one-answer peek would lock in a 100% best.
	const isComplete = $derived($availableProblems.length === 0 && answers.length > 0);

	$effect(() => {
		if (!isComplete || !$currentUser) return;

		const user = $currentUser;
		const key = selectionKey(selectedNumbers);

		// Runs once: the session is stamped complete, which makes isComplete's inputs stable.
		if ($sessionStats.completedAt) return;

		previousBest = getPersonalBest(user.id, key);
		isHighScore = isNewHighScore(user.id, key, $sessionStats);

		const completed = { ...$sessionStats, completedAt: Date.now() };
		sessionStats.set(completed);
		saveSession(user.id, completed);

		if (isHighScore) {
			const savedSet = findSetForSelection($customSets, selectedNumbers);
			updateHighScore(user.id, {
				userId: user.id,
				selectionKey: key,
				selectedNumbers: [...selectedNumbers],
				problemSet: classifySelection(selectedNumbers),
				customSetId: savedSet?.id,
				customSetName: savedSet?.name,
				accuracy: sessionAccuracy(completed.answers),
				avgResponseTime: sessionAvgTime(completed.answers),
				totalProblems: completed.answers.length,
				completedAt: completed.completedAt!
			});
		}
	});

	function startNewSession() {
		resetSession();
		currentScreen.set('setup');
	}

	function viewHistory() {
		currentScreen.set('history');
	}

	function formatSessionTime(ms: number): string {
		const totalSeconds = Math.floor(ms / 1000);
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
	}
</script>

<div class="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 transition-colors">
	<h1 class="text-4xl font-bold text-indigo-900 dark:text-indigo-300 mb-2 text-center transition-colors">
		{isComplete ? 'Session Complete! 🎉' : 'Progress So Far 📈'}
	</h1>
	<p class="text-center text-gray-500 dark:text-gray-400 mb-8 transition-colors">
		{describeSelection(selectedNumbers)}
		{#if !isComplete}
			<span class="block text-sm mt-1">Not saved yet — finish the session to record it.</span>
		{/if}
	</p>

	<!-- High Score Celebration -->
	{#if isHighScore && $currentUser}
		<div class="mb-8 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/40 dark:to-orange-900/40 border-4 border-yellow-400 dark:border-yellow-600 rounded-2xl p-6 transition-colors">
			<div class="text-center">
				<div class="text-5xl mb-2">🏆</div>
				<div class="text-2xl font-bold text-orange-900 dark:text-orange-200 mb-2 transition-colors">NEW HIGH SCORE!</div>
				<div class="text-gray-700 dark:text-gray-300 transition-colors">
					{#if previousBest}
						Beat your previous best of {Math.round(previousBest.accuracy)}% accuracy!
					{:else}
						Your first high score for {describeSelection(selectedNumbers)}!
					{/if}
				</div>
			</div>
		</div>
	{/if}

	<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
		<div class="text-center p-6 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl transition-colors">
			<div class="text-4xl font-bold text-indigo-900 dark:text-indigo-300 transition-colors">
				{Math.round(accuracy)}%
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

	{#if weakestProblems.length > 0}
		<div class="mb-8">
			<h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 transition-colors">Problems to Practice 📚</h2>
			<div class="space-y-3">
				{#each weakestProblems as stat (stat.problem)}
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
		{#if $availableProblems.length > 0}
			<button
				onclick={() => currentScreen.set('practice')}
				class="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white font-bold py-4 px-6 rounded-xl transition-colors"
			>
				▶️ Resume
			</button>
		{/if}
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
