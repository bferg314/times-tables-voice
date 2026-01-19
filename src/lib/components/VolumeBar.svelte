<script lang="ts">
	import { audioState } from '$lib/stores/audio';
</script>

{#if $audioState.isListening}
	<div class="w-48 h-3 bg-gray-200 rounded-full overflow-hidden">
		<div
			class="h-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 transition-all duration-100"
			style="width: {$audioState.volumeLevel}%"
		></div>
	</div>
{/if}
