<script lang="ts">
	import { users, currentUser, switchUser, refreshUsers, reloadCurrentUser } from '$lib/stores/users';
	import { createUser, deleteUser } from '$lib/services/storage';
	import Modal from './Modal.svelte';

	let showNewUserDialog = $state(false);
	let showUserList = $state(false);
	let newUserName = $state('');
	let showDeleteModal = $state(false);
	let userToDelete = $state<string | null>(null);

	function handleCreateUser() {
		if (newUserName.trim()) {
			const user = createUser(newUserName.trim());
			refreshUsers();
			switchUser(user.id);
			showNewUserDialog = false;
			newUserName = '';
		}
	}

	function handleSwitchUser(userId: string) {
		switchUser(userId);
		showUserList = false;
	}

	function handleDeleteUser(userId: string, event: Event) {
		event.stopPropagation();
		userToDelete = userId;
		showDeleteModal = true;
	}

	function confirmDelete() {
		if (userToDelete) {
			deleteUser(userToDelete);
			refreshUsers();
			// deleteUser also clears the persisted current-user pointer, so the store
			// has to be re-read or it keeps pointing at a user that no longer exists.
			reloadCurrentUser();
			showUserList = false;
			showDeleteModal = false;
			userToDelete = null;
		}
	}

	function cancelNewUser() {
		showNewUserDialog = false;
		newUserName = '';
	}

	function cancelDelete() {
		showDeleteModal = false;
		userToDelete = null;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && newUserName.trim()) {
			handleCreateUser();
		}
	}
</script>

<div class="relative">
	{#if $currentUser}
		<!-- Current user display with dropdown -->
		<button
			onclick={() => (showUserList = !showUserList)}
			class="flex items-center gap-2 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border-2 border-indigo-200 dark:border-indigo-700 rounded-xl px-4 py-2 transition-colors"
		>
			<span class="text-2xl">👤</span>
			<span class="font-semibold text-gray-700 dark:text-gray-200 transition-colors">{$currentUser.name}</span>
			<span class="text-gray-400 dark:text-gray-500 transition-colors">▼</span>
		</button>

		{#if showUserList}
			<div
				class="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border-2 border-gray-200 dark:border-gray-700 min-w-64 z-10 transition-colors"
			>
				<div class="p-2">
					<div class="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase transition-colors">Switch User</div>
					{#each $users as user}
						<div class="w-full flex items-center justify-between px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors group">
							<button
								onclick={() => handleSwitchUser(user.id)}
								class="flex items-center gap-2 flex-1 text-left"
							>
								<span class="text-xl">👤</span>
								<span class="font-medium text-gray-700 dark:text-gray-200 transition-colors">{user.name}</span>
								{#if user.id === $currentUser?.id}
									<span class="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded transition-colors">Current</span
									>
								{/if}
							</button>
							{#if user.id !== $currentUser?.id}
								<button
									onclick={(e) => handleDeleteUser(user.id, e)}
									class="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity px-2"
									aria-label="Delete user"
								>
									🗑️
								</button>
							{/if}
						</div>
					{/each}
					<div class="border-t border-gray-200 dark:border-gray-700 my-2 transition-colors"></div>
					<button
						onclick={() => {
							showNewUserDialog = true;
							showUserList = false;
						}}
						class="w-full px-3 py-2 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors text-left text-green-600 dark:text-green-400 font-medium"
					>
						+ Add New User
					</button>
				</div>
			</div>
		{/if}
	{:else}
		<!-- No user selected - show create user button -->
		<button
			onclick={() => (showNewUserDialog = true)}
			class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
		>
			👤 Create User
		</button>
	{/if}

	<!-- New user dialog -->
	{#if showNewUserDialog}
		<Modal title="Create New User" onclose={cancelNewUser}>
			{#snippet children()}
				<input
					type="text"
					bind:value={newUserName}
					onkeydown={handleKeydown}
					placeholder="Enter your name"
					class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none mb-4 transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
				/>
			{/snippet}
			{#snippet actions()}
				<button
					onclick={handleCreateUser}
					disabled={!newUserName.trim()}
					class="flex-1 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Create
				</button>
				<button
					onclick={cancelNewUser}
					class="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold py-3 px-6 rounded-xl transition-colors"
				>
					Cancel
				</button>
			{/snippet}
		</Modal>
	{/if}
</div>

<!-- Close dropdown when clicking outside -->
{#if showUserList}
	<button
		class="fixed inset-0 z-0"
		onclick={() => (showUserList = false)}
		aria-label="Close menu"
	></button>
{/if}

<!-- Delete User Modal -->
{#if showDeleteModal}
	<Modal title="Delete User?" onclose={cancelDelete}>
		{#snippet children()}
			<p class="text-gray-600 dark:text-gray-300 mb-6 transition-colors">
				Are you sure you want to delete this user and all their data? This action cannot be undone.
			</p>
		{/snippet}
		{#snippet actions()}
			<button
				onclick={confirmDelete}
				class="flex-1 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl transition-colors"
			>
				Yes, Delete
			</button>
			<button
				onclick={cancelDelete}
				class="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold py-3 px-6 rounded-xl transition-colors"
			>
				Cancel
			</button>
		{/snippet}
	</Modal>
{/if}
