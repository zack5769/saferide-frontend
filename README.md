# SafeRide - 雨雲回避ナビゲーションアプリ

SafeRideは、雨雲情報を活用して雨を避けるルートを提案する次世代ナビゲーションアプリです。

## 🌟 主な機能

- 🗺️ **インタラクティブ地図表示** - Mapbox GL JSを使用したスムーズな地図操作
- 🌧️ **雨雲回避ルート計算** - Yahoo! JAPAN気象APIを活用した雨雲回避機能
- 📍 **現在地取得** - GPS位置情報の取得と表示
- 🔍 **場所検索** - 目的地の検索機能
- 🧭 **リアルタイムナビゲーション** - 音声案内シミュレーション付きナビゲーション
- 🌙 **ダークモード対応** - ライト/ダークテーマの切り替え
- 📱 **レスポンシブデザイン** - モバイル・デスクトップ両対応

## 🛠️ 技術スタック

### フロントエンド
- **React 18** - ユーザーインターフェースライブラリ
- **TypeScript** - 型安全な開発
- **Vite** - 高速開発ツール
- **Material-UI (MUI)** - UIコンポーネントライブラリ
- **React Router** - ルーティング管理
- **Mapbox GL JS** - 地図表示エンジン

### バックエンド・API
- **GraphHopper** - ルート計算エンジン
- **Yahoo! JAPAN Web Services** - 気象データ
- **Custom Route Service** - 雨雲回避ルート計算API

## 🚀 セットアップ・実行方法

### 前提条件
- Node.js (v18以上)
- npm または yarn
- Mapbox Access Token

### インストール

```bash
# リポジトリをクローン
git clone <repository-url>
cd saferide-frontend

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

### 環境設定

`.env.local`ファイルを作成し、以下の環境変数を設定してください：

```env
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token_here
VITE_BACKEND_URL=http://localhost:3000
```

## 📁 プロジェクト構造

```
src/
├── components/          # 再利用可能なコンポーネント
│   ├── map/            # 地図関連コンポーネント
│   └── navigation/     # ナビゲーション関連コンポーネント
├── hooks/              # カスタムフック
├── layout/             # レイアウトコンポーネント
├── services/           # API通信サービス
├── theme/              # テーマ管理
├── types/              # TypeScript型定義
├── HomeScreen.tsx      # ホーム画面
├── SearchResultScreen.tsx # 検索結果画面
├── RouteScreen.tsx     # ルート詳細画面
├── NavigationScreen.tsx # ナビゲーション画面
└── SettingsScreen.tsx  # 設定画面
```

## 🔧 開発用コマンド

```bash
# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build

# プレビュー
npm run preview

# 型チェック
npm run type-check

# リント
npm run lint
```

## 🌐 画面構成

1. **ホーム画面** (`/`) - 地図表示と検索機能
2. **検索結果画面** (`/searchResult`) - 検索結果の表示と目的地選択
3. **ルート画面** (`/route`) - ルート詳細と雨雲回避設定
4. **ナビゲーション画面** (`/navigate`) - 実際のナビゲーション実行
5. **設定画面** (`/settings`) - アプリケーション設定

## 🙏 謝辞

- 気象情報: Web Services by Yahoo! JAPAN
- 地図データ: Mapbox
- ルート計算: GraphHopper