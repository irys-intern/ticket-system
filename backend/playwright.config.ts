import { defineConfig } from '@playwright/test';

export default defineConfig({
  webServer: {
    command: 'npm run dev',
    port: 5172,
    reuseExistingServer: true,
  },
  use: {
    baseURL: 'http://localhost:5172',
  },
  testMatch: '**/*.e2e.{ts,js}',
});
