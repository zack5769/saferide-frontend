import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Switch,
    Divider,
    Paper,
    Link,
    Chip,
    useTheme,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import AppLayout from "./layout/AppLayout";
import BottomNavigation from "./components/navigation/BottomNavigation";
import { useThemeMode } from "./theme/ThemeProvider";

export default function SettingsScreen() {
    const theme = useTheme();
    const { isDarkMode, toggleDarkMode } = useThemeMode();

    return (
        <AppLayout>
            <Box sx={{ p: 2 }}>
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 3, mt: 2 }}>
                    設定
                </Typography>

                <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
                    <List disablePadding>
                        <ListItem>
                            <ListItemIcon>
                                <NotificationsIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText
                                primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography>通知</Typography>
                                        <Chip 
                                            label="未実装" 
                                            size="small" 
                                            color="warning" 
                                            variant="outlined"
                                            sx={{ fontSize: '0.7rem', height: 20 }}
                                        />
                                    </Box>
                                }
                                secondary="ルート案内時の音声通知（開発予定）"
                            />
                            <Switch 
                                disabled 
                                color="primary"
                                sx={{
                                    '& .MuiSwitch-switchBase.Mui-disabled': {
                                        color: theme.palette.action.disabled,
                                    },
                                    '& .MuiSwitch-switchBase.Mui-disabled + .MuiSwitch-track': {
                                        backgroundColor: theme.palette.action.disabledBackground,
                                    },
                                }}
                            />
                        </ListItem>
                        <Divider />
                        <ListItem>
                            <ListItemIcon>
                                {isDarkMode ? (
                                    <DarkModeIcon color="primary" />
                                ) : (
                                    <LightModeIcon color="primary" />
                                )}
                            </ListItemIcon>
                            <ListItemText
                                primary="ダークモード"
                                secondary={isDarkMode ? "ダークモードが有効です" : "ライトモードが有効です"}
                            />
                            <Switch 
                                checked={isDarkMode}
                                onChange={toggleDarkMode}
                                color="primary" 
                            />
                        </ListItem>
                    </List>
                </Paper>

                <Paper elevation={2} sx={{ borderRadius: 3, mt: 2, p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        アプリについて
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        SafeRide v1.0.0
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        雨雲回避機能付きナビゲーションアプリ
                    </Typography>
                    
                    {/* Yahoo!気象情報APIのクレジット表記 */}
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                            気象情報について
                        </Typography>
                        <Link 
                            href="https://developer.yahoo.co.jp/sitemap/"
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ 
                                fontSize: 'caption.fontSize',
                                textDecoration: 'none',
                                color: 'text.secondary',
                                '&:hover': {
                                    textDecoration: 'underline'
                                }
                            }}
                        >
                            Web Services by Yahoo! JAPAN
                        </Link>
                    </Box>
                </Paper>

                {/* システム情報 */}
                <Paper elevation={2} sx={{ borderRadius: 3, mt: 2, p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        システム情報
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                テーマ:
                            </Typography>
                            <Chip 
                                label={isDarkMode ? "ダーク" : "ライト"} 
                                size="small" 
                                color={isDarkMode ? "secondary" : "primary"}
                                variant="outlined"
                            />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                            設定はローカルストレージに保存されます
                        </Typography>
                    </Box>
                </Paper>
            </Box>

            <BottomNavigation />
        </AppLayout>
    );
}