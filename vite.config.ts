import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import commonjs from '@rollup/plugin-commonjs'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    commonjs({
      include: /node_modules/,
      requireReturnsDefault: 'auto',
      transformMixedEsModules: true
    })
  ],
  resolve: {
    alias: {
      'scheduler': path.resolve(__dirname, 'src/scheduler-polyfill.js')
    },
    dedupe: ['react', 'react-dom', 'scheduler', 'three']
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'scheduler',
      'three',
      '@react-three/fiber',
      '@react-three/drei',
      '@react-pdf/renderer'
    ],
    esbuildOptions: {
      target: 'es2020'
    }
  },
  build: {
    target: 'es2020',
    commonjsOptions: {
      include: [/three/, /@react-three\/fiber/, /@react-three\/drei/, /@react-pdf\/renderer/, /react-pdf/, /scheduler/],
      transformMixedEsModules: true,
      requireReturnsDefault: 'auto'
    }
  }
})