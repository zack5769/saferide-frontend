export interface RouteInstruction {
    distance: number;
    heading?: number;
    sign: number;
    interval: [number, number];
    text: string;
    time: number;
    street_name: string;
    street_ref?: string;
    last_heading?: number;
}

export interface RoutePath {
    distance: number;
    weight: number;
    time: number;
    transfers: number;
    points_encoded: boolean;
    bbox: [number, number, number, number];
    points: {
        type: "LineString";
        coordinates: [number, number][];
    };
    instructions: RouteInstruction[];
    legs: any[];
    details: any;
    ascend: number;
    descend: number;
    snapped_waypoints: {
        type: "LineString";
        coordinates: [number, number][];
    };
}

export interface RouteResponse {
    hints: {
        "visited_nodes.sum": number;
        "visited_nodes.average": number;
    };
    info: {
        copyrights: string[];
        took: number;
        road_data_timestamp: string;
    };
    paths: RoutePath[];
}