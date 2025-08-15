# @mannisto/astro-i18n

A TypeScript + JavaScript Astro i18n package with static site support.

## Features

- 🌍 **Multi-language support** with locale detection
- 📁 **Single shared config** in `astro.plugins.mjs`
- 🚀 **Static site compatible** with client-side detection
- 🎯 **Type-safe** with full TypeScript support
- 💾 **Persistent preferences** with localStorage
- 🧪 **Comprehensive testing** with Vitest

## Installation

```bash
npm install @mannisto/astro-i18n
```

## Quick Start

### 1. Create Configuration

Create `astro.plugins.mjs` in your project root:

```javascript
export default {
  i18n: {
    default: 'en', // REQUIRED, must be one of the locales below
    locales: [
      { code: 'en', endonym: 'English', dir: 'ltr' },
      { code: 'fi', endonym: 'Suomi', dir: 'ltr' },
      { code: 'ar', endonym: 'العربية', dir: 'rtl' }
    ],
    translations: {
      enabled: true,
      path: "./src/translations"
    }
  }
};
```

### 2. Use in Your Astro Layout

```astro
---
// src/layouts/Layout.astro
import { Locale } from '@mannisto/astro-i18n';
---

<html lang={Locale.current} dir={Locale.info(Locale.current)?.dir || 'ltr'}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>My Astro Site</title>
  </head>
  <body>
    <!-- LocaleRedirect component should be copied from src/components/LocaleRedirect.astro -->
    
    <slot />
  </body>
</html>
```

### 3. Use Locale API in Components

```astro
---
// src/pages/index.astro
import { Locale } from '@mannisto/astro-i18n';

const currentLocale = Locale.current;
const localeInfo = Locale.info(currentLocale);
---

<div>
  <h1>Welcome to {localeInfo?.endonym}</h1>
  <p>Current locale: {currentLocale}</p>
  
  <nav>
    {Locale.supported.map(locale => (
      <a href={Locale.url('/about', locale)}>
        {Locale.info(locale)?.endonym}
      </a>
    ))}
  </nav>
</div>
```

## API Reference

### Locale Namespace

The main `Locale` namespace provides all i18n functionality:

#### Properties

- `Locale.default` - Returns the default locale code
- `Locale.supported` - Returns array of supported locale codes
- `Locale.current` - Returns the current locale code

#### Methods

- `Locale.info(locale)` - Returns full locale object or null
- `Locale.set(locale)` - Sets current locale and persists to localStorage
- `Locale.url(path, locale?)` - Generates localized URL

### Astro Components

#### `<LocaleRedirect />`

Runs in static sites. On mount, applies locale detection logic and redirects to the correct path.

**Detection order:**
1. Locale in current path
2. Saved locale in localStorage
3. Browser navigator.languages
4. Default locale from config

**Note:** This component should be copied from `src/components/LocaleRedirect.astro` to your project.

## Configuration

### Required Fields

- `default` - The default locale code (must be in supported locales)
- `locales` - Array of locale objects

### Locale Object

```typescript
{
  code: string;        // Locale code (e.g., 'en', 'fi')
  endonym: string;     // Native name (e.g., 'English', 'Suomi')
  dir: 'ltr' | 'rtl';  // Text direction
}
```

### Optional Fields

- `translations` - Translation configuration (for future use)

## Locale Detection Logic

The package uses a sophisticated detection system:

1. **Path-based**: If URL contains a locale (e.g., `/fi/about`), use that
2. **Persistent**: Check localStorage for previously saved locale
3. **Browser**: Check `navigator.languages` for browser preferences
4. **Default**: Fall back to configured default locale

## URL Structure

- **Default locale**: `/about` (no prefix)
- **Other locales**: `/fi/about`, `/ar/about` (with locale prefix)

## Error Handling

The package throws runtime errors for:

- Missing `astro.plugins.mjs` configuration file
- Invalid configuration (missing required fields)
- Default locale not in supported locales list
- Invalid locale codes in API calls

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import type {
  LocaleConfig,
  I18nConfig,
} from '@mannisto/astro-i18n';
```

## Testing

Run tests with:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## Development

Build the package:

```bash
npm run build
```

Development mode with watch:

```bash
npm run dev
```

## Examples

### Basic Usage

```astro
---
// src/pages/about.astro
import { Locale } from '@mannisto/astro-i18n';

const currentLocale = Locale.current;
const supportedLocales = Locale.supported;
---

<div>
  <h1>About Page</h1>
  <p>Current locale: {currentLocale}</p>
  
  <div>
    <h2>Available Languages:</h2>
    <ul>
      {supportedLocales.map(locale => {
        const info = Locale.info(locale);
        return (
          <li>
            <a href={Locale.url('/about', locale)}>
              {info?.endonym}
            </a>
          </li>
        );
      })}
    </ul>
  </div>
</div>
```

### Dynamic Locale Switching

```astro
---
// src/components/LanguageSwitcher.astro
import { Locale } from '@mannisto/astro-i18n';
---

<script>
  import { Locale } from '@mannisto/astro-i18n';

  function switchLanguage(locale) {
    Locale.set(locale);
    // Redirect to the same page in new locale
    const currentPath = window.location.pathname;
    const newPath = Locale.url(currentPath, locale);
    window.location.href = newPath;
  }

  // Make function globally available
  window.switchLanguage = switchLanguage;
</script>

<div class="language-switcher">
  {Locale.supported.map(locale => (
    <button 
      onclick={`switchLanguage('${locale}')`}
      class={locale === Locale.current ? 'active' : ''}
    >
      {Locale.info(locale)?.endonym}
    </button>
  ))}
</div>
```

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## Changelog

### 0.0.1
- Initial release
- Core Locale namespace API
- Astro components (LocaleRedirect)
- TypeScript support
- Comprehensive testing
