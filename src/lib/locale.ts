import type { Configuration, Locales } from "../types"

// Global configuration injected by the Astro integration
declare global {
  var __ASTRO_I18N_CONFIG__: Configuration | undefined
  var __ASTRO_I18N_TRANSLATIONS__: Record<string, Record<string, string>> | undefined
}

const cache: {
  i18n?: Configuration
  translations: Record<string, Record<string, string>>
} = { translations: {} }

let currentLocale: string = ""

// Try to get saved locale from localStorage on initialization
if (typeof window !== "undefined") {
  try {
    const saved = localStorage.getItem("astro-i18n-locale")
    if (saved) {
      currentLocale = saved
    }
  } catch (error) {
    // Ignore localStorage errors (e.g., in private browsing)
  }
}

const PREFIX = "[@mannisto/astro-i18n]"

/**
 * Loads and validates the configuration file and
 * caches it for future use.
 *
 * @param directory : The root directory of the project,
 *                  defaults to the current working directory
 * @returns       : The configuration object
 */
export function config(): Configuration {
  if (cache.i18n) return cache.i18n

  // Get injected configuration from Astro integration
  const injectedConfig = globalThis.__ASTRO_I18N_CONFIG__
  if (injectedConfig) {
    cache.i18n = injectedConfig
    return injectedConfig
  }

  throw new Error(
    `${PREFIX}: No i18n configuration found. Make sure to add the i18n integration to your astro.config.mjs`,
  )
}

/**
 * Locale namespace functions
 */
export const Locale = {
  /**
   * Returns the enabled status of the i18n configuration
   */
  get enabled(): boolean {
    return config().enabled
  },

  /**
   * Returns the current locale
   */
  get current(): string {
    // If we have a saved locale, validate it's still supported
    if (currentLocale) {
      const supported = config().locales.map((l) => l.code)
      if (supported.includes(currentLocale)) {
        return currentLocale
      }
      // If saved locale is no longer supported, clear it
      currentLocale = ""
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("astro-i18n-locale")
        } catch (error) {
          // Ignore localStorage errors
        }
      }
    }
    return config().default
  },

  /**
   * Returns the supported locales
   */
  get supported(): string[] {
    return config().locales.map((l) => l.code)
  },

  /**
   * Returns the default locale
   */
  get default(): string {
    return config().default
  },

  /**
   * Sets the current locale and saves it to localStorage
   */
  set(locale: string): void {
    currentLocale = locale
    
    // Save to localStorage if available
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("astro-i18n-locale", locale)
      } catch (error) {
        // Ignore localStorage errors (e.g., in private browsing)
      }
    }
  },

  /**
   * Returns the locale configuration for a given locale
   * Falls back to default locale if the requested locale is not found
   */
  info(locale?: string): Locales {
    const code = locale || Locale.current
    const found = config().locales.find((l) => l.code === code)
    if (found) {
      return found
    }
    
    // Fall back to default locale if requested locale not found
    const defaultLocale = config().locales.find((l) => l.code === config().default)
    if (defaultLocale) {
      return defaultLocale
    }
    
    // If even default locale is not found (shouldn't happen with validation), return first available
    return config().locales[0]
  },

  /**
   * Returns the URL for a given pathname and locale
   */
  url(pathname: string = "/", locale?: string): string {
    const code = locale || Locale.current
    if (!pathname.startsWith("/")) pathname = `/${pathname}`
    return `/${code}${pathname}`
  },

  /**
   * Replaces variable placeholders in a text string
   * @param text - The text containing variable placeholders like {name}
   * @param vars - Object containing variable values
   * @returns The text with variables replaced
   */
  replace(text: string, vars: Record<string, string | number>): string {
    let result = text
    for (const [k, v] of Object.entries(vars)) {
      result = result.replace(`{${k}}`, String(v))
    }
    return result
  },

  /**
   * Returns the translations object for the current or specified locale.
   * Uses translations loaded at build time and injected via global variables.
   *
   * @param locale - Optional locale code, defaults to current locale
   * @returns The translations object (synchronous for static generation)
   */
  translations(locale?: string): Record<string, string> {
    const cfg = config()
    const code = locale || Locale.current

    // If translations are disabled, return empty object
    if (!cfg.translations?.enabled) {
      return {}
    }

    // Get translations from injected global variable
    const injectedTranslations = globalThis.__ASTRO_I18N_TRANSLATIONS__
    if (injectedTranslations?.[code]) {
      return injectedTranslations[code]
    }

    // Return empty object if no translations found
    return {}
  },
}
