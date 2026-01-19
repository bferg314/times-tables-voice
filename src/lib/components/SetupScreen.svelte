<script lang="ts">
	import { selectedNumbers, currentScreen, availableProblems, sessionStats } from '$lib/stores/session';
	import { currentUser } from '$lib/stores/users';
	import { generateProblems } from '$lib/services/problemGenerator';
	import NumberGrid from './NumberGrid.svelte';
	import UserSelector from './UserSelector.svelte';
	import BrowserWarning from './BrowserWarning.svelte';

	function startPractice() {
		if ($selectedNumbers.length === 0) return;

		// Generate problems
		const problems = generateProblems($selectedNumbers);
		availableProblems.set(problems);

		// Reset session stats
		sessionStats.set({
			answers: [],
			problemStats: {},
			totalProblems: problems.length,
			startedAt: Date.now(),
			selectedNumbers: [...$selectedNumbers] // Save which times tables are being practiced
		});

		// Navigate to practice screen
		currentScreen.set('practice');
	}

	function viewHistory() {
		currentScreen.set('history');
	}
</script>

<div class="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 transition-colors">
	<!-- User selector at top -->
	<div class="flex justify-between items-center mb-6">
		<UserSelector />
		{#if $currentUser}
			<button
				onclick={viewHistory}
				class="bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-400 font-semibold py-2 px-4 rounded-xl transition-colors"
			>
				📊 View History
			</button>
		{/if}
	</div>

	<h1 class="text-4xl font-bold text-indigo-900 dark:text-indigo-300 mb-4 text-center transition-colors">Times Tables Practice 🎯</h1>
	<p class="text-center text-gray-600 dark:text-gray-300 mb-8 transition-colors">
		Select which numbers you want to practice (click to toggle)
	</p>

	<!-- Browser compatibility warning -->
	<BrowserWarning />

	<NumberGrid />

	<div class="mb-6 p-4 bg-blue-50 dark:bg-gray-700 rounded-lg transition-colors">
		<p class="text-center text-gray-700 dark:text-gray-200 transition-colors">
			<span class="font-bold text-indigo-900 dark:text-indigo-300">{$selectedNumbers.length}</span> numbers selected
			<span class="mx-2">•</span>
			<span class="font-bold text-indigo-900 dark:text-indigo-300"
				>{generateProblems($selectedNumbers).length}</span
			> total problems
			<span class="text-sm text-gray-500 dark:text-gray-400 block mt-1">(each number × 0-12)</span>
		</p>
	</div>

	<button
		onclick={startPractice}
		disabled={$selectedNumbers.length === 0}
		class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600"
	>
		🚀 Start Practice
	</button>
</div>
