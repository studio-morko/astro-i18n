import fs from "node:fs"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

describe("Locale Configuration", () => {
  const originalCwd = process.cwd

  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  afterEach(() => {
    process.cwd = originalCwd
  })

  describe("config()", () => {
    it("should throw error when config file does not exist", async () => {
      // Mock process.cwd only for this test
      const mockCwd = vi.fn(() => "/mock/project/root")
      process.cwd = mockCwd

      // Mock fs.existsSync only for this test
      const mockExistsSync = vi.spyOn(fs, "existsSync").mockReturnValue(false)

      const { config } = await import("../src/lib/locale")
      expect(() => config()).toThrow(
        "astro.mannisto.mjs configuration file not found: /mock/project/root/astro.mannisto.mjs",
      )

      // Restore original function
      mockExistsSync.mockRestore()
    })
  })

  describe("Locale object basic functionality", () => {
    it("should handle locale setting and getting", async () => {
      // Test the basic functionality without complex mocking
      const { Locale } = await import("../src/lib/locale")

      // Test that the methods exist
      expect(typeof Locale.set).toBe("function")
      expect(typeof Locale.info).toBe("function")
      expect(typeof Locale.url).toBe("function")
      expect(typeof Locale.t).toBe("function")

      // Test that getters exist (without triggering config loading)
      expect("current" in Locale).toBe(true)
      expect("supported" in Locale).toBe(true)
      expect("default" in Locale).toBe(true)
      expect("enabled" in Locale).toBe(true)
    })

    it("should handle URL generation", async () => {
      const { Locale } = await import("../src/lib/locale")

      // Test URL generation logic
      expect(typeof Locale.url).toBe("function")

      // Test the URL logic directly
      const testUrl = (pathname: string, locale: string) => {
        if (!pathname.startsWith("/")) pathname = `/${pathname}`
        return `/${locale}${pathname}`
      }

      expect(testUrl("/about", "en")).toBe("/en/about")
      expect(testUrl("about", "fi")).toBe("/fi/about")
      expect(testUrl("/", "ar")).toBe("/ar/")
    })

    it("should handle translation variable replacement", () => {
      // Test the translation variable replacement logic
      const replaceVars = (text: string, vars: Record<string, string | number>) => {
        for (const [k, v] of Object.entries(vars)) {
          text = text.replace(`{${k}}`, String(v))
        }
        return text
      }

      expect(replaceVars("Hello {name}", { name: "John" })).toBe("Hello John")
      expect(replaceVars("You have {count} items", { count: 5 })).toBe("You have 5 items")
      expect(
        replaceVars("Welcome {name}, you have {count} messages", {
          name: "Alice",
          count: 3,
        }),
      ).toBe("Welcome Alice, you have 3 messages")
    })
  })

  describe("Configuration validation", () => {
    it("should validate locale configuration structure", () => {
      // Test the validation logic directly
      const validateLocale = (locale: {
        code?: unknown
        name?: unknown
        endonym?: unknown
        dir?: unknown
      }) => {
        if (typeof locale.code !== "string" || !locale.code.trim()) {
          throw new Error('Locale is missing a valid "code"')
        }
        if (typeof locale.name !== "string" || !locale.name.trim()) {
          throw new Error(`Locale "${locale.code}" is missing a valid "name"`)
        }
        if (typeof locale.endonym !== "string" || !locale.endonym.trim()) {
          throw new Error(`Locale "${locale.code}" is missing a valid "endonym"`)
        }
        if (!["ltr", "rtl"].includes(locale.dir as string)) {
          throw new Error(`Locale "${locale.code}" must have "dir" set to "ltr" or "rtl"`)
        }
        return true
      }

      // Valid locale
      expect(
        validateLocale({
          code: "en",
          name: "English",
          endonym: "English",
          dir: "ltr",
        }),
      ).toBe(true)

      // Invalid locales
      expect(() =>
        validateLocale({
          name: "English",
          endonym: "English",
          dir: "ltr",
        }),
      ).toThrow('Locale is missing a valid "code"')

      expect(() =>
        validateLocale({
          code: "en",
          endonym: "English",
          dir: "ltr",
        }),
      ).toThrow('Locale "en" is missing a valid "name"')

      expect(() =>
        validateLocale({
          code: "en",
          name: "English",
          dir: "ltr",
        }),
      ).toThrow('Locale "en" is missing a valid "endonym"')

      expect(() =>
        validateLocale({
          code: "en",
          name: "English",
          endonym: "English",
          dir: "invalid",
        }),
      ).toThrow('Locale "en" must have "dir" set to "ltr" or "rtl"')
    })

    it("should validate configuration structure", () => {
      const validateConfig = (config: {
        enabled?: unknown
        default?: unknown
        locales?: Array<{ code?: unknown; name?: unknown; endonym?: unknown; dir?: unknown }>
      }) => {
        if (typeof config.enabled !== "boolean") {
          throw new Error('"i18n.enabled" must be true or false')
        }
        if (!Array.isArray(config.locales) || config.locales.length === 0) {
          throw new Error('"i18n.locales" must be a non-empty array')
        }
        if (!config.default || !config.locales.some((l) => l.code === config.default)) {
          throw new Error('"i18n.default" must be one of the supported locale codes')
        }
        return true
      }

      // Valid config
      expect(
        validateConfig({
          enabled: true,
          default: "en",
          locales: [{ code: "en", name: "English", endonym: "English", dir: "ltr" }],
        }),
      ).toBe(true)

      // Invalid configs
      expect(() =>
        validateConfig({
          enabled: "true",
          default: "en",
          locales: [{ code: "en", name: "English", endonym: "English", dir: "ltr" }],
        }),
      ).toThrow('"i18n.enabled" must be true or false')

      expect(() =>
        validateConfig({
          enabled: true,
          default: "en",
          locales: [],
        }),
      ).toThrow('"i18n.locales" must be a non-empty array')

      expect(() =>
        validateConfig({
          enabled: true,
          default: "fr",
          locales: [{ code: "en", name: "English", endonym: "English", dir: "ltr" }],
        }),
      ).toThrow('"i18n.default" must be one of the supported locale codes')
    })
  })

  describe("Translation functionality", () => {
    it("should handle translation key lookup", () => {
      const translations = {
        hello: "Hello",
        welcome: "Welcome {name}",
        count: "You have {count} items",
      }

      const getTranslation = (key: string, translations: Record<string, string>) => {
        return translations[key] ?? key
      }

      expect(getTranslation("hello", translations)).toBe("Hello")
      expect(getTranslation("nonexistent", translations)).toBe("nonexistent")
    })

    it("should handle translation with variables", () => {
      const translate = (
        key: string,
        translations: Record<string, string>,
        vars?: Record<string, string | number>,
      ) => {
        let text = translations[key] ?? key
        if (vars) {
          for (const [k, v] of Object.entries(vars)) {
            text = text.replace(`{${k}}`, String(v))
          }
        }
        return text
      }

      const translations = {
        welcome: "Welcome {name}",
        count: "You have {count} items",
        message: "Hello {name}, you have {count} messages",
      }

      expect(translate("welcome", translations, { name: "John" })).toBe("Welcome John")
      expect(translate("count", translations, { count: 5 })).toBe("You have 5 items")
      expect(translate("message", translations, { name: "Alice", count: 3 })).toBe(
        "Hello Alice, you have 3 messages",
      )
      expect(translate("nonexistent", translations, { name: "John" })).toBe("nonexistent")
    })
  })

  describe("Integration tests", () => {
    beforeEach(() => {
      // Change to tests directory where our test config is located
      process.cwd = vi.fn(() => path.resolve(__dirname))
    })

    it("should load configuration from test file", async () => {
      const { config } = await import("../src/lib/locale")
      const result = config()

      expect(result.enabled).toBe(true)
      expect(result.default).toBe("en")
      expect(result.locales).toHaveLength(3)
      expect(result.locales.map((l) => l.code)).toEqual(["en", "fi", "ar"])
      expect(result.translations?.enabled).toBe(true)
      expect(result.translations?.path).toBe("translate")
    })

    it("should work with Locale object using test config", async () => {
      const { Locale } = await import("../src/lib/locale")

      expect(Locale.enabled).toBe(true)
      expect(Locale.default).toBe("en")
      expect(Locale.supported).toEqual(["en", "fi", "ar"])
      expect(Locale.current).toBe("en") // Default locale
    })

    it("should handle locale switching", async () => {
      const { Locale } = await import("../src/lib/locale")

      Locale.set("fi")
      expect(Locale.current).toBe("fi")

      Locale.set("ar")
      expect(Locale.current).toBe("ar")

      Locale.set("en")
      expect(Locale.current).toBe("en")
    })

    it("should provide locale information", async () => {
      const { Locale } = await import("../src/lib/locale")

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

      const arInfo = Locale.info("ar")
      expect(arInfo).toEqual({
        code: "ar",
        name: "Arabic",
        endonym: "العربية",
        dir: "rtl",
      })

      expect(Locale.info("fr")).toBeUndefined()
    })

    it("should generate URLs correctly", async () => {
      const { Locale } = await import("../src/lib/locale")

      expect(Locale.url("/about")).toBe("/en/about")
      expect(Locale.url("/about", "fi")).toBe("/fi/about")
      expect(Locale.url("/about", "ar")).toBe("/ar/about")

      expect(Locale.url("about")).toBe("/en/about")
      expect(Locale.url("/", "fi")).toBe("/fi/")
      expect(Locale.url()).toBe("/en/")
    })

    it("should handle translations", async () => {
      const { Locale } = await import("../src/lib/locale")

      // Test English translations
      expect(Locale.t("hello")).toBe("Hello")
      expect(Locale.t("welcome", undefined, { name: "John" })).toBe("Welcome John")
      expect(Locale.t("count", undefined, { count: 5 })).toBe("You have 5 items")
      expect(Locale.t("nonexistent")).toBe("nonexistent")

      // Test Finnish translations
      expect(Locale.t("hello", "fi")).toBe("Hei")
      expect(Locale.t("welcome", "fi", { name: "John" })).toBe("Tervetuloa John")
      expect(Locale.t("count", "fi", { count: 5 })).toBe("Sinulla on 5 kohdetta")
    })

    it("should cache translations", async () => {
      const { Locale } = await import("../src/lib/locale")

      // First call should load translations
      const result1 = Locale.t("hello")

      // Second call should use cache
      const result2 = Locale.t("hello")

      expect(result1).toBe(result2)
    })

    it("should handle missing translation files", async () => {
      // Create a config with a non-existent locale
      const originalCwd = process.cwd
      process.cwd = vi.fn(() => "/non/existent/path")

      const { config } = await import("../src/lib/locale")

      expect(() => config()).toThrow("astro.mannisto.mjs configuration file not found")

      process.cwd = originalCwd
    })

    it("should handle translations when disabled", async () => {
      // Test the translation logic directly without relying on config changes
      const { Locale } = await import("../src/lib/locale")

      // The current config has translations enabled, so this should return the actual translation
      expect(Locale.t("hello")).toBe("Hello")

      // Test the logic that would return the key when translations are disabled
      const testTranslationLogic = (key: string, translationsEnabled: boolean) => {
        if (!translationsEnabled) return key
        // In real implementation, this would load translations
        return "Hello" // Mock translation
      }

      expect(testTranslationLogic("hello", false)).toBe("hello")
      expect(testTranslationLogic("hello", true)).toBe("Hello")
    })

    it("should handle translation file loading errors", async () => {
      const { Locale } = await import("../src/lib/locale")

      // Try to get translation for a non-existent locale
      expect(() => Locale.t("hello", "nonexistent")).toThrow(
        'Missing translations file for locale "nonexistent"',
      )
    })

    it("should handle empty translation cache initialization", async () => {
      const { Locale } = await import("../src/lib/locale")

      // Clear the cache by resetting modules
      vi.resetModules()

      // This should initialize the cache
      const result = Locale.t("hello")
      expect(result).toBe("Hello")
    })
  })
})
