import fs from 'fs';
import path from 'path';

// src/integration.ts
function validate(config2) {
  if (typeof config2.enabled !== "boolean") {
    throw new Error(`"enabled" must be a boolean`);
  }
  if (!config2.enabled) return;
  if (typeof config2.default !== "string" || !config2.default.trim()) {
    throw new Error(`"default" must be a non-empty string`);
  }
  if (!Array.isArray(config2.locales) || config2.locales.length === 0) {
    throw new Error(`"locales" must be a non-empty array`);
  }
  for (const [index, locale] of config2.locales.entries()) {
    if (typeof locale.code !== "string" || !locale.code.trim()) {
      throw new Error(`"locales[${index}].code" must be a non-empty string`);
    }
    if (typeof locale.name !== "string" || !locale.name.trim()) {
      throw new Error(`"locales[${index}].name" must be a non-empty string`);
    }
    if (typeof locale.endonym !== "string" || !locale.endonym.trim()) {
      throw new Error(`"locales[${index}].endonym" must be a non-empty string`);
    }
    if (locale.dir !== "ltr" && locale.dir !== "rtl") {
      throw new Error(`"locales[${index}].dir" must be either "ltr" or "rtl"`);
    }
  }
  if (!config2.locales.some((l) => l.code === config2.default)) {
    throw new Error(`"default" must be one of the supported locale codes`);
  }
  if (config2.translations) {
    if (config2.translations.enabled === true) {
      if (typeof config2.translations.path !== "string" || !config2.translations.path.trim()) {
        throw new Error(
          `"translations.path" must be a non-empty string when translations are enabled`
        );
      }
    }
  }
}
function loadTranslations(config2) {
  const translations = {};
  if (config2.translations?.enabled && config2.translations.path) {
    for (const locale of config2.locales) {
      const tsPath = path.join(process.cwd(), config2.translations.path, `${locale.code}.ts`);
      const jsPath = path.join(process.cwd(), config2.translations.path, `${locale.code}.js`);
      let translationData = {};
      if (fs.existsSync(tsPath)) {
        try {
          const content = fs.readFileSync(tsPath, "utf8");
          const match = content.match(/export\s+default\s*(\{[\s\S]*\})\s*;?\s*$/);
          if (match) {
            const objectContent = match[1].replace(/(\w+):/g, '"$1":').replace(/'/g, '"');
            translationData = JSON.parse(objectContent);
          } else {
            throw new Error(`Invalid translation file format in ${tsPath}`);
          }
        } catch (error) {
          throw new Error(`Failed to load translation file ${tsPath}: ${error}`);
        }
      } else if (fs.existsSync(jsPath)) {
        try {
          const content = fs.readFileSync(jsPath, "utf8");
          const match = content.match(/export\s+default\s*(\{[\s\S]*\})\s*;?\s*$/);
          if (match) {
            const objectContent = match[1].replace(/(\w+):/g, '"$1":').replace(/'/g, '"');
            translationData = JSON.parse(objectContent);
          } else {
            throw new Error(`Invalid translation file format in ${jsPath}`);
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
        const configScript = `globalThis.__ASTRO_I18N_CONFIG__ = ${JSON.stringify(config2)};`;
        const translationsScript = `globalThis.__ASTRO_I18N_TRANSLATIONS__ = ${JSON.stringify(translations)};`;
        injectScript("page-ssr", configScript + translationsScript);
      }
    }
  };
}

// src/lib/locale.ts
var cache = { };
var currentLocale = "";
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
    return currentLocale || config().default;
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
   * Sets the current locale
   */
  set(locale) {
    currentLocale = locale;
  },
  /**
   * Returns the locale configuration for a given locale
   */
  info(locale) {
    const code = locale || Locale.current;
    return config().locales.find((l) => l.code === code);
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