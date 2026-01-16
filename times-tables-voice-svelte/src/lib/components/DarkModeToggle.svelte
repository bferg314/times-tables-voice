<script lang="ts">
	import { isDarkMode, toggleDarkMode } from '$lib/stores/theme';
</script>

<button
	onclick={toggleDarkMode}
	class="p-3 rounded-xl transition-colors bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
	aria-label="Toggle dark mode"
	title={$isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
>
	<span class="text-2xl">
		{#if $isDarkMode}
			☀️
		{:else}
			🌙
		{/if}
	</span>
</button>
