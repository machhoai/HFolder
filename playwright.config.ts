import { defineConfig } from "@playwright/test";
const previewUrl = process.env.HFOLDER_E2E_URL;
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  use: {
    baseURL: previewUrl || "http://127.0.0.1:3427",
    viewport: { width: 1380, height: 900 },
    trace: "retain-on-failure",
  },
  webServer: previewUrl
    ? undefined
    : {
        command: "pnpm exec next dev --hostname 127.0.0.1 --port 3427",
        url: "http://127.0.0.1:3427",
        reuseExistingServer: false,
        timeout: 120000,
      },
});
