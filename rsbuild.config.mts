import { defineConfig } from '@rsbuild/core';
import { pluginSvelte } from '@rsbuild/plugin-svelte';

export default defineConfig({
  source: {
    entry: {
     index: './src/frontend/index.ts'
    },
  },
  plugins: [pluginSvelte()],
});
