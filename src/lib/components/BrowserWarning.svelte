<script lang="ts">
	import { onMount } from 'svelte';
	import { detectBrowserSupport, type BrowserInfo } from '$lib/utils/browserDetection';

	let browserInfo = $state<BrowserInfo | null>(null);
	let dismissed = $state(false);

	onMount(() => {
		browserInfo = detectBrowserSupport();
	});

	function dismiss() {
		dismissed = true;
	}
</script>

{#if browserInfo && !browserInfo.isSupported && !dismissed}
	<div class="mb-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-400 dark:border-red-600 rounded-xl p-6 shadow-lg transition-colors">
		<div class="flex items-start gap-4">
			<div class="text-4xl flex-shrink-0">⚠️</div>
			<div class="flex-1">
				<h3 class="text-xl font-bold text-red-900 dark:text-red-200 mb-2 transition-colors">
					Unsupported Browser Detected
				</h3>
				<p class="text-red-800 dark:text-red-300 mb-3 transition-colors">
					You are using <strong>{browserInfo.browserName}</strong>, which does not support the Web Speech Recognition API required for this app.
				</p>

				{#if browserInfo.browserName === 'Firefox'}
					<div class="bg-red-100 dark:bg-red-900/40 rounded-lg p-4 mb-3 transition-colors">
						<p class="text-red-900 dark:text-red-200 text-sm mb-2 transition-colors">
							<strong>Firefox users:</strong> Unfortunately, Mozilla has not implemented the Web Speech Recognition API, and there are no plans to add it in the near future.
						</p>
						<p class="text-red-800 dark:text-red-300 text-sm transition-colors">
							We wish Firefox was supported too! 🦊 For now, you'll need to use a Chromium-based browser.
						</p>
					</div>
				{/if}

				<div class="space-y-2">
					<p class="text-red-800 dark:text-red-300 font-semibold transition-colors">
						✅ This app works in Chromium-based browsers:
					</p>
					<ul class="list-disc list-inside text-red-800 dark:text-red-300 space-y-1 ml-4 transition-colors">
						<li><strong>Google Chrome</strong> - <a href="https://www.google.com/chrome/" target="_blank" rel="noopener noreferrer" class="underline hover:text-red-900 dark:hover:text-red-100">Download Chrome</a></li>
						<li><strong>Microsoft Edge</strong> - <a href="https://www.microsoft.com/edge" target="_blank" rel="noopener noreferrer" class="underline hover:text-red-900 dark:hover:text-red-100">Download Edge</a></li>
						<li><strong>Brave Browser</strong> - <a href="https://brave.com/" target="_blank" rel="noopener noreferrer" class="underline hover:text-red-900 dark:hover:text-red-100">Download Brave</a></li>
						<li><strong>Opera</strong> - <a href="https://www.opera.com/" target="_blank" rel="noopener noreferrer" class="underline hover:text-red-900 dark:hover:text-red-100">Download Opera</a></li>
						<li>Other Chromium-based browsers (Vivaldi, Arc, etc.)</li>
					</ul>
				</div>

				<div class="mt-4 pt-4 border-t border-red-300 dark:border-red-700">
					<p class="text-red-700 dark:text-red-400 text-sm transition-colors">
						<strong>Why this limitation?</strong> This app uses the browser's built-in voice recognition, which is only available in Chromium browsers. We can't work around this limitation.
					</p>
				</div>
			</div>
			<button
				onclick={dismiss}
				class="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 text-2xl flex-shrink-0 transition-colors"
				aria-label="Dismiss warning"
			>
				×
			</button>
		</div>
	</div>
{/if}
