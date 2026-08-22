<script lang="ts">
	import { selectedNumbers } from '$lib/stores/session';
	import { ALL_NUMBERS, getPresetNumbers } from '$lib/services/problemGenerator';

	function toggleNumber(num: number) {
		selectedNumbers.update((nums) => {
			const index = nums.indexOf(num);
			if (index > -1) {
				return nums.filter((n) => n !== num);
			} else {
				return [...nums, num].sort((a, b) => a - b);
			}
		});
	}

	function selectAll() {
		selectedNumbers.set(getPresetNumbers('all'));
	}

	function selectNone() {
		selectedNumbers.set([]);
	}

	function selectRandom() {
		selectedNumbers.set(getPresetNumbers('random'));
	}

	function selectHard() {
		selectedNumbers.set(getPresetNumbers('hard'));
	}
</script>

<div class="grid grid-cols-7 gap-3 mb-8">
	{#each ALL_NUMBERS as num (num)}
		<button
			onclick={() => toggleNumber(num)}
			class="aspect-square rounded-xl text-2xl font-bold transition-all {$selectedNumbers.includes(
				num
			)
				? 'bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 scale-105 shadow-lg'
				: 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-300 dark:hover:bg-gray-600'}"
		>
			{num}
		</button>
	{/each}
	<button
		onclick={selectAll}
		class="aspect-square rounded-xl text-xs font-bold transition-all bg-green-500 text-white hover:bg-green-600 shadow-md"
	>
		ALL
	</button>
	<button
		onclick={selectNone}
		class="aspect-square rounded-xl text-xs font-bold transition-all bg-red-500 text-white hover:bg-red-600 shadow-md"
	>
		NONE
	</button>
	<button
		onclick={selectRandom}
		class="aspect-square rounded-xl text-xs font-bold transition-all bg-purple-500 text-white hover:bg-purple-600 shadow-md"
	>
		🎲<br />RAND
	</button>
	<button
		onclick={selectHard}
		class="aspect-square rounded-xl text-xs font-bold transition-all bg-orange-500 text-white hover:bg-orange-600 shadow-md"
	>
		🔥<br />HARD
	</button>
</div>
