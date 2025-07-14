// 地図ビューポート管理カスタムフック
// 地図の表示位置、ズームレベル、アニメーションを管理
import { useState, useRef } from 'react';

/**
 * 地図ビューポートの状態管理
 */
interface ViewportState {
    longitude: number;
    latitude: number;
    zoom: number;
}

/**
 * カスタムフックの初期化プロパティ
 */
interface UseMapViewportProps {
    initialLongitude: number;
    initialLatitude: number;
    initialZoom: number;
}

/**
 * 地図ビューポート管理カスタムフック
 * 機能：
 * - 地図の表示位置とズームレベル管理
 * - スムーズなアニメーション付き移動
 * - 境界範囲への自動フィット
 * - 地図参照の管理
 * 
 * @param props 初期化プロパティ
 * @returns 地図制御関数群
 */
export const useMapViewport = ({ 
    initialLongitude, 
    initialLatitude, 
    initialZoom 
}: UseMapViewportProps) => {
    const mapRef = useRef<any>(null);
    const [viewport, setViewport] = useState<ViewportState>({
        longitude: initialLongitude,
        latitude: initialLatitude,
        zoom: initialZoom
    });

    /**
     * 指定位置にアニメーション付きで移動
     * @param longitude 経度
     * @param latitude 緯度
     * @param zoom ズームレベル（オプション）
     */
    const flyTo = (longitude: number, latitude: number, zoom?: number) => {
        const newViewport = {
            longitude,
            latitude,
            zoom: zoom || viewport.zoom
        };
        
        setViewport(newViewport);
        
        if (mapRef.current) {
            mapRef.current.flyTo({
                center: [longitude, latitude],
                zoom: zoom || viewport.zoom,
                duration: 1000
            });
        }
    };

    /**
     * 指定した境界範囲に地図をフィット
     * @param bounds 境界範囲 [[minLng, minLat], [maxLng, maxLat]]
     * @param options 追加オプション
     */
    const fitBounds = (bounds: [[number, number], [number, number]], options?: any) => {
        if (mapRef.current) {
            mapRef.current.fitBounds(bounds, { padding: 50, ...options });
        }
    };

    return {
        viewport,
        setViewport,
        flyTo,
        fitBounds,
        mapRef
    };
};