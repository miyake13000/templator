# Templator

Templator: Jinja2ベースのテンプレートジェネレーター

[English](README.md)

## 機能
- ✅ テキスト形式でテンプレートを登録
- ✅ テンプレートに変数や条件付きループを挿入
- ✅ Webインターフェースを使用して変数に値を入力
- ✅ テンプレート内の変数に基づいてフォームを自動生成
- ✅ 変数の型（文字列、整数、真偽値、選択など）とその値の候補を定義
- ✅ 定義された型に合わせた入力フォームを表示（テキストフィールド、ドロップダウン、チェックボックスなど）

## セットアップ
### 前提条件
- Python >= 3.8
- 必要なライブラリ:
  - Flask
  - Jinja2

### インストール

```bash
pip install flask jinja2
```

### 起動

```bash
python app.py -d -b 127.0.0.1 -p 8000
# -d: Debug mode
# -b: Bind address
# -p: Bind port
```

サーバーが起動したら、ブラウザで `http://localhost:8000` にアクセスしてください。

## テンプレート文法
### 変数の定義

変数はテンプレート内に以下のようなコメント構文で定義します:

```
{# @variable variable_name: type=type_name, option1=value1, option2=value2 #}
```

### サポートされている型

- `string` - テキスト入力
- `integer` - 整数入力
- `number` - 数値入力（小数をサポート）
- `boolean` - チェックボックス
- `select` - ドロップダウンリスト（`options` の指定が必要）
- `array` - カンマ区切りリスト

### オプション

- `label` - フォームに表示されるラベル
- `required` - 必須項目かどうかを指定（true/false）
- `options` - 選択肢の配列（`select` 型の場合）
- `min`, `max` - 最小値と最大値（数値入力の場合）
- `default` - デフォルト値
- `placeholder` - プレースホルダーテキスト
- `description` - フィールドの説明やヘルプテキスト

### Jinja2構文
- 変数: `{{ variable }}`
- 繰り返し: `{% for item in items %}...{% endfor %}`
- 条件分岐: `{% if condition %}...{% endif %}`


## 例
### 1. ビジネスメールテンプレート

```jinja2
{# @variable recipient_name: type=string, label="受信者名", required=true, placeholder="山田 太郎" #}
{# @variable sender_name: type=string, label="送信者名", required=true, placeholder="田中 花子" #}
{# @variable subject: type=string, label="件名", required=true #}
{# @variable urgent: type=boolean, label="緊急フラグ", default=false #}
{# @variable department: type=select, label="部署", options=["営業", "開発", "人事", "総務"], required=true #}

{% if urgent %}【緊急】{% endif %}{{ subject }}

{{ recipient_name }}様

{{ department }}の{{ sender_name }}です。

{{ subject }}についてご連絡いたしました。

{% if urgent %}
※ 至急ご確認ください。
{% endif %}

よろしくお願いいたします。

---
{{ sender_name }}
{{ department }}
```


### 2. タスクリストテンプレート

```jinja2
{# @variable project_name: type=string, label="プロジェクト名", required=true #}
{# @variable tasks: type=array, label="タスク内容", required=true #}
{# @variable priority: type=select, label="優先度", options=["高", "中", "低"], default="中" #}
{# @variable deadline: type=datetime, label="締め切り", placeholder="2026-03-31" #}
{# @variable assigned_to: type=string, label="担当者" #}

# {{ project_name }} - タスクリスト

優先度: {{ priority }}
締め切り: {{ deadline }}
担当者: {{ assigned_to }}

## タスクリスト
{% for task in tasks %}
- [ ] {{ task }}
{% endfor %}

---
最終更新: {{ deadline }}
```

## API
### テンプレート登録
- **POST** `/api/templates`
- ボディ: `{"name": "<string:template_name>", "template": "string:template_content"}`

### テンプレート一覧
- **GET** `/api/templates`

### 特定のテンプレート取得
- **GET** `/api/templates/<integer:template_id>`

### テンプレートの特定データでのレンダリング
- **POST** `/api/templates/<integer:template_id>/render`
- ボディ: `{"string:var_name": "string:value" ...}`

### 特定のテンプレート削除
- **DELETE** `/api/templates/<integer:template_id>`
