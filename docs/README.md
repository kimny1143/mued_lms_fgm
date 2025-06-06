# MUED LMS ドキュメント

このディレクトリには、MUED LMS（音楽レッスン学習管理システム）の技術文書、設計文書、運用ガイドが含まれています。

**最終更新: 2025年6月**

## 📚 ドキュメント構成

### 🚀 Getting Started（開始ガイド）
- [`env-setup-guide.md`](./getting-started/env-setup-guide.md) - 環境変数設定ガイド

### 🏗 Architecture（アーキテクチャ）
- [`current/`](./architecture/current/) - 現在のシステムアーキテクチャ
- [`decisions/`](./architecture/decisions/) - アーキテクチャ決定記録（ADR）

### 💻 Development（開発）
- [`coding-standards.md`](./development/coding-standards.md) - コーディング規約
- [`testing-guide.md`](./development/testing-guide.md) - テストガイド
- [`security-practices.md`](./development/security-practices.md) - セキュリティプラクティス

### 🛠 Features（機能別ドキュメント）
- [`authentication/`](./features/authentication/) - 認証システム
- [`booking/`](./features/booking/) - 予約システム
- [`payments/`](./features/payments/) - 決済システム
- [`realtime/`](./features/realtime/) - リアルタイム機能

### 📊 Project（プロジェクト管理）
- [`roadmap.md`](./project/roadmap.md) - ロードマップ
- [`project-config.md`](./project/project-config.md) - プロジェクト設定
- [`kpi-dashboard.md`](./project/kpi-dashboard.md) - KPIダッシュボード

### 💼 Business（ビジネス）
- ビジネスプラン、戦略文書

### 🔧 Operations（運用）
- [`deployment/`](./operations/deployment/) - デプロイメント
- [`monitoring/`](./operations/monitoring/) - モニタリング
- [`troubleshooting/`](./operations/troubleshooting/) - トラブルシューティング

### 📦 Archive（アーカイブ）
過去の文書、移行記録、解決済みの問題などが保管されています。

## 🔍 クイックリンク

### 開発者向け
- [コーディング規約](./development/coding-standards.md)
- [環境構築ガイド](./getting-started/env-setup-guide.md)
- [テストガイド](./development/testing-guide.md)

### アーキテクチャ
- [現在のアーキテクチャ概要](./architecture/current/overview.md)
- [技術スタック](./architecture/current/tech-stack.md)
- [ADRテンプレート](./architecture/decisions/ADR-template.md)

### 運用
- [デプロイメントガイド](./operations/deployment/)
- [モニタリング設定](./operations/monitoring/)

## 📝 ドキュメント管理方針

1. **更新頻度**: 技術的な変更があった場合は、関連文書を即座に更新
2. **アーカイブ**: 3ヶ月以上更新されていない文書は`archive/`へ移動
3. **命名規則**: ケバブケース（kebab-case）を使用
4. **最終更新日**: 各文書の冒頭に最終更新日を記載

## 🤝 コントリビューション

ドキュメントの改善提案や修正は歓迎します。以下のガイドラインに従ってください：

1. 明確で簡潔な記述を心がける
2. 技術文書には具体的なコード例を含める
3. 図表を積極的に活用する
4. 変更履歴を記録する

## 📞 お問い合わせ

技術的な質問や提案がある場合は、プロジェクトリードまたは技術責任者にお問い合わせください。