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
    var __ASTRO_I18N_TRANSLATIONS__: Record<string, Record<string, string>> | undefined;
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
     * Falls back to default locale if the requested locale is not found
     */
    info(locale?: string): Locales;
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
     * Returns the translations object for the current or specified locale.
     * Uses translations loaded at build time and injected via global variables.
     *
     * @param locale - Optional locale code, defaults to current locale
     * @returns The translations object (synchronous for static generation)
     */
    translations(locale?: string): Record<string, string>;
};

export { type Configuration, Locale, type Locales, type Translations, i18n };
