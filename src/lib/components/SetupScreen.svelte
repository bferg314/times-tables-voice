<script lang="ts">
	import { selectedNumbers, currentScreen, availableProblems, sessionStats, resetSession } from '$lib/stores/session';
	import { currentUser } from '$lib/stores/users';
	import { customSets, saveSelectionAsSet, removeCustomSet, findSetForSelection } from '$lib/stores/problemSets';
	import { generateProblems, countProblems } from '$lib/services/problemGenerator';
	import { describeSelection } from '$lib/services/sessionStats';
	import NumberGrid from './NumberGrid.svelte';
	import UserSelector from './UserSelector.svelte';
	import BrowserWarning from './BrowserWarning.svelte';
	import Modal from './Modal.svelte';

	let showSaveDialog = $state(false);
	let newSetName = $state('');
	let setToDelete = $state<string | null>(null);

	const problemCount = $derived(countProblems($selectedNumbers));

	const matchingSet = $derived(findSetForSelection($customSets, $selectedNumbers));

	function startPractice() {
		if ($selectedNumbers.length === 0) return;

		const problems = generateProblems($selectedNumbers);

		resetSession();
		availableProblems.set(problems);
		sessionStats.update((stats) => ({
			...stats,
			totalProblems: problems.length,
			selectedNumbers: [...$selectedNumbers]
		}));

		currentScreen.set('practice');
	}

	function viewHistory() {
		currentScreen.set('history');
	}

	function confirmSave() {
		if (!newSetName.trim()) return;
		saveSelectionAsSet(newSetName.trim(), $selectedNumbers);
		newSetName = '';
		showSaveDialog = false;
	}

	function cancelSave() {
		newSetName = '';
		showSaveDialog = false;
	}

	function confirmDeleteSet() {
		if (setToDelete) removeCustomSet(setToDelete);
		setToDelete = null;
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

	<!-- Saved selections -->
	{#if $currentUser}
		<div class="mb-6">
			<div class="flex items-center justify-between mb-3">
				<h2 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase transition-colors">
					Saved Sets
				</h2>
				<button
					onclick={() => (showSaveDialog = true)}
					disabled={$selectedNumbers.length === 0 || matchingSet !== undefined}
					title={matchingSet ? `Already saved as "${matchingSet.name}"` : 'Save this selection'}
					class="text-sm bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400 font-semibold py-1.5 px-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					💾 Save this selection
				</button>
			</div>

			{#if $customSets.length === 0}
				<p class="text-sm text-gray-400 dark:text-gray-500 transition-colors">
					No saved sets yet — pick some numbers and save them for one-click practice.
				</p>
			{:else}
				<div class="flex flex-wrap gap-2">
					{#each $customSets as set (set.id)}
						<div
							class="flex items-center gap-2 rounded-lg border-2 px-3 py-1.5 transition-colors {matchingSet?.id === set.id
								? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
								: 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}"
						>
							<button
								onclick={() => selectedNumbers.set([...set.selectedNumbers])}
								class="text-left"
							>
								<span class="font-semibold text-gray-700 dark:text-gray-200 transition-colors">{set.name}</span>
								<span class="text-xs text-gray-500 dark:text-gray-400 ml-2 transition-colors">
									{set.selectedNumbers.join(', ')}
								</span>
							</button>
							<button
								onclick={() => (setToDelete = set.id)}
								class="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
								aria-label="Delete set {set.name}"
							>
								🗑️
							</button>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	<div class="mb-6 p-4 bg-blue-50 dark:bg-gray-700 rounded-lg transition-colors">
		<p class="text-center text-gray-700 dark:text-gray-200 transition-colors">
			<span class="font-bold text-indigo-900 dark:text-indigo-300">{$selectedNumbers.length}</span> numbers selected
			<span class="mx-2">•</span>
			<span class="font-bold text-indigo-900 dark:text-indigo-300">{problemCount}</span> total problems
			<span class="text-sm text-gray-500 dark:text-gray-400 block mt-1">
				{describeSelection($selectedNumbers, matchingSet?.name)} — each selected number paired with 0-12
			</span>
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

{#if showSaveDialog}
	<Modal title="Save This Selection" onclose={cancelSave}>
		{#snippet children()}
			<p class="text-sm text-gray-500 dark:text-gray-400 mb-3 transition-colors">
				{$selectedNumbers.join(', ')}
			</p>
			<input
				type="text"
				bind:value={newSetName}
				onkeydown={(e) => e.key === 'Enter' && confirmSave()}
				placeholder="Name this set"
				class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none mb-4 transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
			/>
		{/snippet}
		{#snippet actions()}
			<button
				onclick={confirmSave}
				disabled={!newSetName.trim()}
				class="flex-1 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			>
				Save
			</button>
			<button
				onclick={cancelSave}
				class="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold py-3 px-6 rounded-xl transition-colors"
			>
				Cancel
			</button>
		{/snippet}
	</Modal>
{/if}

{#if setToDelete}
	<Modal title="Delete Saved Set?" onclose={() => (setToDelete = null)}>
		{#snippet children()}
			<p class="text-gray-600 dark:text-gray-300 mb-6 transition-colors">
				This removes the saved set. Your practice history and high scores are not affected.
			</p>
		{/snippet}
		{#snippet actions()}
			<button
				onclick={confirmDeleteSet}
				class="flex-1 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl transition-colors"
			>
				Yes, Delete
			</button>
			<button
				onclick={() => (setToDelete = null)}
				class="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold py-3 px-6 rounded-xl transition-colors"
			>
				Cancel
			</button>
		{/snippet}
	</Modal>
{/if}
