<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		currentProblem,
		availableProblems,
		sessionStats,
		feedback,
		transcript,
		startTime,
		currentScreen,
		resetSession,
		helpMessage,
		autoAdvanceCountdown
	} from '$lib/stores/session';
	import { audioState } from '$lib/stores/audio';
	import { speechService } from '$lib/services/speechRecognition';
	import { audioService } from '$lib/services/audioVisualization';
	import { categorizeSpeed } from '$lib/services/problemGenerator';
	import { practiceProgress } from '$lib/services/sessionStats';
	import type { SessionAnswer } from '$lib/types';
	import VolumeBar from './VolumeBar.svelte';
	import Modal from './Modal.svelte';

	/** Pause before auto-listening, so the learner can read the new problem first. */
	const AUTO_LISTEN_DELAY_MS = 300;
	/** Feedback dwell times. Whole seconds, so the countdown shown matches reality. */
	const CORRECT_FEEDBACK_MS = 2000;
	const WRONG_FEEDBACK_MS = 3000;
	const COUNTDOWN_TICK_MS = 1000;
	const RETRY_DELAY_MS = 1500;
	const MAX_RETRIES = 2;

	let feedbackTimeout: ReturnType<typeof setTimeout> | null = null;
	let countdownInterval: ReturnType<typeof setInterval> | null = null;
	let retryTimeout: ReturnType<typeof setTimeout> | null = null;
	let autoListenTimeout: ReturnType<typeof setTimeout> | null = null;
	let retryCount = 0;

	let showAbandonModal = $state(false);

	const progress = $derived(
		practiceProgress({
			answered: $sessionStats.answers.length,
			queued: $availableProblems.length,
			currentAwaitingAnswer: $currentProblem !== null && $feedback === null
		})
	);

	const feedbackClass = $derived(
		!$feedback
			? ''
			: !$feedback.correct
				? 'bg-red-100 dark:bg-red-900/30 border-4 border-red-400 dark:border-red-500'
				: $feedback.speedCategory === 'fast'
					? 'bg-green-100 dark:bg-green-900/30 border-4 border-green-400 dark:border-green-500'
					: $feedback.speedCategory === 'medium'
						? 'bg-yellow-100 dark:bg-yellow-900/30 border-4 border-yellow-400 dark:border-yellow-500'
						: 'bg-orange-100 dark:bg-orange-900/30 border-4 border-orange-400 dark:border-orange-500'
	);

	onMount(() => {
		// The mic is only needed while practising, so the permission prompt and the
		// analyser loop both start here rather than on app load.
		audioService.init();
		speechService.onResult(handleSpeechResult);
		nextProblem();
	});

	onDestroy(() => {
		clearTimers();
		// destroy() detaches the callback; without it a trailing recognition event
		// would restart the microphone on whichever screen comes next.
		speechService.destroy();
		audioService.stop();
	});

	function clearTimers() {
		if (feedbackTimeout) clearTimeout(feedbackTimeout);
		if (retryTimeout) clearTimeout(retryTimeout);
		if (autoListenTimeout) clearTimeout(autoListenTimeout);
		if (countdownInterval) clearInterval(countdownInterval);
		feedbackTimeout = retryTimeout = autoListenTimeout = null;
		countdownInterval = null;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.code === 'Space' && !$feedback && !$audioState.isListening && !showAbandonModal) {
			e.preventDefault();
			speechService.start();
		}
	}

	function nextProblem() {
		clearTimers();
		// Stop before starting: a late result from the previous problem would otherwise
		// be scored against this one, with a response time measured from the wrong clock.
		speechService.stop();

		feedback.set(null);
		transcript.set('');
		helpMessage.set('');
		autoAdvanceCountdown.set(0);
		retryCount = 0;

		if ($availableProblems.length === 0) {
			currentScreen.set('report');
			return;
		}

		const problem = $availableProblems[0];
		availableProblems.update((p) => p.slice(1));
		currentProblem.set(problem);
		startTime.set(Date.now());

		if ($audioState.autoListen) {
			autoListenTimeout = setTimeout(() => speechService.start(), AUTO_LISTEN_DELAY_MS);
		}
	}

	function handleUnparsed() {
		// A denied permission or dead connection will never succeed; retrying would loop.
		if (speechService.isFatal) {
			helpMessage.set('Voice input is unavailable. Check the message below the microphone.');
			return;
		}

		retryCount++;

		if (retryCount > MAX_RETRIES) {
			helpMessage.set(
				"Still having trouble. Press Space or tap the microphone, then say just a number (like 'five' or 'twelve')."
			);
			return;
		}

		helpMessage.set(`Didn't catch that. Try again! (${retryCount}/${MAX_RETRIES})`);

		if (!$audioState.autoListen) return;

		retryTimeout = setTimeout(() => {
			helpMessage.set('');
			transcript.set('');
			speechService.start();
		}, RETRY_DELAY_MS);
	}

	function handleSpeechResult(_text: string, spokenNumber: number | null) {
		if (!$currentProblem || !$startTime || $feedback) return;

		if (spokenNumber === null) {
			handleUnparsed();
			return;
		}

		retryCount = 0;

		const responseTime = Date.now() - $startTime;
		const isCorrect = spokenNumber === $currentProblem.answer;
		const speed = categorizeSpeed(responseTime);
		const problemKey = `${$currentProblem.num1}×${$currentProblem.num2}`;
		const { num1, num2 } = $currentProblem;

		const answer: SessionAnswer = {
			problem: problemKey,
			correct: isCorrect,
			spokenAnswer: spokenNumber,
			responseTime,
			speedCategory: speed,
			timestamp: Date.now()
		};

		sessionStats.update((stats) => {
			stats.answers.push(answer);

			const current = stats.problemStats[problemKey] ?? {
				attempts: 0,
				totalTime: 0,
				correct: 0,
				num1,
				num2
			};

			stats.problemStats[problemKey] = {
				...current,
				attempts: current.attempts + 1,
				totalTime: current.totalTime + responseTime,
				correct: current.correct + (isCorrect ? 1 : 0)
			};

			return stats;
		});

		feedback.set(answer);

		const delayMs = isCorrect ? CORRECT_FEEDBACK_MS : WRONG_FEEDBACK_MS;
		autoAdvanceCountdown.set(delayMs / COUNTDOWN_TICK_MS);

		countdownInterval = setInterval(() => {
			autoAdvanceCountdown.update((count) => Math.max(0, count - 1));
		}, COUNTDOWN_TICK_MS);

		feedbackTimeout = setTimeout(nextProblem, delayMs);
	}

	function toggleAutoListen() {
		audioState.update((s) => ({ ...s, autoListen: !s.autoListen }));
	}

	function skip() {
		nextProblem();
	}

	function showReport() {
		currentScreen.set('report');
	}

	function confirmAbandon() {
		showAbandonModal = false;
		resetSession();
		currentScreen.set('setup');
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="max-w-5xl mx-auto">
	<!-- Compact header with progress -->
	<div class="flex items-center justify-between mb-4 px-4">
		<div class="flex-1">
			<h1 class="text-3xl font-bold text-indigo-900 dark:text-indigo-300 transition-colors">Times Tables Practice 🎯</h1>
		</div>
		<div class="flex-1 px-6">
			<!-- Progress bar -->
			<div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden transition-colors">
				<div
					class="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500 ease-out"
					style="width: {progress.percent}%"
				></div>
			</div>
			<p class="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center transition-colors">
				{progress.answered} of {progress.total} ({Math.round(progress.percent)}%)
			</p>
		</div>
		<div class="flex-1 flex justify-end gap-2">
			<button
				onclick={skip}
				class="bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold py-2 px-4 rounded-xl transition-colors text-sm"
			>
				🔄 Skip
			</button>
			<button
				onclick={showReport}
				disabled={progress.answered === 0}
				class="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
			>
				📈 Report
			</button>
		</div>
	</div>

	<div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl transition-colors {feedbackClass}">
		{#if $currentProblem}
		<div class="grid grid-cols-1 md:grid-cols-2 md:divide-x divide-gray-200 dark:divide-gray-700">
			<!-- Left side: Question and Feedback -->
			<div class="p-8 flex flex-col justify-center">
				<!-- Question -->
				<div class="text-center mb-6">
					<div class="text-6xl md:text-8xl font-bold text-indigo-900 dark:text-indigo-200 transition-colors leading-none">
						{$currentProblem.num1} × {$currentProblem.num2}
					</div>
					<div class="text-4xl md:text-6xl text-gray-400 dark:text-gray-500 mt-2">= ?</div>
				</div>

				<!-- Fixed height feedback area to prevent jumping -->
				<div class="text-center min-h-[100px] flex items-center justify-center">
					{#if $feedback}
						<div class="w-full">
							<div class="text-3xl font-bold mb-1 {$feedback.correct ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
								{$feedback.correct ? '✓ Correct!' : '✗ Wrong'}
							</div>
							<div class="text-lg text-gray-700 dark:text-gray-300 transition-colors">
								You said: <strong>{$feedback.spokenAnswer}</strong>
								{#if !$feedback.correct}
									<br />
									<span class="text-gray-500 dark:text-gray-400">Answer: {$currentProblem.answer}</span>
								{:else if $feedback.speedCategory === 'fast'}
									<br /><span class="text-sm">⚡ Lightning fast!</span>
								{:else if $feedback.speedCategory === 'medium'}
									<br /><span class="text-sm">👍 Good speed!</span>
								{:else}
									<br /><span class="text-sm">🐢 Try faster!</span>
								{/if}
							</div>
							{#if $autoAdvanceCountdown > 0}
								<div class="mt-2 text-sm text-gray-500 dark:text-gray-400">
									Next in {$autoAdvanceCountdown}s...
								</div>
							{/if}
						</div>
					{:else if $helpMessage}
						<div class="w-full">
							<div class="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-lg p-3 transition-colors">
								<div class="text-xl mb-1">💡</div>
								<p class="text-sm text-yellow-800 dark:text-yellow-300 font-semibold transition-colors">
									{$helpMessage}
								</p>
							</div>
						</div>
					{:else if $transcript}
						<div class="w-full">
							<div class="text-xs text-gray-500 dark:text-gray-400 mb-1">You said:</div>
							<div class="text-xl font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg py-2 px-4 inline-block transition-colors">
								"{$transcript}"
							</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- Right side: Microphone Controls -->
			<div class="p-8 flex flex-col items-center justify-center">
				<!-- Fixed height container for microphone area -->
				<div class="flex flex-col items-center gap-3 h-[280px] justify-center">
					<button
						onclick={() => ($audioState.isListening ? speechService.stop() : speechService.start())}
						disabled={$feedback !== null}
						aria-label={$audioState.isListening ? 'Stop listening' : 'Start listening'}
						class="relative p-8 rounded-full transition-all {$audioState.isListening
							? 'bg-red-500 hover:bg-red-600 animate-pulse'
							: 'bg-indigo-600 hover:bg-indigo-700'} text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
					>
						<span class="text-4xl">{$audioState.isListening ? '🔴' : '🎤'}</span>
					</button>

					<!-- Fixed height status text area -->
					<div class="text-center min-h-[80px] flex flex-col items-center justify-center">
						{#if $feedback && $autoAdvanceCountdown > 0}
							<p class="text-base font-semibold text-gray-600 dark:text-gray-300 transition-colors">
								⏳ Wait {$autoAdvanceCountdown}s...
							</p>
						{:else if $audioState.isListening}
							<p class="text-lg font-semibold text-red-600 dark:text-red-400 transition-colors animate-pulse">
								🔴 Listening...
							</p>
							<p class="text-sm text-gray-500 dark:text-gray-400 transition-colors">Speak your answer now</p>
						{:else}
							<p class="text-base text-gray-700 dark:text-gray-300 transition-colors">
								🎤 Click to Answer
							</p>
							<p class="text-sm text-gray-500 dark:text-gray-400 transition-colors">
								Auto-listening {$audioState.autoListen ? 'ON' : 'OFF'} • Press
								<kbd class="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">Space</kbd>
							</p>
						{/if}
					</div>

					<VolumeBar />

					{#if $audioState.error}
						<div class="bg-red-100 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700 rounded-lg p-3 text-center max-w-xs transition-colors">
							<p class="text-sm text-red-800 dark:text-red-300 font-semibold transition-colors">{$audioState.error}</p>
						</div>
					{/if}
				</div>

				<!-- Auto-listen toggle button -->
				<button
					onclick={toggleAutoListen}
					class="w-full mt-6 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold py-2 px-4 rounded-xl transition-colors text-sm"
				>
					{$audioState.autoListen ? '🔇 Disable Auto-Listen' : '🔊 Enable Auto-Listen'}
				</button>
			</div>
		</div>
		{/if}
	</div>

	<div class="flex justify-center mt-4">
		<button
			onclick={() => (showAbandonModal = true)}
			class="bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 font-semibold py-2 px-6 rounded-xl transition-colors text-sm"
		>
			❌ Abandon Session
		</button>
	</div>
</div>

{#if showAbandonModal}
	<Modal title="Abandon Session?" onclose={() => (showAbandonModal = false)}>
		{#snippet children()}
			<p class="text-gray-600 dark:text-gray-300 mb-6 transition-colors">
				Are you sure you want to abandon this session? All progress will be lost and your answers
				won't be saved.
			</p>
		{/snippet}
		{#snippet actions()}
			<button
				onclick={confirmAbandon}
				class="flex-1 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl transition-colors"
			>
				Yes, Abandon
			</button>
			<button
				onclick={() => (showAbandonModal = false)}
				class="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold py-3 px-6 rounded-xl transition-colors"
			>
				Cancel
			</button>
		{/snippet}
	</Modal>
{/if}
