import { useState, useEffect } from "react";
import { Marker } from "react-map-gl";
import {
    Fab,
    Snackbar,
    Alert,
    useTheme,
    useMediaQuery,
    Zoom,
} from "@mui/material";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import AppLayout from "./layout/AppLayout";
import SearchBar from "./components/SearchBar";
import BottomNavigation from "./components/navigation/BottomNavigation";
import MapContainer from "./components/map/MapContainer";
import { useGeolocation } from "./hooks/useGeolocation";
import { useMapViewport } from "./hooks/useMapViewport";
import { useThemeMode } from "./theme/ThemeProvider";

export default function HomeScreen() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { isDarkMode } = useThemeMode();
    const { position, error, loading } = useGeolocation();
    const { viewport, setViewport, flyTo, mapRef } = useMapViewport({
        initialLongitude: 137.7,
        initialLatitude: 34.7,
        initialZoom: 16
    });

    const [showLocationButton, setShowLocationButton] = useState(false);
    const [hasInitializedPosition, setHasInitializedPosition] = useState(false);

    // 現在地が取得されたら地図の中心を移動
    useEffect(() => {
        if (position && !hasInitializedPosition) {
            // 初回のみ現在地に地図を移動
            setViewport({
                longitude: position[0],
                latitude: position[1],
                zoom: 16
            });
            setHasInitializedPosition(true);
            setShowLocationButton(true);
        } else if (position && !showLocationButton) {
            // 位置情報が取得できたらボタンを表示
            setShowLocationButton(true);
        }
    }, [position, hasInitializedPosition, setViewport, showLocationButton]);

    // 現在地ボタンが押されたときの処理
    const handleFlyToCurrent = () => {
        if (position) {
            flyTo(position[0], position[1], 16);
        }
    };

    return (
        <AppLayout>
            {/* 検索バー */}
            <SearchBar placeholder="場所を検索..." />

            {/* 地図 */}
            <MapContainer
                ref={mapRef}
                viewport={viewport}
                onMove={evt => setViewport(evt.viewState)}
            >
                {/* 現在地マーカー */}
                {position && (
                    <Marker longitude={position[0]} latitude={position[1]}>
                        <div 
                            className={isDarkMode ? "marker-glow" : ""}
                            style={{ 
                                width: 20,
                                height: 20,
                                backgroundColor: isDarkMode ? '#00e676' : theme.palette.primary.main,
                                border: `3px solid ${isDarkMode ? '#1e1e1e' : '#ffffff'}`,
                                borderRadius: '50%',
                                boxShadow: isDarkMode 
                                    ? `0 0 20px rgba(0, 230, 118, 0.8), 0 0 40px rgba(0, 230, 118, 0.4)`
                                    : `0 0 10px ${theme.palette.primary.main}40`
                            }} 
                        />
                    </Marker>
                )}
            </MapContainer>

            {/* 現在地ボタン */}
            <Zoom in={showLocationButton} timeout={300}>
                <Fab
                    color="primary"
                    size={isMobile ? "medium" : "large"}
                    sx={{
                        position: "absolute",
                        bottom: isMobile ? 100 : 120,
                        right: isMobile ? 16 : 24,
                        zIndex: 1000,
                        boxShadow: isDarkMode ? theme.shadows[12] : theme.shadows[6],
                    }}
                    onClick={handleFlyToCurrent}
                >
                    <MyLocationIcon />
                </Fab>
            </Zoom>

            {/* エラー表示 */}
            <Snackbar 
                open={!!error} 
                autoHideDuration={6000}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert severity="warning" sx={{ width: '100%' }}>
                    {error}
                </Alert>
            </Snackbar>

            {/* ボトムナビゲーション */}
            <BottomNavigation />
        </AppLayout>
    );
}
