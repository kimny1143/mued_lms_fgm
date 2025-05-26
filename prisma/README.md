# Prisma Directory 整理計画

## 現在の状況
prismaフォルダに複数のSQL設定ファイルが散在し、DBリセット後に何を実行すべきか不明確。

## 整理方針

### 🟢 保持するファイル

#### 1. 必須ファイル
- `schema.prisma` - **メイン**: Prismaスキーマ定義
- `migrations/` - Prismaマイグレーション履歴

#### 2. 統合初期化ファイル（新規作成）
- `post-reset-init.sql` - **統合**: DBリセット後の一括初期化
- `rls-policies.sql` - RLSポリシー定義
- `seed/` - 初期データ投入

### 🔴 削除対象ファイル（古い・重複・分散）

#### 分散したSQL設定ファイル
- `auth_user_sync_trigger.sql` - 統合ファイルにマージ
- `setup-auth-sync.sql` - 重複機能
- `setup-auth-sync-fixed.sql` - 重複機能
- `complete_init_migration.sql` - 古い統合ファイル
- `create-stripe-subscriptions-view.sql` - 統合ファイルにマージ

## 整理後のディレクトリ構造

```
prisma/
├── README.md                    # このファイル
├── schema.prisma               # Prismaスキーマ定義
├── post-reset-init.sql         # 🔥 統合初期化SQL
├── rls-policies.sql            # 🔒 RLSポリシー定義
├── migrations/                 # Prismaマイグレーション
│   └── 20250526010325_init_with_approval_flow/
└── seed/                       # 初期データ
    ├── roles.sql              # ロール定義
    ├── test-users.sql         # テストユーザー
    └── sample-data.sql        # サンプルデータ
```

## DBリセット後の初期化フロー

### 1. Prismaマイグレーション実行
```bash
npx prisma migrate reset --force
npx prisma generate
```

### 2. 統合初期化SQL実行
```bash
# Supabase SQL Editorで実行
psql -f prisma/post-reset-init.sql
```

### 3. 初期データ投入
```bash
npm run seed
```

### 4. 動作確認
```bash
npm run check:user
npm run debug:frontend
```

## 統合初期化SQLの内容

### post-reset-init.sql に含まれる機能
1. **基本ロール作成** (Student, Mentor, Admin)
2. **認証ユーザー同期システム** (トリガー + 関数)
3. **RLSポリシー設定** (全テーブル)
4. **Stripe関連設定** (権限 + インデックス)
5. **初期権限設定** (anon, authenticated, service_role)
6. **動作確認関数** (テスト用)

### 実行順序の保証
- 依存関係を考慮した実行順序
- エラー処理とロールバック機能
- 冪等性の確保（重複実行可能）

## 開発ワークフロー

### 日常開発時
```bash
# 通常のマイグレーション
npx prisma migrate dev --name feature_name

# スキーマ変更後
npx prisma generate
```

### 大きな変更時
```bash
# 完全リセット
npm run reset:dev

# 初期化確認
npm run analyze:db
```

### トラブルシューティング
```bash
# DB状態確認
npm run analyze:db

# 権限確認
npm run check:supabase-permissions

# 手動修正
# Supabase SQL Editorで個別SQL実行
```

## 注意事項

⚠️ **重要**: `post-reset-init.sql`は本番環境では慎重に実行してください。

⚠️ **データ消失**: リセット後は全てのデータが削除されます。

⚠️ **権限設定**: RLSポリシーは本番環境のセキュリティに直結します。 