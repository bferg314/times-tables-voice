<script lang="ts">
	import { currentScreen } from '$lib/stores/session';

	import SetupScreen from '$lib/components/SetupScreen.svelte';
	import PracticeScreen from '$lib/components/PracticeScreen.svelte';
	import ReportScreen from '$lib/components/ReportScreen.svelte';
	import HistoryScreen from '$lib/components/HistoryScreen.svelte';
	import DarkModeToggle from '$lib/components/DarkModeToggle.svelte';
</script>

<div class="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 transition-colors">
	<!-- Dark mode toggle -->
	<div class="fixed top-4 right-4 z-50">
		<DarkModeToggle />
	</div>

	<div class="p-8">
		{#if $currentScreen === 'setup'}
			<SetupScreen />
		{:else if $currentScreen === 'practice'}
			<PracticeScreen />
		{:else if $currentScreen === 'report'}
			<ReportScreen />
		{:else if $currentScreen === 'history'}
			<HistoryScreen />
		{/if}
	</div>
</div>
