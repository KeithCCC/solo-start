# DealFlow Lite（MVP v3）

## 🎯 目的
個人〜小規模事業者が  
**名刺/連絡先管理 → 顧客管理 → 案件管理 → 営業活動最適化**  
までを1つで完結できる軽量CRMを提供する。  
ローカルファーストで実装し、短期間で「動く・見せられる」品質を作る。

---

## 👤 Primary ICP（v1）
- 主対象: **ソロ起業家 / Solo Startup CEO（B2B商談を自分で回す人）**
- 課題:
  - 連絡先・案件・タスクが分散して進捗が追えない
  - 次にやるべき営業行動が不明瞭
  - 提案中案件の総額と優先順位が見えない
- Secondary:
  - フリーランス営業
  - 小規模B2B事業者

---

## ✅ MVP Success Criteria（計測可能）
1. 初見ユーザーが**3分以内**にデモフローを完了できる。  
2. シードデータ/CSV投入後、主要5画面で致命的エラーなく操作できる。  
3. ダッシュボード数値（今日タスク、パイプライン総額、最近接触）がDB内容と一致する。  

---

## 🧩 MVP機能構成（In Scope）

### 1) 名刺/コンタクト管理（軽量）
- 手入力登録
- 会社紐付け
- タグ
- 検索
- 最近接触順ソート

除外:
- OCRなし
- 共有なし

### 2) CRM基盤
エンティティ:
- Contact
- Company
- Deal
- Activity
- Task
- EmailTemplate
- EmailLog

共通機能:
- タイムライン履歴
- 保存ビュー（フィルタ）
- 固定4段階ステージ管理

### 3) Sales Hub機能（主役）
パイプライン管理:
- Kanban UI
- ステージ変更（v1はセレクト操作可、DnDは優先実装）
- 金額合計表示

タスク管理:
- フォローアップタスク
- 期限設定
- Today / Upcoming

メールテンプレ:
- 3テンプレ固定
- Contactから送信（Mock）
- 送信履歴保存

ミーティング管理:
- 予定日入力
- ステータス更新

活動ログ:
- メモ
- メール送信ログ

### 4) Marketing（Post-MVP）
以下はv1から除外し、Phase 2で検討:
- Contactタグによる簡易セグメント
- 一斉メール（手動）
- 送信履歴の集計UI

---

## 🇯🇵 Japan-First Requirements
- 表示言語: 日本語優先
- タイムゾーン: JST（Asia/Tokyo）基準
- 金額表示: JPY（`¥`、3桁区切り）
- 検索: 全角/半角の揺れを吸収
- 会社名表記: `株式会社` と `(株)` の揺れを許容

---

## 🗄 Operational Data Rules（v1）
共通必須:
- `id`（UUID文字列）
- `owner_id`（ローカルでは固定ユーザー）
- `created_at`
- `updated_at`（Activity/EmailLogは作成時刻のみ）

Deal enum:
- `stage`: `lead | qualified | proposal | negotiation`
- `status`: `open | won | lost`

Task enum:
- `type`: `daily_todo | customer_engagement | project_task`
- `status`: `todo | in_progress | done`
- `reminder_state`: `none | due_today | overdue`

主要フィールド:
- Contact: `name, email, phone, company_id, tags[], lifecycle_stage, project, notes`
- Company: `name, industry, notes`
- Deal: `contact_id, title, stage, amount, expected_close_date, status, project, notes`
- Task: `contact_id, deal_id, type, title, due_date, status, reminder_state`
- Activity: `contact_id, deal_id, type(note/email/meeting), content`
- EmailTemplate: `title, body`
- EmailLog: `contact_id, template_id, subject, body, sent_at`

---

## 📊 画面構成（v1）
1. ダッシュボード
   - 今日期限タスク
   - パイプライン総額（openのみ）
   - 最近接触
2. コンタクト一覧 / 詳細
3. 会社一覧
4. パイプライン（Kanban）
5. タスク（Today / Upcoming / Done）
6. CSVインポート

---

## 🎬 Must-Pass Demo Flow（Recruiter向け）
1. アプリ起動後、シード済みデータを表示。  
2. コンタクトを1件追加。  
3. そのコンタクトに案件を作成。  
4. 案件ステージを変更。  
5. 今日期限タスクを追加し、完了にする。  
6. コンタクト詳細からMockメールを送信。  
7. ダッシュボード数値と活動履歴が更新されることを確認。  

---

## ❌ やらないこと（v1）
- 権限管理
- チームロール
- 自動ワークフロー
- リードスコア
- 外部API連携
- 広告統合
- カスタムオブジェクト
- 実メール送信（Mockのみ）

---

## 🧠 設計思想
- 個人で完結できる操作体験
- Contact中心の構造
- パイプラインを視覚的主役に
- タスクを行動ドライバーに
- 将来のSupabase移行を前提に、ドメイン境界を保つ
