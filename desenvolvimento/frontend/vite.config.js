import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Sem isso, o minificador de CSS do build de produção (esbuild) emite
    // media query na sintaxe moderna "range" (@media (width>=768px)) em vez
    // da clássica (@media (min-width: 768px)) — visualmente idêntico pro
    // navegador, mas quebra o parser de CSS do pagedjs (usado nas telas de
    // impressão paginada: Escala dos Despachantes e Relatório de Permutas),
    // que não reconhece essa sintaxe e lança "Cannot read properties of
    // undefined (reading 'includes')". O dev server (`npm run dev`) não
    // minifica CSS, por isso esse bug só aparecia em produção.
    cssTarget: 'chrome89',
  },
})
