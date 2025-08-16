// @ts-check
import { defineConfig } from 'astro/config';
import { i18n } from '@mannisto/astro-i18n';

// https://astro.build/config
export default defineConfig({
  integrations: [
    i18n({
      enabled: true,
      default: "en",
      locales: [
        { code: "en", name: "English", endonym: "English", dir: "ltr" },
        { code: "fi", name: "Finnish", endonym: "Suomi", dir: "ltr" },
      ],
      translations: {
        enabled: true,
        path: "./src/translations",
      },
    }),
  ],
});
