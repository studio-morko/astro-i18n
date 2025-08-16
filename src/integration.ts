import fs from "node:fs"
import path from "node:path"
import { parse } from "@babel/parser"
import traverse from "@babel/traverse"
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
          const ast = parse(content, {
            sourceType: "module",
            plugins: ["typescript"],
          })

          traverse(ast, {
            ExportDefaultDeclaration(path) {
              const declaration = path.node.declaration
              if (declaration.type === "ObjectExpression") {
                declaration.properties.forEach((prop) => {
                  if (prop.type === "ObjectProperty" && prop.value.type === "StringLiteral") {
                    const key =
                      prop.key.type === "StringLiteral" ? prop.key.value : (prop.key as any).name
                    translationData[key] = prop.value.value
                  }
                })
              }
            },
          })
        } catch (error) {
          throw new Error(`Failed to load translation file ${tsPath}: ${error}`)
        }
      } else if (fs.existsSync(jsPath)) {
        try {
          const content = fs.readFileSync(jsPath, "utf8")
          const ast = parse(content, {
            sourceType: "module",
            plugins: ["typescript"],
          })

          traverse(ast, {
            ExportDefaultDeclaration(path) {
              const declaration = path.node.declaration
              if (declaration.type === "ObjectExpression") {
                declaration.properties.forEach((prop) => {
                  if (
                    prop.type === "ObjectProperty" &&
                    prop.key.type === "StringLiteral" &&
                    prop.value.type === "StringLiteral"
                  ) {
                    translationData[prop.key.value] = prop.value.value
                  }
                })
              }
            },
          })
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

        const configScript = `globalThis.__ASTRO_I18N_CONFIG__ = ${JSON.stringify(config)};`
        const translationsScript = `globalThis.__ASTRO_I18N_TRANSLATIONS__ = ${JSON.stringify(translations)};`

        injectScript("page-ssr", configScript + translationsScript)
      },
    },
  }
}
