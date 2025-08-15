# Astro Internationalization

[![npm version](https://img.shields.io/npm/v/@mannisto/astro-i18n.svg)](https://www.npmjs.com/package/@mannisto/astro-i18n)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Internationalization plugin for Astro 5+ supporting both static and server/hybrid modes. Designed for simplicity, clean structure, and developer ergonomics.

---

## Installation

```bash
npm install @mannisto/astro-i18n
pnpm add @mannisto/astro-i18n
```

---

## Configuration

Add the integration to your `astro.config.mjs`:

```mjs
import { defineConfig } from 'astro/config';
import { i18n } from '@mannisto/astro-i18n';

export default defineConfig({
  integrations: [
    i18n({
      enabled: true,
      default: "en",
      locales: [
        { code: "en", name: "English", endonym: "English", dir: "ltr" },
        { code: "fi", name: "Finnish", endonym: "Suomi", dir: "ltr" },
        { code: "ar", name: "Arabic", endonym: "العربية", dir: "rtl" },
      ],
      translations: {
        enabled: true,
        path: "./src/translations",
      },
    }),
  ],
});
```

### Options

| Key                         | Type      | Required | Default | Description                                                                               |
| ----------------------------| --------- | -------- | ------- | ----------------------------------------------------------------------------------------- |
| `i18n.enabled`              | `boolean` | **Yes**  | —       | Enables or disables internationalization.                                                 |
| `i18n.default`              | `string`  | **Yes**  | —       | Default locale code (must match one in `locales`).                                        |
| `i18n.locales`              | `array`   | **Yes**  | —       | List of supported locale objects. Each must include `code`, `name`, `endonym`, and `dir`. |
| `i18n.locales[].code`       | `string`  | **Yes**  | —       | Locale code (e.g., `"en"`, `"fi"`, `"ar"`).                                               |
| `i18n.locales[].name`       | `string`  | **Yes**  | —       | Locale name in English (exonym).                                                          |
| `i18n.locales[].endonym`    | `string`  | **Yes**  | —       | Locale name in the native language.                                                       |
| `i18n.locales[].dir`        | `string`  | **Yes**  | —       | Text direction: `"ltr"` or `"rtl"`.                                                       |
| `i18n.translations.enabled` | `boolean` | No       | `false` | Whether translations are enabled.                                                         |
| `i18n.translations.path`    | `string`  | No       | —       | Path to translation files directory (only required if translations are enabled).          |

---
## Locale API

| Function / Property | Parameters                        | Returns                                                                | Description                                                                              |
| ------------------- | --------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `Locale.enabled`    | —                                 | `boolean`                                                              | Whether `i18n` is enabled.                                                               |
| `Locale.current`    | —                                 | `string`                                                               | The currently active locale code.                                                        |
| `Locale.supported`  | —                                 | `string[]`                                                             | All supported locale codes.                                                              |
| `Locale.info`       | `(locale?: string)`               | `{ code: string, name: string, endonym: string, dir: 'ltr' \| 'rtl' }` | Returns details about a locale. Uses `Locale.current` if omitted.                        |
| `Locale.url`        | `(path: string, locale?: string)` | `string`                                                               | Builds a locale-aware URL. Uses `Locale.current` if `locale` is omitted.                 |
| `Locale.set`        | `(locale: string)`                | `void`                                                                 | Sets the current locale.                                                                 |
| `Locale.t`          | `(key: string, locale?: string)`  | `string`                                                               | Retrieves a translation for the given key. Uses `Locale.current` if `locale` is omitted. |
| `Locale.replace`    | `(text: string, vars: object)`    | `string`                                                               | Replaces variable placeholders in text with provided values.                             |

---

## Astro Components

### `<LocaleRedirect />`
Ensures the user is on a valid locale route.  
Useful when the locale is missing from the URL, for example if a user navigates directly to a non-localized path.

---

## Usage Example

```astro
---
// src/pages/[locale]/about.astro
import { Locale, LocaleRedirect } from "@mannisto/astro-i18n";

// Build all locale variations at build time
export function getStaticPaths() {
  return Locale.supported.map((locale) => ({
    params: { locale },
  }));
}

// Set locale based on the dynamic route parameter
Locale.set(Astro.params.locale);
---

<html lang={Locale.current} dir={Locale.info().dir}>
  <head>
    <!-- Ensure user is on a valid locale -->
    <LocaleRedirect />
  </head>

  <body>
    <!-- Get some translations -->
    <h1>{Locale.t("page.about.title")}</h1>

    <!-- Translation with variables -->
    <p>{Locale.replace(Locale.t("page.about.welcome"), { name: "John" })}</p>

    <!-- Link to the home page in the *current* locale -->
    <a href={Locale.url("/")}>
      {Locale.t("page.home.link")}
    </a>

    <!-- Link to the home page in a *different* locale -->
    <a href={Locale.url("/", "fi")}>
      {Locale.info("fi").endonym}
    </a>
  </body>
</html>
```

---

## Example Translations

**`src/translations/en.ts`**
```ts
export default {
  "page.about.title": "About Us",
  "page.about.welcome": "Welcome {name}!",
  "page.home.link"  : "Go to Homepage",
};
```

**`src/translations/fi.ts`**
```ts
export default {
  "page.about.title": "Tietoa meistä",
  "page.about.welcome": "Tervetuloa {name}!",
  "page.home.link"  : "Palaa etusivulle",
};
```

---

## License

MIT © Studio Mörkö
