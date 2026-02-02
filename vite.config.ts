import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import obfuscator from 'vite-plugin-obfuscator'
import { figmaAssetsPlugin } from './vite-plugin-figma-assets'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),

    // Handle figma:asset imports
    figmaAssetsPlugin({
      fallbackImage:
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
      debug: false,
    }),

    // 🔒 OBFUSCATION (PRODUCTION HARDENING)
    obfuscator({
      options: {
        compact: true,
        controlFlowFlattening: true,
        deadCodeInjection: true,
        stringArray: true,
        stringArrayThreshold: 0.75,
      },
    }),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Dependency optimization (tetap, jangan diubah)
  optimizeDeps: {
    force: true,
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react-router',
      '@supabase/supabase-js',
      'lucide-react',
      'sonner',
      'motion/react',
      'date-fns',
      'clsx',
      'tailwind-merge',
      'class-variance-authority',

      // Radix UI
      '@radix-ui/react-tabs',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-label',
      '@radix-ui/react-slot',
      '@radix-ui/react-separator',
      '@radix-ui/react-avatar',
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-popover',
      '@radix-ui/react-progress',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-switch',
      '@radix-ui/react-toggle',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-aspect-ratio',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-context-menu',
      '@radix-ui/react-hover-card',
      '@radix-ui/react-menubar',
      '@radix-ui/react-navigation-menu',
      '@radix-ui/react-slider',
      '@radix-ui/react-toggle-group',

      // Others
      'embla-carousel-react',
      'embla-carousel-autoplay',
      'react-hook-form',
      'input-otp',
      'cmdk',
      'vaul',
      'qrcode.react',
      '@emailjs/browser',
      'react-day-picker',
      'next-themes',
    ],
    exclude: ['@vite/client', '@vite/env'],
  },

  // 🔒 BUILD HARDENING (INI KUNCI)
  build: {
    sourcemap: false, // ⛔ MATIKAN SOURCE MAP (WAJIB)
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },

  // Dev server (tetap, ini hanya DEV)
  server: {
    fs: {
      strict: false,
    },
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  },
})
