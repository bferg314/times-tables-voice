import { writable } from 'svelte/store';
import type { User } from '$lib/types';
import { getUsers, getCurrentUser, setCurrentUser } from '$lib/services/storage';

export const users = writable<User[]>(getUsers());
export const currentUser = writable<User | null>(getCurrentUser());

export function switchUser(userId: string) {
	setCurrentUser(userId);
	currentUser.set(getCurrentUser());
}

export function refreshUsers() {
	users.set(getUsers());
}
