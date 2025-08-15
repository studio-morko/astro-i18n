import fs from "node:fs"
import path from "node:path"
import type { Configuration, Locales } from "../types"

// Global configuration injected by the Astro integration
declare global {
  var __ASTRO_I18N_CONFIG__: Configuration | undefined
}

const cache: {
  i18n?: Configuration
  translations: Record<string, Record<string, string>>
} = { translations: {} }

let currentLocale: string = ""

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
    return currentLocale || config().default
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
   * Sets the current locale
   */
  set(locale: string): void {
    currentLocale = locale
  },

  /**
   * Returns the locale configuration for a given locale
   */
  info(locale?: string): Locales | undefined {
    const code = locale || Locale.current
    return config().locales.find((l) => l.code === code)
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
   * Returns the translation for a given key, loading it from cache if available.
   * If not in cache, loads it from disk, caches it, and then returns.
   */
  t(key: string, locale?: string): string {
    const cfg = config()

    // Start with the key as the base text
    let text = key

    // If translations are enabled and path is provided, try to load from translation files
    if (cfg.translations?.enabled && cfg.translations.path) {
      const code = locale || Locale.current

      // Ensure translations object exists in cache
      if (!cache.translations) {
        cache.translations = {}
      }

      // Load into cache if not present
      if (!cache.translations[code]) {
        // Try .ts first, then .js
        let translationsPath = path.join(process.cwd(), cfg.translations.path, `${code}.ts`)
        if (!fs.existsSync(translationsPath)) {
          translationsPath = path.join(process.cwd(), cfg.translations.path, `${code}.js`)
          if (!fs.existsSync(translationsPath)) {
            throw new Error(
              `${PREFIX}: Missing translations file for locale "${code}" (tried ${code}.ts and ${code}.js)`,
            )
          }
        }
        cache.translations[code] = require(translationsPath).default
      }

      // Try to get translation from cache, fallback to key if not found
      text = cache.translations[code]?.[key] ?? key
    }

    return text
  },
}
