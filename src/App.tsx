import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomeScreen from "./HomeScreen";
import SearchResultScreen from "./SearchResultScreen";
import RouteScreen from "./RouteScreen";
import NavigationScreen from "./NavigationScreen";
import SettingsScreen from "./SettingsScreen";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/searchResult" element={<SearchResultScreen />} />
        <Route path="/route" element={<RouteScreen />} />
        <Route path="/navigate" element={<NavigationScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
