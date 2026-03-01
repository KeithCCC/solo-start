# DealFlow Lite（MVP v2）

## 🎯 目的
個人〜小規模事業者が  
**名刺 → 顧客管理 → 案件管理 → 営業活動最適化**  
までを一つで完結できる軽量CRM。

HubSpot Sales Hubを中核にした営業特化型。

---

## 👤 想定ユーザー
- フリーランス営業
- 小規模B2B事業者
- 起業初期Founder
- 営業1〜3名チーム

---

# 🧩 MVP機能構成

---

## 1️⃣ 名刺管理（軽量）

- 手入力名刺登録
- 会社紐付け
- タグ
- 検索
- 最近接触順ソート

※ OCRなし  
※ 共有なし

---

## 2️⃣ CRM基盤

### エンティティ
- Contact
- Company
- Deal
- Activity
- Task

### 共通機能
- タイムライン履歴
- 保存ビュー（フィルタ）
- ステージ管理（固定4段階）

---

## 3️⃣ Sales Hub 機能（主役）

### 🔹 パイプライン管理
- Kanban UI
- ドラッグでステージ変更
- 金額合計表示

### 🔹 タスク管理
- フォローアップタスク
- 期限設定
- Todayビュー

### 🔹 メールテンプレ
- 3テンプレ固定
- Contactから送信
- 送信履歴保存

### 🔹 ミーティング管理
- 予定日入力
- ステータス更新

※ カレンダー同期なし（MVP）

### 🔹 活動ログ
- メモ
- メール送信ログ

---

## 4️⃣ Marketing（最低限）

- Contactタグによる簡易セグメント
- 一斉メール（手動）
- 送信履歴

※ ワークフローなし  
※ リードスコアなし  
※ フォームなし  

---

# 🗄 データモデル

## Contact
- id
- name
- email
- phone
- company_id
- tags[]
- lifecycle_stage
- created_at

## Company
- id
- name
- industry
- notes

## Deal
- id
- contact_id
- stage
- amount
- expected_close_date
- status
- created_at

## Task
- id
- contact_id
- due_date
- status
- type
- created_at

## Activity
- id
- contact_id
- type (note/email/meeting)
- content
- created_at

## EmailTemplate
- id
- title
- body

---

# 📊 画面構成

1. ダッシュボード
   - 今日期限タスク
   - パイプライン総額
   - 最近接触

2. コンタクト一覧 / 詳細

3. パイプライン（Kanban）

4. タスクビュー（Today / Upcoming）

5. メール送信画面

---

# ❌ やらないこと

- 権限管理
- チームロール
- 自動ワークフロー
- スコアリング
- API連携
- 広告統合
- カスタムオブジェクト

---

# 🎓 このMVPで鍛えられるもの

- CRMデータ設計
- パイプライン状態管理
- 営業活動トラッキング
- 保存フィルタ設計
- 情報密度のUI設計

---

# 🧠 設計思想

- 個人で完結
- Contact中心の構造
- パイプラインを視覚的主役に
- タスクを行動ドライバーに