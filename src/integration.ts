import fs from "node:fs"
import path from "node:path"
import type { AstroIntegration } from "astro"
import type { Configuration } from "./types.js"

const PREFIX = "[@mannisto/astro-i18n]"

function validate(config: Configuration) {
  // Validate enabled field
  if (typeof config.enabled !== "boolean") {
    throw new Error(`${PREFIX}: "enabled" must be a boolean`)
  }

  // If disabled, no further validation needed
  if (!config.enabled) return

  // Validate default locale
  if (typeof config.default !== "string" || !config.default.trim()) {
    throw new Error(`${PREFIX}: "default" must be a non-empty string`)
  }

  // Validate locales array
  if (!Array.isArray(config.locales) || config.locales.length === 0) {
    throw new Error(`${PREFIX}: "locales" must be a non-empty array`)
  }

  // Validate each locale in the array
  for (const [index, locale] of config.locales.entries()) {
    if (typeof locale.code !== "string" || !locale.code.trim()) {
      throw new Error(`${PREFIX}: "locales[${index}].code" must be a non-empty string`)
    }
    if (typeof locale.name !== "string" || !locale.name.trim()) {
      throw new Error(`${PREFIX}: "locales[${index}].name" must be a non-empty string`)
    }
    if (typeof locale.endonym !== "string" || !locale.endonym.trim()) {
      throw new Error(`${PREFIX}: "locales[${index}].endonym" must be a non-empty string`)
    }
    if (locale.dir !== "ltr" && locale.dir !== "rtl") {
      throw new Error(`${PREFIX}: "locales[${index}].dir" must be either "ltr" or "rtl"`)
    }
  }

  // Validate default locale exists in locales
  if (!config.locales.some((l) => l.code === config.default)) {
    throw new Error(`${PREFIX}: "default" must be one of the supported locale codes`)
  }

  // Validate translations configuration if it exists
  if (config.translations) {
    // If translations.enabled is explicitly true, validate the path
    if (config.translations.enabled === true) {
      if (typeof config.translations.path !== "string" || !config.translations.path.trim()) {
        throw new Error(
          `${PREFIX}: "translations.path" must be a non-empty string when translations are enabled`,
        )
      }
    }
  }
}

function loadTranslations(config: Configuration): Record<string, Record<string, string>> {
  const translations: Record<string, Record<string, string>> = {}

  if (config.translations?.enabled && config.translations.path) {
    for (const locale of config.locales) {
      const tsPath = path.join(process.cwd(), config.translations.path, `${locale.code}.ts`)
      const jsPath = path.join(process.cwd(), config.translations.path, `${locale.code}.js`)

      let translationData: Record<string, string> = {}

      if (fs.existsSync(tsPath)) {
        try {
          translationData = require(tsPath).default
        } catch (error) {
          throw new Error(`${PREFIX}: Failed to load translation file ${tsPath}: ${error}`)
        }
      } else if (fs.existsSync(jsPath)) {
        try {
          translationData = require(jsPath).default
        } catch (error) {
          throw new Error(`${PREFIX}: Failed to load translation file ${jsPath}: ${error}`)
        }
      } else {
        throw new Error(
          `${PREFIX}: Translation file not found for locale "${locale.code}" (tried ${locale.code}.ts and ${locale.code}.js)`,
        )
      }

      translations[locale.code] = translationData
    }
  }

  return translations
}

export default function i18n(config: Configuration): AstroIntegration {
  return {
    name: "@mannisto/astro-i18n",
    hooks: {
      "astro:config:setup": ({ injectScript, logger }) => {
        validate(config)

        logger.info(`${PREFIX}: enabled: ${config.enabled}`)
        if (config.enabled) {
          logger.info(`${PREFIX}: default locale: ${config.default}`)
          logger.info(
            `${PREFIX}: supported locales: ${config.locales.map((l) => l.code).join(", ")}`,
          )
        }

        // Load translations at build time if enabled
        let translations: Record<string, Record<string, string>> = {}
        if (config.translations?.enabled) {
          try {
            translations = loadTranslations(config)
            logger.info(
              `${PREFIX}: loaded translations for ${Object.keys(translations).length} locales`,
            )
          } catch (error) {
            logger.error(`${PREFIX}: Failed to load translations: ${error}`)
            throw error
          }
        }

        // Inject configuration and translations into global scope
        const configScript = `globalThis.__ASTRO_I18N_CONFIG__ = ${JSON.stringify(config)};`
        const translationsScript = `globalThis.__ASTRO_I18N_TRANSLATIONS__ = ${JSON.stringify(translations)};`

        injectScript("page-ssr", configScript + translationsScript)
      },
    },
  }
}
