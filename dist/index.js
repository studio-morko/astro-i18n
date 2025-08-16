import fs from 'fs';
import path from 'path';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';

// src/integration.ts
function validate(config2) {
  if (!config2.enabled) {
    return;
  }
  if (!config2.default) {
    throw new Error('"default" is required when enabled is true');
  }
  if (!config2.locales || !Array.isArray(config2.locales) || config2.locales.length === 0) {
    throw new Error('"locales" must be a non-empty array');
  }
  if (!config2.locales.some((l) => l.code === config2.default)) {
    throw new Error('"default" must be one of the supported locale codes');
  }
  if (config2.translations?.enabled && !config2.translations.path) {
    throw new Error('"translations.path" is required when translations.enabled is true');
  }
}
function loadTranslations(config2) {
  const translations = {};
  if (config2.translations?.enabled && config2.translations.path) {
    for (const locale of config2.locales) {
      const tsPath = path.join(process.cwd(), config2.translations.path, `${locale.code}.ts`);
      const jsPath = path.join(process.cwd(), config2.translations.path, `${locale.code}.js`);
      const translationData = {};
      if (fs.existsSync(tsPath)) {
        try {
          const content = fs.readFileSync(tsPath, "utf8");
          const ast = parse(content, {
            sourceType: "module",
            plugins: ["typescript"]
          });
          traverse(ast, {
            ExportDefaultDeclaration(path2) {
              const declaration = path2.node.declaration;
              if (declaration.type === "ObjectExpression") {
                declaration.properties.forEach((prop) => {
                  if (prop.type === "ObjectProperty" && prop.value.type === "StringLiteral") {
                    const key = prop.key.type === "StringLiteral" ? prop.key.value : prop.key.name;
                    translationData[key] = prop.value.value;
                  }
                });
              }
            }
          });
        } catch (error) {
          throw new Error(`Failed to load translation file ${tsPath}: ${error}`);
        }
      } else if (fs.existsSync(jsPath)) {
        try {
          const content = fs.readFileSync(jsPath, "utf8");
          const ast = parse(content, {
            sourceType: "module",
            plugins: ["typescript"]
          });
          traverse(ast, {
            ExportDefaultDeclaration(path2) {
              const declaration = path2.node.declaration;
              if (declaration.type === "ObjectExpression") {
                declaration.properties.forEach((prop) => {
                  if (prop.type === "ObjectProperty" && prop.value.type === "StringLiteral") {
                    const key = prop.key.type === "StringLiteral" ? prop.key.value : prop.key.name;
                    translationData[key] = prop.value.value;
                  }
                });
              }
            }
          });
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