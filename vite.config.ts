import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		proxy: {
			'/api': {
				target: process.env.VITE_API_URL || 'http://localhost:3001',
				changeOrigin: true,
				secure: false
			}
		}
	}
});
