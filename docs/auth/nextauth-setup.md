# NextAuth + Supabase Auth 統合設定

このドキュメントでは、MUED LMSプロジェクトにおけるNextAuthとSupabase Authの統合設定方法について説明します。

## 1. 環境変数の設定

`.env` ファイルに以下の環境変数を設定してください：

```
# Supabase環境変数
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google OAuth環境変数
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret

# NextAuth環境変数
VITE_NEXTAUTH_URL=http://localhost:5173
VITE_NEXTAUTH_SECRET=your_nextauth_secret_key
```

## 2. Google Cloudでの設定

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成するか、既存のプロジェクトを選択
3. 「APIとサービス」>「OAuth同意画面」を設定
   - ユーザータイプ: 外部
   - アプリ名、ユーザーサポートメール、開発者連絡先情報を入力
   - 承認済みドメインにプロジェクトのドメインを追加
4. 「認証情報」>「認証情報を作成」>「OAuthクライアントID」
   - アプリケーションの種類: ウェブアプリケーション
   - 名前: MUED LMS
   - 承認済みリダイレクトURI: `http://localhost:5173/api/auth/callback/google`
5. 作成されたクライアントIDとクライアントシークレットを`.env`ファイルに設定

## 3. Supabaseでの設定

1. Supabaseで新しいプロジェクトを作成
2. SQLエディタで以下のスクリプトを実行して、ユーザーロールカラムを追加:

```sql
-- ユーザーロールカラムの追加
ALTER TABLE auth.users ADD COLUMN role VARCHAR(20) DEFAULT 'student';

-- ユーザーテーブルの作成（ロール情報などを保存）
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'student' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) ポリシーの設定
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 自分自身のデータのみ読み取り可能
CREATE POLICY "Users can view their own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- 管理者はすべてのユーザーデータを読み取り可能
CREATE POLICY "Admins can view all user data" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 自分自身のデータのみ更新可能
CREATE POLICY "Users can update their own data" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- 管理者はすべてのユーザーデータを更新可能
CREATE POLICY "Admins can update all user data" ON public.users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
```

3. APIキーを取得
   - プロジェクト設定 > API
   - プロジェクトAPIキー（anon public）と秘密キー（service_role）をコピー
   - `.env`ファイルにそれぞれ設定

## 4. NextAuthシークレットの生成

ターミナルで以下のコマンドを実行して、NextAuthシークレットを生成:

```bash
openssl rand -base64 32
```

生成された値を`.env`ファイルの`VITE_NEXTAUTH_SECRET`に設定してください。

## 5. RBACの使用方法

ロールベースのアクセス制御を適用するには:

```tsx
// 特定のロールが必要なルートを保護
<RouteGuard requiredRoles={UserRole.ADMIN}>
  <AdminPage />
</RouteGuard>

// 複数のロールを許可
<RouteGuard requiredRoles={[UserRole.MENTOR, UserRole.ADMIN]}>
  <MentorDashboardPage />
</RouteGuard>

// フックを使用してUIを条件付きでレンダリング
function MyComponent() {
  const isAdmin = useIsAdmin();
  
  return (
    <div>
      {isAdmin && <AdminControls />}
      <CommonContent />
    </div>
  );
}
```

## 6. トラブルシューティング

1. **認証エラー**: 環境変数が正しく設定されているか確認
2. **リダイレクトエラー**: Google Cloud ConsoleのリダイレクトURIが正しいか確認
3. **ロールエラー**: Supabaseでユーザーテーブルとカラムが正しく作成されているか確認

詳細は以下のドキュメントを参照してください:
- [NextAuth.js 公式ドキュメント](https://next-auth.js.org/)
- [Supabase 公式ドキュメント](https://supabase.io/docs) 