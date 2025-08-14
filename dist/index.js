import { Config } from '@mannisto/astro-config';
export { config } from '@mannisto/astro-config';

// src/lib/locale.ts
var LocaleError = class _LocaleError extends Error {
  constructor(message) {
    super(message);
    this.name = "LocaleError";
    Error.captureStackTrace?.(this, _LocaleError);
  }
};
var cache = {
  locale: null,
  config: null
};
var Private = {
  /**
   * Loads the configuration (lazy loaded and cached)
   */
  async loadConfig() {
    if (cache.config) {
      return cache.config;
    }
    try {
      const config2 = await Config.load();
      if (!config2.i18n) {
        throw new LocaleError(
          "Config must export default with `i18n` settings: export default config({ i18n: { ... } })."
        );
      }
      Private.validate(config2.i18n);
      cache.config = config2.i18n;
      return cache.config;
    } catch (error) {
      if (error instanceof LocaleError) {
        throw error;
      }
      throw new LocaleError(
        `Failed to load configuration: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  },
  /**
   * Validates the i18n configuration
   */
  validate(i18nConfig) {
    if (!i18nConfig) {
      throw new LocaleError(
        "Config must export default with `i18n` settings: export default config({ i18n: { ... } })."
      );
    }
    if (!i18nConfig.default) {
      throw new LocaleError("Default locale missing. Add `default` to i18n config.");
    }
    if (!Array.isArray(i18nConfig.locales) || i18nConfig.locales.length === 0) {
      throw new LocaleError("No locales defined. Add at least one locale in `locales` array.");
    }
    const codes = i18nConfig.locales.map((locale) => locale.code);
    if (!codes.includes(i18nConfig.default)) {
      throw new LocaleError(
        `Default locale "${i18nConfig.default}" not in supported locales: ${codes.join(", ")}.`
      );
    }
    for (const locale of i18nConfig.locales) {
      if (!locale.code || typeof locale.code !== "string") {
        throw new LocaleError(
          "Invalid locale code. Each locale needs a `code` string (e.g., 'en', 'fi', 'en-US')."
        );
      }
      if (!locale.endonym || typeof locale.endonym !== "string") {
        throw new LocaleError(
          "Invalid locale endonym. Each locale needs an `endonym` string (e.g., 'English', 'Suomi')."
        );
      }
      if (!locale.dir || !["ltr", "rtl"].includes(locale.dir)) {
        throw new LocaleError("Invalid locale direction. Use 'ltr' or 'rtl'.");
      }
    }
    const uniqueCodes = new Set(codes);
    if (uniqueCodes.size !== codes.length) {
      throw new LocaleError("Duplicate locale codes found. Each code must be unique.");
    }
  },
  /**
   * Detects locale from the current path, localStorage, or browser preferences
   * @returns The detected locale code
   */
  async detect() {
    const config2 = await Private.loadConfig();
    if (typeof window !== "undefined") {
      const pathLocale = await Private.detectFromPath();
      if (pathLocale) {
        return pathLocale;
      }
    }
    if (typeof window !== "undefined" && window.localStorage) {
      const savedLocale = window.localStorage.getItem("astro-i18n-locale");
      if (savedLocale && config2.locales.map((l) => l.code).includes(savedLocale)) {
        return savedLocale;
      }
    }
    if (typeof window !== "undefined" && navigator.languages) {
      const browserLocale = await Private.detectFromBrowser();
      if (browserLocale) {
        return browserLocale;
      }
    }
    return config2.default;
  },
  /**
   * Detects locale from the current URL path
   * @returns The detected locale code or null
   */
  async detectFromPath() {
    if (typeof window === "undefined") return null;
    const config2 = await Private.loadConfig();
    const pathname = window.location.pathname;
    const pathSegments = pathname.split("/").filter(Boolean);
    if (pathSegments.length > 0) {
      const firstSegment = pathSegments[0];
      if (config2.locales.map((l) => l.code).includes(firstSegment)) {
        return firstSegment;
      }
    }
    return null;
  },
  /**
   * Detects locale from browser navigator.languages
   * @returns The detected locale code or null
   */
  async detectFromBrowser() {
    if (typeof window === "undefined" || !navigator.languages) return null;
    const config2 = await Private.loadConfig();
    const supportedLocales = config2.locales.map((l) => l.code);
    for (const browserLang of navigator.languages) {
      if (supportedLocales.includes(browserLang)) {
        return browserLang;
      }
      const langCode = browserLang.split("-")[0];
      if (supportedLocales.includes(langCode)) {
        return langCode;
      }
    }
    return null;
  }
};
var Locale = {
  /**
   * Gets the default locale code
   */
  async default() {
    const config2 = await Private.loadConfig();
    return config2.default;
  },
  /**
   * Gets an array of supported locale codes
   */
  async supported() {
    const config2 = await Private.loadConfig();
    return config2.locales.map((locale) => locale.code);
  },
  /**
   * Gets the current locale code
   */
  async current() {
    if (cache.locale === null) {
      cache.locale = await Private.detect();
    }
    return cache.locale;
  },
  /**
   * Gets information about a specific locale
   * @param locale - The locale code to get info for
   * @returns The locale object or null if not found
   */
  async info(locale) {
    const config2 = await Private.loadConfig();
    return config2.locales.find((l) => l.code === locale) || null;
  },
  /**
   * Sets the current locale and persists it to localStorage
   * @param localeCode - The locale code to set
   */
  async set(localeCode) {
    const config2 = await Private.loadConfig();
    const supportedLocales = config2.locales.map((l) => l.code);
    if (!supportedLocales.includes(localeCode)) {
      throw new LocaleError(
        `Locale "${localeCode}" is not supported. Supported locales: ${supportedLocales.join(", ")}`
      );
    }
    cache.locale = localeCode;
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem("astro-i18n-locale", localeCode);
    }
  },
  /**
   * Generates a localized URL
   * @param path - The base path
   * @param locale - The locale to use (defaults to current locale)
   * @returns The localized URL
   */
  async url(path, locale) {
    const targetLocale = locale || await this.current();
    const config2 = await Private.loadConfig();
    const supportedLocales = config2.locales.map((l) => l.code);
    if (!supportedLocales.includes(targetLocale)) {
      throw new LocaleError(
        `Locale "${targetLocale}" is not supported. Supported locales: ${supportedLocales.join(", ")}`
      );
    }
    if (targetLocale === config2.default) {
      return path.startsWith("/") ? path : `/${path}`;
    }
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `/${targetLocale}${cleanPath}`;
  }
};
function resetLocaleState() {
  cache.locale = null;
  cache.config = null;
}

export { Locale, resetLocaleState };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map