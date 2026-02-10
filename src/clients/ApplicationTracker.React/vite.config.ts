import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
	plugins: [react()],
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: './src/test/setup.ts',
		// might be able to remove this when cleaning up boostrap code
		alias: {
			'/vite.svg': './public/vite.svg',
		},
	},
});
