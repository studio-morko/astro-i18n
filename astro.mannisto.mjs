import { config } from "@mannisto/astro-config"

export default config({
  i18n: {
    enable: true,
    default: "en",
    locales: [
      { code: "en", endonym: "English", dir: "ltr" },
      { code: "fi", endonym: "Suomi", dir: "ltr" },
      { code: "ar", endonym: "العربية", dir: "rtl" },
    ],
    translations: {
      enable: true,
      path: "./src/translations",
    },
  },
})