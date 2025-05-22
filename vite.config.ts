import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		proxy: {
			'api': {
				target: process.env.VITE_API_URL || 'https://goring-hg3o.shuttle.app',
				changeOrigin: true,
				secure: false
			}
		}
	}
});
