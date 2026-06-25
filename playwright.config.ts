import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// 러너가 앱과 동일한 실 시크릿을 쓰도록 .env.local을 로드한다(쿠키 민팅·argon2·admin 핸들).
dotenv.config({ path: ".env.local" });

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e/specs",
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "html" : "list",
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // dev 모드 필수: 프로덕션 빌드는 secure 쿠키라 http localhost에서 드랍된다.
    command: "pnpm dev",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
