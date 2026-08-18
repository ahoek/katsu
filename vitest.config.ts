import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // The stroke specs sweep the whole deck - every stroke of every kanji, a
    // few times over for the drift cases - so their cost grows with the deck
    // rather than with the number of tests. At 642 kanji the heaviest of them
    // runs about two seconds here and five on a CI runner, which is where the
    // default five-second budget started failing the build; this leaves room
    // for the deck to keep growing towards the 常用漢字.
    testTimeout: 20_000,
    // @ionic/angular uses extensionless deep imports (e.g. @ionic/core/components)
    // that Node's native ESM resolver rejects; let Vite resolve them instead.
    server: {
      deps: {
        inline: [/@ionic/, /ionicons/],
      },
    },
  },
});
