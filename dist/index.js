import fs from 'fs';
import path from 'path';

// src/integration.ts
function validate(config2) {
  if (!config2.enabled) {
    return;
  }
  if (!config2.default) {
    throw new Error('"default" is required when enabled is true');
  }
  if (!config2.locales || !Array.isArray(config2.locales) || config2.locales.length === 0) {
    throw new Error('"locales" must be a non-empty array');
  }
  if (!config2.locales.some((l) => l.code === config2.default)) {
    throw new Error('"default" must be one of the supported locale codes');
  }
  if (config2.translations?.enabled && !config2.translations.path) {
    throw new Error('"translations.path" is required when translations.enabled is true');
  }
}
function loadTranslations(config2) {
  const translations = {};
  if (config2.translations?.enabled && config2.translations.path) {
    for (const locale of config2.locales) {
      const tsPath = path.join(process.cwd(), config2.translations.path, `${locale.code}.ts`);
      const jsPath = path.join(process.cwd(), config2.translations.path, `${locale.code}.js`);
      const translationData = {};
      if (fs.existsSync(tsPath)) {
        try {
          const content = fs.readFileSync(tsPath, "utf8");
          const noComments = content.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
          const match = noComments.match(/export\s+default\s*(\{[\s\S]*\})\s*;?\s*$/);
          if (match) {
            const objectContent = match[1];
            const keyValueRegex = /(["']?)([^"'\s:]+)\1\s*:\s*["']([^"']*)["']/g;
            let keyValueMatch;
            while ((keyValueMatch = keyValueRegex.exec(objectContent)) !== null) {
              const key = keyValueMatch[2];
              const value = keyValueMatch[3];
              translationData[key] = value;
            }
          }
        } catch (error) {
          throw new Error(`Failed to load translation file ${tsPath}: ${error}`);
        }
      } else if (fs.existsSync(jsPath)) {
        try {
          const content = fs.readFileSync(jsPath, "utf8");
          const noComments = content.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
          const match = noComments.match(/export\s+default\s*(\{[\s\S]*\})\s*;?\s*$/);
          if (match) {
            const objectContent = match[1];
            const keyValueRegex = /(["']?)([^"'\s:]+)\1\s*:\s*["']([^"']*)["']/g;
            let keyValueMatch;
            while ((keyValueMatch = keyValueRegex.exec(objectContent)) !== null) {
              const key = keyValueMatch[2];
              const value = keyValueMatch[3];
              translationData[key] = value;
            }
          }
        } catch (error) {
          throw new Error(`Failed to load translation file ${jsPath}: ${error}`);
        }
      } else {
        throw new Error(
          `Translation file not found for locale "${locale.code}" (tried ${locale.code}.ts and ${locale.code}.js)`
        );
      }
      translations[locale.code] = translationData;
    }
  }
  return translations;
}
function i18n(config2) {
  return {
    name: "@mannisto/astro-i18n",
    hooks: {
      "astro:config:setup": ({ injectScript, logger }) => {
        validate(config2);
        logger.info(`enabled: ${config2.enabled}`);
        if (config2.enabled) {
          logger.info(`default locale: ${config2.default}`);
          logger.info(`supported locales: ${config2.locales.map((l) => l.code).join(", ")}`);
        }
        let translations = {};
        if (config2.translations?.enabled) {
          try {
            translations = loadTranslations(config2);
            logger.info(`loaded translations for ${Object.keys(translations).length} locales`);
          } catch (error) {
            logger.error(`Failed to load translations: ${error}`);
            throw error;
          }
        }
        globalThis.__ASTRO_I18N_CONFIG__ = config2;
        globalThis.__ASTRO_I18N_TRANSLATIONS__ = translations;
        const configScript = `globalThis.__ASTRO_I18N_CONFIG__ = ${JSON.stringify(config2)};`;
        const translationsScript = `globalThis.__ASTRO_I18N_TRANSLATIONS__ = ${JSON.stringify(translations)};`;
        injectScript("head-inline", configScript + translationsScript);
      }
    }
  };
}

// src/lib/locale.ts
var cache = { };
var currentLocale = "";
if (typeof window !== "undefined") {
  try {
    const saved = localStorage.getItem("astro-i18n-locale");
    if (saved) {
      currentLocale = saved;
    }
  } catch (error) {
  }
}
var PREFIX = "[@mannisto/astro-i18n]";
function config() {
  if (cache.i18n) return cache.i18n;
  const injectedConfig = globalThis.__ASTRO_I18N_CONFIG__;
  if (injectedConfig) {
    cache.i18n = injectedConfig;
    return injectedConfig;
  }
  throw new Error(
    `${PREFIX}: No i18n configuration found. Make sure to add the i18n integration to your astro.config.mjs`
  );
}
var Locale = {
  /**
   * Returns the enabled status of the i18n configuration
   */
  get enabled() {
    return config().enabled;
  },
  /**
   * Returns the current locale
   */
  get current() {
    if (currentLocale) {
      const supported = config().locales.map((l) => l.code);
      if (supported.includes(currentLocale)) {
        return currentLocale;
      }
      currentLocale = "";
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("astro-i18n-locale");
        } catch (error) {
        }
      }
    }
    return config().default;
  },
  /**
   * Returns the supported locales
   */
  get supported() {
    return config().locales.map((l) => l.code);
  },
  /**
   * Returns the default locale
   */
  get default() {
    return config().default;
  },
  /**
   * Sets the current locale and saves it to localStorage
   */
  set(locale) {
    currentLocale = locale;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("astro-i18n-locale", locale);
      } catch (error) {
      }
    }
  },
  /**
   * Returns the locale configuration for a given locale
   * Falls back to default locale if the requested locale is not found
   */
  info(locale) {
    const code = locale || Locale.current;
    const found = config().locales.find((l) => l.code === code);
    if (found) {
      return found;
    }
    const defaultLocale = config().locales.find((l) => l.code === config().default);
    if (defaultLocale) {
      return defaultLocale;
    }
    return config().locales[0];
  },
  /**
   * Returns the URL for a given pathname and locale
   */
  url(pathname = "/", locale) {
    const code = locale || Locale.current;
    if (!pathname.startsWith("/")) pathname = `/${pathname}`;
    return `/${code}${pathname}`;
  },
  /**
   * Replaces variable placeholders in a text string
   * @param text - The text containing variable placeholders like {name}
   * @param vars - Object containing variable values
   * @returns The text with variables replaced
   */
  replace(text, vars) {
    let result = text;
    for (const [k, v] of Object.entries(vars)) {
      result = result.replace(`{${k}}`, String(v));
    }
    return result;
  },
  /**
   * Returns the translations object for the current or specified locale.
   * Uses translations loaded at build time and injected via global variables.
   *
   * @param locale - Optional locale code, defaults to current locale
   * @returns The translations object (synchronous for static generation)
   */
  translations(locale) {
    const cfg = config();
    const code = locale || Locale.current;
    if (!cfg.translations?.enabled) {
      return {};
    }
    const injectedTranslations = globalThis.__ASTRO_I18N_TRANSLATIONS__;
    if (injectedTranslations?.[code]) {
      return injectedTranslations[code];
    }
    return {};
  }
};

export { Locale, i18n };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map