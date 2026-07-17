import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // @ionic/angular uses extensionless deep imports (e.g. @ionic/core/components)
    // that Node's native ESM resolver rejects; let Vite resolve them instead.
    server: {
      deps: {
        inline: [/@ionic/, /ionicons/],
      },
    },
  },
});
