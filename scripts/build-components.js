#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Transform the LocaleRedirect.astro component for distribution
const sourcePath = 'src/components/LocaleRedirect.astro';
const distPath = 'dist/components/LocaleRedirect.astro';

// Ensure dist/components directory exists
const distDir = path.dirname(distPath);
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Read the source file
let content = fs.readFileSync(sourcePath, 'utf8');

// Transform the import for distribution
content = content.replace(
  /import \{ Locale \} from "\.\.\/lib\/locale"/,
  `// @ts-ignore - This is a generated file
import { Locale } from "@mannisto/astro-i18n"`
);

// Write the transformed file
fs.writeFileSync(distPath, content);

console.log('✅ Components built successfully');
