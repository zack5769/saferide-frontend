// ナビゲーション画面
// 実際のルート案内とリアルタイム位置追跡を行う
import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Map, { Marker, Source, Layer } from "react-map-gl";
import {
    Box,
    Paper,
    Typography,
    Button,
    LinearProgress,
    useMediaQuery,
    IconButton,
    Alert,
    Link,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import NavigationIcon from "@mui/icons-material/Navigation";
import TurnRightIcon from "@mui/icons-material/TurnRight";
import TurnLeftIcon from "@mui/icons-material/TurnLeft";
import StraightIcon from "@mui/icons-material/Straight";
import FlagIcon from "@mui/icons-material/Flag";
import HomeIcon from "@mui/icons-material/Home";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { RouteService } from "./services/routeService";
import RainTileLayer from "./components/map/RainTileLayer";
import type { RouteResponse, RouteInstruction } from "./types/route";
import { useThemeMode } from "./theme/ThemeProvider";

/**
 * ナビゲーション画面コンポーネント
 * 主要機能：
 * - リアルタイムナビゲーション表示
 * - 音声案内シミュレーション
 * - 進行状況の可視化
 * - 雨雲情報の表示
 */
export default function NavigationScreen() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const mapRef = useRef<any>(null);
    const isMobile = useMediaQuery("(max-width:600px)");
    const { isDarkMode } = useThemeMode();
    
    // ルートと指示の状態管理
    const [route, setRoute] = useState<RouteResponse | null>(null);
    const [currentInstructionIndex, setCurrentInstructionIndex] = useState(0);
    const [simulatedPosition, setSimulatedPosition] = useState<[number, number] | null>(null);
    const [currentCoordinateIndex, setCurrentCoordinateIndex] = useState(0);
    const [isNavigating, setIsNavigating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [remainingTime, setRemainingTime] = useState(0);
    const [remainingDistance, setRemainingDistance] = useState(0);
    const [distanceToNextInstruction, setDistanceToNextInstruction] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    
    // 地図のビューポート状態
    const [viewport, setViewport] = useState({
        longitude: 137.7,
        latitude: 34.7,
        zoom: 18
    });

    // URLパラメータから座標を取得
    const startLng = parseFloat(searchParams.get('startLng') || '137.7');
    const startLat = parseFloat(searchParams.get('startLat') || '34.7');
    const endLng = parseFloat(searchParams.get('endLng') || '137.72');
    const endLat = parseFloat(searchParams.get('endLat') || '34.72');
    const destinationName = searchParams.get('name') || '目的地';

    /**
     * 2点間の距離を計算する関数（メートル）
     * @param lat1 緯度1
     * @param lng1 経度1
     * @param lat2 緯度2
     * @param lng2 経度2
     * @returns 距離（メートル）
     */
    const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
        const R = 6371000; // 地球の半径（メートル）
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };

    /**
     * 現在位置から次の指示までの距離を計算
     * @param currentPosition 現在位置
     * @param coordinateIndex 現在の座標インデックス
     * @param instructionIndex 現在の指示インデックス
     * @returns 距離（メートル）
     */
    const calculateDistanceToNextInstruction = (
        currentPosition: [number, number], 
        coordinateIndex: number, 
        instructionIndex: number
    ): number => {
        if (!route?.paths?.[0]) return 0;
        
        const coordinates = route.paths[0].points.coordinates;
        const instructions = route.paths[0].instructions;
        
        if (instructionIndex >= instructions.length - 1) return 0;
        
        const nextInstruction = instructions[instructionIndex];
        const nextInstructionCoordIndex = nextInstruction.interval[1];
        
        let totalDistance = 0;
        
        // 現在位置から現在の座標点までの距離
        if (coordinateIndex < coordinates.length) {
            const currentCoord = coordinates[coordinateIndex];
            totalDistance += calculateDistance(
                currentPosition[1], currentPosition[0],
                currentCoord[1], currentCoord[0]
            );
        }
        
        // 現在の座標点から次の指示の座標点までの距離
        for (let i = coordinateIndex; i < Math.min(nextInstructionCoordIndex, coordinates.length - 1); i++) {
            const coord1 = coordinates[i];
            const coord2 = coordinates[i + 1];
            totalDistance += calculateDistance(coord1[1], coord1[0], coord2[1], coord2[0]);
        }
        
        return totalDistance;
    };

    // ルートデータ取得
    useEffect(() => {
        const fetchRoute = async () => {
            try {
                const routeData = await RouteService.getRoute(
                    startLng, 
                    startLat, 
                    endLng, 
                    endLat,
                    true // ナビゲーション時は雨雲回避を有効化
                );
                setRoute(routeData);
                
                // 開始位置を設定
                if (routeData.paths?.[0]?.points.coordinates[0]) {
                    const startCoord = routeData.paths[0].points.coordinates[0];
                    setSimulatedPosition([startCoord[0], startCoord[1]]);
                    setViewport(prev => ({
                        ...prev,
                        longitude: startCoord[0],
                        latitude: startCoord[1]
                    }));
                    
                    // 初期の次の指示までの距離を計算
                    const initialDistance = calculateDistanceToNextInstruction(
                        [startCoord[0], startCoord[1]], 
                        0, 
                        0
                    );
                    setDistanceToNextInstruction(initialDistance);
                }
                
                // 残り時間と距離を初期化
                setRemainingTime(routeData.paths?.[0]?.time || 0);
                setRemainingDistance(routeData.paths?.[0]?.distance || 0);
            } catch (error) {
                console.error('Failed to fetch route:', error);
            }
        };

        fetchRoute();
    }, [startLng, startLat, endLng, endLat]);

    // ナビゲーションシミュレーション
    useEffect(() => {
        if (!isNavigating || !route?.paths?.[0]?.points.coordinates) return;

        const coordinates = route.paths[0].points.coordinates;
        const instructions = route.paths[0].instructions;
        const totalDistance = route.paths[0].distance;
        
        let coordinateIndex = 0;
        let instructionIndex = 0;
        
        const interval = setInterval(() => {
            // 現在の座標を更新
            if (coordinateIndex < coordinates.length) {
                const currentCoord = coordinates[coordinateIndex];
                setSimulatedPosition([currentCoord[0], currentCoord[1]]);
                setCurrentCoordinateIndex(coordinateIndex);
                
                // 地図の中心を現在位置に移動
                setViewport(prev => ({
                    ...prev,
                    longitude: currentCoord[0],
                    latitude: currentCoord[1]
                }));

                // 進行状況を計算
                const progressPercent = (coordinateIndex / coordinates.length) * 100;
                setProgress(progressPercent);

                // 残り時間と距離を更新（概算）
                const remainingPercent = (coordinates.length - coordinateIndex) / coordinates.length;
                setRemainingTime(Math.round((route.paths?.[0]?.time || 0) * remainingPercent));
                setRemainingDistance(Math.round(totalDistance * remainingPercent));

                // 次の指示までの距離を更新
                const distanceToNext = calculateDistanceToNextInstruction(
                    [currentCoord[0], currentCoord[1]], 
                    coordinateIndex, 
                    instructionIndex
                );
                setDistanceToNextInstruction(distanceToNext);

                // 指示の更新
                if (instructionIndex < instructions.length - 1) {
                    const currentInstruction = instructions[instructionIndex];
                    const intervalEnd = currentInstruction.interval[1];
                    
                    if (coordinateIndex >= intervalEnd) {
                        instructionIndex++;
                        setCurrentInstructionIndex(instructionIndex);
                    }
                }

                coordinateIndex++;
            } else {
                // 到着
                setIsComplete(true);
                setProgress(100);
                setRemainingTime(0);
                setRemainingDistance(0);
                setDistanceToNextInstruction(0);
                clearInterval(interval);
            }
        }, 1000); // 1秒ごとに更新

        return () => clearInterval(interval);
    }, [isNavigating, route]);

    const handleStartNavigation = () => {
        setIsNavigating(true);
        setCurrentInstructionIndex(0);
        setProgress(0);
        setIsComplete(false);
    };

    const handleStopNavigation = () => {
        setIsNavigating(false);
    };

    const handleClose = () => {
        navigate(-1);
    };

    const handleGoHome = () => {
        navigate('/'); // ホーム画面に戻る
    };

    const getInstructionIcon = (sign: number, size: 'small' | 'medium' | 'large' = 'medium') => {
        const fontSize = size === 'large' ? 'large' : size === 'small' ? 'small' : 'medium';
        
        switch (sign) {
            case -3: case -2: // Turn left / sharp left
                return <TurnLeftIcon color="primary" fontSize={fontSize} />;
            case -1: // Turn slight left
                return <TurnLeftIcon color="disabled" fontSize={fontSize} />;
            case 0: // Continue straight
                return <StraightIcon color="primary" fontSize={fontSize} />;
            case 1: // Turn slight right
                return <TurnRightIcon color="disabled" fontSize={fontSize} />;
            case 2: case 3: // Turn right / sharp right
                return <TurnRightIcon color="primary" fontSize={fontSize} />;
            case 7: // Keep right
                return <TurnRightIcon color="action" fontSize={fontSize} />;
            case -7: // Keep left
                return <TurnLeftIcon color="action" fontSize={fontSize} />;
            case 4: // Arrive
                return <FlagIcon color="success" fontSize={fontSize} />;
            default:
                return <StraightIcon color="primary" fontSize={fontSize} />;
        }
    };

    const routePath = route?.paths?.[0];
    const currentInstruction = routePath?.instructions[currentInstructionIndex];
    const nextInstruction = routePath?.instructions[currentInstructionIndex + 1];

    return (
        <Box sx={{ 
            width: "100vw", 
            height: "100vh", 
            position: "relative",
            bgcolor: isDarkMode ? "#000" : "#000"
        }}>
            {/* 地図 */}
            <Map
                ref={mapRef}
                {...viewport}
                onMove={evt => setViewport(evt.viewState)}
                style={{ width: "100vw", height: "100vh" }}
                mapStyle={isDarkMode 
                    ? "mapbox://styles/mapbox/navigation-night-v1" // Navigation Nightテーマ
                    : "mapbox://styles/mapbox/navigation-day-v1"}
                mapboxAccessToken={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}
            >
                {/* 雨タイル表示 */}
                {route?.rain_tile_list && route.rain_tile_list.length > 0 && (
                    <RainTileLayer rainTiles={route.rain_tile_list} />
                )}

                {/* ルート線 */}
                {routePath && (
                    <Source id="route" type="geojson" data={routePath.points}>
                        <Layer
                            id="route-layer"
                            type="line"
                            paint={{
                                'line-color': isDarkMode ? '#00e676' : '#2196f3', // ダークモード時はより鮮やかなグリーン
                                'line-width': 8,
                                'line-opacity': 0.9
                            }}
                        />
                    </Source>
                )}

                {/* 現在位置マーカー */}
                {simulatedPosition && (
                    <Marker longitude={simulatedPosition[0]} latitude={simulatedPosition[1]}>
                        <div style={{ 
                            width: 20,
                            height: 20,
                            backgroundColor: isDarkMode ? '#00e676' : '#2196f3',
                            border: isDarkMode ? '3px solid #000' : '3px solid white',
                            borderRadius: '50%',
                            boxShadow: isDarkMode 
                                ? '0 0 20px rgba(0, 230, 118, 0.8), 0 0 40px rgba(0, 230, 118, 0.4)'
                                : '0 0 10px rgba(33, 150, 243, 0.5)'
                        }} />
                    </Marker>
                )}

                {/* 目的地マーカー */}
                <Marker longitude={endLng} latitude={endLat}>
                    <div style={{ 
                        color: isDarkMode ? '#ff5722' : '#4caf50', 
                        fontSize: 32,
                        filter: isDarkMode 
                            ? 'drop-shadow(2px 2px 8px rgba(0,0,0,0.9)) brightness(1.3)'
                            : 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))'
                    }}>
                        🏁
                    </div>
                </Marker>
            </Map>

            {/* 閉じるボタン */}
            <IconButton
                onClick={handleClose}
                sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    bgcolor: isDarkMode ? 'rgba(30,30,30,0.9)' : 'rgba(255,255,255,0.9)',
                    boxShadow: 2,
                    zIndex: 1000,
                    '&:hover': {
                        bgcolor: isDarkMode ? 'rgba(50,50,50,0.9)' : 'white'
                    }
                }}
            >
                <CloseIcon />
            </IconButton>

            {/* 進行状況バー */}
            <LinearProgress 
                variant="determinate" 
                value={progress} 
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    zIndex: 1000,
                    bgcolor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.3)',
                    '& .MuiLinearProgress-bar': {
                        bgcolor: '#4caf50'
                    }
                }}
            />

            {/* 上部情報パネル */}
            <Paper
                sx={{
                    position: 'absolute',
                    top: 20,
                    left: 16,
                    right: 60,
                    zIndex: 1000,
                    p: 2,
                    borderRadius: 3,
                    bgcolor: isDarkMode 
                        ? 'rgba(30, 30, 30, 0.95)' 
                        : 'rgba(255, 255, 255, 0.95)'
                }}
                elevation={4}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h6" fontWeight="bold" color="primary">
                            {RouteService.formatTime(remainingTime)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            残り {RouteService.formatDistance(remainingDistance)}
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        {destinationName}
                    </Typography>
                </Box>
            </Paper>


            {/* 下部指示パネル */}
            <Paper
                sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    p: 3,
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    bgcolor: 'background.paper',
                    zIndex: 1000
                }}
                elevation={8}
            >
                {!isNavigating ? (
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
                            ナビゲーション準備完了
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                            {destinationName}までのルートが設定されました
                        </Typography>
                        
                        {/* Yahoo!気象情報APIのクレジット表記 */}
                        <Link 
                            href="https://developer.yahoo.co.jp/sitemap/"
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ 
                                fontSize: 'caption.fontSize',
                                textDecoration: 'none',
                                color: 'text.secondary',
                                display: 'block',
                                mb: 2,
                                '&:hover': {
                                    textDecoration: 'underline'
                                }
                            }}
                        >
                            Web Services by Yahoo! JAPAN
                        </Link>
                        
                        <Button
                            variant="contained"
                            color="primary"
                            fullWidth
                            startIcon={<NavigationIcon />}
                            size="large"
                            sx={{ 
                                borderRadius: "999px", 
                                textTransform: "none",
                                py: 1.5,
                                fontSize: '1.1rem',
                                fontWeight: 600
                            }}
                            onClick={handleStartNavigation}
                        >
                            ナビゲーション開始
                        </Button>
                    </Box>
                ) : isComplete ? (
                    // 到着時の表示
                    <Box sx={{ textAlign: 'center' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                            <CheckCircleIcon 
                                sx={{ 
                                    fontSize: 48, 
                                    color: 'success.main',
                                }} 
                            />
                        </Box>
                        <Typography variant="h5" fontWeight="bold" color="success.main" sx={{ mb: 1 }}>
                            目的地に到着しました！
                        </Typography>
                        <Typography variant="h6" gutterBottom>
                            {destinationName}
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                            お疲れさまでした。安全運転ありがとうございました。
                        </Typography>
                        
                        {/* 統計情報 */}
                        {routePath && (
                            <Box sx={{ 
                                bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'grey.50', 
                                borderRadius: 2, 
                                p: 2, 
                                mb: 3 
                            }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    ナビゲーション情報
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 1 }}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h6" fontWeight="bold" color="primary">
                                            {RouteService.formatDistance(routePath.distance)}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            総距離
                                        </Typography>
                                    </Box>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h6" fontWeight="bold" color="primary">
                                            {RouteService.formatTime(routePath.time)}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            所要時間
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        )}
                        
                        <Button
                            onClick={handleGoHome}
                            variant="contained"
                            startIcon={<HomeIcon />}
                            fullWidth
                            size="large"
                            sx={{ 
                                borderRadius: "999px",
                                py: 1.5,
                                fontSize: '1.1rem',
                                fontWeight: 600
                            }}
                        >
                            ホームに戻る
                        </Button>
                    </Box>
                ) : (
                    // ナビゲーション中の表示
                    <Box>
                        {/* 現在の指示 */}
                        {currentInstruction && (
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Box sx={{ mr: 2 }}>
                                    {getInstructionIcon(currentInstruction.sign, 'large')}
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    {/* 距離表示を大きくして強調 */}
                                    <Typography 
                                        variant="h3" 
                                        fontWeight="bold" 
                                        color="primary"
                                        sx={{ 
                                            fontSize: isMobile ? '2.5rem' : '3rem',
                                            lineHeight: 1,
                                            mb: 0.5
                                        }}
                                    >
                                        {RouteService.formatDistance(distanceToNextInstruction)}先
                                    </Typography>
                                    <Typography variant="h6" fontWeight="bold">
                                        {currentInstruction.text}
                                        {currentInstruction.street_ref && ` (${currentInstruction.street_ref})`}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {currentInstruction.street_name}
                                    </Typography>
                                </Box>
                            </Box>
                        )}

                        {/* 次の指示 */}
                        {nextInstruction && (
                            <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                p: 2, 
                                bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f5f5f5', 
                                borderRadius: 2,
                                mb: 2
                            }}>
                                <Box sx={{ mr: 2 }}>
                                    {getInstructionIcon(nextInstruction.sign, 'small')}
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="body2" fontWeight="500">
                                        次: {nextInstruction.text}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {RouteService.formatDistance(nextInstruction.distance)} • {nextInstruction.street_name}
                                    </Typography>
                                </Box>
                            </Box>
                        )}

                        {/* ナビ停止ボタン */}
                        <Button
                            variant="outlined"
                            color="primary"
                            fullWidth
                            sx={{ 
                                borderRadius: "999px", 
                                textTransform: "none",
                                py: 1
                            }}
                            onClick={handleStopNavigation}
                        >
                            ナビゲーション停止
                        </Button>
                    </Box>
                )}
            </Paper>
        </Box>
    );
}