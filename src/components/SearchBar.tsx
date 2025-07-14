// 検索バーコンポーネント
// 場所検索のためのユーザーインターフェース
import { useState, forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    Paper,
    TextField,
    InputAdornment,
    IconButton,
    useMediaQuery,
    Fade,
    useTheme,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useThemeMode } from "../theme/ThemeProvider";

/**
 * 検索バーコンポーネントのプロパティ
 */
interface SearchBarProps {
    initialQuery?: string;      // 初期検索クエリ
    onClose?: () => void;       // 閉じるボタンのコールバック
    onBack?: () => void;        // 戻るボタンのコールバック
    showBackButton?: boolean;   // 戻るボタンの表示
    showCloseButton?: boolean;  // 閉じるボタンの表示
    placeholder?: string;       // プレースホルダーテキスト
    autoFocus?: boolean;        // オートフォーカス
}

/**
 * 検索バーコンポーネント
 * 機能：
 * - 場所検索のテキスト入力
 * - 検索結果画面への遷移
 * - レスポンシブデザイン
 * - ダークモード対応
 */
const SearchBar = forwardRef<HTMLFormElement, SearchBarProps>(({
    initialQuery = "",
    onClose,
    onBack,
    showBackButton = false,
    showCloseButton = false,
    placeholder = "ここで検索",
    autoFocus = false,
}, ref) => {
    const [query, setQuery] = useState(initialQuery);
    const navigate = useNavigate();
    const theme = useTheme();
    const { isDarkMode } = useThemeMode();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    /**
     * 検索実行処理
     */
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            navigate(`/searchResult?q=${encodeURIComponent(query.trim())}`);
        }
    };

    /**
     * 戻るボタンの処理
     */
    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigate(-1);
        }
    };

    return (
        <Fade in timeout={300}>
            <Paper
                ref={ref}
                elevation={isDarkMode ? 8 : 4}
                sx={{
                    position: "absolute",
                    top: isMobile ? 12 : 24,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: isMobile ? "calc(100vw - 24px)" : 480,
                    zIndex: 1200,
                    borderRadius: 6,
                    overflow: 'hidden',
                    bgcolor: isDarkMode 
                        ? "rgba(30, 30, 30, 0.95)" 
                        : "rgba(255, 255, 255, 0.95)",
                    backdropFilter: "blur(10px)",
                    border: `1px solid ${theme.palette.divider}`,
                }}
                component="form"
                onSubmit={handleSearch}
            >
                <TextField
                    variant="standard"
                    placeholder={placeholder}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    autoFocus={autoFocus}
                    InputProps={{
                        disableUnderline: true,
                        startAdornment: (
                            <InputAdornment position="start">
                                {showBackButton ? (
                                    <IconButton onClick={handleBack} size="small" edge="start">
                                        <ArrowBackIcon />
                                    </IconButton>
                                ) : (
                                    <SearchIcon color="action" />
                                )}
                            </InputAdornment>
                        ),
                        endAdornment: (
                            <InputAdornment position="end">
                                {showCloseButton && (
                                    <IconButton onClick={onClose} size="small" edge="end">
                                        <CloseIcon />
                                    </IconButton>
                                )}
                                {!showCloseButton && query && (
                                    <IconButton onClick={() => setQuery('')} size="small" edge="end">
                                        <CloseIcon />
                                    </IconButton>
                                )}
                            </InputAdornment>
                        ),
                        sx: {
                            px: 2,
                            py: 1.5,
                            fontSize: isMobile ? '16px' : '18px',
                            fontWeight: 500,
                            color: theme.palette.text.primary,
                        }
                    }}
                    sx={{
                        width: '100%',
                        '& .MuiInputBase-root': {
                            borderRadius: 0,
                        },
                        '& .MuiInputBase-input::placeholder': {
                            color: theme.palette.text.secondary,
                            opacity: 1,
                        }
                    }}
                />
            </Paper>
        </Fade>
    );
});

SearchBar.displayName = 'SearchBar';

export default SearchBar;