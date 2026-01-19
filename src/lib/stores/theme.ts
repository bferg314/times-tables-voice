import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Get initial theme from localStorage or system preference
function getInitialTheme(): 'light' | 'dark' {
	if (!browser) return 'light';

	const stored = localStorage.getItem('ttvapp_theme');
	if (stored === 'dark' || stored === 'light') return stored;

	// Check system preference
	if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
		return 'dark';
	}

	return 'light';
}

export const isDarkMode = writable<boolean>(getInitialTheme() === 'dark');

// Subscribe to changes and update localStorage + document class
if (browser) {
	isDarkMode.subscribe(dark => {
		localStorage.setItem('ttvapp_theme', dark ? 'dark' : 'light');
		if (dark) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	});
}

export function toggleDarkMode() {
	isDarkMode.update(dark => !dark);
}
