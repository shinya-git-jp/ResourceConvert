import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { ErrorMessage } from "../types/ErrorMessage";
import type { DbConfig } from "../types/DbConfig";
import useDebounce from "../hooks/useDebounce"; // 作成した useDebounce フックをインポート

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

const LOCAL_STORAGE_KEY = "dbConfigs";
const TABLE_AREA_MIN_HEIGHT_PX = 600;

const ErrorMessageDisplay: React.FC = () => {
  const [messages, setMessages] = useState<ErrorMessage[]>([]);
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
    errorNo: "",
    errorType: "",
    message: ""
  });

  // デバウンスされたフィルター値 (500ms)
  const debouncedFilter = useDebounce(filter, 500);

  // フォーカス管理用の state と ref
  const [focusedInputId, setFocusedInputId] = useState<string | null>(null);
  const objectIdInputRef = useRef<HTMLInputElement>(null);
  const errorNoInputRef = useRef<HTMLInputElement>(null);
  const errorTypeInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  // データ取得ロジック (useCallbackでメモ化)
  const fetchData = useCallback(async (configName: string, currentFilter: typeof filter) => {
    const selectedConfig = dbConfigs.find(c => c.name === configName);
    if (!selectedConfig) {
      setMessages([]);
      setSelectedObjectIDs(new Set());
      return;
    }

    setLoading(true);

    const { name, ...configForBackend } = selectedConfig;
    const requestBody = {
      ...configForBackend,
      filter: currentFilter // 現在のフィルター値を渡す
    };

    try {
      const response = await fetch("http://localhost:8080/api/error-messages/fetch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`データ取得失敗 (HTTP ${response.status})`);
      }
      const data: ErrorMessage[] = await response.json();
      setMessages(data);
      setSelectedObjectIDs(new Set()); // データ取得成功時にクリア
    } catch (err: any) {
      console.error("エラーメッセージ取得失敗:", err);
      alert(err.message || "エラーメッセージ取得失敗");
      setMessages([]); // エラー時クリア
      setSelectedObjectIDs(new Set()); // エラー時クリア
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
      fetchData(selectedConfigName, filter); // filterも渡す
    } else {
      setMessages([]);
      setSelectedObjectIDs(new Set());
    }
  }, [selectedConfigName, fetchData]);

  // デバウンスされたフィルター値が変更されたらデータ再取得する Effect
  useEffect(() => {
    if (selectedConfigName) {
      fetchData(selectedConfigName, debouncedFilter); // debouncedFilter を使う
    }
  }, [debouncedFilter, selectedConfigName, fetchData]);

  // データ更新後 (loadingがfalseになった後) にフォーカスを復元する Effect
  useEffect(() => {
    if (!loading && focusedInputId) { // ローディング完了後、IDがあれば
      let inputToFocus: HTMLInputElement | null = null;
      switch (focusedInputId) {
        case 'filter-error-objectID': // ID名を修正
          inputToFocus = objectIdInputRef.current;
          break;
        case 'filter-errorNo':        // ID名を修正
          inputToFocus = errorNoInputRef.current;
          break;
        case 'filter-errorType':      // ID名を修正
          inputToFocus = errorTypeInputRef.current;
          break;
        case 'filter-errorMessage':   // ID名を修正
          inputToFocus = messageInputRef.current;
          break;
      }
      if (inputToFocus) {
         setTimeout(() => inputToFocus?.focus(), 0); // 微小な遅延でフォーカス
      }
    }
  }, [loading, focusedInputId]); // loading 変更時にチェック

  // 変換画面への遷移
  const handleNavigateToConvert = () => {
    const selectedMessages = messages.filter(msg =>
      selectedObjectIDs.has(msg.objectID)
    );

    if (selectedMessages.length === 0) {
        alert("変換するデータが選択されていません");
        return;
    }

    navigate("/error-messages-xml", { state: { messages: selectedMessages } });
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
      const allObjectIDs = new Set(messages.map(m => m.objectID));
      setSelectedObjectIDs(allObjectIDs);
    }
  };

  // 現在表示されているデータが全て選択されているか
  const isAllSelected = messages.length > 0 && selectedObjectIDs.size === messages.length;

  // フィルター入力フィールドの onFocus と ref, id, name を設定
  const handleFilterFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    setFocusedInputId(event.target.id);
  };

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFilter(prev => ({ ...prev, [name]: value }));
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
            justifyContent: "flex-end",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Button
            size="large"
            variant="contained"
            onClick={handleNavigateToConvert}
            disabled={selectedObjectIDs.size === 0 || loading} // ローディング中も無効化
          >
            変換
          </Button>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          {/* DB接続設定 Select */}
          <FormControl sx={{ minWidth: 240, mr: 2 }} size="small">
            <InputLabel id="db-config-select-label">DB接続設定</InputLabel>
            <Select
              labelId="db-config-select-label"
              label="DB接続設定"
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
            id="filter-error-objectID" // ID修正
            name="objectID"
            inputRef={objectIdInputRef}
            label="ObjectID (部分一致)"
            variant="outlined"
            size="small"
            fullWidth
            value={filter.objectID}
            onChange={handleFilterChange}
            onFocus={handleFilterFocus}
            disabled={loading || !selectedConfigName} // ローディング中や未選択時は無効化
          />
          <TextField
            id="filter-errorNo"        // ID修正
            name="errorNo"
            inputRef={errorNoInputRef}
            label="ErrorNo (部分一致)"
            variant="outlined"
            size="small"
            fullWidth
            value={filter.errorNo}
            onChange={handleFilterChange}
            onFocus={handleFilterFocus}
            disabled={loading || !selectedConfigName} // ローディング中や未選択時は無効化
          />
          <TextField
            id="filter-errorType"      // ID修正
            name="errorType"
            inputRef={errorTypeInputRef}
            label="ErrorType (部分一致)"
            variant="outlined"
            size="small"
            fullWidth
            value={filter.errorType}
            onChange={handleFilterChange}
            onFocus={handleFilterFocus}
            disabled={loading || !selectedConfigName} // ローディング中や未選択時は無効化
          />
          <TextField
            id="filter-errorMessage"   // ID修正
            name="message"
            inputRef={messageInputRef}
            label="メッセージ (部分一致)"
            variant="outlined"
            size="small"
            fullWidth
            value={filter.message}
            onChange={handleFilterChange}
            onFocus={handleFilterFocus}
            disabled={loading || !selectedConfigName} // ローディング中や未選択時は無効化
          />
        </Paper>

        {/* 選択件数表示と全件選択ボタン */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 1, minHeight: '30px' }}>
         {selectedConfigName && messages.length > 0 && ( // DB選択済み かつ データがある場合のみ表示
            <Typography variant="body2" color="text.secondary" sx={{ mr: 3 }}>
              <strong>{selectedObjectIDs.size} / {messages.length}</strong> 件選択中
            </Typography>
          )}
          <Button
            onClick={handleSelectAll}
            size="medium"
            variant="outlined"
            disabled={messages.length === 0 || loading} // データがない or ローディング中は無効
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
              opacity: 0.5,
            }}
          >
            <CircularProgress />
          </Box>
        )}

        {/* テーブル描画エリア (ローディング中でない場合に表示) */}
        {!loading && selectedConfigName && ( // DB設定が選択されている場合のみ表示
          <>
            {messages.length > 0 && (
              <TableContainer sx={{ maxHeight: TABLE_AREA_MIN_HEIGHT_PX }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox" sx={{ minWidth: 60 }}></TableCell>
                      <TableCell sx={{ minWidth: 150 }}>ObjectID</TableCell>
                      <TableCell sx={{ minWidth: 120 }}>ErrorNo</TableCell>
                      <TableCell sx={{ minWidth: 100 }}>ErrorType</TableCell>
                      <TableCell sx={{ minWidth: 150 }}>MessageObjectID</TableCell>
                      <TableCell sx={{ minWidth: 200 }}>country1</TableCell>
                      <TableCell sx={{ minWidth: 200 }}>country2</TableCell>
                      <TableCell sx={{ minWidth: 200 }}>country3</TableCell>
                      <TableCell sx={{ minWidth: 200 }}>country4</TableCell>
                      <TableCell sx={{ minWidth: 200 }}>country5</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {messages.map((msg) => (
                      <TableRow
                        key={msg.objectID}
                        hover
                        role="checkbox"
                        tabIndex={-1}
                        selected={selectedObjectIDs.has(msg.objectID)}
                        onClick={() => handleToggleSelect(msg.objectID)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            color="primary"
                            checked={selectedObjectIDs.has(msg.objectID)}
                          />
                        </TableCell>
                        <TableCell>{msg.objectID}</TableCell>
                        <TableCell>{msg.errorNo}</TableCell>
                        <TableCell>{msg.errorType}</TableCell>
                        <TableCell>{msg.messageObjectID}</TableCell>
                        <TableCell>{msg.country1}</TableCell>
                        <TableCell>{msg.country2}</TableCell>
                        <TableCell>{msg.country3}</TableCell>
                        <TableCell>{msg.country4}</TableCell>
                        <TableCell>{msg.country5}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* フィルター結果が0件の場合の表示 */}
            {messages.length === 0 && (
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
               DB接続設定を選択してください
            </Typography>
          </Box>
        )}

      </Paper>
    </Container>
  );
};

export default ErrorMessageDisplay;