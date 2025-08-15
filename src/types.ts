/**
 * Locale configuration
 */
export interface Locales {
  code: string
  name: string
  endonym: string
  dir: "ltr" | "rtl"
}

/**
 * Translation configuration
 */
export interface Translations {
  enabled?: boolean
  path?: string
}

/**
 * Internationalization configuration
 */
export interface Configuration {
  enabled: boolean
  default: string
  locales: Locales[]
  translations?: Translations
}
