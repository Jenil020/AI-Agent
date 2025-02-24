import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import react from '@vitejs/plugin-react'
import path from 'path'
import viteCompression from 'vite-plugin-compression'

export default defineConfig({
    assetsInclude: ['.gltf', '.png', '.jpg', '.wav', '.mp3', '.lottie'],
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        assetsDir: 'assets',
        rollupOptions: {
            input: {
                main: './index.html'
            }
        }
    },
    plugins: [
        react({
            include: ['**/*.jsx', '**/*.tsx'],
            jsxRuntime: 'automatic'
        }),
        viteStaticCopy({
            targets: [{
                src: 'public/assets/*',
                dest: 'assets'
            }]
        }),
        viteCompression({
            verbose: true,
            algorithm: 'gzip',
            filter: /\.(js|mjs|ts|tsx|json|css|html|wasm|svg|lottie|glb)$/
        })
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        },
        extensions: ['.js', '.jsx', '.ts', '.tsx']
    },
    server: {
        port: 3000,
        open: true,
        cors: true,
        proxy: {
            '^/public_api': {
                target: 'https://cloud.staging.muaverse.build',
                changeOrigin: true
            }
        }
    }
})