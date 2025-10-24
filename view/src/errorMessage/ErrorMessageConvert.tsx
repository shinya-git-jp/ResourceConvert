import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { ErrorMessage } from "../types/ErrorMessage";
import type { LanguageMap } from "../types/DbConfig";
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

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
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormGroup,
  FormControlLabel,
  TextField,
} from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';


const ErrorMessageXmlConvert: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state as { messages: ErrorMessage[], languageMap?: LanguageMap };
    const initialMessages: ErrorMessage[] = state?.messages || [];
    const langMap = state?.languageMap;

    const [messages] = useState<ErrorMessage[]>(initialMessages);
    const [selectedCountryForPreview, setSelectedCountryForPreview] = useState<keyof LanguageMap>("country1");
    const previewTextareaRef = useRef<HTMLTextAreaElement>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [downloadLangs, setDownloadLangs] = useState<Array<keyof LanguageMap>>([selectedCountryForPreview]);
    const [downloadFilename, setDownloadFilename] = useState('');

    const availableLangKeys = (['country1', 'country2', 'country3', 'country4', 'country5'] as Array<keyof LanguageMap>)
      .filter(key => (langMap && langMap[key] && langMap[key].trim() !== '') || key === 'country1');

    const generateXmlText = (countryKey: keyof LanguageMap): string => {
        if (!countryKey || !messages || messages.length === 0) return "";

        const xmlItems = messages.map((msg) => {
            let type: string;
            switch (msg.errorType) {
              case "1": type = "error"; break;
              case "2": type = "warning"; break;
              case "3": case "4": type = "info"; break;
              default: type = "info";
            }
            const messageText = msg[countryKey as keyof ErrorMessage] || "";
            return `  <error code="${msg.errorNo}">
    <type>${type}</type>
    <message>${messageText}</message>
  </error>`;
        });
        return `<?xml version="1.0" encoding="UTF-8"?>\n<error-messages>\n${xmlItems.join("\n")}\n</error-messages>`;
    };

    // ダウンロード処理本体
    const executeDownload = async () => {
        if (downloadLangs.length === 0) {
            alert("ダウンロードする言語を選択してください。");
            return;
        }
        if (!downloadFilename || downloadFilename.trim() === '') {
            alert("ファイル名を入力してください。");
            return;
        }

        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);

        // --- 単一言語選択の場合 ---
        if (downloadLangs.length === 1) {
            const countryKey = downloadLangs[0];
            const content = generateXmlText(countryKey);
            const blob = new Blob([bom, content], { type: "application/xml;charset=utf-8" });
            const finalFilename = downloadFilename.endsWith(".xml") ? downloadFilename : downloadFilename + ".xml";
            saveAs(blob, finalFilename);

        // --- 複数言語選択の場合 ---
        } else {
            const zip = new JSZip();

            // 選択された各言語についてファイル生成
            downloadLangs.forEach(countryKey => {
                const langName = (langMap && langMap[countryKey]?.trim()) ? langMap[countryKey] : countryKey;
                const filenameInZip = (langName && langName.trim() !== "")
                  ? `output_${langName}.xml`
                  : `output_${countryKey}.xml`;
                const content = generateXmlText(countryKey);
                zip.file(filenameInZip, new Blob([bom, content], { type: "application/xml;charset=utf-8" }));
            });

            // ZIPファイルを生成してダウンロード
            try {
                const zipBlob = await zip.generateAsync({ type: "blob" });
                const finalFilename = downloadFilename.endsWith(".zip") ? downloadFilename : downloadFilename + ".zip";
                saveAs(zipBlob, finalFilename);
            } catch (err) {
                console.error("ZIPファイルの生成に失敗しました:", err);
                alert("ZIPファイルの生成に失敗しました。");
            }
        }
        setIsModalOpen(false);
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

    const getDisplayLanguageName = (countryKey: keyof LanguageMap): string => {
      const mappedName = langMap?.[countryKey];
      return (mappedName && mappedName.trim() !== '') ? `${mappedName} (${countryKey})` : countryKey;
    }

    const openDownloadModal = () => {
        if (downloadLangs.length === 1) {
            const countryKey = downloadLangs[0];
            const langName = (langMap && langMap[countryKey]?.trim()) ? langMap[countryKey] : countryKey;
            setDownloadFilename((langName && langName.trim() !== "") ? `output_${langName}.xml` : "output.xml");
        } else if (downloadLangs.length > 1) {
            setDownloadFilename("output.zip");
        } else {
             const previewLangKey = selectedCountryForPreview;
             const previewLangName = (langMap && langMap[previewLangKey]?.trim()) ? langMap[previewLangKey] : previewLangKey;
             setDownloadFilename((previewLangName && previewLangName.trim() !== "") ? `output_${previewLangName}.xml` : "output.xml");
             setDownloadLangs([previewLangKey]);
        }
        setIsModalOpen(true);
    };

    const handleModalLangChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const key = event.target.name as keyof LanguageMap;
      const isChecked = event.target.checked;

      setDownloadLangs(prev => {
          const newLangs = isChecked
            ? [...prev, key]
            : prev.filter(lang => lang !== key);

          if (newLangs.length === 1) {
              const countryKey = newLangs[0];
              const langName = (langMap && langMap[countryKey]?.trim()) ? langMap[countryKey] : countryKey;
              setDownloadFilename((langName && langName.trim() !== "") ? `output_${langName}.xml` : "output.xml");
          } else if (newLangs.length > 1) {
              setDownloadFilename("error_messages.zip");
          } else {
              setDownloadFilename("");
          }
          return newLangs;
      });
    };

    useEffect(() => {
        setDownloadLangs([selectedCountryForPreview]);
        const langName = (langMap && langMap[selectedCountryForPreview]?.trim()) ? langMap[selectedCountryForPreview] : selectedCountryForPreview;
        setDownloadFilename((langName && langName.trim() !== "") ? `output_${langName}.xml` : "output.xml");
    }, [selectedCountryForPreview, langMap]);

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
                    onClick={openDownloadModal}
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
                        value={selectedCountryForPreview}
                        onChange={(e: SelectChangeEvent<string>) => setSelectedCountryForPreview(e.target.value as keyof LanguageMap)}
                    >
                         {availableLangKeys.map((countryKey) => (
                          <MenuItem key={countryKey} value={countryKey}>
                            {getDisplayLanguageName(countryKey)}
                          </MenuItem>
                         ))}
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
                    value={generateXmlText(selectedCountryForPreview)}
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

            <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="sm" fullWidth>
              <DialogTitle>ダウンロード設定</DialogTitle>
              <DialogContent>
                <Typography variant="subtitle1" gutterBottom>言語選択 (複数可)</Typography>
                <FormGroup sx={{ mb: 3 }}>
                  {availableLangKeys.map((countryKey) => (
                    <FormControlLabel
                      key={countryKey}
                      control={
                        <Checkbox
                          checked={downloadLangs.includes(countryKey)}
                          onChange={handleModalLangChange}
                          name={countryKey}
                        />
                      }
                      label={getDisplayLanguageName(countryKey)}
                    />
                  ))}
                </FormGroup>

                <Typography variant="subtitle1" gutterBottom>ファイル名</Typography>
                <TextField
                  fullWidth
                  margin="dense"
                  label={downloadLangs.length > 1 ? "ZIPファイル名" : "ファイル名"}
                  value={downloadFilename}
                  onChange={(e) => setDownloadFilename(e.target.value)}
                  helperText={
                    downloadLangs.length > 1
                    ? ".zip は自動で付与されます"
                    : ".xml は自動で付与されます"
                  }
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setIsModalOpen(false)}>キャンセル</Button>
                <Button
                  variant="contained"
                  onClick={executeDownload}
                  disabled={downloadLangs.length === 0 || !downloadFilename || downloadFilename.trim() === ''}
                >
                  ダウンロード実行
                </Button>
              </DialogActions>
            </Dialog>
        </Container>
    );
};

export default ErrorMessageXmlConvert;