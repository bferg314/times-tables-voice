<script lang="ts">
	import type { Snippet } from 'svelte';
	import '../app.css';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<svelte:head>
	<!-- Prevent flash of unstyled content - apply dark mode before page renders -->
	<script>
		// Runs before the page renders, so it cannot import KEYS.THEME from the app
		// bundle - this literal must stay in step with storage.ts.
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
