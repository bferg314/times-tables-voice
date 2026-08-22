<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		/** Called on Escape, backdrop click, or the close affordance. */
		onclose: () => void;
		children: Snippet;
		actions: Snippet;
	}

	let { title, onclose, children, actions }: Props = $props();

	let panel = $state<HTMLDivElement | null>(null);

	function focusables(): HTMLElement[] {
		if (!panel) return [];
		return Array.from(
			panel.querySelectorAll<HTMLElement>(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
			)
		).filter((el) => !el.hasAttribute('disabled'));
	}

	$effect(() => {
		// Move focus into the dialog so keyboard and screen-reader users land here.
		focusables()[0]?.focus();
	});

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			onclose();
			return;
		}

		if (event.key !== 'Tab') return;

		// Keep focus inside the dialog while it is open.
		const items = focusables();
		if (items.length === 0) return;

		const first = items[0];
		const last = items[items.length - 1];
		const active = document.activeElement;

		if (event.shiftKey && active === first) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && active === last) {
			event.preventDefault();
			first.focus();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div
	class="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 transition-opacity"
	role="presentation"
	onclick={(event) => {
		if (event.target === event.currentTarget) onclose();
	}}
>
	<div
		bind:this={panel}
		class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transition-colors"
		role="dialog"
		aria-modal="true"
		aria-label={title}
	>
		<h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 transition-colors">
			{title}
		</h2>

		{@render children()}

		<div class="flex gap-3">
			{@render actions()}
		</div>
	</div>
</div>
