import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

describe("Locale Configuration", () => {
  const originalCwd = process.cwd

  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    // Clear any injected config
    if (typeof globalThis !== "undefined") {
      ;(globalThis as Record<string, unknown>).__ASTRO_I18N_CONFIG__ = undefined
    }
  })

  afterEach(() => {
    process.cwd = originalCwd
    // Clear any injected config
    if (typeof globalThis !== "undefined") {
      ;(globalThis as Record<string, unknown>).__ASTRO_I18N_CONFIG__ = undefined
    }
  })

  describe("Configuration Loading", () => {
    it("should throw error when no i18n configuration is found", async () => {
      const { config } = await import("../src/lib/locale")
      expect(() => config()).toThrow(
        "[@mannisto/astro-i18n]: No i18n configuration found. Make sure to add the i18n integration to your astro.config.mjs",
      )
    })

    it("should return configuration when injected via integration", async () => {
      const testConfig = {
        enabled: true,
        default: "en",
        locales: [
          { code: "en", name: "English", endonym: "English", dir: "ltr" },
          { code: "fi", name: "Finnish", endonym: "Suomi", dir: "ltr" },
        ],
        translations: {
          enabled: true,
          path: "./src/translations",
        },
      }

      ;(globalThis as Record<string, unknown>).__ASTRO_I18N_CONFIG__ = testConfig

      const { config } = await import("../src/lib/locale")
      const result = config()

      expect(result).toEqual(testConfig)
    })
  })

  describe("Core Locale Functionality", () => {
    it("should handle locale setting and getting", async () => {
      const testConfig = {
        enabled: true,
        default: "en",
        locales: [
          { code: "en", name: "English", endonym: "English", dir: "ltr" },
          { code: "fi", name: "Finnish", endonym: "Suomi", dir: "ltr" },
        ],
        translations: {
          enabled: true,
          path: "./src/translations",
        },
      }

      ;(globalThis as Record<string, unknown>).__ASTRO_I18N_CONFIG__ = testConfig

      const { Locale } = await import("../src/lib/locale")

      // Verify method existence
      expect(typeof Locale.set).toBe("function")
      expect(typeof Locale.info).toBe("function")
      expect(typeof Locale.url).toBe("function")
      expect(typeof Locale.t).toBe("function")
      expect(typeof Locale.replace).toBe("function")

      // Verify getter functionality
      expect(Locale.enabled).toBe(true)
      expect(Locale.default).toBe("en")
      expect(Locale.current).toBe("en")
      expect(Locale.supported).toEqual(["en", "fi"])

      // Test locale switching
      Locale.set("fi")
      expect(Locale.current).toBe("fi")
    })

    it("should handle URL generation", async () => {
      const testConfig = {
        enabled: true,
        default: "en",
        locales: [
          { code: "en", name: "English", endonym: "English", dir: "ltr" },
          { code: "fi", name: "Finnish", endonym: "Suomi", dir: "ltr" },
        ],
        translations: {
          enabled: true,
          path: "./src/translations",
        },
      }

      ;(globalThis as Record<string, unknown>).__ASTRO_I18N_CONFIG__ = testConfig

      const { Locale } = await import("../src/lib/locale")

      expect(Locale.url("/about")).toBe("/en/about")
      expect(Locale.url("about", "fi")).toBe("/fi/about")
      expect(Locale.url("/", "ar")).toBe("/ar/")
    })

    it("should handle variable replacement", async () => {
      const { Locale } = await import("../src/lib/locale")

      // Test basic variable replacement
      expect(Locale.replace("Hello {name}", { name: "John" })).toBe("Hello John")
      expect(Locale.replace("You have {count} items", { count: 5 })).toBe("You have 5 items")

      // Test multiple variables
      expect(
        Locale.replace("Welcome {name}, you have {count} messages", {
          name: "Alice",
          count: 3,
        }),
      ).toBe("Welcome Alice, you have 3 messages")

      // Test with numbers
      expect(Locale.replace("Count: {num}", { num: 42 })).toBe("Count: 42")

      // Test with no variables
      expect(Locale.replace("Simple text", {})).toBe("Simple text")
      expect(Locale.replace("Simple text", {})).toBe("Simple text")
    })
  })

  describe("Translation System", () => {
    it("should handle translation key lookup when translations are disabled", async () => {
      const testConfig = {
        enabled: true,
        default: "en",
        locales: [{ code: "en", name: "English", endonym: "English", dir: "ltr" }],
        translations: {
          enabled: false, // Disable translations to avoid file loading
        },
      }

      ;(globalThis as Record<string, unknown>).__ASTRO_I18N_CONFIG__ = testConfig

      const { Locale } = await import("../src/lib/locale")

      // When translations are disabled, should return the key
      expect(Locale.t("hello")).toBe("hello")
      expect(Locale.t("welcome")).toBe("welcome")
    })

    it("should handle translation with variables using the new API", async () => {
      const testConfig = {
        enabled: true,
        default: "en",
        locales: [{ code: "en", name: "English", endonym: "English", dir: "ltr" }],
        translations: {
          enabled: false, // Disable translations to avoid file loading
        },
      }

      ;(globalThis as Record<string, unknown>).__ASTRO_I18N_CONFIG__ = testConfig

      const { Locale } = await import("../src/lib/locale")

      // Test using Locale.replace with Locale.t
      expect(Locale.replace(Locale.t("Welcome {name}"), { name: "John" })).toBe("Welcome John")
      expect(Locale.replace(Locale.t("You have {count} items"), { count: 5 })).toBe(
        "You have 5 items",
      )
      expect(
        Locale.replace(Locale.t("Hello {name}, you have {count} messages"), {
          name: "Alice",
          count: 3,
        }),
      ).toBe("Hello Alice, you have 3 messages")
    })
  })

  describe("Integration Scenarios", () => {
    it("should work with injected configuration", async () => {
      const testConfig = {
        enabled: true,
        default: "en",
        locales: [
          { code: "en", name: "English", endonym: "English", dir: "ltr" },
          { code: "fi", name: "Finnish", endonym: "Suomi", dir: "ltr" },
        ],
        translations: {
          enabled: true,
          path: "./src/translations",
        },
      }

      ;(globalThis as Record<string, unknown>).__ASTRO_I18N_CONFIG__ = testConfig

      const { Locale } = await import("../src/lib/locale")

      expect(Locale.enabled).toBe(true)
      expect(Locale.default).toBe("en")
      expect(Locale.current).toBe("en")
      expect(Locale.supported).toEqual(["en", "fi"])
    })

    it("should handle locale switching", async () => {
      const testConfig = {
        enabled: true,
        default: "en",
        locales: [
          { code: "en", name: "English", endonym: "English", dir: "ltr" },
          { code: "fi", name: "Finnish", endonym: "Suomi", dir: "ltr" },
        ],
        translations: {
          enabled: true,
          path: "./src/translations",
        },
      }

      ;(globalThis as Record<string, unknown>).__ASTRO_I18N_CONFIG__ = testConfig

      const { Locale } = await import("../src/lib/locale")

      expect(Locale.current).toBe("en")

      Locale.set("fi")
      expect(Locale.current).toBe("fi")

      Locale.set("en")
      expect(Locale.current).toBe("en")
    })

    it("should provide locale information", async () => {
      const testConfig = {
        enabled: true,
        default: "en",
        locales: [
          { code: "en", name: "English", endonym: "English", dir: "ltr" },
          { code: "fi", name: "Finnish", endonym: "Suomi", dir: "ltr" },
        ],
        translations: {
          enabled: true,
          path: "./src/translations",
        },
      }

      ;(globalThis as Record<string, unknown>).__ASTRO_I18N_CONFIG__ = testConfig

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

      expect(Locale.info("nonexistent")).toBeUndefined()
    })

    it("should generate URLs correctly", async () => {
      const testConfig = {
        enabled: true,
        default: "en",
        locales: [
          { code: "en", name: "English", endonym: "English", dir: "ltr" },
          { code: "fi", name: "Finnish", endonym: "Suomi", dir: "ltr" },
        ],
        translations: {
          enabled: true,
          path: "./src/translations",
        },
      }

      ;(globalThis as Record<string, unknown>).__ASTRO_I18N_CONFIG__ = testConfig

      const { Locale } = await import("../src/lib/locale")

      expect(Locale.url("/")).toBe("/en/")
      expect(Locale.url("/about")).toBe("/en/about")
      expect(Locale.url("/about", "fi")).toBe("/fi/about")
      expect(Locale.url("about", "fi")).toBe("/fi/about")
    })

    it("should handle translations when disabled", async () => {
      const testConfig = {
        enabled: true,
        default: "en",
        locales: [{ code: "en", name: "English", endonym: "English", dir: "ltr" }],
        translations: {
          enabled: false,
        },
      }

      ;(globalThis as Record<string, unknown>).__ASTRO_I18N_CONFIG__ = testConfig

      const { Locale } = await import("../src/lib/locale")

      // When translations are disabled, should return the key
      expect(Locale.t("hello")).toBe("hello")
      expect(Locale.t("welcome")).toBe("welcome")
    })

    it("should handle disabled i18n", async () => {
      const testConfig = {
        enabled: false,
      }

      ;(globalThis as Record<string, unknown>).__ASTRO_I18N_CONFIG__ = testConfig

      const { Locale } = await import("../src/lib/locale")

      expect(Locale.enabled).toBe(false)
    })
  })
})
