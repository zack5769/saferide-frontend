// 検索結果画面
// 場所検索の結果を表示し、目的地の選択とルート計算を行う
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Marker, Popup } from "react-map-gl";
import {
    Box,
    Paper,
    Button,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    CircularProgress,
    Card,
    CardContent,
    Chip,
    Slide,
    useTheme,
    useMediaQuery,
    Divider,
    IconButton,
    Switch,
    Link,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import DirectionsIcon from "@mui/icons-material/Directions";
import CloudIcon from "@mui/icons-material/Cloud";
import AppLayout from "./layout/AppLayout";
import SearchBar from "./components/SearchBar";
import MapContainer from "./components/map/MapContainer";
import { useMapViewport } from "./hooks/useMapViewport";
import { useThemeMode } from "./theme/ThemeProvider";

/**
 * 検索結果のデータ構造
 */
interface SearchResult {
    name: string;
    address: string;
    lat: number;
    lon: number;
    display_name?: string;
    category?: string;
}

/**
 * 検索結果画面コンポーネント
 * 主要機能：
 * - 場所検索結果の表示
 * - 地図上でのマーカー表示
 * - 目的地選択とルート計算
 * - 雨雲回避設定の管理
 */
export default function SearchResultScreen() {
    const [searchParams] = useSearchParams();
    // エラーメッセージ取得
    const errorMessage = searchParams.get('error');
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { isDarkMode } = useThemeMode();

    // 検索結果の状態管理
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedMarker, setSelectedMarker] = useState<number | null>(null);
    const [showResults, setShowResults] = useState(false);
    const [hasInitiallyAdjusted, setHasInitiallyAdjusted] = useState(false);
    const [hasSearchResults, setHasSearchResults] = useState(false);
    const [rainAvoidance, setRainAvoidance] = useState(true); // 雨雲回避設定

    // 地図のビューポート管理
    const { viewport, setViewport, mapRef, flyTo } = useMapViewport({
        initialLongitude: 138,
        initialLatitude: 36,
        initialZoom: 6
    });

    // エラー表示用の状態管理
    const [showError, setShowError] = useState(!!errorMessage);
    
    /**
     * エラーアラートを閉じる処理
     */
    const handleCloseError = () => {
        setShowError(false);
        // エラーを消してURLをクリーンアップ（検索クエリは保持）
        const params = new URLSearchParams(searchParams);
        params.delete('error');
        navigate({ pathname: '/searchResult', search: params.toString() }, { replace: true });
    };

    /**
     * 地図の中心を指定した位置に移動
     * @param lat 緯度
     * @param lon 経度
     */
    const centerMapOnPin = (lat: number, lon: number) => {
        if (!mapRef.current) return;

        try {
            mapRef.current.flyTo({
                center: [lon, lat],
                zoom: 16,
                duration: 1200,
                essential: true
            });
        } catch (error) {
            console.warn('flyTo failed, using fallback:', error);
            setViewport({
                longitude: lon,
                latitude: lat,
                zoom: 16
            });
        }
    };

    /**
     * 全ての検索結果が表示されるように地図を調整
     * @param results 検索結果配列
     */
    const adjustMapToAllResults = (results: SearchResult[]) => {
        if (results.length === 0) return;
        
        if (results.length === 1) {
            // 単一結果の場合は中心に表示
            setViewport({
                longitude: results[0].lon,
                latitude: results[0].lat,
                zoom: 16
            });
        } else {
            // 複数結果の場合 - mapRefを使ってfitBoundsを実行
            setTimeout(() => {
                if (mapRef.current) {
                    try {
                        // バウンディングボックスを計算
                        const lngs = results.map(r => r.lon);
                        const lats = results.map(r => r.lat);
                        
                        const minLng = Math.min(...lngs);
                        const maxLng = Math.max(...lngs);
                        const minLat = Math.min(...lats);
                        const maxLat = Math.max(...lats);

                        // パディングを追加
                        const lngPadding = (maxLng - minLng) * 0.1;
                        const latPadding = (maxLat - minLat) * 0.1;

                        const bounds: [[number, number], [number, number]] = [
                            [minLng - lngPadding, minLat - latPadding],
                            [maxLng + lngPadding, maxLat + latPadding]
                        ];

                        mapRef.current.fitBounds(bounds, {
                            padding: {
                                top: 100,
                                bottom: 100,
                                left: 50,
                                right: 50
                            },
                            duration: 1000
                        });
                    } catch (error) {
                        console.warn('fitBounds failed, using fallback method:', error);
                        // フォールバック: 中心点とズームレベルを計算
                        const lngs = results.map(r => r.lon);
                        const lats = results.map(r => r.lat);
                        
                        const centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
                        const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;
                        
                        // ズームレベルを範囲に基づいて計算
                        const lngDiff = Math.max(...lngs) - Math.min(...lngs);
                        const latDiff = Math.max(...lats) - Math.min(...lats);
                        const maxDiff = Math.max(lngDiff, latDiff);
                        
                        let zoom = 12;
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
            }, 100);
        }
        
        // 検索結果が表示されたら少し遅らせてドロワーを表示
        setTimeout(() => {
            setShowResults(true);
        }, 1500); // 1.5秒後にドロワーを表示
    };

    // 検索実行
    const performSearch = async (searchQuery: string) => {
        if (!searchQuery.trim()) return;
        
        setLoading(true);
        setHasInitiallyAdjusted(false); // 新しい検索なのでリセット
        setHasSearchResults(false);
        
        try {
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&addressdetails=1&limit=20&countrycodes=jp`;
            const response = await fetch(url, {
                headers: {
                    "Accept-Language": "ja,en",
                    "User-Agent": "SafeRideApp/1.0"
                }
            });
            const data = await response.json();
            
            const formattedResults: SearchResult[] = data.map((item: any) => ({
                name: item.display_name?.split(',')[0] || item.name || '名称不明',
                address: item.display_name || '',
                lat: parseFloat(item.lat),
                lon: parseFloat(item.lon),
                display_name: item.display_name,
                category: item.class || 'place'
            }));
            
            setResults(formattedResults);
            setHasSearchResults(true);
            
            // 初回のみ全体表示
            if (!hasInitiallyAdjusted) {
                adjustMapToAllResults(formattedResults);
                setHasInitiallyAdjusted(true);
            }
            
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    // 初回検索実行
    useEffect(() => {
        const initialQuery = searchParams.get('q');
        if (initialQuery && !errorMessage) {
            performSearch(initialQuery);
        }
    }, [searchParams.get('q')]); // searchParams全体ではなく、クエリ部分のみを監視

    // エラーがあれば自動で表示（検索結果がなくてもエラーを表示）
    useEffect(() => {
        if (errorMessage) {
            setShowError(true);
            // エラーがある場合も、既存の検索結果がある場合は保持
            if (results.length > 0) {
                setHasSearchResults(true);
            } else {
                setHasSearchResults(true); // エラーがある場合は検索結果セクションを表示
            }
            setShowResults(true); // エラーメッセージを表示するためドロワーを表示
        }
    }, [errorMessage, results.length]);

    // 個別のマーカークリック時（アニメーション付きでズーム）
    const handleMarkerClick = (lat: number, lon: number, index: number) => {
        setSelectedMarker(index);
        
        // ピン選択時は必ずドロワーを下げる
        setShowResults(false);
        
        // 少し遅らせてから地図の調整を実行（ドロワーアニメーションを待つ）
        setTimeout(() => {
            centerMapOnPin(lat, lon);
        }, 300); // ドロワーのアニメーション時間に合わせる
    };

    // 地図上のピンを直接クリックした時の処理
    const handleMapMarkerClick = (e: any, index: number) => {
        e.originalEvent.stopPropagation();
        const result = results[index];
        
        // 既に選択されているマーカーをクリックした場合は吹き出しを閉じる
        if (selectedMarker === index) {
            setSelectedMarker(null);
            return;
        }
        
        // 新しいマーカーを選択
        setSelectedMarker(index);
        
        // ピン選択時は必ずドロワーを下げる
        setShowResults(false);
        
        // 少し遅らせてから地図の調整を実行（ドロワーアニメーションを待つ）
        setTimeout(() => {
            centerMapOnPin(result.lat, result.lon);
        }, 300);
    };

    // 全体表示ボタンの処理（全体を再表示）
    const handleShowAllResults = () => {
        if (results.length > 0) {
            setSelectedMarker(null);
            setShowResults(true);
            
            // 少し遅らせてから地図の調整を実行（ドロワーアニメーションを待つ）
            setTimeout(() => {
                adjustMapToAllResults(results);
            }, 300);
        }
    };

    // ドロワーのハンドルクリック時の処理
    const handleDrawerToggle = () => {
        const newShowResults = !showResults;
        setShowResults(newShowResults);
        
        // ドロワーを表示する場合は選択をクリア
        if (newShowResults) {
            setSelectedMarker(null);
            // 全体表示に戻す
            setTimeout(() => {
                adjustMapToAllResults(results);
            }, 300);
        }
    };

    // ルート画面に遷移
    const handleGetDirections = (result: SearchResult) => {
        // 現在地を取得してからルート画面に遷移
        navigator.geolocation.getCurrentPosition((pos) => {
            const params = new URLSearchParams({
                startLng: pos.coords.longitude.toString(),
                startLat: pos.coords.latitude.toString(),
                endLng: result.lon.toString(),
                endLat: result.lat.toString(),
                name: result.name,
                rainAvoidance: rainAvoidance.toString() // 雨雲回避設定を追加
            });
            console.log('Navigating to route with current position:', {
                start: [pos.coords.longitude, pos.coords.latitude],
                end: [result.lon, result.lat],
                name: result.name,
                rainAvoidance: rainAvoidance
            });
            navigate(`/route?${params.toString()}`);
        }, (error) => {
            console.error('位置情報取得エラー:', error);
            // 位置情報が取得できない場合はエラーメッセージを表示
            alert('現在地を取得できませんでした。位置情報の使用を許可してください。');
        }, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000 // 1分以内の位置情報を使用
        });
    };

    return (
        <AppLayout hideNavigation>
            {/* 検索バー */}
            <SearchBar 
            initialQuery={searchParams.get('q') || ''}
            showBackButton
            placeholder="場所を検索..."
            autoFocus
            onBack={() => {
                // エラー状態の場合は単純に前の画面に戻る（新しい検索やフェッチを実行しない）
                if (showError && errorMessage) {
                    navigate('/', { replace: true });
                } else {
                    navigate('/');
                }
            }}
            />

            {/* 全体表示ボタン（個別マーカーが選択されている時のみ表示） */}
            {!showResults && results.length > 1 && (
            <Button
                variant="contained"
                size="small"
                onClick={handleShowAllResults}
                sx={{
                position: 'absolute',
                top: 80,
                right: 16,
                zIndex: 1100,
                minWidth: 'auto',
                px: 2,
                borderRadius: 3,
                }}
            >
                全体表示
            </Button>
            )}

            {/* 地図 - 画面全体 */}
            <MapContainer
            ref={mapRef}
            viewport={viewport}
            onMove={evt => setViewport(evt.viewState)}
            style={{ 
                width: '100vw', 
                height: '100vh',
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 1
            }}
            >
            {/* 検索結果マーカー */}
            {results.map((result, idx) => (
                <Marker
                key={idx}
                longitude={result.lon}
                latitude={result.lat}
                onClick={(e) => handleMapMarkerClick(e, idx)}
                >
                <Box
                    sx={{
                    width: 40,
                    height: 40,
                    bgcolor: selectedMarker === idx ? 'secondary.main' : 'primary.main',
                    borderRadius: '50% 50% 50% 0',
                    transform: 'rotate(-45deg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                        transform: 'rotate(-45deg) scale(1.15)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    },
                    // 選択されたマーカーを強調
                    ...(selectedMarker === idx && {
                        boxShadow: '0 0 0 3px rgba(245, 0, 87, 0.3), 0 4px 20px rgba(245, 0, 87, 0.2)',
                        transform: 'rotate(-45deg) scale(1.1)',
                    }),
                    }}
                >
                    <LocationOnIcon 
                    sx={{ 
                        color: 'white', 
                        transform: 'rotate(45deg)',
                        fontSize: 20,
                        transition: 'all 0.2s',
                    }} 
                    />
                </Box>
                </Marker>
            ))}

            {/* 選択されたマーカーのポップアップ */}
            {selectedMarker !== null && results[selectedMarker] && (
                <Popup
                longitude={results[selectedMarker].lon}
                latitude={results[selectedMarker].lat}
                anchor="bottom"
                onClose={() => setSelectedMarker(null)}
                closeButton={false}
                className="custom-popup"
                offset={[0, -15]}
                maxWidth="200px"
                closeOnClick={false}
                focusAfterOpen={false}
                >
                <Card 
                    sx={{ 
                    minWidth: 160,
                    maxWidth: 200,
                    boxShadow: 6,
                    animation: 'popupFadeIn 0.3s ease-out',
                    position: 'relative',
                    zIndex: 1300,
                    bgcolor: 'background.paper',
                    }}
                >
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography 
                            variant="subtitle2" 
                            fontWeight="bold"
                            sx={{ 
                            mb: 0.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                            }}
                        >
                            {results[selectedMarker].name}
                        </Typography>
                        <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ 
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.2,
                            }}
                        >
                            {results[selectedMarker].address}
                        </Typography>
                        </Box>
                        <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleGetDirections(results[selectedMarker])}
                        sx={{ 
                            minWidth: 32,
                            height: 32,
                            borderRadius: 1.5,
                            bgcolor: 'primary.main',
                            color: 'white',
                            '&:hover': {
                            bgcolor: 'primary.dark',
                            transform: 'scale(1.1)',
                            },
                            transition: 'all 0.2s',
                        }}
                        >
                        <DirectionsIcon fontSize="small" />
                        </IconButton>
                    </Box>
                    </CardContent>
                </Card>
                </Popup>
            )}
            </MapContainer>

            {/* 検索結果リスト - ドロワー形式でオーバーレイ */}
            {(hasSearchResults || (showError && errorMessage)) && (
            <Slide direction="up" in={showResults} timeout={300}>
                <Paper
                className="search-results-drawer"
                sx={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "40vh",
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0,
                    zIndex: 2000,
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: isDarkMode 
                    ? 'rgba(30, 30, 30, 0.98)' 
                    : 'rgba(255, 255, 255, 0.98)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)',
                }}
                elevation={0}
                >
                {/* ハンドル */}
                <Box
                    sx={{
                    width: 40,
                    height: 4,
                    bgcolor: 'grey.300',
                    borderRadius: 2,
                    mx: 'auto',
                    mt: 1,
                    mb: 2,
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    '&:hover': {
                        bgcolor: 'grey.400',
                    }
                    }}
                    onClick={handleDrawerToggle}
                />
                
                {/* エラー表示 - 検索結果画面内に表示 */}
                {showError && errorMessage && (
                    <Box sx={{
                    mx: 2,
                    mb: 2,
                    bgcolor: 'error.main',
                    color: 'white',
                    py: 1.5,
                    px: 2,
                    borderRadius: 2,
                    fontWeight: 'bold',
                    whiteSpace: 'pre-line',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'slideDown 0.3s ease-out',
                    boxShadow: 2,
                    flexShrink: 0,
                    }}>
                    <span style={{ flex: 1 }}>{decodeURIComponent(errorMessage)}</span>
                    <Button onClick={handleCloseError} sx={{ ml: 2, color: 'white', borderColor: 'white' }} variant="outlined" size="small">閉じる</Button>
                    </Box>
                )}
                
                {/* 雨雲回避設定 */}
                <Box sx={{ px: 2, pb: 0.2, flexShrink: 0 }}> {/* pb: 1 → 0.2 に変更 */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.2 }}> {/* mb: 1 → 0.2 に変更 */}
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
                    <Box sx={{ mb: 0.2 }}> {/* mb: 1 → 0.2 に変更 */}
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
                </Box>

                <Divider sx={{ flexShrink: 0 }} />
                
                {/* 結果ヘッダー */}
                <Box sx={{ px: 2, py: 0.2, flexShrink: 0 }}> {/* py: 1 → 0.2 に変更 */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" gutterBottom={false}> {/* gutterBottom を false に変更 */}
                        検索結果 ({results.length}件)
                    </Typography>
                    {results.length > 1 && (
                        <Button
                        variant="outlined"
                        size="small"
                        onClick={handleShowAllResults}
                        sx={{ 
                            minWidth: 'auto', 
                            px: 1,
                            transition: 'all 0.2s',
                            '&:hover': {
                            transform: 'translateY(-1px)',
                            }
                        }}
                        >
                        全体表示
                        </Button>
                    )}
                    </Box>
                </Box>

                <Divider sx={{ flexShrink: 0 }} />
                
                {/* 結果リスト */}
                <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                    {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                    ) : results.length === 0 && !errorMessage ? (
                    <Box sx={{ textAlign: 'center', p: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                        検索結果がありません
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        別のキーワードで検索してみてください
                        </Typography>
                    </Box>
                    ) : results.length === 0 && errorMessage ? (
                    <Box sx={{ textAlign: 'center', p: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                        ルートの取得に失敗しました
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        他の目的地を試すか、設定を変更してください
                        </Typography>
                    </Box>
                    ) : (
                    <List sx={{ p: 0 }}>
                        {results.map((result, idx) => (
                        <ListItem
                            key={idx}
                            sx={{
                            px: 2,
                            py: 1.5,
                            cursor: "pointer",
                            transition: 'all 0.2s',
                            '&:hover': {
                                bgcolor: 'action.hover',
                                transform: 'translateX(4px)',
                            },
                            borderBottom: idx < results.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
                            // 選択されたアイテムをハイライト
                            ...(selectedMarker === idx && {
                                bgcolor: 'action.selected',
                                borderLeft: `3px solid ${theme.palette.primary.main}`,
                            }),
                            }}
                            onClick={() => handleMarkerClick(result.lat, result.lon, idx)}
                            secondaryAction={
                            <Button
                                variant="contained"
                                size="small"
                                onClick={(e) => {
                                e.stopPropagation();
                                handleGetDirections(result);
                                }}
                                sx={{ 
                                minWidth: isMobile ? 40 : 'auto',
                                px: isMobile ? 1 : 2,
                                transition: 'all 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-1px)',
                                }
                                }}
                            >
                                {isMobile ? (
                                <DirectionsIcon fontSize="small" />
                                ) : (
                                <>
                                    <DirectionsIcon sx={{ mr: 0.5 }} fontSize="small" />
                                    ルート
                                </>
                                )}
                            </Button>
                            }
                        >
                            <ListItemAvatar>
                            <Avatar sx={{ 
                                bgcolor: selectedMarker === idx ? 'secondary.main' : 'primary.main',
                                transition: 'all 0.2s',
                            }}>
                                <LocationOnIcon />
                            </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                            primary={
                                <Typography variant="subtitle1" fontWeight={600} noWrap>
                                {result.name}
                                </Typography>
                            }
                            secondary={
                                <Typography variant="body2" color="text.secondary" noWrap>
                                {result.address}
                                </Typography>
                            }
                            />
                        </ListItem>
                        ))}
                    </List>
                    )}
                </Box>
                </Paper>
            </Slide>
            )}

            {/* ドロワーが下がっている時の最小化されたドロワー */}
            {!showResults && (hasSearchResults || (showError && errorMessage)) && (
            <Paper
                sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: showError && errorMessage ? 'auto' : 60,
                minHeight: 60,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                zIndex: 2000,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: showError && errorMessage ? 'flex-start' : 'center',
                bgcolor: isDarkMode 
                    ? 'rgba(30, 30, 30, 0.95)' 
                    : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                    bgcolor: isDarkMode 
                    ? 'rgba(50, 50, 50, 0.95)' 
                    : 'rgba(255, 255, 255, 1)',
                    transform: 'translateY(-2px)',
                }
                }}
                elevation={0}
                onClick={handleDrawerToggle}
            >
                {/* エラー表示 - 最小化されたドロワーでも表示 */}
                {showError && errorMessage && (
                <Box sx={{
                    width: '100%',
                    bgcolor: 'error.main',
                    color: 'white',
                    py: 1.5,
                    px: 2,
                    fontWeight: 'bold',
                    whiteSpace: 'pre-line',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    mb: 1,
                    flexShrink: 0,
                }}>
                    <span style={{ flex: 1 }}>{decodeURIComponent(errorMessage)}</span>
                    <Button 
                    onClick={(e) => {
                        e.stopPropagation();
                        handleCloseError();
                    }} 
                    sx={{ ml: 2, color: 'white', borderColor: 'white' }} 
                    variant="outlined" 
                    size="small"
                    >
                    閉じる
                    </Button>
                </Box>
                )}
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                    sx={{
                    width: 40,
                    height: 4,
                    bgcolor: 'grey.300',
                    borderRadius: 2,
                    }}
                />
                <Typography variant="body2" color="text.secondary">
                    {results.length > 0 ? `${results.length}件の検索結果` : 'エラーが発生しました'}
                </Typography>
                {rainAvoidance && (
                    <Chip 
                    label="雨雲回避ON" 
                    size="small" 
                    color="primary" 
                    sx={{ ml: 1 }}
                    />
                )}
                </Box>
            </Paper>
            )}
        </AppLayout>
    );
}
