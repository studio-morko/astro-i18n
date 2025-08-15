import fs from "node:fs"
import path from "node:path"
import type { I18nConfig, LocaleConfig } from "../types"

const cache: {
  i18n?: I18nConfig
  translations: Record<string, Record<string, string>>
} = { translations: {} }

let currentLocale: string = ""

const FILENAME = "astro.mannisto.mjs"
const PREFIX = "[@mannisto/astro-i18n]"

/**
 * Loads and validates the configuration file and
 * caches it for future use.
 *
 * @param directory : The root directory of the project,
 *                  defaults to the current working directory
 * @returns       : The configuration object
 */
export function config(directory: string = process.cwd()): I18nConfig {
  if (cache.i18n) return cache.i18n

  const configPath = path.join(directory, FILENAME)

  if (!fs.existsSync(configPath)) {
    throw new Error(`${FILENAME} configuration file not found: ${configPath}`)
  }

  let config: { i18n?: I18nConfig }

  try {
    config = require(configPath).default
  } catch (err) {
    throw new Error(`${PREFIX}: Failed to load ${FILENAME} config file: ${err}`)
  }

  // Check that the i18n object is an object
  if (!config.i18n || typeof config.i18n !== "object") {
    throw new Error(`${PREFIX}: "i18n" object is missing in ${FILENAME} configuration`)
  }

  // Get the i18n object from the user config
  const i18n = config.i18n as I18nConfig

  // Check that enabled is a boolean
  if (typeof i18n.enabled !== "boolean") {
    throw new Error(`${PREFIX}: "i18n.enabled" must be true or false`)
  }

  // Check that locales is an array and is not empty
  if (!Array.isArray(i18n.locales) || i18n.locales.length === 0) {
    throw new Error(`${PREFIX}: "i18n.locales" must be a non-empty array`)
  }

  // Check that all locales are valid
  // 1. Check if the locale code is a non-empty string
  // 2. Check if the locale name is a non-empty string
  // 3. Check if the locale endonym is a non-empty string
  // 4. Check if the locale dir is "ltr" or "rtl"
  for (const loc of i18n.locales) {
    if (typeof loc.code !== "string" || !loc.code.trim()) {
      throw new Error(`${PREFIX}: Locale is missing a valid "code"`)
    }
    if (typeof loc.name !== "string" || !loc.name.trim()) {
      throw new Error(`${PREFIX}: Locale "${loc.code}" is missing a valid "name"`)
    }
    if (typeof loc.endonym !== "string" || !loc.endonym.trim()) {
      throw new Error(`${PREFIX}: Locale "${loc.code}" is missing a valid "endonym"`)
    }
    if (!["ltr", "rtl"].includes(loc.dir)) {
      throw new Error(`${PREFIX}: Locale "${loc.code}" must have "dir" set to "ltr" or "rtl"`)
    }
  }

  // Check that default locale is one of the supported locales
  if (!i18n.default || !i18n.locales.some((l) => l.code === i18n.default)) {
    throw new Error(`${PREFIX}: "i18n.default" must be one of the supported locale codes`)
  }

  // If translations are enabled, check if the translations object is valid
  if (i18n.translations) {
    if (typeof i18n.translations !== "object") {
      throw new Error(`${PREFIX}: "i18n.translations" must be an object`)
    }
    if (typeof i18n.translations.enabled !== "boolean") {
      throw new Error(`${PREFIX}: "i18n.translations.enabled" must be true or false`)
    }
    if (typeof i18n.translations.path !== "string" || !i18n.translations.path.trim()) {
      throw new Error(`${PREFIX}: "i18n.translations.path" must be a non-empty string`)
    }
    if (i18n.translations.enabled) {
      for (const loc of i18n.locales) {
        const tsFile = path.join(directory, i18n.translations.path, `${loc.code}.ts`)
        const jsFile = path.join(directory, i18n.translations.path, `${loc.code}.js`)
        if (!fs.existsSync(tsFile) && !fs.existsSync(jsFile)) {
          throw new Error(
            `${PREFIX}: Missing translations file for locale "${loc.code}" (tried ${loc.code}.ts and ${loc.code}.js)`,
          )
        }
      }
    }
  }

  cache.i18n = i18n
  return cache.i18n
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
  info(locale?: string): LocaleConfig | undefined {
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
   * Returns the translation for a given key, loading it from cache if available.
   * If not in cache, loads it from disk, caches it, and then returns.
   */
  t(key: string, locale?: string, vars?: Record<string, string | number>): string {
    const cfg = config()
    if (!cfg.translations?.enabled) return key

    const code = locale || Locale.current

    // Ensure translations object exists in cache
    if (!cache.translations) {
      cache.translations = {}
    }

    // Load into cache if not present
    if (!cache.translations[code]) {
      // Try .ts first, then .js
      let translationsPath = path.join(process.cwd(), cfg.translations!.path, `${code}.ts`)
      if (!fs.existsSync(translationsPath)) {
        translationsPath = path.join(process.cwd(), cfg.translations!.path, `${code}.js`)
        if (!fs.existsSync(translationsPath)) {
          throw new Error(
            `${PREFIX}: Missing translations file for locale "${code}" (tried ${code}.ts and ${code}.js)`,
          )
        }
      }
      cache.translations[code] = require(translationsPath).default
    }

    // Safely read the translation
    let text = cache.translations[code]?.[key] ?? key

    // Replace variable placeholders
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        text = text.replace(`{${k}}`, String(v))
      }
    }
    return text
  },
}
