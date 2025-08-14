import { Config, config } from "@mannisto/astro-config"
import type { I18nConfig, LocaleConfig } from "../types.js"

export { config }

export class LocaleError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "LocaleError"
    Error.captureStackTrace?.(this, LocaleError)
  }
}

// Internal state
const cache: {
  locale: string | null
  config: I18nConfig | null
} = {
  locale: null,
  config: null,
}

/**
 * Internal namespace for private functions
 */
const Private = {
  /**
   * Loads the configuration (lazy loaded and cached)
   */
  async loadConfig(): Promise<I18nConfig> {
    if (cache.config) {
      return cache.config
    }

    try {
      const config = await Config.load()
      if (!config.i18n) {
        throw new LocaleError(
          "Config must export default with `i18n` settings: export default config({ i18n: { ... } }).",
        )
      }

      Private.validate(config.i18n)
      cache.config = config.i18n
      return cache.config!
    } catch (error) {
      if (error instanceof LocaleError) {
        throw error
      }
      throw new LocaleError(
        `Failed to load configuration: ${error instanceof Error ? error.message : "Unknown error"}`,
      )
    }
  },

  /**
   * Validates the i18n configuration
   */
  validate(i18nConfig: I18nConfig): void {
    if (!i18nConfig) {
      throw new LocaleError(
        "Config must export default with `i18n` settings: export default config({ i18n: { ... } }).",
      )
    }

    if (!i18nConfig.default) {
      throw new LocaleError("Default locale missing. Add `default` to i18n config.")
    }

    if (!Array.isArray(i18nConfig.locales) || i18nConfig.locales.length === 0) {
      throw new LocaleError("No locales defined. Add at least one locale in `locales` array.")
    }

    const codes = i18nConfig.locales.map((locale: LocaleConfig) => locale.code)

    if (!codes.includes(i18nConfig.default)) {
      throw new LocaleError(
        `Default locale "${i18nConfig.default}" not in supported locales: ${codes.join(", ")}.`,
      )
    }

    // Validate each locale
    for (const locale of i18nConfig.locales) {
      // Locale must have a code
      if (!locale.code || typeof locale.code !== "string") {
        throw new LocaleError(
          "Invalid locale code. Each locale needs a `code` string (e.g., 'en', 'fi', 'en-US').",
        )
      }

      // Locale must have an endonym
      if (!locale.endonym || typeof locale.endonym !== "string") {
        throw new LocaleError(
          "Invalid locale endonym. Each locale needs an `endonym` string (e.g., 'English', 'Suomi').",
        )
      }

      // Locale must have a valid direction
      if (!locale.dir || !["ltr", "rtl"].includes(locale.dir)) {
        throw new LocaleError("Invalid locale direction. Use 'ltr' or 'rtl'.")
      }
    }

    // Check for duplicate locale codes
    const uniqueCodes = new Set(codes)
    if (uniqueCodes.size !== codes.length) {
      throw new LocaleError("Duplicate locale codes found. Each code must be unique.")
    }
  },

  /**
   * Detects locale from the current path, localStorage, or browser preferences
   * @returns The detected locale code
   */
  async detect(): Promise<string> {
    const config = await Private.loadConfig()

    // 1. Check if locale is in the current path
    if (typeof window !== "undefined") {
      const pathLocale = await Private.detectFromPath()
      if (pathLocale) {
        return pathLocale
      }
    }

    // 2. Check localStorage for saved locale
    if (typeof window !== "undefined" && window.localStorage) {
      const savedLocale = window.localStorage.getItem("astro-i18n-locale")
      if (savedLocale && config.locales.map((l: LocaleConfig) => l.code).includes(savedLocale)) {
        return savedLocale
      }
    }

    // 3. Check browser navigator.languages
    if (typeof window !== "undefined" && navigator.languages) {
      const browserLocale = await Private.detectFromBrowser()
      if (browserLocale) {
        return browserLocale
      }
    }

    // 4. Use default locale
    return config.default
  },

  /**
   * Detects locale from the current URL path
   * @returns The detected locale code or null
   */
  async detectFromPath(): Promise<string | null> {
    if (typeof window === "undefined") return null

    const config = await Private.loadConfig()
    const pathname = window.location.pathname
    const pathSegments = pathname.split("/").filter(Boolean)

    if (pathSegments.length > 0) {
      const firstSegment = pathSegments[0]
      if (config.locales.map((l: LocaleConfig) => l.code).includes(firstSegment)) {
        return firstSegment
      }
    }

    return null
  },

  /**
   * Detects locale from browser navigator.languages
   * @returns The detected locale code or null
   */
  async detectFromBrowser(): Promise<string | null> {
    if (typeof window === "undefined" || !navigator.languages) return null

    const config = await Private.loadConfig()
    const supportedLocales = config.locales.map((l: LocaleConfig) => l.code)

    for (const browserLang of navigator.languages) {
      // Try exact match first
      if (supportedLocales.includes(browserLang)) {
        return browserLang
      }

      // Try language code match (e.g., 'en-US' -> 'en')
      const langCode = browserLang.split("-")[0]
      if (supportedLocales.includes(langCode)) {
        return langCode
      }
    }

    return null
  },
}

/**
 * Locale namespace for managing internationalization
 */
export const Locale = {
  /**
   * Gets the default locale code
   */
  async default(): Promise<string> {
    const config = await Private.loadConfig()
    return config.default
  },

  /**
   * Gets an array of supported locale codes
   */
  async supported(): Promise<string[]> {
    const config = await Private.loadConfig()
    return config.locales.map((locale: LocaleConfig) => locale.code)
  },

  /**
   * Gets the current locale code
   */
  async current(): Promise<string> {
    if (cache.locale === null) {
      cache.locale = await Private.detect()
    }
    return cache.locale
  },

  /**
   * Gets information about a specific locale
   * @param locale - The locale code to get info for
   * @returns The locale object or null if not found
   */
  async info(locale: string): Promise<LocaleConfig | null> {
    const config = await Private.loadConfig()
    return config.locales.find((l: LocaleConfig) => l.code === locale) || null
  },

  /**
   * Sets the current locale and persists it to localStorage
   * @param localeCode - The locale code to set
   */
  async set(localeCode: string): Promise<void> {
    const config = await Private.loadConfig()
    const supportedLocales = config.locales.map((l: LocaleConfig) => l.code)

    if (!supportedLocales.includes(localeCode)) {
      throw new LocaleError(
        `Locale "${localeCode}" is not supported. Supported locales: ${supportedLocales.join(", ")}`,
      )
    }

    cache.locale = localeCode

    // Persist to localStorage (client-side only)
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem("astro-i18n-locale", localeCode)
    }
  },

  /**
   * Generates a localized URL
   * @param path - The base path
   * @param locale - The locale to use (defaults to current locale)
   * @returns The localized URL
   */
  async url(path: string, locale?: string): Promise<string> {
    const targetLocale = locale || (await this.current())
    const config = await Private.loadConfig()
    const supportedLocales = config.locales.map((l: LocaleConfig) => l.code)

    if (!supportedLocales.includes(targetLocale)) {
      throw new LocaleError(
        `Locale "${targetLocale}" is not supported. Supported locales: ${supportedLocales.join(", ")}`,
      )
    }

    // If it's the default locale, don't prefix the path
    if (targetLocale === config.default) {
      return path.startsWith("/") ? path : `/${path}`
    }

    // For non-default locales, prefix with locale code
    const cleanPath = path.startsWith("/") ? path : `/${path}`
    return `/${targetLocale}${cleanPath}`
  },
}

// Function to reset internal state (for testing)
export function resetLocaleState(): void {
  cache.locale = null
  cache.config = null
}
