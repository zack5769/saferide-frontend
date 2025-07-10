import React from "react";
import {
    Box,
    Paper,
    Typography,
    TextField,
    IconButton,
    Switch,
    Button,
    Container,
} from "@mui/material";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CloseIcon from "@mui/icons-material/Close";
import MotorcycleIcon from "@mui/icons-material/SportsMotorsports";
import NavigationIcon from "@mui/icons-material/Navigation";

export default function MapUI() {
    return (
        <Box sx={{ position: "relative", height: "100vh", bgcolor: "grey.100" }}>
            {/* 上部セクション（地図背景部分） */}
            <Box
                sx={{
                    height: "60%",
                    backgroundImage:
                        "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBCcSk19rvUaNrEC0u43l2oQHLmYkeS4_WytDFg0doD8PyxvYvxEa88EUD1q4Qyfwo_AEIwJuwr4JQJJGQi0Y0HUfisrM9eG3Oahjz3y3a45roGM8PShyiBbM-wRuXxi6kYdG-109r-14liK8R80LApbH5WVmE31rGYe64q6kXJuGPgi3ogprtRfXGbgZ4IMsEPXnzDBUOBVFaqw5Pmb8aAk0vsQFNpbUZWPjeGjlTFZOioWev51jRX_vojqJmLaokq2MX7EW0lbY0')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    position: "relative",
                }}
            >
                {/* 現在地パネル */}
                <Paper
                    elevation={3}
                    sx={{ position: "absolute", top: 16, left: 16, right: 16, p: 2 }}
                >
                    <Box display="flex" alignItems="center" mb={1}>
                        <FiberManualRecordIcon color="primary" sx={{ mr: 1 }} />
                        <Typography color="text.secondary">現在地</Typography>
                    </Box>
                    <Box display="flex" alignItems="center">
                        <LocationOnIcon color="error" sx={{ mr: 1 }} />
                        <TextField
                            fullWidth
                            size="small"
                            variant="standard"
                            value="大久保駅、東京都新宿区百人町1丁..."
                            InputProps={{ disableUnderline: true, readOnly: true }}
                        />
                        <IconButton size="small">
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </Paper>

                {/* 所要時間（上） */}
                <Paper
                    elevation={2}
                    sx={{ position: "absolute", top: "33%", left: 16, px: 2, py: 1, borderRadius: 8 }}
                >
                    <Typography fontWeight="bold">7 時間 21 分</Typography>
                </Paper>

                {/* 所要時間（バイク） */}
                <Paper
                    elevation={2}
                    sx={{
                        position: "absolute",
                        top: "50%",
                        right: 32,
                        transform: "translateY(-50%)",
                        bgcolor: "primary.dark",
                        color: "white",
                        px: 2,
                        py: 1,
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                    }}
                >
                    <Typography fontWeight="bold" mr={1}>
                        6 時間 2 分
                    </Typography>
                    <MotorcycleIcon fontSize="small" />
                </Paper>
            </Box>

            {/* 下部パネル */}
            <Paper
                elevation={4}
                sx={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    p: 3,
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    height: "40%",
                }}
            >
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" color="text.primary">
                        雨雲回避
                    </Typography>
                    <Switch defaultChecked color="secondary" />
                </Box>

                <Box mb={4}>
                    <Typography variant="h3" fontWeight="bold">
                        6 時間 2 分
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        21:46着・雨雲回避ルート
                    </Typography>
                </Box>

                <Button
                    variant="contained"
                    color="secondary"
                    fullWidth
                    startIcon={<NavigationIcon />}
                    size="large"
                    sx={{ borderRadius: "999px", textTransform: "none" }}
                >
                    ナビ開始
                </Button>
            </Paper>
        </Box>
    );
}
