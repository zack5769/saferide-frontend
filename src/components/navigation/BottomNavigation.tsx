import { useNavigate, useLocation } from "react-router-dom";
import {
    BottomNavigation as MuiBottomNavigation,
    BottomNavigationAction,
    Paper,
    useTheme,
} from "@mui/material";
import MapIcon from "@mui/icons-material/Map";
import SettingsIcon from "@mui/icons-material/Settings";

export default function BottomNavigation() {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();

    const getCurrentTab = () => {
        switch (location.pathname) {
            case '/':
                return 0;
            case '/settings':
                return 1;
            default:
                return 0;
        }
    };

    const handleTabChange = (_: any, newValue: number) => {
        switch (newValue) {
            case 0:
                navigate('/');
                break;
            case 1:
                navigate('/settings');
                break;
        }
    };

    return (
        <Paper
            elevation={8}
            sx={{
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 2000,
                borderTop: `1px solid ${theme.palette.divider}`,
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
            }}
        >
            <MuiBottomNavigation
                value={getCurrentTab()}
                onChange={handleTabChange}
                showLabels
                sx={{
                    borderTopLeftRadius: 16,
                    borderTopRightRadius: 16,
                    '& .MuiBottomNavigationAction-root': {
                        color: theme.palette.text.secondary,
                        '&.Mui-selected': {
                            color: theme.palette.primary.main,
                        },
                    },
                }}
            >
                <BottomNavigationAction
                    label="ホーム"
                    icon={<MapIcon />}
                />
                <BottomNavigationAction
                    label="設定"
                    icon={<SettingsIcon />}
                />
            </MuiBottomNavigation>
        </Paper>
    );
}