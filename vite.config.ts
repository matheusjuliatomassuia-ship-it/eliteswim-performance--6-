import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carrega as variáveis do arquivo .env
  const env = loadEnv(mode, '.', '');
  
  return {
    // Define caminhos relativos para funcionar perfeitamente na Hostinger
    base: './', 
    
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    
    plugins: [react()],
    
    // Injeta a chave de API para que o código de produção a reconheça
    define: {
      'process.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
    },
    
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    
    build: {
      rollupOptions: {
        output: {
          // GERAÇÃO DE NOMES ÚNICOS (Cache Busting)
          entryFileNames: `assets/[name]-[hash].js`,
          chunkFileNames: `assets/[name]-[hash].js`,
          assetFileNames: `assets/[name]-[hash].[ext]`,
          
          // Organização de módulos pesados (React, Lucide, etc)
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          }
        }
      },
      // Aumenta o limite de aviso para builds maiores
      chunkSizeWarningLimit: 1600
    }
  };
});