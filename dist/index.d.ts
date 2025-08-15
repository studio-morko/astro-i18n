/**
 * Locale configuration object
 */
interface LocaleConfig {
    code: string;
    name: string;
    endonym: string;
    dir: "ltr" | "rtl";
}
/**
 * Translation configuration
 */
interface TranslationConfig {
    enabled: boolean;
    path: string;
}
/**
 * Main internationalization configuration
 */
interface I18nConfig {
    enabled: boolean;
    default: string;
    locales: LocaleConfig[];
    translations?: TranslationConfig;
}

/**
 * Locale namespace functions
 */
declare const Locale: {
    /**
     * Returns the enabled status of the i18n configuration
     */
    readonly enabled: boolean;
    /**
     * Returns the current locale
     */
    readonly current: string;
    /**
     * Returns the supported locales
     */
    readonly supported: string[];
    /**
     * Returns the default locale
     */
    readonly default: string;
    /**
     * Sets the current locale
     */
    set(locale: string): void;
    /**
     * Returns the locale configuration for a given locale
     */
    info(locale?: string): LocaleConfig | undefined;
    /**
     * Returns the URL for a given pathname and locale
     */
    url(pathname?: string, locale?: string): string;
    /**
     * Returns the translation for a given key, loading it from cache if available.
     * If not in cache, loads it from disk, caches it, and then returns.
     */
    t(key: string, locale?: string, vars?: Record<string, string | number>): string;
};

export { type I18nConfig, Locale, type LocaleConfig, type TranslationConfig };
