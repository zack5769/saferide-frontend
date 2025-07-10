import { forwardRef, ReactNode } from 'react';
import Map from 'react-map-gl';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import { useThemeMode } from '../../theme/ThemeProvider';

interface MapContainerProps {
    viewport: {
        longitude: number;
        latitude: number;
        zoom: number;
    };
    onMove: (evt: any) => void;
    children?: ReactNode;
    style?: React.CSSProperties;
    mapStyle?: string;
}

const MapContainer = forwardRef<any, MapContainerProps>(({
    viewport,
    onMove,
    children,
    style,
    mapStyle,
}, ref) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { isDarkMode } = useThemeMode();

    // ダークモード対応の地図スタイル - Navigation Nightテーマを使用
    const getMapStyle = () => {
        if (mapStyle) return mapStyle;
        return isDarkMode 
            ? "mapbox://styles/mapbox/navigation-night-v1" // Navigation Nightテーマ
            : "mapbox://styles/mapbox/streets-v12";
    };

    return (
        <Box
            sx={{
                width: '100%',
                height: '100%',
                position: 'relative',
                borderRadius: isMobile ? 0 : 2,
                overflow: 'hidden',
                ...style,
            }}
        >
            <Map
                ref={ref}
                {...viewport}
                onMove={onMove}
                style={{ width: "100%", height: "100%" }}
                mapStyle={getMapStyle()}
                mapboxAccessToken={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}
                attributionControl={false}
                logoPosition="bottom-right"
            >
                {children}
            </Map>
        </Box>
    );
});

MapContainer.displayName = 'MapContainer';

export default MapContainer;