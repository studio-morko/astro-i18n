import { beforeEach, describe, expect, it, vi } from "vitest"
import i18n from "../src/integration.ts"

/**
 * Mock parameters for Astro integration setup hook
 * Creates a complete mock object for testing the astro:config:setup hook
 */
const createMockParams = () => ({
  injectScript: vi.fn(),
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  config: {},
  command: "dev",
  isRestart: false,
  updateConfig: vi.fn(),
  addRenderer: vi.fn(),
  addClientDirective: vi.fn(),
  addMiddleware: vi.fn(),
  addDevToolbarApp: vi.fn(),
  addWatchFile: vi.fn(),
  injectRoute: vi.fn(),
  createCodegenDir: vi.fn(() => new URL("file:///tmp")),
})

describe("i18n Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Integration Creation", () => {
    it("should create a valid Astro integration with proper structure", () => {
      const integration = i18n({
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
      })

      expect(integration).toBeDefined()
      expect(integration.name).toBe("@mannisto/astro-i18n")
      expect(integration.hooks).toBeDefined()
      expect(integration.hooks["astro:config:setup"]).toBeDefined()
    })
  })

  describe("Configuration Injection", () => {
    it("should inject configuration script and log setup information", () => {
      const mockInjectScript = vi.fn()
      const mockLogger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      }

      const integration = i18n({
        enabled: true,
        default: "en",
        locales: [
          { code: "en", name: "English", endonym: "English", dir: "ltr" },
          { code: "fi", name: "Finnish", endonym: "Suomi", dir: "ltr" },
        ],
        translations: {
          enabled: false, // Disable translations for test
        },
      })

      const setupHook = integration.hooks["astro:config:setup"]
      if (setupHook) {
        const mockParams = createMockParams()
        mockParams.injectScript = mockInjectScript
        mockParams.logger = mockLogger
        // biome-ignore lint/suspicious/noExplicitAny: Mock for testing Astro integration
        setupHook(mockParams as any)
      }

      // Verify configuration script injection
      expect(mockInjectScript).toHaveBeenCalledWith(
        "page-ssr",
        expect.stringContaining("__ASTRO_I18N_CONFIG__"),
      )

      // Verify logging of configuration details
      expect(mockLogger.info).toHaveBeenCalledWith("enabled: true")
      expect(mockLogger.info).toHaveBeenCalledWith("default locale: en")
      expect(mockLogger.info).toHaveBeenCalledWith("supported locales: en, fi")
    })
  })

  describe("Configuration States", () => {
    it("should handle disabled i18n configuration", () => {
      const mockInjectScript = vi.fn()
      const mockLogger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      }

      const integration = i18n({
        enabled: false,
        default: "en",
        locales: [{ code: "en", name: "English", endonym: "English", dir: "ltr" }],
      })

      const setupHook = integration.hooks["astro:config:setup"]!
      const mockParams = createMockParams()
      mockParams.injectScript = mockInjectScript
      mockParams.logger = mockLogger
      // biome-ignore lint/suspicious/noExplicitAny: Mock for testing Astro integration
      setupHook(mockParams as any)

      expect(mockLogger.info).toHaveBeenCalledWith("enabled: false")
    })

    it("should support RTL locales", () => {
      const mockInjectScript = vi.fn()
      const mockLogger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      }

      const integration = i18n({
        enabled: true,
        default: "ar",
        locales: [{ code: "ar", name: "Arabic", endonym: "العربية", dir: "rtl" }],
        translations: {
          enabled: false, // Disable translations for test
        },
      })

      const setupHook = integration.hooks["astro:config:setup"]!
      const mockParams = createMockParams()
      mockParams.injectScript = mockInjectScript
      mockParams.logger = mockLogger
      // biome-ignore lint/suspicious/noExplicitAny: Mock for testing Astro integration
      setupHook(mockParams as any)

      expect(mockLogger.info).toHaveBeenCalledWith("default locale: ar")
      expect(mockLogger.info).toHaveBeenCalledWith("supported locales: ar")
    })

    it("should handle translations when disabled", () => {
      const mockInjectScript = vi.fn()
      const mockLogger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      }

      const integration = i18n({
        enabled: true,
        default: "en",
        locales: [{ code: "en", name: "English", endonym: "English", dir: "ltr" }],
        // No translations object when disabled
      })

      const setupHook = integration.hooks["astro:config:setup"]!
      const mockParams = createMockParams()
      mockParams.injectScript = mockInjectScript
      mockParams.logger = mockLogger
      // biome-ignore lint/suspicious/noExplicitAny: Mock for testing Astro integration
      setupHook(mockParams as any)

      expect(mockLogger.info).toHaveBeenCalledWith("enabled: true")
      expect(mockLogger.info).toHaveBeenCalledWith("default locale: en")
      expect(mockLogger.info).toHaveBeenCalledWith("supported locales: en")
    })
  })

  describe("Configuration Validation", () => {
    it("should validate configuration during setup and throw errors for invalid config", () => {
      const mockInjectScript = vi.fn()
      const mockLogger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      }

      const integration = i18n({
        enabled: true,
        default: "en",
        locales: [], // Empty locales array - should cause validation error
      })

      const setupHook = integration.hooks["astro:config:setup"]!

      expect(() => {
        const mockParams = createMockParams()
        mockParams.injectScript = mockInjectScript
        mockParams.logger = mockLogger
        // biome-ignore lint/suspicious/noExplicitAny: Mock for testing Astro integration
        setupHook(mockParams as any)
      }).toThrow('"locales" must be a non-empty array')
    })

    it("should validate individual locale fields", () => {
      const mockInjectScript = vi.fn()
      const mockLogger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      }

      const integration = i18n({
        enabled: true,
        default: "en",
        locales: [
          { code: "", name: "English", endonym: "English", dir: "ltr" }, // Empty code
        ],
      })

      const setupHook = integration.hooks["astro:config:setup"]!

      expect(() => {
        const mockParams = createMockParams()
        mockParams.injectScript = mockInjectScript
        mockParams.logger = mockLogger
        // biome-ignore lint/suspicious/noExplicitAny: Mock for testing Astro integration
        setupHook(mockParams as any)
      }).toThrow('"locales[0].code" must be a non-empty string')
    })

    it("should validate translations configuration when provided", () => {
      const mockInjectScript = vi.fn()
      const mockLogger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      }

      const integration = i18n({
        enabled: true,
        default: "en",
        locales: [{ code: "en", name: "English", endonym: "English", dir: "ltr" }],
        translations: {
          enabled: true,
          path: "", // Empty path when enabled
        },
      })

      const setupHook = integration.hooks["astro:config:setup"]!

      expect(() => {
        const mockParams = createMockParams()
        mockParams.injectScript = mockInjectScript
        mockParams.logger = mockLogger
        // biome-ignore lint/suspicious/noExplicitAny: Mock for testing Astro integration
        setupHook(mockParams as any)
      }).toThrow('"translations.path" must be a non-empty string when translations are enabled')
    })

    it("should throw error when required fields are missing", () => {
      expect(() => {
        // Test with missing required fields at runtime
        const integration = i18n({
          enabled: true,
          // Missing default and locales
          // biome-ignore lint/suspicious/noExplicitAny: Testing invalid configuration
        } as any)

        const setupHook = integration.hooks["astro:config:setup"]!
        const mockParams = createMockParams()
        // biome-ignore lint/suspicious/noExplicitAny: Mock for testing Astro integration
        setupHook(mockParams as any)
      }).toThrow('"default" must be a non-empty string')
    })
  })
})
