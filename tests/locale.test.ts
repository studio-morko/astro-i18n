import { beforeEach, describe, expect, it } from "vitest"
import { Locale } from "../src/lib/locale"
import type { Configuration } from "../src/types"

// Mock the global variables that would be injected by the Astro integration
const mockConfig: Configuration = {
  enabled: true,
  default: "en",
  locales: [
    { code: "en", name: "English", endonym: "English", dir: "ltr" as const },
    { code: "fi", name: "Finnish", endonym: "Suomi", dir: "ltr" as const },
  ],
  translations: {
    enabled: true,
    path: "./translations",
  },
}

const mockTranslations = {
  en: {
    hello: "Hello",
    welcome: "Welcome",
    goodbye: "Goodbye",
    "user.welcome": "Welcome, {name}!",
    "page.title": "My Website",
  },
  fi: {
    hello: "Hei",
    welcome: "Tervetuloa",
    goodbye: "Näkemiin",
    "user.welcome": "Tervetuloa, {name}!",
    "page.title": "Sivustoni",
  },
}

describe("Locale", () => {
  beforeEach(() => {
    // Reset global variables before each test
    globalThis.__ASTRO_I18N_CONFIG__ = undefined
    globalThis.__ASTRO_I18N_TRANSLATIONS__ = undefined

    // Reset current locale
    Locale.set("")
  })

  describe("Configuration", () => {
    it("should throw error when no configuration is found", () => {
      expect(() => Locale.enabled).toThrow("No i18n configuration found")
    })

    it("should load configuration from injected global", () => {
      globalThis.__ASTRO_I18N_CONFIG__ = mockConfig

      expect(Locale.enabled).toBe(true)
      expect(Locale.default).toBe("en")
      expect(Locale.supported).toEqual(["en", "fi"])
    })
  })

  describe("Locale Management", () => {
    beforeEach(() => {
      globalThis.__ASTRO_I18N_CONFIG__ = mockConfig
    })

    it("should return default locale when current is not set", () => {
      expect(Locale.current).toBe("en")
    })

    it("should return set locale", () => {
      Locale.set("fi")
      expect(Locale.current).toBe("fi")
    })

    it("should return locale information", () => {
      const enInfo = Locale.info("en")
      expect(enInfo).toEqual({
        code: "en",
        name: "English",
        endonym: "English",
        dir: "ltr",
      })

      const fiInfo = Locale.info("fi")
      expect(fiInfo).toEqual({
        code: "fi",
        name: "Finnish",
        endonym: "Suomi",
        dir: "ltr",
      })
    })

    it("should return undefined for non-existent locale", () => {
      expect(Locale.info("nonexistent")).toBeUndefined()
    })

    it("should generate URLs with locale prefix", () => {
      expect(Locale.url("/")).toBe("/en/")
      expect(Locale.url("/about")).toBe("/en/about")
      expect(Locale.url("about")).toBe("/en/about")
      expect(Locale.url("/", "fi")).toBe("/fi/")
    })
  })

  describe("Variable Replacement", () => {
    it("should replace variables in text", () => {
      expect(Locale.replace("Hello {name}!", { name: "John" })).toBe("Hello John!")
      expect(Locale.replace("Welcome {user} to {site}", { user: "Alice", site: "MyApp" })).toBe(
        "Welcome Alice to MyApp",
      )
    })

    it("should handle missing variables", () => {
      expect(Locale.replace("Hello {name}!", {})).toBe("Hello {name}!")
    })

    it("should handle numeric variables", () => {
      expect(Locale.replace("You have {count} messages", { count: 5 })).toBe("You have 5 messages")
    })
  })

  describe("Translations", () => {
    beforeEach(() => {
      globalThis.__ASTRO_I18N_CONFIG__ = mockConfig
      globalThis.__ASTRO_I18N_TRANSLATIONS__ = mockTranslations
    })

    it("should load translations for current locale", () => {
      const translations = Locale.translations()
      expect(translations).toEqual(mockTranslations.en)
    })

    it("should load translations for specified locale", () => {
      const translations = Locale.translations("fi")
      expect(translations).toEqual(mockTranslations.fi)
    })

    it("should return empty object when translations are disabled", () => {
      globalThis.__ASTRO_I18N_CONFIG__ = {
        ...mockConfig,
        translations: { enabled: false },
      }
      globalThis.__ASTRO_I18N_TRANSLATIONS__ = undefined

      const translations = Locale.translations()
      expect(translations).toEqual({})
    })

    it("should return empty object when no translations found", () => {
      globalThis.__ASTRO_I18N_TRANSLATIONS__ = {}

      const translations = Locale.translations()
      expect(translations).toEqual({})
    })

    it("should return empty object for non-existent locale", () => {
      const translations = Locale.translations("nonexistent")
      expect(translations).toEqual({})
    })

    it("should work with variable replacement", () => {
      const translations = Locale.translations()
      const welcomeText = translations["user.welcome"]
      expect(welcomeText).toBe("Welcome, {name}!")

      const personalizedWelcome = Locale.replace(welcomeText, { name: "John" })
      expect(personalizedWelcome).toBe("Welcome, John!")
    })
  })
})
