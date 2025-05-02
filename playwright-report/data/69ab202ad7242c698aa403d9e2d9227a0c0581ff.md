# Test info

- Name: 学生がログインして予約するフロー
- Location: /Users/kimny/Dropbox/_DevProjects/mued/mued_lms_fgm/tests/e2e/auth-booking.spec.ts:15:1

# Error details

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('link', { name: /ログイン/i })

    at /Users/kimny/Dropbox/_DevProjects/mued/mued_lms_fgm/tests/e2e/auth-booking.spec.ts:22:53
    at /Users/kimny/Dropbox/_DevProjects/mued/mued_lms_fgm/tests/e2e/auth-booking.spec.ts:20:14
```

# Page snapshot

```yaml
- text: "[plugin:vite:import-analysis] Failed to resolve import \"next-auth/react\" from \"src/components/RouteGuard.tsx\". Does the file exist? /app/src/components/RouteGuard.tsx:3:27 17 | var _s = $RefreshSig$(); 18 | import { Navigate, useLocation } from \"react-router-dom\"; 19 | import { useSession } from \"next-auth/react\"; | ^ 20 | import { useHasRole } from \"../lib/hooks/useRBAC\"; 21 | export default function RouteGuard({ at TransformPluginContext._formatError (file:///app/node_modules/vite/dist/node/chunks/dep-BZMjGe_U.js:47372:41) at TransformPluginContext.error (file:///app/node_modules/vite/dist/node/chunks/dep-BZMjGe_U.js:47367:16) at normalizeUrl (file:///app/node_modules/vite/dist/node/chunks/dep-BZMjGe_U.js:45633:23) at process.processTicksAndRejections (node:internal/process/task_queues:95:5) at async file:///app/node_modules/vite/dist/node/chunks/dep-BZMjGe_U.js:45752:39 at async Promise.all (index 4) at async TransformPluginContext.transform (file:///app/node_modules/vite/dist/node/chunks/dep-BZMjGe_U.js:45679:7) at async EnvironmentPluginContainer.transform (file:///app/node_modules/vite/dist/node/chunks/dep-BZMjGe_U.js:47214:18) at async loadAndTransform (file:///app/node_modules/vite/dist/node/chunks/dep-BZMjGe_U.js:41025:27) at async viteTransformMiddleware (file:///app/node_modules/vite/dist/node/chunks/dep-BZMjGe_U.js:42469:24 Click outside, press Esc key, or fix the code to dismiss. You can also disable this overlay by setting"
- code: server.hmr.overlay
- text: to
- code: "false"
- text: in
- code: vite.config.ts
- text: .
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | /**
   4 |  * MUED LMS - 認証→予約フローのE2Eテスト
   5 |  * 
   6 |  * このテストでは、ユーザーログインから予約完了までの主要なユーザーフローをテストします
   7 |  */
   8 |
   9 | // テスト用アカウント情報
   10 | const TEST_USER = {
   11 |   email: 'test-student@example.com',
   12 |   password: 'test-password123'
   13 | };
   14 |
   15 | test('学生がログインして予約するフロー', async ({ page }) => {
   16 |   // 各テスト前にホームページにアクセス
   17 |   await page.goto('/');
   18 |   
   19 |   // ステップ1: ログイン
   20 |   await test.step('ログイン', async () => {
   21 |     // ログインボタンをクリック
>  22 |     await page.getByRole('link', { name: /ログイン/i }).click();
      |                                                     ^ Error: locator.click: Test timeout of 30000ms exceeded.
   23 |     
   24 |     // ログインフォームが表示されることを確認
   25 |     await expect(page.getByRole('heading', { name: /ログイン/i })).toBeVisible();
   26 |     
   27 |     // メールとパスワードを入力
   28 |     await page.getByLabel(/メールアドレス/i).fill(TEST_USER.email);
   29 |     await page.getByLabel(/パスワード/i).fill(TEST_USER.password);
   30 |     
   31 |     // ログインボタンをクリック
   32 |     await page.getByRole('button', { name: /ログイン/i }).click();
   33 |     
   34 |     // ダッシュボードにリダイレクトされることを確認
   35 |     await expect(page).toHaveURL(/dashboard/);
   36 |   });
   37 |   
   38 |   // ステップ2: メンター検索
   39 |   await test.step('メンター検索', async () => {
   40 |     // メンター検索ページに移動
   41 |     await page.getByRole('link', { name: /メンターを探す/i }).click();
   42 |     
   43 |     // メンター検索ページにアクセスしたことを確認
   44 |     await expect(page).toHaveURL(/mentors/);
   45 |     
   46 |     // メンター検索フォームに入力
   47 |     await page.getByPlaceholder(/ジャンルや楽器で検索/i).fill('ピアノ');
   48 |     await page.getByRole('button', { name: /検索/i }).click();
   49 |     
   50 |     // 検索結果が表示されることを確認
   51 |     await expect(page.getByTestId('mentor-results')).toBeVisible();
   52 |     
   53 |     // 最初のメンターをクリック
   54 |     await page.getByTestId('mentor-card').first().click();
   55 |     
   56 |     // メンター詳細ページに移動したことを確認
   57 |     await expect(page).toHaveURL(/mentors\/\w+/);
   58 |   });
   59 |   
   60 |   // ステップ3: 空き時間確認と予約
   61 |   await test.step('空き時間確認と予約', async () => {
   62 |     // 「レッスンを予約する」ボタンをクリック
   63 |     await page.getByRole('button', { name: /レッスンを予約する/i }).click();
   64 |     
   65 |     // 予約カレンダーが表示されることを確認
   66 |     await expect(page.getByTestId('booking-calendar')).toBeVisible();
   67 |     
   68 |     // 利用可能な時間枠を選択
   69 |     await page.getByTestId('time-slot').first().click();
   70 |     
   71 |     // 「予約を確定する」ボタンをクリック
   72 |     await page.getByRole('button', { name: /予約を確定する/i }).click();
   73 |     
   74 |     // 予約確認画面が表示されることを確認
   75 |     await expect(page.getByText(/予約内容の確認/i)).toBeVisible();
   76 |     
   77 |     // 予約詳細を入力
   78 |     await page.getByLabel(/メッセージ/i).fill('よろしくお願いします');
   79 |     
   80 |     // 「確定して支払いへ進む」ボタンをクリック
   81 |     await page.getByRole('button', { name: /確定して支払いへ進む/i }).click();
   82 |   });
   83 |   
   84 |   // ステップ4: 支払い処理
   85 |   await test.step('支払い処理', async () => {
   86 |     // 支払いページにリダイレクトされることを確認
   87 |     await expect(page).toHaveURL(/checkout/);
   88 |     
   89 |     // モックStripe支払いの処理
   90 |     // NOTE: 実際のStripe APIはモックに置き換えています
   91 |     await page.getByLabel(/カード番号/i).fill('4242424242424242');
   92 |     await page.getByLabel(/有効期限/i).fill('12/30');
   93 |     await page.getByLabel(/セキュリティコード/i).fill('123');
   94 |     await page.getByLabel(/名前/i).fill('TEST USER');
   95 |     
   96 |     // 「支払う」ボタンをクリック
   97 |     await page.getByRole('button', { name: /支払う/i }).click();
   98 |     
   99 |     // 支払い完了ページにリダイレクトされることを確認
  100 |     await expect(page).toHaveURL(/bookings\/success/);
  101 |     await expect(page.getByText(/予約が完了しました/i)).toBeVisible();
  102 |   });
  103 |   
  104 |   // ステップ5: 予約確認
  105 |   await test.step('予約確認', async () => {
  106 |     // マイページの予約一覧に移動
  107 |     await page.getByRole('link', { name: /マイページ/i }).click();
  108 |     await page.getByRole('link', { name: /予約一覧/i }).click();
  109 |     
  110 |     // 予約一覧ページに表示されることを確認
  111 |     await expect(page).toHaveURL(/bookings/);
  112 |     
  113 |     // 作成した予約が一覧に表示されることを確認
  114 |     await expect(page.getByTestId('booking-item')).toBeVisible();
  115 |     
  116 |     // 予約のステータスが「支払い済み」であることを確認
  117 |     await expect(page.getByText(/支払い済み/i)).toBeVisible();
  118 |   });
  119 | }); 
```