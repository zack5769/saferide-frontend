import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Map, { Marker, Source, Layer } from "react-map-gl";
import {
    Box,
    Paper,
    Typography,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    useMediaQuery,
    CircularProgress,
    IconButton,
    Switch,
    Chip,
    Divider,
    Link,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import NavigationIcon from "@mui/icons-material/Navigation";
import SportsMotorsportsIcon from "@mui/icons-material/SportsMotorsports";
import CloudIcon from "@mui/icons-material/Cloud";
import { RouteService } from "./services/routeService";
import InstructionIcon from "./components/InstructionIcon";
import type { RouteResponse } from "./types/route";
import { useThemeMode } from "./theme/ThemeProvider";

export default function RouteScreen() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const isMobile = useMediaQuery("(max-width:600px)");
    const mapRef = useRef<any>(null);
    const { isDarkMode } = useThemeMode();
    
    const [route, setRoute] = useState<RouteResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null);
    
    const [viewport, setViewport] = useState({
        longitude: 137.7,
        latitude: 34.7,
        zoom: 14
    });

    // URLパラメータから取得
    const startLng = parseFloat(searchParams.get('startLng') || '137.7');
    const startLat = parseFloat(searchParams.get('startLat') || '34.7');
    const endLng = parseFloat(searchParams.get('endLng') || '137.72');
    const endLat = parseFloat(searchParams.get('endLat') || '34.72');
    const destinationName = searchParams.get('name') || '目的地';
    const initialRainAvoidance = searchParams.get('rainAvoidance') === 'true'; // URLパラメータから雨雲回避設定を取得

    // 雨雲回避の初期値をURLパラメータから設定
    const [rainAvoidance, setRainAvoidance] = useState(initialRainAvoidance);

    // 現在地を取得
    useEffect(() => {
        navigator.geolocation.getCurrentPosition((pos) => {
            setCurrentPosition([pos.coords.longitude, pos.coords.latitude]);
        }, (error) => {
            console.error('位置情報取得エラー:', error);
            // フォールバック: URLパラメータの座標を使用
            setCurrentPosition([startLng, startLat]);
        }, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
        });
    }, [startLng, startLat]);

    // ルート取得
    useEffect(() => {
        if (!currentPosition) return;

        const fetchRoute = async () => {
            setLoading(true);
            try {
                // 現在地をstart地点として使用し、雨雲回避設定を渡す
                const routeData = await RouteService.getRoute(
                    currentPosition[0], // 現在地のlng
                    currentPosition[1], // 現在地のlat
                    endLng, 
                    endLat,
                    rainAvoidance // 雨雲回避設定を追加
                );
                setRoute(routeData);
                // スタート地点とゴール地点が画面に収まるように表示
                setTimeout(() => {
                    if (mapRef.current && currentPosition) {
                        try {
                            // スタート地点（現在地）とゴール地点の座標
                            const startCoords: [number, number] = [currentPosition[0], currentPosition[1]];
                            const endCoords: [number, number] = [endLng, endLat];
                            // バウンディングボックスを計算
                            const minLng = Math.min(startCoords[0], endCoords[0]);
                            const maxLng = Math.max(startCoords[0], endCoords[0]);
                            const minLat = Math.min(startCoords[1], endCoords[1]);
                            const maxLat = Math.max(startCoords[1], endCoords[1]);
                            // パディングを追加（両地点間の距離の10%）
                            const lngPadding = Math.max((maxLng - minLng) * 0.2, 0.01);
                            const latPadding = Math.max((maxLat - minLat) * 0.2, 0.01);
                            const bounds: [[number, number], [number, number]] = [
                                [minLng - lngPadding, minLat - latPadding],
                                [maxLng + lngPadding, maxLat + latPadding]
                            ];
                            mapRef.current.fitBounds(bounds, {
                                padding: {
                                    top: 80,
                                    bottom: 200, // 下部パネル分のパディング
                                    left: 40,
                                    right: 40
                                },
                                duration: 1500,
                                essential: true
                            });
                        } catch (error) {
                            console.warn('fitBounds failed, using fallback method:', error);
                            // フォールバック: 中心点とズームレベルを計算
                            const centerLng = (currentPosition[0] + endLng) / 2;
                            const centerLat = (currentPosition[1] + endLat) / 2;
                            // 距離に基づいてズームレベルを計算
                            const lngDiff = Math.abs(endLng - currentPosition[0]);
                            const latDiff = Math.abs(endLat - currentPosition[1]);
                            const maxDiff = Math.max(lngDiff, latDiff);
                            let zoom = 14;
                            if (maxDiff < 0.01) zoom = 16;
                            else if (maxDiff < 0.05) zoom = 14;
                            else if (maxDiff < 0.1) zoom = 12;
                            else if (maxDiff < 0.5) zoom = 10;
                            else zoom = 8;
                            setViewport({
                                longitude: centerLng,
                                latitude: centerLat,
                                zoom: zoom
                            });
                        }
                    }
                }, 500); // ルート描画後に実行
            } catch (error: any) {
                console.error('Failed to fetch route:', error);
                // 400エラー時はエラーメッセージ付きで検索画面に戻る
                if (error && error.message && error.message.includes('status: 400')) {
                    const errorMsg = encodeURIComponent('ルートを取得できませんでした。\n現在地または目的地が雨、経路が国外を通る、または到着地点までの道がありません。');
                    // 元の検索クエリも一緒に保持
                    navigate(`/searchResult?q=${encodeURIComponent(destinationName)}&error=${errorMsg}`);
                } else {
                    console.error('Failed to fetch route:', error);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchRoute();
    }, [currentPosition, endLng, endLat, rainAvoidance]); // rainAvoidanceを依存配列に追加

    const routePath = route?.paths[0];

    const handleStartNavigation = () => {
        navigate(`/navigate?${searchParams.toString()}`);
    };

    const handleClose = () => {
        navigate(-1);
    };

    if (loading) {
        return (
            <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                bgcolor: 'background.default'
            }}>
                <CircularProgress size={60} />
                <Typography variant="h6" sx={{ mt: 2 }}>
                    ルートを計算中...
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ 
            width: "100vw", 
            height: "100vh", 
            position: "relative",
            bgcolor: "background.default"
        }}>
            {/* 地図エリア */}
            <Box sx={{ 
                width: "100vw", 
                height: "60vh"
            }}>
                <Map
                    ref={mapRef}
                    {...viewport}
                    onMove={evt => setViewport(evt.viewState)}
                    style={{ width: "100%", height: "100%" }}
                    mapStyle={isDarkMode 
                        ? "mapbox://styles/mapbox/navigation-night-v1" // Navigation Nightテーマ
                        : "mapbox://styles/mapbox/streets-v12"
                    }
                    mapboxAccessToken={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}
                >
                    {/* 出発地マーカー */}
                    <Marker longitude={startLng} latitude={startLat}>
                        <div style={{ 
                            color: '#4caf50', 
                            fontSize: 28,
                            filter: isDarkMode 
                                ? 'drop-shadow(2px 2px 8px rgba(0,0,0,0.9)) brightness(1.3)'
                                : 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))'
                        }}>
                            🟢
                        </div>
                    </Marker>

                    {/* 目的地マーカー */}
                    <Marker longitude={endLng} latitude={endLat}>
                        <div style={{ 
                            color: '#f44336', 
                            fontSize: 28,
                            filter: isDarkMode 
                                ? 'drop-shadow(2px 2px 8px rgba(0,0,0,0.9)) brightness(1.3)'
                                : 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))'
                        }}>
                            🔴
                        </div>
                    </Marker>

                    {/* 現在地マーカー */}
                    {currentPosition && (
                        <Marker longitude={currentPosition[0]} latitude={currentPosition[1]}>
                            <div style={{ 
                                color: '#2196f3', 
                                fontSize: 28,
                                filter: isDarkMode 
                                    ? 'drop-shadow(2px 2px 8px rgba(0,0,0,0.9)) brightness(1.3)'
                                    : 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))'
                            }}>
                                🔵
                            </div>
                        </Marker>
                    )}

                    {/* ルート線 */}
                    {routePath && (
                        <Source id="route" type="geojson" data={routePath.points}>
                            <Layer
                                id="route-layer"
                                type="line"
                                paint={{
                                    'line-color': rainAvoidance 
                                        ? (isDarkMode ? '#00e676' : '#2196f3') // ダークモード時はより鮮やかなグリーン
                                        : (isDarkMode ? '#ffab40' : '#ff9800'), // ダークモード時はより鮮やかなオレンジ
                                    'line-width': 6,
                                    'line-opacity': 0.9
                                }}
                            />
                        </Source>
                    )}
                </Map>
            </Box>

            {/* 閉じるボタン */}
            <IconButton
                onClick={handleClose}
                sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    bgcolor: 'background.paper',
                    boxShadow: 2,
                    zIndex: 1000,
                    '&:hover': { 
                        bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' 
                    }
                }}
            >
                <CloseIcon />
            </IconButton>

            {/* 下部パネル */}
            <Paper
                sx={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "40vh",
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    p: 3,
                    overflowY: 'auto',
                    bgcolor: 'background.paper'
                }}
                elevation={8}
            >
                {/* 雨雲回避設定 */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CloudIcon color={rainAvoidance ? "primary" : "disabled"} />
                        <Typography variant="h6">雨雲回避ルート</Typography>
                        {rainAvoidance && <Chip label="ON" color="primary" size="small" />}
                    </Box>
                    <Switch 
                        checked={rainAvoidance}
                        onChange={(e) => setRainAvoidance(e.target.checked)}
                        color="primary"
                    />
                </Box>

                {/* Yahoo!気象情報APIのクレジット表記 */}
                <Box sx={{ mb: 2 }}>
                    <Link 
                        href="https://developer.yahoo.co.jp/sitemap/"
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ 
                            fontSize: 'caption.fontSize',
                            textDecoration: 'none',
                            color: 'text.secondary',
                            '&:hover': {
                                textDecoration: 'underline'
                            }
                        }}
                    >
                        Web Services by Yahoo! JAPAN
                    </Link>
                </Box>

                {/* ルート情報 */}
                {routePath && (
                    <>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Typography variant="h4" fontWeight="bold" color="primary">
                                {RouteService.formatTime(routePath.time)}
                            </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                            <Chip label={RouteService.formatDistance(routePath.distance)} variant="outlined" />
                            <Chip label={destinationName} variant="outlined" />
                            {rainAvoidance && <Chip label="雨雲回避" color="primary" />}
                        </Box>
                    </>
                )}

                {/* ナビ開始ボタン */}
                <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    startIcon={<NavigationIcon />}
                    size="large"
                    sx={{ 
                        borderRadius: "999px", 
                        textTransform: "none",
                        mb: 3,
                        py: 1.5,
                        fontSize: '1.1rem',
                        fontWeight: 600
                    }}
                    onClick={handleStartNavigation}
                >
                    ナビ開始
                </Button>

                <Divider sx={{ mb: 2 }} />

                {/* ルート詳細 */}
                {routePath?.instructions && (
                    <Box>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            ルート詳細 ({routePath.instructions.length - 1}つの指示)
                        </Typography>
                        <List dense>
                            {routePath.instructions.slice(0, -1).map((instruction, index) => (
                                <ListItem key={index} sx={{ px: 0, py: 1 }}>
                                    <ListItemIcon sx={{ minWidth: 40 }}>
                                        <InstructionIcon sign={instruction.sign} color="primary" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={
                                            <Typography variant="body1" fontWeight={500}>
                                                {instruction.text}
                                                {instruction.street_ref && ` (${instruction.street_ref})`}
                                            </Typography>
                                        }
                                        secondary={
                                            <Box component="div" sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                                                <Chip 
                                                    label={RouteService.formatDistance(instruction.distance)}
                                                    size="small" variant="outlined"
                                                />
                                                <Chip 
                                                    label={RouteService.formatTime(instruction.time)}
                                                    size="small" variant="outlined"
                                                />
                                                {instruction.street_name && (
                                                    <Chip 
                                                        label={instruction.street_name}
                                                        size="small" variant="outlined"
                                                    />
                                                )}
                                            </Box>
                                        }
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                )}
            </Paper>
        </Box>
    );
}