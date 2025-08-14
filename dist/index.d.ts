export { config } from '@mannisto/astro-config';

/**
 * Locale configuration object
 */
interface LocaleConfig {
    code: string;
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
    default: string;
    locales: LocaleConfig[];
    translations?: TranslationConfig;
}

/**
 * Locale namespace for managing internationalization
 */
declare const Locale: {
    /**
     * Gets the default locale code
     */
    default(): Promise<string>;
    /**
     * Gets an array of supported locale codes
     */
    supported(): Promise<string[]>;
    /**
     * Gets the current locale code
     */
    current(): Promise<string>;
    /**
     * Gets information about a specific locale
     * @param locale - The locale code to get info for
     * @returns The locale object or null if not found
     */
    info(locale: string): Promise<LocaleConfig | null>;
    /**
     * Sets the current locale and persists it to localStorage
     * @param localeCode - The locale code to set
     */
    set(localeCode: string): Promise<void>;
    /**
     * Generates a localized URL
     * @param path - The base path
     * @param locale - The locale to use (defaults to current locale)
     * @returns The localized URL
     */
    url(path: string, locale?: string): Promise<string>;
};
declare function resetLocaleState(): void;

export { type I18nConfig, Locale, type LocaleConfig, type TranslationConfig, resetLocaleState };
