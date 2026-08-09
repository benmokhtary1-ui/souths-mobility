import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, existsSync } from 'node:fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // copie404 : GitHub Pages ne reecrit pas les adresses, il sert 404.html.
    // On y depose l'application pour que les liens profonds fonctionnent aussi.
    { name: 'copie404', closeBundle() {
        if (existsSync('dist/index.html')) copyFileSync('dist/index.html', 'dist/404.html');
      } },
  ],
})
