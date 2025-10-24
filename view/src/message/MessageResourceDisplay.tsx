import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import type { DbConfig } from "../types/DbConfig";
import useDebounce from "../hooks/useDebounce";

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
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Checkbox,
  CircularProgress,
  TextField,
  type SelectChangeEvent,
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';

interface SLocalizationLabel {
  objectID: string;
  categoryName: string;
  country1: string;
  country2?: string;
  country3?: string;
  country4?: string;
  country5?: string;
}

interface EditableLabel extends SLocalizationLabel {
  messageId?: string; // ユーザーが入力できるメッセージID
}

// DbConnection.tsx からキーを拝借
const LOCAL_STORAGE_KEY = "dbConfigs";

const TABLE_AREA_MIN_HEIGHT_PX = 600;

function MessageResourceDisplay() {
  const [labels, setLabels] = useState<EditableLabel[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // DB接続設定関連の state
  const [dbConfigs, setDbConfigs] = useState<DbConfig[]>([]);
  const [selectedConfigName, setSelectedConfigName] = useState<string>("");

  // 選択状態を管理する State
  const [selectedObjectIDs, setSelectedObjectIDs] = useState(new Set<string>());

  // フィルター条件の state
  const [filter, setFilter] = useState({
    objectID: "",
    categoryName: "",
    message: ""
  });

  // デバウンスされたフィルター値 (500ms)
  const debouncedFilter = useDebounce(filter, 500);

  // フォーカス管理用の state と ref
  const [focusedInputId, setFocusedInputId] = useState<string | null>(null);
  const objectIdInputRef = useRef<HTMLInputElement>(null);
  const categoryInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  // データ取得ロジック (useCallbackでメモ化)
  const fetchData = useCallback(async (configName: string, currentFilter: typeof filter) => {
    const selectedConfig = dbConfigs.find(c => c.name === configName);
    if (!selectedConfig) {
      setLabels([]);
      setSelectedObjectIDs(new Set());
      return;
    }

    setLoading(true);

    const { name, languageMap, ...configForBackend } = selectedConfig;
    const requestBody = {
      ...configForBackend,
      filter: currentFilter // 現在のフィルター値を渡す
    };

    try {
      const response = await fetch("http://localhost:8080/api/labels/fetch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`データ取得失敗 (HTTP ${response.status})`);
      }
      const data: SLocalizationLabel[] = await response.json();
      const editableData = data.map(d => ({ ...d, messageId: "" }));
      setLabels(editableData);
      setSelectedObjectIDs(new Set());
    } catch (error: any) {
      console.error(error);
      alert(error.message || "データ取得に失敗しました");
      setLabels([]);
      setSelectedObjectIDs(new Set());
    } finally {
      setLoading(false);
    }
  }, [dbConfigs]); // dbConfigs が変更された時だけ関数を再生成

  // DB設定をローカルストレージから読み込む Effect
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const configs: DbConfig[] = JSON.parse(saved);
      setDbConfigs(configs);
    }
  }, []);

  // DB接続設定が変更されたら自動でデータ取得する Effect
  useEffect(() => {
    if (selectedConfigName) {
      fetchData(selectedConfigName, filter);
    } else {
      setLabels([]);
      setSelectedObjectIDs(new Set());
    }
    // 初回マウント時と selectedConfigName 変更時に実行
  }, [selectedConfigName, fetchData]);

  // デバウンスされたフィルター値が変更されたらデータ再取得する Effect
  useEffect(() => {
    if (selectedConfigName) {
      fetchData(selectedConfigName, debouncedFilter); // debouncedFilter を使う
    }
    // debouncedFilter が変更された時だけ実行 (fetchDataはuseCallbackでメモ化済み)
  }, [debouncedFilter, selectedConfigName, fetchData]);

  // データ更新後 (loadingがfalseになった後) にフォーカスを復元する Effect
  useEffect(() => {
    if (!loading && focusedInputId) { // ローディングが完了し、フォーカスすべきIDがある場合
      let inputToFocus: HTMLInputElement | null = null;
      switch (focusedInputId) {
        case 'filter-objectID':
          inputToFocus = objectIdInputRef.current;
          break;
        case 'filter-categoryName':
          inputToFocus = categoryInputRef.current;
          break;
        case 'filter-message':
          inputToFocus = messageInputRef.current;
          break;
      }
      if (inputToFocus) {
        setTimeout(() => inputToFocus?.focus(), 0);
      }
    }
  }, [loading, focusedInputId]); // loading の状態が変わった時にチェック

  const selectedConfig = dbConfigs.find(c => c.name === selectedConfigName);
  const langMap = selectedConfig?.languageMap;

  // 変換画面への遷移
  const handleConvert = () => {
    const selectedLabels = labels.filter(label =>
      selectedObjectIDs.has(label.objectID)
    );

    if (selectedLabels.length === 0) {
      alert("変換するデータが選択されていません");
      return;
    }

    const updatedLabels = selectedLabels.map(label => ({
      ...label,
      messageId: label.messageId?.trim() || label.objectID,
    }));

    navigate("/properties", { state: { labels: updatedLabels, languageMap: langMap } });
  };

  // 行選択のトグル
  const handleToggleSelect = (objectID: string) => {
    setSelectedObjectIDs(prevSet => {
      const newSet = new Set(prevSet);
      if (newSet.has(objectID)) {
        newSet.delete(objectID);
      } else {
        newSet.add(objectID);
      }
      return newSet;
    });
  };

  // 全件選択/解除
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedObjectIDs(new Set());
    } else {
      const allObjectIDs = new Set(labels.map(l => l.objectID));
      setSelectedObjectIDs(allObjectIDs);
    }
  };

  // 現在表示されているデータが全て選択されているか
  const isAllSelected = labels.length > 0 && selectedObjectIDs.size === labels.length;

  // フィルター入力フィールドの onFocus と ref, id を設定
  const handleFilterFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    setFocusedInputId(event.target.id); // フォーカスが当たった要素のIDを記憶
  };

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFilter(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 , width:1500}}>
      <Typography variant="h5" component="h2" gutterBottom>
            メッセージリソース変換
      </Typography>
      <Paper elevation={3} sx={{ p: 3 , overflowX:'auto'}}>

        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Button
            size="large"
            variant="contained"
            onClick={handleConvert}
            disabled={selectedObjectIDs.size === 0 || loading} // ローディング中も無効化
          >
            変換
          </Button>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          {/* DB接続設定 Select */}
          <FormControl sx={{ minWidth: 240, mr: 2 }} size="small">
            <InputLabel id="db-config-select-label">環境設定</InputLabel>
            <Select
              labelId="db-config-select-label"
              label="環境設定"
              value={selectedConfigName}
              onChange={(e: SelectChangeEvent<string>) => setSelectedConfigName(e.target.value)}
              disabled={loading} // ローディング中は無効化
            >
              <MenuItem value="">
                <em>-- 選択してください --</em>
              </MenuItem>
              {dbConfigs.map(config => (
                <MenuItem key={config.name} value={config.name}>
                  {config.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {/* ローディングインジケーター */}
          {loading && <CircularProgress size={24} sx={{ ml: 2 }} />}
        </Box>

        {/* 検索フィルターUI */}
        <Paper elevation={1} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, p: 2 }}>
          <SearchIcon color="action" sx={{ mr: 1 }} />
          <TextField
            id="filter-objectID"
            name="objectID"
            inputRef={objectIdInputRef}
            label="ObjectID (部分一致)"
            variant="outlined"
            size="small"
            fullWidth
            value={filter.objectID}
            onChange={handleFilterChange}
            onFocus={handleFilterFocus}
            disabled={loading || !selectedConfigName}
          />
          <TextField
            id="filter-categoryName"
            name="categoryName"
            inputRef={categoryInputRef}
            label="Category (部分一致)"
            variant="outlined"
            size="small"
            fullWidth
            value={filter.categoryName}
            onChange={handleFilterChange}
            onFocus={handleFilterFocus}
            disabled={loading || !selectedConfigName}
          />
          <TextField
            id="filter-message"
            name="message"
            inputRef={messageInputRef}
            label="メッセージ (部分一致)"
            variant="outlined"
            size="small"
            fullWidth
            value={filter.message}
            onChange={handleFilterChange}
            onFocus={handleFilterFocus}
            disabled={loading || !selectedConfigName}
          />
        </Paper>

        {/* 選択件数表示と全件選択ボタン */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 1, minHeight: '30px' }}>
          {selectedConfigName && labels.length > 0 && ( // DB選択済み かつ データがある場合のみ表示
            <Typography variant="body2" color="text.secondary" sx={{ mr: 3 }}>
              <strong>{selectedObjectIDs.size} / {labels.length}</strong> 件選択中
            </Typography>
          )}
          <Button
                onClick={handleSelectAll}
                size="medium"
                variant="outlined"
                disabled={labels.length === 0 || loading} // データがない or ローディング中は無効
              >
                {isAllSelected ? '全件解除' : '全件選択'}
          </Button>
        </Box>

          {/* ローディング中の表示 */}
          {loading && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: 'center',
                p: 4,
                minHeight: TABLE_AREA_MIN_HEIGHT_PX,
                opacity: 0.5, // 少し薄く表示
              }}
            >
              <CircularProgress />
            </Box>
          )}

        {/* テーブル描画エリア (ローディング中でない場合に表示) */}
        {!loading && selectedConfigName && ( // DB設定が選択されている場合のみ表示
          <>
            {labels.length > 0 && (
              <TableContainer sx={{ maxHeight: TABLE_AREA_MIN_HEIGHT_PX }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox" sx={{ minWidth: 60 }}></TableCell>
                      <TableCell sx={{ minWidth: 170 }}>メッセージID（任意）</TableCell>
                      <TableCell sx={{ minWidth: 150 }}>Object ID</TableCell>
                      <TableCell sx={{ minWidth: 150 }}>Category</TableCell>
                      <TableCell sx={{ minWidth: 200 }}>{langMap?.country1 && langMap.country1.trim() !== '' ? `${langMap.country1} (Country1)` : 'Country1'}</TableCell>
                      <TableCell sx={{ minWidth: 200 }}>{langMap?.country2 && langMap.country2.trim() !== '' ? `${langMap.country2} (Country2)` : 'Country2'}</TableCell>
                      <TableCell sx={{ minWidth: 200 }}>{langMap?.country3 && langMap.country3.trim() !== '' ? `${langMap.country3} (Country3)` : 'Country3'}</TableCell>
                      <TableCell sx={{ minWidth: 200 }}>{langMap?.country4 && langMap.country4.trim() !== '' ? `${langMap.country4} (Country4)` : 'Country4'}</TableCell>
                      <TableCell sx={{ minWidth: 200 }}>{langMap?.country5 && langMap.country5.trim() !== '' ? `${langMap.country5} (Country5)` : 'Country5'}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {labels.map((label) => (
                      <TableRow
                        key={label.objectID}
                        hover
                        role="checkbox"
                        tabIndex={-1}
                        selected={selectedObjectIDs.has(label.objectID)}
                        onClick={() => handleToggleSelect(label.objectID)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            color="primary"
                            checked={selectedObjectIDs.has(label.objectID)}
                          />
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <TextField
                            variant="standard"
                            size="small"
                            value={label.messageId ?? ""}
                            placeholder={label.objectID}
                            onChange={(e) => {
                              const newLabels = labels.map((l) =>
                                l.objectID === label.objectID
                                  ? { ...l, messageId: e.target.value }
                                  : l
                              );
                              setLabels(newLabels);
                            }}
                            sx={{ minWidth: 150 }}
                          />
                        </TableCell>
                        <TableCell>{label.objectID}</TableCell>
                        <TableCell>{label.categoryName}</TableCell>
                        <TableCell>{label.country1}</TableCell>
                        <TableCell>{label.country2}</TableCell>
                        <TableCell>{label.country3}</TableCell>
                        <TableCell>{label.country4}</TableCell>
                        <TableCell>{label.country5}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* フィルター結果が0件の場合の表示 */}
            {labels.length === 0 && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: 'center',
                  p: 4,
                  minHeight: TABLE_AREA_MIN_HEIGHT_PX,
                }}
              >
                <Typography sx={{ p: 4, textAlign: 'center' }}>
                  検索条件に一致するデータがありません。
                </Typography>
              </Box>
            )}
          </>
        )}

        {/* DB設定が未選択の場合の表示 */}
        {!loading && !selectedConfigName && (
           <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: 'center',
              p: 4,
              minHeight: TABLE_AREA_MIN_HEIGHT_PX,
            }}
          >
            <Typography sx={{ fontSize: "1.3rem", p: 4, textAlign: 'center', mb:20 }}>
              環境設定を選択してください
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
}

export default MessageResourceDisplay;