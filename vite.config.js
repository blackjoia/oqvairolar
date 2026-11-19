import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // Bibliotecas em arquivos separados: mudam pouco, então o celular reaproveita o que já baixou a cada versão nova do site.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          // O aviso no celular (messaging) fica de fora: só carrega quando a pessoa pede lembrete.
          if (/messaging|installations|[\/]idb[\/]/.test(id)) return
          if (id.includes('firebase') || id.includes('re2js')) return 'firebase'
          if (id.includes('react') || id.includes('scheduler')) return 'react'
        },
      },
    },
  },
})
