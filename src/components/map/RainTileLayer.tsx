// 雨雲タイルレイヤーコンポーネント
// 雨雲情報を地図上に可視化する
import React from 'react';
import { Source, Layer } from 'react-map-gl';
import type { RainTile } from '../../types/route';

/**
 * 雨雲タイルレイヤーのプロパティ
 */
interface RainTileLayerProps {
    rainTiles: RainTile[];
}

/**
 * タイル座標を地理座標に変換する関数
 * @param x タイルのX座標
 * @param y タイルのY座標
 * @param z ズームレベル
 * @returns [経度, 緯度]
 */
function tileToLonLat(x: number, y: number, z: number): [number, number] {
    const n = Math.pow(2, z);
    const lonDeg = (x / n) * 360.0 - 180.0;
    const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)));
    const latDeg = (latRad * 180.0) / Math.PI;
    return [lonDeg, latDeg];
}

/**
 * タイルの境界を計算する関数
 * @param x タイルのX座標
 * @param y タイルのY座標
 * @param z ズームレベル
 * @returns ポリゴンの座標配列
 */
function getTileBounds(x: number, y: number, z: number): number[][] {
    const [westLng, northLat] = tileToLonLat(x, y, z);
    const [eastLng, southLat] = tileToLonLat(x + 1, y + 1, z);
    
    return [
        [westLng, northLat],
        [eastLng, northLat],
        [eastLng, southLat],
        [westLng, southLat],
        [westLng, northLat] // ポリゴンを閉じる
    ];
}

/**
 * 雨雲タイルレイヤーコンポーネント
 * 機能：
 * - 雨雲タイルの地図表示
 * - タイル座標から地理座標への変換
 * - 半透明の雨雲オーバーレイ
 * - Yahoo!気象データの可視化
 */
const RainTileLayer: React.FC<RainTileLayerProps> = ({ rainTiles }) => {
    if (!rainTiles || rainTiles.length === 0) {
        return null;
    }

    // 雨タイルをGeoJSONフィーチャーに変換
    const features = rainTiles.map((tile, index) => {
        const bounds = getTileBounds(tile.x, tile.y, tile.zoom);
        
        return {
            type: 'Feature' as const,
            id: index,
            properties: {
                tileX: tile.x,
                tileY: tile.y,
                zoom: tile.zoom,
            },
            geometry: {
                type: 'Polygon' as const,
                coordinates: [bounds],
            },
        };
    });

    const geoJsonData = {
        type: 'FeatureCollection' as const,
        features,
    };

    const layerStyle = {
        id: 'rain-tiles',
        type: 'fill' as const,
        paint: {
            'fill-color': '#2196f3', // 青色
            'fill-opacity': 0.4,
        },
    };

    const borderLayerStyle = {
        id: 'rain-tiles-border',
        type: 'line' as const,
        paint: {
            'line-color': '#1976d2', // より濃い青色
            'line-width': 1,
            'line-opacity': 0.6,
        },
    };

    return (
        <Source id="rain-tiles-source" type="geojson" data={geoJsonData}>
            <Layer {...layerStyle} />
            <Layer {...borderLayerStyle} />
        </Source>
    );
};

export default RainTileLayer;
