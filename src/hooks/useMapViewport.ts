import { useState, useRef } from 'react';

interface ViewportState {
    longitude: number;
    latitude: number;
    zoom: number;
}

interface UseMapViewportProps {
    initialLongitude: number;
    initialLatitude: number;
    initialZoom: number;
}

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