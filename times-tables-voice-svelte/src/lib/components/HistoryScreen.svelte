<script lang="ts">
	import { currentScreen } from '$lib/stores/session';
	import { currentUser } from '$lib/stores/users';
	import { getUserHistory, getHighScores } from '$lib/services/storage';
	import type { SessionStats } from '$lib/types';

	$: history = $currentUser ? getUserHistory($currentUser.id) : null;
	$: highScores = $currentUser ? getHighScores($currentUser.id) : [];
	$: sessions = history?.sessions || [];

	function goBack() {
		currentScreen.set('setup');
	}

	function formatDate(timestamp: number): string {
		const date = new Date(timestamp);
		return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}

	function getSessionAccuracy(session: SessionStats): number {
		if (session.answers.length === 0) return 0;
		return (session.answers.filter(a => a.correct).length / session.answers.length) * 100;
	}

	function getSessionAvgTime(session: SessionStats): number {
		if (session.answers.length === 0) return 0;
		return session.answers.reduce((sum, a) => sum + a.responseTime, 0) / session.answers.length;
	}
</script>

<div class="max-w-6xl mx-auto">
	<div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-6 transition-colors">
		<div class="flex justify-between items-center mb-6">
			<h1 class="text-4xl font-bold text-indigo-900 dark:text-indigo-300 transition-colors">
				{$currentUser?.name}'s History 📊
			</h1>
			<button
				onclick={goBack}
				class="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold py-2 px-4 rounded-xl transition-colors"
			>
				← Back
			</button>
		</div>

		<!-- High Scores -->
		{#if highScores.length > 0}
			<div class="mb-8">
				<h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 transition-colors">🏆 High Scores</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{#each highScores as score}
						<div class="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30 border-2 border-yellow-300 dark:border-yellow-600 rounded-xl p-4 transition-colors">
							<div class="text-lg font-bold text-orange-900 dark:text-orange-300 mb-2 transition-colors">
								{score.problemSet === 'all' ? 'All Tables' : score.problemSet === 'hard' ? 'Hard Tables' : score.customSetName || 'Custom'}
							</div>
							<div class="space-y-1 text-sm text-gray-700 dark:text-gray-300 transition-colors">
								<div class="flex justify-between">
									<span>Accuracy:</span>
									<span class="font-bold">{Math.round(score.accuracy)}%</span>
								</div>
								<div class="flex justify-between">
									<span>Avg Time:</span>
									<span class="font-bold">{(score.avgResponseTime / 1000).toFixed(1)}s</span>
								</div>
								<div class="flex justify-between">
									<span>Problems:</span>
									<span class="font-bold">{score.totalProblems}</span>
								</div>
								<div class="text-xs text-gray-500 dark:text-gray-400 mt-2 transition-colors">
									{formatDate(score.completedAt)}
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Recent Sessions -->
		<div>
			<h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 transition-colors">📝 Recent Sessions</h2>
			{#if sessions.length === 0}
				<div class="text-center py-12 text-gray-500 dark:text-gray-400 transition-colors">
					<div class="text-6xl mb-4">📭</div>
					<div class="text-xl">No sessions yet</div>
					<div class="text-sm mt-2">Complete a practice session to see it here!</div>
				</div>
			{:else}
				<div class="space-y-3">
					{#each sessions.slice().reverse().slice(0, 20) as session, index}
						{@const accuracy = getSessionAccuracy(session)}
						{@const avgTime = getSessionAvgTime(session)}
						<div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
							<div class="flex justify-between items-start">
								<div class="flex-1">
									<div class="flex items-center gap-3 mb-2">
										<span class="text-sm text-gray-500 dark:text-gray-400">#{sessions.length - index}</span>
										<span class="text-sm text-gray-500 dark:text-gray-400">{formatDate(session.startedAt)}</span>
										{#if session.problemSetType}
											<span class="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded transition-colors">
												{session.problemSetType}
											</span>
										{/if}
									</div>
									{#if session.selectedNumbers && session.selectedNumbers.length > 0}
										<div class="mb-2">
											<span class="text-xs text-gray-500 dark:text-gray-400">Times tables: </span>
											<span class="text-xs text-gray-700 dark:text-gray-200 font-medium">
												{session.selectedNumbers.join(', ')}
											</span>
										</div>
									{/if}
									<div class="flex gap-6 text-sm">
										<div>
											<span class="text-gray-600 dark:text-gray-400 transition-colors">Accuracy:</span>
											<span class="font-bold ml-1" class:text-green-600={accuracy >= 90} class:dark:text-green-400={accuracy >= 90} class:text-yellow-600={accuracy >= 70 && accuracy < 90} class:dark:text-yellow-400={accuracy >= 70 && accuracy < 90} class:text-red-600={accuracy < 70} class:dark:text-red-400={accuracy < 70}>
												{Math.round(accuracy)}%
											</span>
										</div>
										<div>
											<span class="text-gray-600 dark:text-gray-400 transition-colors">Correct:</span>
											<span class="font-bold ml-1 dark:text-gray-200">
												{session.answers.filter(a => a.correct).length}/{session.answers.length}
											</span>
										</div>
										<div>
											<span class="text-gray-600 dark:text-gray-400 transition-colors">Avg Time:</span>
											<span class="font-bold ml-1 dark:text-gray-200">{(avgTime / 1000).toFixed(1)}s</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
				{#if sessions.length > 20}
					<div class="text-center text-gray-500 dark:text-gray-400 text-sm mt-4 transition-colors">
						Showing latest 20 of {sessions.length} sessions
					</div>
				{/if}
			{/if}
		</div>
	</div>
</div>
