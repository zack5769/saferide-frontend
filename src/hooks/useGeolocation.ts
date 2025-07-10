import { useState, useEffect } from 'react';

export interface GeolocationState {
    position: [number, number] | null;
    error: string | null;
    loading: boolean;
}

export const useGeolocation = () => {
    const [state, setState] = useState<GeolocationState>({
        position: null,
        error: null,
        loading: true
    });

    useEffect(() => {
        if (!navigator.geolocation) {
            setState({
                position: null,
                error: "位置情報APIがサポートされていません。",
                loading: false
            });
            return;
        }

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
                enableHighAccuracy: true, 
                timeout: 10000, 
                maximumAge: 0 
            }
        );

        return () => navigator.geolocation.clearWatch(watcherId);
    }, []);

    return state;
};