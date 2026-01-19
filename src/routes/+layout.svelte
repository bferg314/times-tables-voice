<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import '../app.css';
	import { isDarkMode } from '$lib/stores/theme';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	// Ensure dark mode is applied on initial load
	onMount(() => {
		// The theme store handles this, but we need to trigger a check
		isDarkMode.subscribe(() => {});
	});
</script>

<svelte:head>
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
