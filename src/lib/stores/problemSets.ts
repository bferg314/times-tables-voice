import { writable, get } from 'svelte/store';
import type { CustomProblemSet } from '$lib/types';
import {
	getCustomProblemSets,
	saveCustomProblemSet,
	deleteCustomProblemSet
} from '$lib/services/storage';
import { selectionKey } from '$lib/services/sessionStats';
import { currentUser } from './users';

export const customSets = writable<CustomProblemSet[]>([]);

/** Reload the active user's saved sets. Clears them when nobody is signed in. */
export function refreshCustomSets() {
	const user = get(currentUser);
	customSets.set(user ? getCustomProblemSets(user.id) : []);
}

export function saveSelectionAsSet(name: string, numbers: number[]) {
	const user = get(currentUser);
	if (!user) return;

	saveCustomProblemSet(user.id, { name, selectedNumbers: [...numbers] });
	refreshCustomSets();
}

export function removeCustomSet(setId: string) {
	const user = get(currentUser);
	if (!user) return;

	deleteCustomProblemSet(user.id, setId);
	refreshCustomSets();
}

/** The saved set matching a selection exactly, if there is one. */
export function findSetForSelection(
	sets: CustomProblemSet[],
	numbers: number[]
): CustomProblemSet | undefined {
	const key = selectionKey(numbers);
	return sets.find((set) => selectionKey(set.selectedNumbers) === key);
}

// Saved sets belong to a user, so they follow whoever is signed in.
currentUser.subscribe(() => refreshCustomSets());
