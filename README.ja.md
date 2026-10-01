# Emasoft Apple Documentation プラグイン

<!--BADGES-START-->
[![バージョン](https://img.shields.io/badge/version-2.0.0-blue)](https://github.com/Emasoft/emasoft-apple-documentation-plugin/releases)
[![ライセンス: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
<!--BADGES-END-->

Claude Code 向けの Apple 開発者ドキュメント: iOS、macOS、watchOS、tvOS、visionOS のドキュメント、フレームワーク、API、SwiftUI、UIKit、WWDC ビデオを検索し、Swift/Objective-C のコード例、API リファレンス、技術ガイドを Claude Code のセッション内で直接取得できます。プラグインには MCP (モデルコンテキストプロトコル) サーバーが同梱されているため、プラグインをインストールするだけで使えます。

このプラグイン (`emasoft-apple-documentation-plugin`) は kimsungwhee 氏の [kimsungwhee/apple-docs-mcp](https://github.com/kimsungwhee/apple-docs-mcp) (MIT ライセンス) をベースにしています。独立したフォークであり、Claude Code プラグインとして再パッケージされています。npm では公開されていません。

[English](README.md) | **日本語** | [한국어](README.ko.md) | [简体中文](README.zh-CN.md)

> **注**: この日本語版は英語版に遅れて更新されることがあります。インストール、設定、開発の各セクションは英語版 README から機械翻訳したものです。最新かつ正確な情報は [英語版 README](README.md) を参照してください。

## 機能

- **スマート検索**: SwiftUI、UIKit、Foundation、CoreData、ARKit などの Apple 開発者ドキュメントのインテリジェント検索
- **完全なドキュメントアクセス**: Swift、Objective-C、フレームワークドキュメントのための Apple JSON API への完全アクセス
- **Apple Design と HIG へのアクセス**: Human Interface Guidelines の JSON、Apple Design ページ、Design Resources カタログ項目を読み取り
- **デザインリソースのプレビュー**: Apple 提供の HIG 画像とリソースのサムネイルを MCP 画像コンテンツブロックとして返却
- **ダウンロード可能なデザインリソース**: Apple が直接ホストするテンプレート、フォント、ツール、アーカイブをローカルの MCP リソースキャッシュにダウンロード
- **フレームワークインデックス**: iOS、macOS、watchOS、tvOS、visionOS フレームワークの階層 API 構造を閲覧
- **テクノロジーカタログ**: SwiftUI、UIKit、Metal、Core ML、Vision、ARKit を含む Apple テクノロジーを探索
- **ドキュメント更新**: WWDC 2025/2026 発表、iOS 27、macOS 27、最新 SDK リリースを追跡
- **テクノロジー概要**: Swift、SwiftUI、UIKit、すべての Apple 開発プラットフォームの包括的なガイド
- **サンプルコードライブラリ**: iOS、macOS、クロスプラットフォーム開発のための Swift および Objective-C コード例
- **WWDC ビデオライブラリ**: WWDC 2014-2026 セッションを検索、トランスクリプト、Swift/SwiftUI コード例、リソース付き (データは初回使用時に一度だけダウンロードされます)
- **関連 API 発見**: SwiftUI ビュー、UIKit コントローラー、フレームワーク固有の API 関係を検索
- **プラットフォーム互換性**: iOS 13+、macOS 10.15+、watchOS 6+、tvOS 13+、visionOS 互換性分析
- **高性能**: Xcode、Swift Playgrounds、AI 駆動開発環境に最適化
- **スマート UserAgent プール**: 自動障害回復とパフォーマンス監視を備えたインテリジェントな UserAgent ローテーションシステム
- **マルチプラットフォーム**: 完全な iOS、iPadOS、macOS、watchOS、tvOS、visionOS ドキュメントサポート
- **ベータ & ステータス追跡**: ベータおよび新リリースの API、非推奨 UIKit メソッド、新しい SwiftUI 機能を追跡

## インストール

### 要件

- [Claude Code](https://code.claude.com/docs/en/overview)
- `PATH` 上の `node` (Node.js 22 以降)。Claude Code は同梱サーバーを `node` で起動しますが、ネイティブインストーラーは Node.js を同梱しません。`node --version` で確認してください。
- WWDC データ用に約 11 MB のディスク容量。WWDC ツールを初めて使うときに一度だけダウンロードされます (「WWDC データ」を参照)。

### Claude Code セッションから

```text
/plugin marketplace add Emasoft/emasoft-plugins
/plugin install emasoft-apple-documentation-plugin@emasoft-plugins
```

### ターミナルから

```bash
claude plugin marketplace add Emasoft/emasoft-plugins
claude plugin install emasoft-apple-documentation-plugin@emasoft-plugins --scope user
```

Claude Code を再起動 (または `/reload-plugins` を実行) してプラグインを有効化し、`/mcp` でこのプラグインの `apple-docs` サーバーが接続されていることを確認してください。

### 更新とアンインストール

```bash
claude plugin update emasoft-apple-documentation-plugin@emasoft-plugins
claude plugin uninstall emasoft-apple-documentation-plugin
```

### Claude Code でのツール名

Claude Code はプラグインの MCP サーバーのツールに名前空間を付けるため、ツール `search_apple_docs` は `mcp__plugin_emasoft-apple-documentation-plugin_apple-docs__search_apple_docs` として表示されます。これらの名前を入力する必要はありません。必要なことを伝えれば Claude が適切なツールを選びます。

### トラブルシューティング

- **サーバーが起動しない、または `/mcp` で失敗と表示される?** Claude Code はコマンド `node` でサーバーを起動します。GUI アプリはシェルの `PATH` を継承しないことがあります。ターミナルで `which node` を実行し、そのディレクトリが Claude Code を起動するプロセスの `PATH` に含まれていることを確認してください。プラグインには Node.js 22 以降が必要です。
- **`search_apple_docs` が何も返さない、またはエラーになる?** developer.apple.com の検索ページが内部で使用している、非公開の Apple 検索バックエンド (`devintserv.msc.sbz.apple.com`) に依存しています。Apple がレスポンス形式を変更すると、このプラグインが追従するまで `search_apple_docs` は動作しなくなることがあります。`get_apple_doc_content`、`search_framework_symbols`、WWDC ツールはこのエンドポイントに依存せず、引き続き動作します。
- **`search_apple_docs` が遅い?** Apple は結果全体をストリーミングで返すため、検索には通常 5〜25 秒 (中央値は約 10 秒) かかります。10 分以内に同じクエリを繰り返すと、ローカルキャッシュから返されます。

## 使用例

自然な言葉で Claude に尋ねるだけで、適切なツールが選ばれます。例:

### スマート検索

```text
"SwiftUI アニメーションを検索"
"CoreML モデル読み込み方法を見つける"
"Swift の async/await パターンを調べる"
"AlarmKit スケジューリング例を表示"
```

### フレームワーク深掘り

```text
"SwiftUI フレームワークの詳細情報を取得"
"iOS 18 フレームワークの新機能は？"
"Vision フレームワークの機能について教えて"
"すべての WeatherKit API を表示"
```

### Apple Design と HIG

```text
"レイアウトに関する Apple Design ドキュメントを検索"
"iOS テンプレート向けの Apple Design Resources を一覧表示"
"この resourceId の Apple Design リソースをダウンロード"
"レイアウト HIG ページの Apple Design 例を表示"
```

### API 探索

```text
"UIViewController ライフサイクルメソッドを表示"
"SwiftData モデル作成の詳細を取得"
"AlarmAttributes のプロパティは何？"
"すべての ARKit アンカータイプをリスト"
```

### サンプルコードとチュートリアル

```text
"アラームスケジューリングのサンプルコードを見つける"
"SwiftUI チュートリアル例を表示"
"カメラキャプチャのサンプルコードを取得"
"Core Data マイグレーション例を見つける"
```

### テクノロジー発見

```text
"iOS 最新版のすべてのベータフレームワークをリスト"
"グラフィックス & ゲームテクノロジーを表示"
"どの機械学習フレームワークが利用可能？"
"すべての watchOS フレームワークを閲覧"
```

### ドキュメント更新

```text
"最新の WWDC 更新を表示"
"SwiftUI の新機能は？"
"iOS のテクノロジー更新を取得"
"Xcode のリリースノートを表示"
"最新更新のベータ機能を検索"
```

### テクノロジー概要

```text
"アプリデザインと UI のテクノロジー概要を表示"
"ゲーム開発の包括的なガイドを取得"
"AI と機械学習の概要を探索"
"iOS 専用のテクノロジーガイドを表示"
"データ管理テクノロジーの概要を取得"
```

### サンプルコードライブラリ

```text
"SwiftUI サンプルコードプロジェクトを表示"
"機械学習のサンプルコードを検索"
"UIKit サンプルプロジェクトを取得"
"注目の WWDC サンプルコードを表示"
"Core Data サンプル実装を検索"
"ベータサンプルコードプロジェクトのみを表示"
```

### WWDC ビデオ検索

```text
"SwiftUI に関する WWDC ビデオを検索"
"機械学習の WWDC セッションを検索"
"WWDC 2024 ビデオを表示"
"async/await WWDC トークを検索"
"Swift 並行処理に関する WWDC ビデオを検索"
"アクセシビリティに焦点を当てた WWDC セッションを表示"
```

### WWDC ビデオ詳細

```text
"WWDC セッション 10176 の詳細を取得"
"WWDC23 SwiftData セッションのトランスクリプトを表示"
"WWDC ビデオ 10019 のコード例を取得"
"Vision Pro WWDC セッションのリソースを表示"
"Meet async/await in Swift セッションのトランスクリプトを取得"
```

### WWDC トピックと年度

```text
"すべての WWDC トピックをリスト"
"Swift トピックの WWDC ビデオを表示"
"開発者ツールに関する WWDC ビデオを取得"
"2023 年の WWDC ビデオをリスト"
"すべての SwiftUI および UI フレームワークセッションを表示"
"機械学習 WWDC コンテンツを取得"
```

## 利用可能なツール

| ツール | 説明 | 主要機能 |
|-------|------|----------|
| `search_apple_docs` | Apple 開発者ドキュメント検索 | 公式検索 API、特定の API・クラス・メソッドの検索 |
| `get_apple_doc_content` | 詳細なドキュメントコンテンツ取得 | JSON API アクセス、オプション拡張分析（関連/類似 API、プラットフォーム互換性） |
| `search_apple_design_docs` | Apple Design と HIG のコンテンツ検索 | HIG JSON 参照、Design ページ、Design Resources カタログ |
| `get_apple_design_content` | Apple Design と HIG ページの読み取り | HIG JSON レンダリング、`/design/` ページ用の HTML フォールバック |
| `list_apple_design_resources` | Apple Design Resources の一覧 | 安定したリソース ID、カテゴリ/プラットフォーム/形式フィルター、プレビューとリンク |
| `download_apple_design_resource` | Apple Design リソースの直接ダウンロード | ローカルキャッシュ、MCP `resource_link` ブロック、`resources/read` による Blob アクセス |
| `get_apple_design_examples` | Apple Design のビジュアル例を返却 | base64 データと MIME タイプを含む MCP `image` ブロック |
| `list_technologies` | すべての Apple テクノロジー閲覧 | カテゴリフィルタリング、言語サポート、ベータステータス |
| `search_framework_symbols` | 特定フレームワーク内のシンボル検索 | クラス、構造体、プロトコル、ワイルドカードパターン、タイプフィルタリング |
| `get_related_apis` | 関連 API 検索 | 継承、準拠、「参照」関係 |
| `resolve_references_batch` | API 参照バッチ解決 | ドキュメントからすべての参照を抽出・解決 |
| `get_platform_compatibility` | プラットフォーム互換性分析 | バージョンサポート、ベータステータス、非推奨情報 |
| `find_similar_apis` | 類似 API 発見 | Apple 公式推奨、トピックグループ化 |
| `get_documentation_updates` | Apple ドキュメント更新追跡 | WWDC 発表、テクノロジー更新、リリースノート |
| `get_technology_overviews` | テクノロジー概要とガイド取得 | 包括的なガイド、階層ナビゲーション、プラットフォームフィルタリング |
| `get_sample_code` | Apple サンプルコードプロジェクト閲覧 | フレームワークフィルタリング（制限あり）、キーワード検索、ベータステータス |
| `list_wwdc_videos` | WWDC ビデオセッションの閲覧 | オフラインのトランスクリプトとコード、トピック/年度フィルタリング |
| `search_wwdc_content` | WWDC トランスクリプトとコードの全文検索 | 特定の議論、API の言及、実装例 |
| `get_wwdc_video` | WWDC セッション全体の取得 | 完全なトランスクリプト、コード例、リソース |
| `get_wwdc_code_examples` | WWDC セッションのコード例を閲覧 | セッションの文脈付きの実装パターン |
| `browse_wwdc_topics` | WWDC トピックカテゴリを ID 付きでリスト | `list_wwdc_videos` のフィルターに使えるトピック ID |
| `find_related_wwdc_videos` | ビデオに関連するセッションの発見 | 前提セッション、フォローアップ、類似トーク |
| `list_wwdc_years` | 利用可能なすべての WWDC 年度をリスト | ビデオ数と統計付きの年度情報 |

## 技術アーキテクチャ

```text
emasoft-apple-documentation-plugin/
├── .claude-plugin/plugin.json        # Claude Code プラグインマニフェスト
├── .mcp.json                         # 同梱 MCP サーバー (apple-docs) を登録
├── servers/apple-docs/
│   ├── index.js                      # コミット済みの esbuild バンドル、ユーザーが実行するサーバー
│   └── THIRD_PARTY_LICENSES.txt      # 同梱依存関係のライセンス
├── src/                              # サーバーの TypeScript ソース
│   ├── index.ts                      # MCP サーバーエントリーポイント、すべてのツールを含む
│   ├── tools/                        # MCP ツール実装 (docs、design、WWDC など)
│   └── utils/                        # キャッシュ、HTTP クライアント、UserAgent プール、エラー処理
├── scripts/                          # build-bundle.mjs と publish.py
├── tests/                            # Jest テストスイート
└── package.json                      # 開発用の依存関係とスクリプト (private)
```

### パフォーマンス機能

- **メモリベースのキャッシュ**: 自動クリーンアップと TTL をサポートする独自のキャッシュ実装
- **スマート UserAgent プール**: 自動障害回復とパフォーマンス監視を備えたインテリジェントなローテーションシステム
- **動的ヘッダー**: リアルなブラウザーヘッダー生成 (Accept、Accept-Language、User-Agent)
- **スマート検索**: 結果フォーマットを強化した Apple 公式検索 API
- **拡張分析**: オプションの関連 API、プラットフォーム互換性、類似性分析
- **エラー回復力**: 包括的なエラー処理による優雅な劣化
- **型安全性**: Zod によるランタイム検証を備えた完全な TypeScript
- **実行時依存関係ゼロ**: サーバーは単一のバンドルファイルとして配布され、インストールする node_modules はありません

### キャッシュ戦略

| コンテンツタイプ | キャッシュ期間 | キャッシュサイズ | 理由 |
|------------------|----------------|----------------|------|
| API ドキュメント | 30分 | 500 エントリ | 頻繁にアクセスされる、適度な更新 |
| 検索結果 | 10分 | 200 エントリ | 動的コンテンツ、ユーザー固有 |
| フレームワークインデックス | 1時間 | 100 エントリ | 安定した構造、変更頻度が低い |
| テクノロジーリスト | 2時間 | 50 エントリ | 滅多に変更されない、大容量コンテンツ |
| ドキュメント更新 | 30分 | 100 エントリ | 定期更新、WWDC 発表 |
| Apple Design コンテンツ | 2時間 | 100 エントリ | HIG と Design ページはセッション中は安定 |
| Apple Design リソース | 2時間 | 20 エントリ | カタログのメタデータはページ読み取りより変更頻度が低い |

ダウンロードした Apple Design ファイルはプラグインのディレクトリの外にキャッシュされます。サーバープロセスごとに作成される一時ディレクトリ、または `APPLE_DOCS_MCP_CACHE_DIR` で指定したディレクトリです (「設定」を参照)。これらのファイルは MCP の `resources/list` と `resources/read` を通じて公開されます。

## WWDC データ

WWDC ビデオデータ (2014-2026) は**プラグインに同梱されていません**。WWDC ツールを最初に呼び出すと、プラグインのデータリリースからアーカイブ (約 11 MB: 1,400 以上のセッションと完全なトランスクリプト、19 のトピックカテゴリ) を 1 つダウンロードし、SHA-256 を検証して `${CLAUDE_PLUGIN_DATA}/wwdc-data/v2` に展開します (`CLAUDE_PLUGIN_DATA` が未設定の場合は、`APPLE_DOCS_MCP_CACHE_DIR` または `~/.cache/apple-docs-mcp` の下の `wwdc-data/v2`)。以降の呼び出しは、どのセッションでもディスクから読み込みます。サーバーの起動と他のすべてのツールはダウンロードしません。ビデオ、スライド、サンプルプロジェクトはダウンロードされず、WWDC ツールはそのリンクを返すだけです。

オフライン環境や GitHub に接続できないマシンでは、アーカイブを自分で展開し、プラグインにそのパスを指定してください:

```bash
mkdir -p /path/to/wwdc-data && curl -L https://github.com/Emasoft/apple-docs-wwdc-data/releases/download/v2/wwdc-data.tar.gz | tar xz -C /path/to/wwdc-data
export APPLE_DOCS_MCP_WWDC_DATA_DIR=/path/to/wwdc-data
```

アーカイブの SHA-256 は `9e436884c29acb8ccef0b1077bc0713e1d380be513ba174cbf865fa7f17bc3bb` です。ダウンロードに失敗した場合、WWDC ツールは URL、保存先ディレクトリ、`APPLE_DOCS_MCP_WWDC_DATA_DIR` を示すエラーを返します。

> **注**: より新しい WWDC データのリリースを入手するには、プラグインを更新してください。

## 設定

サーバーは起動時に次のオプションの環境変数を読み取ります。変数は Claude Code を起動するプロセスの環境に設定してください。GUI から起動した Claude Code は、シェルのプロファイルでエクスポートした変数を認識しないためです (Claude Code 2.1.285 で確認。公式ドキュメントには記載なし)。設定するには、変数をエクスポートしたターミナルから Claude Code を起動するか、macOS では `launchctl setenv NAME value` を実行してから Claude Code を再起動します (launchctl の値は再起動すると失われます)。

| 変数 | 説明 | デフォルト |
|------|------|------------|
| `APPLE_DOCS_MCP_CACHE_DIR` | ダウンロードした Apple Design ファイルのディレクトリ (`CLAUDE_PLUGIN_DATA` が未設定の場合は WWDC データも) | サーバープロセスごとの一時ディレクトリ (WWDC データ: `~/.cache/apple-docs-mcp`) |
| `APPLE_DOCS_MCP_WWDC_DATA_DIR` | 展開済みの WWDC データアーカイブのディレクトリ。設定するとダウンロードは行われません (「WWDC データ」を参照) | 未設定: 初回使用時にダウンロード |
| `APPLE_DOCS_MCP_CACHE_MAX_BYTES` | ダウンロードキャッシュのサイズ上限 (バイト) | 1073741824 (1 GiB) |
| `MCP_DEBUG` | `true` に設定するとデバッグログを有効化 | オフ |
| `DEFAULT_ACCEPT_LANGUAGE` | Apple サーバーに送信する Accept-Language ヘッダー | `en-US,en;q=0.9` |
| `DISABLE_LANGUAGE_ROTATION` | `true` に設定すると Accept-Language ヘッダーのローテーションを停止 | オフ |
| `DISABLE_SEC_FETCH` | `true` に設定すると Sec-Fetch-* ヘッダーを送信しない | オフ |
| `DISABLE_DNT` | `true` に設定すると DNT ヘッダーを送信しない | オフ |
| `SIMPLE_HEADERS_MODE` | `true` に設定すると最小限のリクエストヘッダーを送信 | オフ |
| `APPLE_DOCS_MCP_JEV_RERANK` | `1` に設定すると Jev セマンティック選択をデフォルトで有効化 (下記参照) | オフ |
| `APPLE_DOCS_MCP_JEV_PROVIDER` | Jev プロバイダー: `typesafe`、`openrouter`、`gateway`。Jev を有効にする場合は必須 | なし |
| `TYPESAFE_API_KEY` | `typesafe` プロバイダー用の API キー | なし |
| `OPENROUTER_API_KEY` | `openrouter` プロバイダー用の API キー | なし |
| `JEV_GATEWAY_URL`、`JEV_GATEWAY_API_KEY` | `gateway` プロバイダー用の URL と API キー | なし |

サーバーには 12 種類以上の設定済み UserAgent 文字列 (macOS、Windows、Linux 上の Chrome、Firefox、Safari、Edge) のプールが含まれ、自動障害回復を伴ってローテーションします。

### Jev セマンティック選択 (オプション、有料)

`search_wwdc_content` と `search_apple_docs` は、Jev 関連度スコアリングサービスを使って結果をクエリに最も合致する 1〜5 件に絞り込み、それぞれに関連度スコアを付けて表示できます。デフォルトではオフです。有効にするには、`APPLE_DOCS_MCP_JEV_RERANK=1` を設定し、`APPLE_DOCS_MCP_JEV_PROVIDER` でプロバイダーを選び、そのプロバイダーのキー (`TYPESAFE_API_KEY`、`OPENROUTER_API_KEY`、または `JEV_GATEWAY_URL` と `JEV_GATEWAY_API_KEY`) を設定します。

- **パラメーター:** 両ツールとも `select` (`true` または `false`。デフォルトは `APPLE_DOCS_MCP_JEV_RERANK` に従います) と `maxResults` (1〜5、デフォルト 5、選択がオフのときは無視されます) を受け付けます。Jev が有効でないときの `select: true` はエラーです。関連度のしきい値を超える結果がない場合は、最も良い 1 件が「No strong match」の警告付きで返されます。
- **`search_wwdc_content` の `limit`:** 選択がオンのとき、`limit` はリコール幅になります。一致数の順に並べた上位その本数のビデオが Jev でスコアリングされます (最大 256)。`limit` を省略すると、256 件までのすべての候補がスコアリングされます。選択がオフのときの `limit` は従来どおりです (デフォルト 20、最大 100)。スキャンで一致したビデオがスコアリングした数より多い場合、ヘッダーは「Selected N of M scored (of T matching)」と表示されます。
- **送信される内容と送信先:** 選択がオンのとき、クエリと、各候補のタイトル、概要 (Apple ドキュメントの結果のみ)、URL、トピック、さらに WWDC では最初の一致箇所の抜粋 (文字起こしまたはコード) が、選択したプロバイダーに API キーとともに送信されます。送信先は、`typesafe` では `api.typesafe.ai`、`openrouter` では `openrouter.ai`、`gateway` では `JEV_GATEWAY_URL` の URL です。選択がオフのときは何も送信されません。
- **コスト:** 有料サービスで、プロバイダーがあなたのキーに課金します。実測の目安: Apple ドキュメントの結果約 17 件で約 $0.0001、WWDC の候補約 90 件で約 $0.001、上限の 256 件で最大約 $0.003 です。選択による遅延は通常 2 秒未満で、プロバイダーが遅い場合やリトライする場合でも最大約 15 秒です。
- **フェイルファスト:** 選択がオンのとき、いかなる失敗 (キーの未設定、無効なプロバイダー、リトライ後のネットワークまたはプロバイダーのエラー) も、順位付けされていない結果ではなくエラーを返します。絞り込まれていない結果が必要な場合は `select: false` を渡してください。

選択の設計は [jgrep](https://github.com/kyu1204/jgrep) (MIT) から移植したものです。

## 開発

このセクションはメンテナー向けです。プラグインのユーザーには不要です。必要なもの: Node.js 22 以降と pnpm (バージョンは `package.json` の `packageManager` で固定されています)。

```bash
pnpm install --frozen-lockfile   # 開発用の依存関係をインストール
pnpm build                       # servers/apple-docs/index.js と THIRD_PARTY_LICENSES.txt を再生成
pnpm typecheck                   # tsc --noEmit
pnpm lint                        # eslint src
pnpm test                        # Jest テストスイート
pnpm start                       # ビルド済みの stdio サーバーを実行 (node servers/apple-docs/index.js)
```

- **バンドルはコミットされます。** `servers/apple-docs/index.js` は Claude Code が実行するファイルで、ユーザーのマシンで依存関係のインストールは不要です。`src/` や同梱依存関係を変更したら `pnpm build` を実行して結果をコミットしてください。コミット済みのバンドルが新規ビルドと異なると、鮮度テスト (`tests/bundle-freshness.test.ts`) が失敗します。
- **npm / bun のロックファイルは置かないでください。** `package.json` の隣に `package-lock.json`、`npm-shrinkwrap.json`、`bun.lock`、`bun.lockb` があると、Claude Code はプラグインルートで `npm ci` を実行し、すべての開発用依存関係をユーザーのマシンにインストールしてしまいます。このリポジトリは pnpm を使用しており、Claude Code はそのロックファイルを無視します。ガードテスト (`tests/plugin-lockfile-guard.test.ts`) は、これらのファイルが現れると失敗します。
- **依存関係の更新。** cheerio をアップグレードしたら、`scripts/build-bundle.mjs` にある `load-parse` エントリへのリダイレクトを再検証してください (`pnpm build` とスタンドアロンバンドルテストを実行)。
- **リリース。** リリースは CPV 標準パイプラインで行います: `uv run python scripts/publish.py` (lint、検証、テスト、`plugin.json`・`package.json`・`pyproject.toml` のバージョン更新、changelog、タグ、プッシュ、GitHub リリース)。npm には何も公開しません。

## コントリビューション

コントリビューション歓迎！始め方：

1. リポジトリを **Fork**
2. 機能ブランチを **作成**: `git checkout -b feature/amazing-feature`
3. Conventional Commits 形式で変更を **コミット** (CI の commitlint が検査します): `git commit -m "feat: add amazing feature"`
4. ブランチに **プッシュ**: `git push origin feature/amazing-feature`
5. Pull Request を **開く**

## ライセンス

MIT ライセンス - 詳細は [LICENSE](LICENSE) をご覧ください。オリジナルの著作権は kimsungwhee 氏、追加部分の著作権は Emasoft に帰属します。サーバーに同梱されている依存関係のライセンスは [servers/apple-docs/THIRD_PARTY_LICENSES.txt](servers/apple-docs/THIRD_PARTY_LICENSES.txt) に記載されています。

## 免責事項

このプロジェクトは Apple Inc. と提携または承認されていません。教育および開発目的で公開されている Apple 開発者ドキュメント API を使用しています。

---

[問題を報告](https://github.com/Emasoft/emasoft-apple-documentation-plugin/issues) • [機能リクエスト](https://github.com/Emasoft/emasoft-apple-documentation-plugin/issues/new) • [ソース](https://github.com/Emasoft/emasoft-apple-documentation-plugin)
