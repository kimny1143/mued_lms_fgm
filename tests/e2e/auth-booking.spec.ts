import { test, expect } from '@playwright/test';

/**
 * MUED LMS - 認証→予約フローのE2Eテスト
 * 
 * このテストでは、ユーザーログインから予約完了までの主要なユーザーフローをテストします
 */

// テスト用アカウント情報
const TEST_USER = {
  email: 'test-student@example.com',
  password: 'test-password123'
};

test('学生がログインして予約するフロー', async ({ page }) => {
  // 各テスト前にホームページにアクセス
  await page.goto('/');
  
  // ステップ1: ログイン
  await test.step('ログイン', async () => {
    // ログインボタンをクリック
    await page.getByRole('link', { name: /ログイン/i }).click();
    
    // ログインフォームが表示されることを確認
    await expect(page.getByRole('heading', { name: /ログイン/i })).toBeVisible();
    
    // メールとパスワードを入力
    await page.getByLabel(/メールアドレス/i).fill(TEST_USER.email);
    await page.getByLabel(/パスワード/i).fill(TEST_USER.password);
    
    // ログインボタンをクリック
    await page.getByRole('button', { name: /ログイン/i }).click();
    
    // ダッシュボードにリダイレクトされることを確認
    await expect(page).toHaveURL(/dashboard/);
  });
  
  // ステップ2: メンター検索
  await test.step('メンター検索', async () => {
    // メンター検索ページに移動
    await page.getByRole('link', { name: /メンターを探す/i }).click();
    
    // メンター検索ページにアクセスしたことを確認
    await expect(page).toHaveURL(/mentors/);
    
    // メンター検索フォームに入力
    await page.getByPlaceholder(/ジャンルや楽器で検索/i).fill('ピアノ');
    await page.getByRole('button', { name: /検索/i }).click();
    
    // 検索結果が表示されることを確認
    await expect(page.getByTestId('mentor-results')).toBeVisible();
    
    // 最初のメンターをクリック
    await page.getByTestId('mentor-card').first().click();
    
    // メンター詳細ページに移動したことを確認
    await expect(page).toHaveURL(/mentors\/\w+/);
  });
  
  // ステップ3: 空き時間確認と予約
  await test.step('空き時間確認と予約', async () => {
    // 「レッスンを予約する」ボタンをクリック
    await page.getByRole('button', { name: /レッスンを予約する/i }).click();
    
    // 予約カレンダーが表示されることを確認
    await expect(page.getByTestId('booking-calendar')).toBeVisible();
    
    // 利用可能な時間枠を選択
    await page.getByTestId('time-slot').first().click();
    
    // 「予約を確定する」ボタンをクリック
    await page.getByRole('button', { name: /予約を確定する/i }).click();
    
    // 予約確認画面が表示されることを確認
    await expect(page.getByText(/予約内容の確認/i)).toBeVisible();
    
    // 予約詳細を入力
    await page.getByLabel(/メッセージ/i).fill('よろしくお願いします');
    
    // 「確定して支払いへ進む」ボタンをクリック
    await page.getByRole('button', { name: /確定して支払いへ進む/i }).click();
  });
  
  // ステップ4: 支払い処理
  await test.step('支払い処理', async () => {
    // 支払いページにリダイレクトされることを確認
    await expect(page).toHaveURL(/checkout/);
    
    // モックStripe支払いの処理
    // NOTE: 実際のStripe APIはモックに置き換えています
    await page.getByLabel(/カード番号/i).fill('4242424242424242');
    await page.getByLabel(/有効期限/i).fill('12/30');
    await page.getByLabel(/セキュリティコード/i).fill('123');
    await page.getByLabel(/名前/i).fill('TEST USER');
    
    // 「支払う」ボタンをクリック
    await page.getByRole('button', { name: /支払う/i }).click();
    
    // 支払い完了ページにリダイレクトされることを確認
    await expect(page).toHaveURL(/bookings\/success/);
    await expect(page.getByText(/予約が完了しました/i)).toBeVisible();
  });
  
  // ステップ5: 予約確認
  await test.step('予約確認', async () => {
    // マイページの予約一覧に移動
    await page.getByRole('link', { name: /マイページ/i }).click();
    await page.getByRole('link', { name: /予約一覧/i }).click();
    
    // 予約一覧ページに表示されることを確認
    await expect(page).toHaveURL(/bookings/);
    
    // 作成した予約が一覧に表示されることを確認
    await expect(page.getByTestId('booking-item')).toBeVisible();
    
    // 予約のステータスが「支払い済み」であることを確認
    await expect(page.getByText(/支払い済み/i)).toBeVisible();
  });
}); 