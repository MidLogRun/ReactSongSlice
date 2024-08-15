import { defineConfig } from 'vite';
const path = require('path')
import react from '@vitejs/plugin-react';

export default defineConfig({
    root: path.resolve(__dirname, 'src'),
    resolve: {
        alias: {
            '~bootstrap': path.resolve(__dirname, 'node_modules/bootstrap'),
        }
    },
    plugins: [react()],
    server: {
        port: 5173,
        hot: true
    }
});
