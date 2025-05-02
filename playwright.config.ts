import { defineConfig, devices } from '@playwright/test';

/**
 * MUED LMS Playwright設定
 * 
 * 詳細設定: https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // テストのタイムアウト: 60秒（CI環境では時間がかかる場合があるため）
  timeout: process.env.CI ? 60000 : 30000,
  
  // テストファイルのパターン
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  
  // テスト実行間の間隔
  fullyParallel: false,
  
  // テスト失敗時にトレースを出力
  retries: process.env.CI ? 2 : 0,
  
  // 各テストワーカーあたりのリソース
  workers: process.env.CI ? 1 : undefined,
  
  // レポーター設定
  reporter: [
    ['html', { open: 'never' }],
    ['list']
  ],
  
  // 前提条件: Viteサーバーを起動
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
  
  // テスト対象プロジェクトの設定
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  
  // 各テストで使用するグローバル設定
  use: {
    // ベースURL（本番環境テストの場合は環境変数で上書き）
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
    
    // 自動スクリーンショット
    screenshot: 'only-on-failure',
    
    // トレースの出力
    trace: 'on-first-retry',
    
    // VideoをCIモードでのみ記録
    video: process.env.CI ? 'on-first-retry' : 'off',
    
    // テストの安定性向上のための設定
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
}); 