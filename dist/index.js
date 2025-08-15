import fs from 'fs';
import path from 'path';

var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var cache = { translations: {} };
var currentLocale = "";
var FILENAME = "astro.mannisto.mjs";
var PREFIX = "[@mannisto/astro-i18n]";
function config(directory = process.cwd()) {
  if (cache.i18n) return cache.i18n;
  const configPath = path.join(directory, FILENAME);
  if (!fs.existsSync(configPath)) {
    throw new Error(`${FILENAME} configuration file not found: ${configPath}`);
  }
  let config2;
  try {
    config2 = __require(configPath).default;
  } catch (err) {
    throw new Error(`${PREFIX}: Failed to load ${FILENAME} config file: ${err}`);
  }
  if (!config2.i18n || typeof config2.i18n !== "object") {
    throw new Error(`${PREFIX}: "i18n" object is missing in ${FILENAME} configuration`);
  }
  const i18n = config2.i18n;
  if (typeof i18n.enabled !== "boolean") {
    throw new Error(`${PREFIX}: "i18n.enabled" must be true or false`);
  }
  if (!Array.isArray(i18n.locales) || i18n.locales.length === 0) {
    throw new Error(`${PREFIX}: "i18n.locales" must be a non-empty array`);
  }
  for (const loc of i18n.locales) {
    if (typeof loc.code !== "string" || !loc.code.trim()) {
      throw new Error(`${PREFIX}: Locale is missing a valid "code"`);
    }
    if (typeof loc.name !== "string" || !loc.name.trim()) {
      throw new Error(`${PREFIX}: Locale "${loc.code}" is missing a valid "name"`);
    }
    if (typeof loc.endonym !== "string" || !loc.endonym.trim()) {
      throw new Error(`${PREFIX}: Locale "${loc.code}" is missing a valid "endonym"`);
    }
    if (!["ltr", "rtl"].includes(loc.dir)) {
      throw new Error(`${PREFIX}: Locale "${loc.code}" must have "dir" set to "ltr" or "rtl"`);
    }
  }
  if (!i18n.default || !i18n.locales.some((l) => l.code === i18n.default)) {
    throw new Error(`${PREFIX}: "i18n.default" must be one of the supported locale codes`);
  }
  if (i18n.translations) {
    if (typeof i18n.translations !== "object") {
      throw new Error(`${PREFIX}: "i18n.translations" must be an object`);
    }
    if (typeof i18n.translations.enabled !== "boolean") {
      throw new Error(`${PREFIX}: "i18n.translations.enabled" must be true or false`);
    }
    if (typeof i18n.translations.path !== "string" || !i18n.translations.path.trim()) {
      throw new Error(`${PREFIX}: "i18n.translations.path" must be a non-empty string`);
    }
    if (i18n.translations.enabled) {
      for (const loc of i18n.locales) {
        const tsFile = path.join(directory, i18n.translations.path, `${loc.code}.ts`);
        const jsFile = path.join(directory, i18n.translations.path, `${loc.code}.js`);
        if (!fs.existsSync(tsFile) && !fs.existsSync(jsFile)) {
          throw new Error(
            `${PREFIX}: Missing translations file for locale "${loc.code}" (tried ${loc.code}.ts and ${loc.code}.js)`
          );
        }
      }
    }
  }
  cache.i18n = i18n;
  return cache.i18n;
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
   * Returns the translation for a given key, loading it from cache if available.
   * If not in cache, loads it from disk, caches it, and then returns.
   */
  t(key, locale, vars) {
    const cfg = config();
    if (!cfg.translations?.enabled) return key;
    const code = locale || Locale.current;
    if (!cache.translations) {
      cache.translations = {};
    }
    if (!cache.translations[code]) {
      let translationsPath = path.join(process.cwd(), cfg.translations.path, `${code}.ts`);
      if (!fs.existsSync(translationsPath)) {
        translationsPath = path.join(process.cwd(), cfg.translations.path, `${code}.js`);
        if (!fs.existsSync(translationsPath)) {
          throw new Error(
            `${PREFIX}: Missing translations file for locale "${code}" (tried ${code}.ts and ${code}.js)`
          );
        }
      }
      cache.translations[code] = __require(translationsPath).default;
    }
    let text = cache.translations[code]?.[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        text = text.replace(`{${k}}`, String(v));
      }
    }
    return text;
  }
};

export { Locale };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map