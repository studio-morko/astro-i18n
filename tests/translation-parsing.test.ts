import fs from "node:fs"
import path from "node:path"
import { parse } from "@babel/parser"
import traverse from "@babel/traverse"
import { describe, expect, it } from "vitest"

describe("Translation File Parsing", () => {
  it("should parse translation files with comments and multi-line strings", () => {
    const testFilePath = path.join(__dirname, "translations/en.ts")
    const content = fs.readFileSync(testFilePath, "utf8")

    const ast = parse(content, {
      sourceType: "module",
      plugins: ["typescript"],
    })

    const translationData: Record<string, string> = {}

    traverse(ast, {
      ExportDefaultDeclaration(path) {
        const declaration = path.node.declaration
        if (declaration.type === "ObjectExpression") {
          declaration.properties.forEach((prop) => {
            if (prop.type === "ObjectProperty" && prop.value.type === "StringLiteral") {
              const key =
                prop.key.type === "StringLiteral" ? prop.key.value : (prop.key as any).name
              translationData[key] = prop.value.value
            }
          })
        }
      },
    })

    expect(translationData.welcome).toBe("Welcome")
    expect(translationData.hello).toBe("Hello world")
    expect(translationData.greeting).toBe("Hello {name}")
    expect(translationData["long.text"]).toBe(
      "This is a very long text that spans multiple lines and should be parsed correctly",
    )
    expect(translationData["special.chars"]).toBe("Text with 'quotes' and \"double quotes\"")

    expect(Object.keys(translationData)).toHaveLength(8)
  })

  it("should parse multiple language files correctly", () => {
    const languages = ["en", "fi", "es"]
    const expectedTranslations = {
      en: {
        welcome: "Welcome",
        hello: "Hello world",
        greeting: "Hello {name}",
      },
      fi: {
        welcome: "Tervetuloa",
        hello: "Hei maailma",
        greeting: "Hei {name}",
      },
      es: {
        welcome: "Bienvenido",
        hello: "Hola mundo",
        greeting: "Hola {name}",
      },
    }

    languages.forEach((lang) => {
      const testFilePath = path.join(__dirname, `translations/${lang}.ts`)
      const content = fs.readFileSync(testFilePath, "utf8")

      const ast = parse(content, {
        sourceType: "module",
        plugins: ["typescript"],
      })

      const translationData: Record<string, string> = {}

      traverse(ast, {
        ExportDefaultDeclaration(path) {
          const declaration = path.node.declaration
          if (declaration.type === "ObjectExpression") {
            declaration.properties.forEach((prop) => {
              if (prop.type === "ObjectProperty" && prop.value.type === "StringLiteral") {
                const key =
                  prop.key.type === "StringLiteral" ? prop.key.value : (prop.key as any).name
                translationData[key] = prop.value.value
              }
            })
          }
        },
      })

      const expected = expectedTranslations[lang as keyof typeof expectedTranslations]
      expect(translationData.welcome).toBe(expected.welcome)
      expect(translationData.hello).toBe(expected.hello)
      expect(translationData.greeting).toBe(expected.greeting)
      expect(Object.keys(translationData)).toHaveLength(8)
    })
  })

  it("should handle single quotes and mixed quote styles", () => {
    const content = `
export default {
  'single.quoted.key': 'Single quoted value',
  "double.quoted.key": "Double quoted value",
  'mixed.quotes': "Mixed quote value",
  "another.mixed": 'Another mixed value',
};
`

    const ast = parse(content, {
      sourceType: "module",
      plugins: ["typescript"],
    })

    const translationData: Record<string, string> = {}

    traverse(ast, {
      ExportDefaultDeclaration(path) {
        const declaration = path.node.declaration
        if (declaration.type === "ObjectExpression") {
          declaration.properties.forEach((prop) => {
            if (prop.type === "ObjectProperty" && prop.value.type === "StringLiteral") {
              const key =
                prop.key.type === "StringLiteral" ? prop.key.value : (prop.key as any).name
              translationData[key] = prop.value.value
            }
          })
        }
      },
    })

    expect(translationData["single.quoted.key"]).toBe("Single quoted value")
    expect(translationData["double.quoted.key"]).toBe("Double quoted value")
    expect(translationData["mixed.quotes"]).toBe("Mixed quote value")
    expect(translationData["another.mixed"]).toBe("Another mixed value")
  })

  it("should handle trailing commas", () => {
    const content = `
export default {
  "key1": "value1",
  "key2": "value2",
  "key3": "value3",
};
`

    const ast = parse(content, {
      sourceType: "module",
      plugins: ["typescript"],
    })

    const translationData: Record<string, string> = {}

    traverse(ast, {
      ExportDefaultDeclaration(path) {
        const declaration = path.node.declaration
        if (declaration.type === "ObjectExpression") {
          declaration.properties.forEach((prop) => {
            if (prop.type === "ObjectProperty" && prop.value.type === "StringLiteral") {
              const key =
                prop.key.type === "StringLiteral" ? prop.key.value : (prop.key as any).name
              translationData[key] = prop.value.value
            }
          })
        }
      },
    })

    expect(translationData.key1).toBe("value1")
    expect(translationData.key2).toBe("value2")
    expect(translationData.key3).toBe("value3")
  })
})
