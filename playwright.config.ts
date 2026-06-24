import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: {
    timeout: 7_500,
  },
  fullyParallel: false,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 950 } },
    },
    {
      name: 'tablet-chromium',
      use: { ...devices['iPad Pro 11'], browserName: 'chromium' },
    },
    {
      name: 'phone-portrait',
      use: { ...devices['Pixel 7'], browserName: 'chromium' },
    },
    {
      name: 'phone-landscape',
      use: { ...devices['Pixel 7 landscape'], browserName: 'chromium' },
    },
  ],
})
