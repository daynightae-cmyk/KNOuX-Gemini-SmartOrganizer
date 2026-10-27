import { defineConfig } from '@playwright/test';
import path from 'node:path';
import { existsSync } from 'node:fs';
export default defineConfig({
  testDir: '.', testMatch: 'entry.spec.ts', timeout: 30000, workers: 2,
  reporter: [['list'], ['json', { outputFile: path.resolve(import.meta.dirname, '../../visual-evidence/cinematic-entry/results.json') }]],
  outputDir: path.resolve(import.meta.dirname, '../../node_modules/.cache/entry-results'),
  use: { baseURL: 'http://127.0.0.1:3000', headless: true, launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined), args: ['--no-sandbox'] }, trace: 'retain-on-failure' },
  webServer: { command: 'npm run dev -- --strictPort', cwd: path.resolve(import.meta.dirname, '../..'), url: 'http://127.0.0.1:3000', reuseExistingServer: !process.env.CI },
});
