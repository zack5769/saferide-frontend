import type { RouteResponse } from '../types/route';

/**
 * ルート計算サービス
 * 気象情報: Web Services by Yahoo! JAPAN
 * https://developer.yahoo.co.jp/sitemap/
 */
export class RouteService {
    private static readonly BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
    private static readonly ROUTING_API_URL = 'http://127.0.0.1:5000';

    static async getRoute(
        startLng: number,
        startLat: number,
        endLng: number,
        endLat: number,
        rainAvoidance: boolean = false
    ): Promise<RouteResponse> {
        try {
            // 雨雲回避設定に応じてエンドポイントを選択
            const endpoint = rainAvoidance ? 'route' : 'normal_route';
            const url = `${this.ROUTING_API_URL}/${endpoint}/${startLat},${startLng}/${endLat},${endLng}`;
            console.log(`Fetching ${rainAvoidance ? 'rain-avoiding' : 'normal'} route from:`, url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            });
            
            if (!response.ok) {
                // 400エラーの場合は特別なエラーメッセージを投げる
                if (response.status === 400) {
                    throw new Error(`HTTP error! status: 400 - Route calculation failed`);
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const routeData: RouteResponse = await response.json();
            console.log('Received route data:', routeData);
            return routeData;
            
        } catch (error) {
            console.error('Failed to fetch route from API:', error);
            
            // 400エラーの場合はそのまま再投げする
            if (error instanceof Error && error.message.includes('status: 400')) {
                throw error;
            }
            
            // その他のエラーの場合はフォールバック: サンプルデータを使用
            console.log('Falling back to sample data');
            return this.getSampleRouteData(startLng, startLat, endLng, endLat);
        }
    }

    private static async getSampleRouteData(
        startLng: number,
        startLat: number,
        endLng: number,
        endLat: number
    ): Promise<RouteResponse> {
        try {
            // route_sample.jsonを読み込み
            const response = await fetch('/route_sample.json');
            if (!response.ok) {
                throw new Error('Failed to load route_sample.json');
            }
            const sampleData: RouteResponse = await response.json();
            
            // サンプルデータをそのまま返す（座標調整なし）
            console.log('Using route_sample.json data:', sampleData);
            return sampleData;
        } catch (error) {
            console.error('Failed to load sample route:', error);
            // フォールバック: 最小限のデータを返す
            return this.getMinimalRoute(startLng, startLat, endLng, endLat);
        }
    }

    private static getMinimalRoute(
        startLng: number,
        startLat: number,
        endLng: number,
        endLat: number
    ): RouteResponse {
        const distance = this.calculateDistance(startLng, startLat, endLng, endLat) * 1000;
        // 時間をミリ秒で計算（約30km/hで移動すると仮定）
        const timeInMilliseconds = Math.round((distance / 8.33) * 1000);
        
        return {
            hints: {
                "visited_nodes.sum": 250,
                "visited_nodes.average": 250.0
            },
            info: {
                copyrights: ["GraphHopper", "OpenStreetMap contributors"],
                took: 1,
                road_data_timestamp: new Date().toISOString()
            },
            paths: [{
                distance: distance,
                weight: 1159.300583,
                time: timeInMilliseconds, // ミリ秒に変更
                transfers: 0,
                points_encoded: false,
                bbox: [
                    Math.min(startLng, endLng),
                    Math.min(startLat, endLat),
                    Math.max(startLng, endLng),
                    Math.max(startLat, endLat)
                ],
                points: {
                    type: "LineString",
                    coordinates: [
                        [startLng, startLat],
                        [(startLng + endLng) / 2, (startLat + endLat) / 2],
                        [endLng, endLat]
                    ]
                },
                instructions: [
                    {
                        distance: distance * 0.8,
                        sign: 0,
                        interval: [0, 1],
                        text: "目的地方面へ進む",
                        time: Math.round(timeInMilliseconds * 0.8), // ミリ秒に変更
                        street_name: "メイン通り"
                    },
                    {
                        distance: distance * 0.2,
                        sign: 2,
                        interval: [1, 2],
                        text: "右折して目的地へ",
                        time: Math.round(timeInMilliseconds * 0.2), // ミリ秒に変更
                        street_name: "目的地通り"
                    },
                    {
                        distance: 0,
                        sign: 4,
                        interval: [2, 2],
                        text: "目的地に到着",
                        time: 0,
                        street_name: ""
                    }
                ],
                legs: [],
                details: {},
                ascend: 0.0,
                descend: 0.0,
                snapped_waypoints: {
                    type: "LineString",
                    coordinates: [
                        [startLng, startLat],
                        [endLng, endLat]
                    ]
                }
            }]
        };
    }

    private static calculateDistance(lng1: number, lat1: number, lng2: number, lat2: number): number {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    // ミリ秒を時間・分・秒形式に変換
    static formatTime(milliseconds: number): string {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        if (hours > 0) {
            return `${hours}時間${minutes}分`;
        } else if (minutes > 0) {
            return `${minutes}分`;
        } else {
            return `${seconds}秒`;
        }
    }

    static formatDistance(meters: number): string {
        if (meters >= 1000) {
            return `${(meters / 1000).toFixed(1)}km`;
        } else {
            return `${Math.round(meters)}m`;
        }
    }
}