// 位置情報取得カスタムフック
// GPS位置情報の取得と監視を行う
import { useState, useEffect } from 'react';

/**
 * 位置情報の状態管理インターフェース
 */
export interface GeolocationState {
    position: [number, number] | null; // [longitude, latitude]
    error: string | null;
    loading: boolean;
}

/**
 * 位置情報取得カスタムフック
 * 機能：
 * - GPS位置情報の取得
 * - リアルタイム位置監視
 * - エラーハンドリング
 * - 高精度モード対応
 * 
 * @returns 位置情報の状態
 */
export const useGeolocation = () => {
    const [state, setState] = useState<GeolocationState>({
        position: null,
        error: null,
        loading: true
    });

    useEffect(() => {
        // Geolocation APIサポート確認
        if (!navigator.geolocation) {
            setState({
                position: null,
                error: "位置情報APIがサポートされていません。",
                loading: false
            });
            return;
        }

        // 位置情報の監視を開始
        const watcherId = navigator.geolocation.watchPosition(
            (pos) => {
                const location: [number, number] = [pos.coords.longitude, pos.coords.latitude];
                setState({
                    position: location,
                    error: null,
                    loading: false
                });
            },
            (err) => {
                setState({
                    position: null,
                    error: `現在地の取得に失敗しました：${err.message}`,
                    loading: false
                });
            },
            { 
                enableHighAccuracy: true, // 高精度モード
                timeout: 10000, // 10秒でタイムアウト
                maximumAge: 0 // キャッシュを使用しない
            }
        );

        // クリーンアップ関数：監視を停止
        return () => navigator.geolocation.clearWatch(watcherId);
    }, []);

    return state;
};