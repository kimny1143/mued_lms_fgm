import { test, expect } from '@playwright/test';
import { execMcp } from '../lib/mcpClient';

test.skip(true, 'Booking scenario skipped until MCP interaction stabilised');

test('AI エージェントがレッスン予約を完了できる', async ({ page, request }) => {
  await page.goto('/');
  const res = await execMcp(request, `
    1. 「レッスンを予約」ボタンをクリック
    2. 最初の空き時間を選択
    3. 決済情報にテストカード 4242424242424242 を入力
    4. 完了画面のスクリーンショットを撮影
  `);
  expect(res.ok).toBe(true);
}); 