import { useLocation, useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import "../App.css";

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


interface EditableLabel {
  objectID: string;
  categoryName: string;
  country1: string;
  country2?: string;
  country3?: string;
  country4?: string;
  country5?: string;
  messageId?: string;
}

export const MessageResourceConvert = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialLabels: EditableLabel[] = (location.state as { labels: EditableLabel[] })?.labels || [];
  const [labels] = useState<EditableLabel[]>(initialLabels);
  const [selectedCountry, setSelectedCountry] = useState<keyof EditableLabel>("country1");
  const previewTextareaRef = useRef<HTMLTextAreaElement>(null);

  // ダウンロード用バックエンド呼び出し
  const handleDownload = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/labels/properties/download", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            labels: labels,       
            lang: selectedCountry
         }) 
      });

      if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`プロパティ生成失敗 (HTTP ${response.status}): ${errorText}`);
      }

      const text = await response.text(); 

      const filename = prompt("ファイル名を入力してください", "output.properties") || "output.properties";

      const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
      const blob = new Blob([bom, text], { type: "text/plain;charset=utf-8" }); 

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename.endsWith(".properties") ? filename : filename + ".properties"; 
      a.click();
      window.URL.revokeObjectURL(url);

    } catch (err: any) {
      console.error(err);
      alert(`プロパティ生成に失敗しました: ${err.message}`); 
    }
  };

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

  const generatePreviewText = () => {
    return labels.map(label => {
        const key = label.messageId || label.objectID;
        const value = label[selectedCountry] || "";
        return `${key}=${value}`;
      }).join("\n");
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 , width:1500}}>
      <Typography variant="h5" component="h2" gutterBottom>
            メッセージリソース変換
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
          <Typography variant="h4" sx={{ flexGrow: 1 }}>
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
              value={selectedCountry}
              onChange={(e: SelectChangeEvent<string>) => setSelectedCountry(e.target.value as keyof EditableLabel)}
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
