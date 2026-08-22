import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

const network = {
	// Bind all interfaces so other hosts on the network can reach the dev server.
	host: true,
	strictPort: true,
	// Vite rejects unknown Host headers; allow the tailnet's MagicDNS names.
	allowedHosts: ['.ts.net']
};

export default defineConfig({
	plugins: [sveltekit()],
	server: network,
	test: {
		environment: 'node',
		include: ['src/**/*.test.ts']
	}
});
