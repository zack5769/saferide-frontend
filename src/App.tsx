// SafeRideアプリケーションのメインコンポーネント
// 雨雲回避機能付きナビゲーションアプリ
import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomeScreen from "./HomeScreen";
import SearchResultScreen from "./SearchResultScreen";
import RouteScreen from "./RouteScreen";
import NavigationScreen from "./NavigationScreen";
import SettingsScreen from "./SettingsScreen";

/**
 * SafeRideアプリケーションのメインコンポーネント
 * React Routerを使用して画面間の遷移を管理
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ホーム画面 - 地図表示と検索機能 */}
        <Route path="/" element={<HomeScreen />} />
        {/* 検索結果画面 - 検索結果の表示と目的地選択 */}
        <Route path="/searchResult" element={<SearchResultScreen />} />
        {/* ルート画面 - ルート選択と詳細表示 */}
        <Route path="/route" element={<RouteScreen />} />
        {/* ナビゲーション画面 - 実際のナビゲーション実行 */}
        <Route path="/navigate" element={<NavigationScreen />} />
        {/* 設定画面 - アプリケーション設定 */}
        <Route path="/settings" element={<SettingsScreen />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
