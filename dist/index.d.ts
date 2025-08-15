import { AstroIntegration } from 'astro';

/**
 * Locale configuration
 */
interface Locales {
    code: string;
    name: string;
    endonym: string;
    dir: "ltr" | "rtl";
}
/**
 * Translation configuration
 */
interface Translations {
    enabled?: boolean;
    path?: string;
}
/**
 * Internationalization configuration
 */
interface Configuration {
    enabled: boolean;
    default: string;
    locales: Locales[];
    translations?: Translations;
}

declare function i18n(config: Configuration): AstroIntegration;

declare global {
    var __ASTRO_I18N_CONFIG__: Configuration | undefined;
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
    info(locale?: string): Locales | undefined;
    /**
     * Returns the URL for a given pathname and locale
     */
    url(pathname?: string, locale?: string): string;
    /**
     * Replaces variable placeholders in a text string
     * @param text - The text containing variable placeholders like {name}
     * @param vars - Object containing variable values
     * @returns The text with variables replaced
     */
    replace(text: string, vars: Record<string, string | number>): string;
    /**
     * Returns the translation for a given key, loading it from cache if available.
     * If not in cache, loads it from disk, caches it, and then returns.
     */
    t(key: string, locale?: string): string;
};

export { type Configuration, Locale, type Locales, type Translations, i18n };
