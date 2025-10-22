import React, { useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { ErrorMessage } from "../types/ErrorMessage";

// MUIコンポーネントをインポート
import {
  Container,
  Paper,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  type SelectChangeEvent,
} from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';


const ErrorMessageXmlConvert: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const initialMessages: ErrorMessage[] = (location.state as { messages: ErrorMessage[] })?.messages || [];

    const [messages] = useState<ErrorMessage[]>(initialMessages);
    const [selectedLang, setSelectedLang] = useState<keyof ErrorMessage>("country1");
    const previewTextareaRef = useRef<HTMLTextAreaElement>(null);

    // XMLプレビューを生成する
    const generatePreviewText = () => {
        const xmlItems = messages.map((msg) => {
            let type: string;
            if (msg.errorType === "1") {
                type = "error";
            } else if (msg.errorType === "2") {
                type = "warning";
            } else if (msg.errorType === "3" || msg.errorType === "4") {
                type = "info";
            } else {
                type = "info"; //デフォルト
            }

            const messageText = msg[selectedLang] || "";
            return `  <error code="${msg.errorNo}">
    <type>${type}</type>
    <message>${messageText}</message>
  </error>`;
        });

        return `<?xml version="1.0" encoding="UTF-8"?>\n<error-messages>\n${xmlItems.join(
            "\n"
        )}\n</error-messages>`;
    };

    // バックエンドでXML生成してダウンロード
    const handleDownload = async () => {
        const filename = prompt("ファイル名を入力してください", "output.xml") || "output.xml";
        try {
            const response = await fetch(
                "http://localhost:8080/api/error-messages/xml/download",
                {
                    method: "POST", // POSTメソッド
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        messages: messages,
                        lang: selectedLang
                    })
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`XML生成失敗 (HTTP ${response.status}): ${errorText}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename.endsWith(".xml") ? filename : filename + ".xml";
            a.click();
            window.URL.revokeObjectURL(url);

        } catch (err: any) {
            console.error(err);
            alert(`XMLダウンロードに失敗しました: ${err.message}`);
        }
    };

    // プレビューをコピー
    const handleCopyPreview = () => {
        if (previewTextareaRef.current) {
            const textToCopy = previewTextareaRef.current.value;
            navigator.clipboard.writeText(textToCopy)
            .then(() => {
                alert('コピーしました');
            })
            .catch(err => {
                console.error('コピーに失敗しました:', err);
                alert('コピーに失敗しました。');
            });
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4 , width:1500}}>
            <Typography variant="h5" component="h2" gutterBottom>
              エラーメッセージリソース変換
            </Typography>
            <Paper elevation={3} sx={{ p: 3, overflowX: 'auto' }}>
                <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    mb: 2,
                }}
                >
                <Button 
                    variant="outlined" 
                    onClick={() => navigate(-1)}
                    startIcon={<ArrowBackIcon />}
                    sx={{ mr: 2 }}
                >
                    戻る
                </Button>
                <Typography variant="h5" sx={{ flexGrow: 1 }}>
                    変換結果
                </Typography>

                <Button
                    size="large"
                    variant="contained"
                    onClick={handleDownload}
                    startIcon={<DownloadIcon />}
                >
                    ダウンロード
                </Button>
                </Box>

                <Box sx={{ mb: 2 }}>
                <FormControl sx={{ minWidth: 200 }} size="small">
                    <InputLabel id="language-select-label">表示言語</InputLabel>
                    <Select
                        labelId="language-select-label"
                        label="表示言語"
                        value={selectedLang}
                        onChange={(e: SelectChangeEvent<string>) => setSelectedLang(e.target.value as keyof ErrorMessage)}
                    >
                        <MenuItem value="country1">Country1</MenuItem>
                        <MenuItem value="country2">Country2</MenuItem>
                        <MenuItem value="country3">Country3</MenuItem>
                        <MenuItem value="country4">Country4</MenuItem>
                        <MenuItem value="country5">Country5</MenuItem>
                    </Select>
                </FormControl>
                </Box>

                <Box 
                sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'flex-end',
                    mb: 1
                }}
                >
                <Button 
                    onClick={handleCopyPreview} 
                    size="medium"
                    variant="outlined"
                    startIcon={<ContentCopyIcon />}
                >
                    コピー
                </Button>
                </Box>

                <Box sx={{ minWidth: 'max-content' }}>
                <textarea
                    ref={previewTextareaRef}
                    readOnly
                    value={generatePreviewText()}
                    style={{
                    width: '100%',
                    height: '600px',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    borderColor: '#4ab5e2ff',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    lineHeight: 1.5,
                    whiteSpace: 'pre',
                    overflow: 'auto',
                    resize: 'none',
                    }}
                />
                </Box>
            </Paper>
        </Container>
    );
};

export default ErrorMessageXmlConvert;