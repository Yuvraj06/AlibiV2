import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: path.resolve(rootDir, 'index.html'),
        easy: path.resolve(rootDir, 'easy.html'),
        scene: path.resolve(rootDir, 'scene.html'),
      },
    },
  },
});
