<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { isDarkMode } from '$lib/stores/theme';

	let { children } = $props();

	// Ensure dark mode is applied on initial load
	onMount(() => {
		// The theme store handles this, but we need to trigger a check
		isDarkMode.subscribe(() => {});
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<!-- Prevent flash of unstyled content - apply dark mode before page renders -->
	<script>
		// This runs before the page renders
		(function() {
			const stored = localStorage.getItem('ttvapp_theme');
			const isDark = stored === 'dark' ||
				(stored !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);

			if (isDark) {
				document.documentElement.classList.add('dark');
			}
		})();
	</script>
</svelte:head>

{@render children()}
