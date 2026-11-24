import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

const network = {
	// Bind all interfaces so other hosts on the network can reach the dev server.
	host: true,
	strictPort: true,
	// Vite rejects unknown Host headers; allow the tailnet's MagicDNS names.
	allowedHosts: ['.ts.net']
};

export default defineConfig({
	// SvelteKit 3 takes its config here; svelte.config.js is no longer read.
	plugins: [sveltekit({ adapter: adapter(), preprocess: vitePreprocess() })],
	server: network,
	test: {
		environment: 'node',
		include: ['src/**/*.test.ts']
	}
});
