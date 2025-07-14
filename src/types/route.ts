// ルート関連の型定義
// GraphHopperAPIとの互換性とアプリケーション固有の型を定義

/**
 * ルート指示の詳細情報
 */
export interface RouteInstruction {
    distance: number;        // 指示区間の距離（メートル）
    heading?: number;        // 進行方向の角度
    sign: number;           // 指示の種類（直進、右折、左折など）
    interval: [number, number]; // 座標配列内での区間インデックス
    text: string;           // 指示テキスト
    time: number;           // 指示区間の所要時間（ミリ秒）
    street_name: string;    // 道路名
    street_ref?: string;    // 道路参照
    last_heading?: number;  // 前回の進行方向
}

/**
 * ルートパス情報
 */
export interface RoutePath {
    distance: number;       // 総距離（メートル）
    weight: number;         // ルートの重み
    time: number;           // 総所要時間（ミリ秒）
    transfers: number;      // 乗り換え回数
    points_encoded: boolean; // 座標のエンコード状態
    bbox: [number, number, number, number]; // 境界ボックス
    points: {
        type: "LineString";
        coordinates: [number, number][]; // ルート座標列
    };
    instructions: RouteInstruction[]; // 指示リスト
    legs: any[];            // 区間情報
    details: any;           // 詳細情報
    ascend: number;         // 上り高度
    descend: number;        // 下り高度
    snapped_waypoints: {
        type: "LineString";
        coordinates: [number, number][]; // スナップされた経由点
    };
}

/**
 * 雨タイル情報
 */
export interface RainTile {
    x: number;              // タイルのX座標
    y: number;              // タイルのY座標
    zoom: number;           // ズームレベル
}

/**
 * ルート計算レスポンス
 */
export interface RouteResponse {
    response?: {
        paths: RoutePath[];
    };
    hints?: {
        "visited_nodes.sum": number;
        "visited_nodes.average": number;
    };
    info?: {
        copyrights: string[];
        took: number;
        road_data_timestamp: string;
    };
    paths?: RoutePath[];
    rain_tile_list?: RainTile[];
}