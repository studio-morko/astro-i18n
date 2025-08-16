import fs from "node:fs"
import path from "node:path"

import type { AstroIntegration } from "astro"
import type { Configuration } from "./types.js"

function validate(config: Configuration): void {
  if (!config.enabled) {
    return
  }

  if (!config.default) {
    throw new Error('"default" is required when enabled is true')
  }

  if (!config.locales || !Array.isArray(config.locales) || config.locales.length === 0) {
    throw new Error('"locales" must be a non-empty array')
  }

  if (!config.locales.some((l) => l.code === config.default)) {
    throw new Error('"default" must be one of the supported locale codes')
  }

  if (config.translations?.enabled && !config.translations.path) {
    throw new Error('"translations.path" is required when translations.enabled is true')
  }
}

function loadTranslations(config: Configuration): Record<string, Record<string, string>> {
  const translations: Record<string, Record<string, string>> = {}

  if (config.translations?.enabled && config.translations.path) {
    for (const locale of config.locales) {
      const tsPath = path.join(process.cwd(), config.translations.path, `${locale.code}.ts`)
      const jsPath = path.join(process.cwd(), config.translations.path, `${locale.code}.js`)

      const translationData: Record<string, string> = {}

      if (fs.existsSync(tsPath)) {
        try {
          const content = fs.readFileSync(tsPath, "utf8")
          
          // Remove comments
          const noComments = content
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* */ comments
            .replace(/\/\/.*$/gm, '') // Remove // comments
          
          // Extract the export default object
          const match = noComments.match(/export\s+default\s*(\{[\s\S]*\})\s*;?\s*$/)
          if (match) {
            const objectContent = match[1]
            
            // Parse key-value pairs
            const keyValueRegex = /(["']?)([^"'\s:]+)\1\s*:\s*["']([^"']*)["']/g
            let keyValueMatch
            
            while ((keyValueMatch = keyValueRegex.exec(objectContent)) !== null) {
              const key = keyValueMatch[2]
              const value = keyValueMatch[3]
              translationData[key] = value
            }
          }
        } catch (error) {
          throw new Error(`Failed to load translation file ${tsPath}: ${error}`)
        }
      } else if (fs.existsSync(jsPath)) {
        try {
          const content = fs.readFileSync(jsPath, "utf8")
          
          // Remove comments
          const noComments = content
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* */ comments
            .replace(/\/\/.*$/gm, '') // Remove // comments
          
          // Extract the export default object
          const match = noComments.match(/export\s+default\s*(\{[\s\S]*\})\s*;?\s*$/)
          if (match) {
            const objectContent = match[1]
            
            // Parse key-value pairs
            const keyValueRegex = /(["']?)([^"'\s:]+)\1\s*:\s*["']([^"']*)["']/g
            let keyValueMatch
            
            while ((keyValueMatch = keyValueRegex.exec(objectContent)) !== null) {
              const key = keyValueMatch[2]
              const value = keyValueMatch[3]
              translationData[key] = value
            }
          }
        } catch (error) {
          throw new Error(`Failed to load translation file ${jsPath}: ${error}`)
        }
      } else {
        throw new Error(
          `Translation file not found for locale "${locale.code}" (tried ${locale.code}.ts and ${locale.code}.js)`,
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

        logger.info(`enabled: ${config.enabled}`)
        if (config.enabled) {
          logger.info(`default locale: ${config.default}`)
          logger.info(`supported locales: ${config.locales.map((l) => l.code).join(", ")}`)
        }

        let translations: Record<string, Record<string, string>> = {}
        if (config.translations?.enabled) {
          try {
                                    translations = loadTranslations(config)
            logger.info(`loaded translations for ${Object.keys(translations).length} locales`)
          } catch (error) {
            logger.error(`Failed to load translations: ${error}`)
            throw error
          }
        }

        // Make configuration available globally during build time
        (globalThis as any).__ASTRO_I18N_CONFIG__ = config;
        (globalThis as any).__ASTRO_I18N_TRANSLATIONS__ = translations;

        const configScript = `globalThis.__ASTRO_I18N_CONFIG__ = ${JSON.stringify(config)};`
        const translationsScript = `globalThis.__ASTRO_I18N_TRANSLATIONS__ = ${JSON.stringify(translations)};`

        // Debug: log what we're injecting
        logger.info(`Injecting config: ${configScript}`)
        logger.info(`Injecting translations: ${translationsScript}`)

        injectScript("head-inline", configScript + translationsScript)
      },
    },
  }
}
