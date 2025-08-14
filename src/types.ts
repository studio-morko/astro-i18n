/**
 * Locale configuration object
 */
export interface LocaleConfig {
  code: string
  endonym: string
  dir: "ltr" | "rtl"
}

/**
 * Translation configuration
 */
export interface TranslationConfig {
  enabled: boolean
  path: string
}

/**
 * Main internationalization configuration
 */
export interface I18nConfig {
  default: string
  locales: LocaleConfig[]
  translations?: TranslationConfig
}
