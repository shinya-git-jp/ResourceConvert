import React, { useEffect, useState, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom"; // useLocation をインポート
import type { ErrorMessage } from "../types/ErrorMessage";
import type { DbConfig } from "../types/DbConfig";
import useDebounce from "../hooks/useDebounce";

// MUI Components
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
  TablePagination,
  Tooltip,
  type SelectChangeEvent,
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

// APIレスポンス型
interface PagedResponse<T> { content: T[]; totalElements: number; }

// filter state の型を明示的に定義
interface FilterState {
  objectID: string;
  errorNo: string;
  errorType: string;
  message: string;
}

// 保存する状態の型
interface DisplayStateToSave {
  selectedConfigName: string;
  page: number;
  rowsPerPage: number;
  filter: FilterState; // typeof filter の代わりに FilterState を使用
  selectedObjectIDs: string[]; // Set は JSON にできないため Array で保存
}

const LOCAL_STORAGE_KEY = "dbConfigs";
const SESSION_STORAGE_KEY = "errorDisplayState"; // sessionStorage 用のキー
const TABLE_AREA_MIN_HEIGHT_PX = 600;

const ErrorMessageDisplay: React.FC = () => {
  // --- States ---
  // Context ではなくローカル state を使用
  const [selectedConfigName, setSelectedConfigName] = useState<string>("");
  const [selectedObjectIDs, setSelectedObjectIDs] = useState(new Set<string>());

  const [messages, setMessages] = useState<ErrorMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [dbConfigs, setDbConfigs] = useState<DbConfig[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25); // デフォルト値を25に変更
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState<FilterState>({ // useState に FilterState 型を適用
    objectID: "", errorNo: "", errorType: "", message: ""
  });
  const [focusedInputId, setFocusedInputId] = useState<string | null>(null);
  const [isRestored, setIsRestored] = useState<boolean | null>(null); // 状態復元フラグ (初期値 null)

  // --- Refs ---
  const objectIdInputRef = useRef<HTMLInputElement>(null);
  const errorNoInputRef = useRef<HTMLInputElement>(null);
  const errorTypeInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  // --- Hooks ---
  const navigate = useNavigate();
  const location = useLocation(); // location を取得
  const debouncedFilter = useDebounce(filter, 500);

  // --- Data Fetching Logic ---
  const fetchData = useCallback(async (
    configName: string,
    currentFilter: FilterState, // 型を FilterState に変更
    currentPage: number,
    currentSize: number
  ) => {
    const selectedConfig = dbConfigs.find(c => c.name === configName);
    if (!selectedConfig) return;

    // フェッチ開始時にフォーカスIDクリア
    // if (!focusedInputId?.startsWith('messageId-')) { // もしフィルター入力中にフェッチが走るなら
    //    setFocusedInputId(null);
    // }
    setLoading(true);
    // リセット処理は useEffect に移動

    const { name, languageMap, ...configForBackend } = selectedConfig;
    const requestBody = { ...configForBackend, filter: currentFilter, page: currentPage, size: currentSize };
    try {
      const response = await fetch("http://localhost:8080/api/error-messages/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });
      if (!response.ok) throw new Error(`データ取得失敗 (HTTP ${response.status})`);
      const data: PagedResponse<ErrorMessage> = await response.json();
      setMessages(data.content);
      setTotalCount(data.totalElements);
    } catch (err: any) {
      console.error("エラーメッセージ取得失敗:", err);
      alert(err.message || "エラーメッセージ取得失敗");
      setMessages([]);
      setTotalCount(0);
      // エラー時のリセットも selectedConfigName の useEffect で行う
    } finally {
      setLoading(false);
    }
  }, [dbConfigs]); // 依存配列は dbConfigs のみ

  // --- useEffect フック ---

  // Mount/Location Change: Load DB Configs and Restore State
  useEffect(() => {
    // DB設定読み込み
    const savedConfigs = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedConfigs) { try { setDbConfigs(JSON.parse(savedConfigs)); } catch (e) { console.error(e); } }

    // sessionStorage から状態を復元
    const savedStateString = sessionStorage.getItem(SESSION_STORAGE_KEY);
    let restored = false;
    if (savedStateString) {
      try {
        const savedState: DisplayStateToSave = JSON.parse(savedStateString);
        setSelectedConfigName(savedState.selectedConfigName);
        setPage(savedState.page);
        setRowsPerPage(savedState.rowsPerPage);
        setFilter(savedState.filter);
        setSelectedObjectIDs(new Set(savedState.selectedObjectIDs));
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        console.log("Error state restored from sessionStorage:", savedState);
        restored = true;
      } catch (e) {
        console.error("Failed to parse error state from sessionStorage", e);
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }
    setIsRestored(restored); // 復元成否をマーク

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  // Fetch data when parameters change AFTER initial load/restore is determined
  useEffect(() => {
    // 復元処理が終わっていない場合は何もしない
    if (isRestored === null) return;

    // 設定が選択されていない場合
    if (!selectedConfigName) {
      setMessages([]);
      setTotalCount(0);
      // 復元されていない場合は選択もクリア
      if (!isRestored) {
        setSelectedObjectIDs(new Set());
      }
      return;
    }

    // 状態復元直後 or パラメータ変更時にデータ取得
    // debouncedFilter を使ってフェッチする
    fetchData(selectedConfigName, debouncedFilter, page, rowsPerPage);

  }, [selectedConfigName, debouncedFilter, page, rowsPerPage, isRestored, fetchData]);

  // Debounced filter effect: reset page only
  useEffect(() => {
    if (isRestored === null || !selectedConfigName) return;
    // フィルター入力が完了したらページをリセット
    // 簡易的な比較。厳密にはオブジェクト比較が必要な場合も
    if (JSON.stringify(filter) !== JSON.stringify(debouncedFilter)) {
      setPage(0);
    }
  }, [debouncedFilter, isRestored, selectedConfigName, filter]);

  // フォーカス復元ロジック
  useEffect(() => {
    // ローディング中や、復元直後は何もしない
    if (loading || isRestored === null) return;

    if (focusedInputId && focusedInputId.startsWith('filter-')) {
      let inputToFocus: HTMLInputElement | null = null;
      switch (focusedInputId) {
        case 'filter-error-objectID': inputToFocus = objectIdInputRef.current; break;
        case 'filter-errorNo': inputToFocus = errorNoInputRef.current; break;
        case 'filter-errorType': inputToFocus = errorTypeInputRef.current; break;
        case 'filter-errorMessage': inputToFocus = messageInputRef.current; break;
      }
      if (inputToFocus) {
        // console.log("Attempting to restore focus to:", focusedInputId);
        setTimeout(() => {
          inputToFocus?.focus();
          // フォーカスを試みた後はクリアする
          // setFocusedInputId(null);
        }, 0);
      } else {
        // console.log("Input element not found for:", focusedInputId);
        // setFocusedInputId(null); // 要素が見つからない場合もクリアした方が良いかも
      }
    }
  }, [loading, focusedInputId, isRestored]);


  // --- Derived State ---
  const selectedConfig = dbConfigs.find(c => c.name === selectedConfigName);
  const langMap = selectedConfig?.languageMap;

  // --- Handlers ---

  // メインの変換ボタンハンドラ
  const handleNavigateToConvert = async () => {
    if (selectedObjectIDs.size === 0 || !selectedConfig) {
      alert(selectedObjectIDs.size === 0 ? "変換するデータが選択されていません" : "環境設定を選択してください");
      return;
    }

    // sessionStorage に現在の状態を保存
    const stateToSave: DisplayStateToSave = {
      selectedConfigName,
      page,
      rowsPerPage,
      filter,
      selectedObjectIDs: Array.from(selectedObjectIDs)
    };
    try { sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(stateToSave)); } catch (e) {
      console.error("Failed to save state to sessionStorage", e);
      alert("画面状態の保存に失敗しました。");
      return;
    }

    setActionLoading(true);
    try {
      const { name, languageMap, ...configForBackend } = selectedConfig;
      const requestBody = { dbConfig: configForBackend, objectIDs: Array.from(selectedObjectIDs) };
      const response = await fetch("http://localhost:8080/api/error-messages/fetch/by-ids", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestBody), });
      if (!response.ok) {
        throw new Error(`選択データの取得失敗 (HTTP ${response.status})`);
      }
      const selectedMessagesData: ErrorMessage[] = await response.json();
      navigate("/error-messages-xml", { state: { messages: selectedMessagesData, languageMap: langMap } });
    } catch (error: any) {
      console.error("選択データの取得または画面遷移エラー:", error);
      alert(error.message || "処理中にエラーが発生しました");
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } finally {
      setActionLoading(false);
    }
  };

  // 選択関連ハンドラ
  const handleToggleSelect = (objectID: string) => { setSelectedObjectIDs(prevSet => { const newSet = new Set(prevSet); if (newSet.has(objectID)) newSet.delete(objectID); else newSet.add(objectID); return newSet; }); };
  const handleSelectPage = () => { const currentPageObjectIDs = messages.map(m => m.objectID); setSelectedObjectIDs(prevSet => { const newSet = new Set(prevSet); currentPageObjectIDs.forEach(id => newSet.add(id)); return newSet; }); };
  const handleClearSelection = () => { setSelectedObjectIDs(new Set()); };
  const handleSelectAllFiltered = async () => { if (!selectedConfig) { alert("環境設定を選択してください"); return; } setActionLoading(true); try { const { name, languageMap, ...configForBackend } = selectedConfig; const requestBody = { ...configForBackend, filter: debouncedFilter }; const response = await fetch("http://localhost:8080/api/error-messages/fetch/ids", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestBody), }); if (!response.ok) { throw new Error(`全IDの取得失敗 (HTTP ${response.status})`); } const allIDs: string[] = await response.json(); setSelectedObjectIDs(new Set(allIDs)); } catch (error: any) { console.error("全ID取得エラー:", error); alert(error.message || "全件選択中にエラーが発生しました"); } finally { setActionLoading(false); } };

  // フィルターハンドラ
  const handleFilterFocus = (event: React.FocusEvent<HTMLInputElement>) => { setFocusedInputId(event.target.id); };
  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => { const { name, value } = event.target; setFilter(prev => ({ ...prev, [name]: value })); };

  // ページネーションハンドラ
  const handleChangePage = (_event: unknown, newPage: number) => { setPage(newPage); };
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => { setRowsPerPage(parseInt(event.target.value, 10)); setPage(0); };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, width: 1500 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        エラーメッセージリソース変換
      </Typography>
      <Paper elevation={3} sx={{ p: 3, overflowX: 'auto' }}>
        <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", mb: 2 }}>
          <Tooltip title="チェックボックスで選択したすべての項目（複数ページにまたがる場合も含む）を変換画面に送ります">
            <span>
              <Button
                size="large"
                variant="contained"
                onClick={handleNavigateToConvert}
                disabled={selectedObjectIDs.size === 0 || loading || actionLoading}
              >
                選択した{selectedObjectIDs.size}件を変換
              </Button>
            </span>
          </Tooltip>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <FormControl sx={{ minWidth: 240, mr: 2 }} size="small">
            <InputLabel id="db-config-select-label">環境設定</InputLabel>
            <Select
              labelId="db-config-select-label"
              label="環境設定"
              value={selectedConfigName}
              onChange={(e: SelectChangeEvent<string>) => setSelectedConfigName(e.target.value)}
              disabled={loading || actionLoading}
            >
              <MenuItem value=""><em>-- 選択してください --</em></MenuItem>
              {dbConfigs.map(config => (<MenuItem key={config.name} value={config.name}>{config.name}</MenuItem>))}
            </Select>
          </FormControl>
          {(loading || actionLoading) && <CircularProgress size={24} sx={{ ml: 2 }} />}
        </Box>

        <Paper elevation={1} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, p: 2 }}>
          <SearchIcon color="action" sx={{ mr: 1 }} />
          <TextField id="filter-error-objectID" name="objectID" inputRef={objectIdInputRef} label="ObjectID" variant="outlined" size="small" fullWidth value={filter.objectID} onChange={handleFilterChange} onFocus={handleFilterFocus} disabled={loading || actionLoading || !selectedConfigName} />
          <TextField id="filter-errorNo" name="errorNo" inputRef={errorNoInputRef} label="ErrorNo" variant="outlined" size="small" fullWidth value={filter.errorNo} onChange={handleFilterChange} onFocus={handleFilterFocus} disabled={loading || actionLoading || !selectedConfigName} />
          <TextField id="filter-errorType" name="errorType" inputRef={errorTypeInputRef} label="ErrorType" variant="outlined" size="small" fullWidth value={filter.errorType} onChange={handleFilterChange} onFocus={handleFilterFocus} disabled={loading || actionLoading || !selectedConfigName} />
          <TextField id="filter-errorMessage" name="message" inputRef={messageInputRef} label="エラーメッセージ" variant="outlined" size="small" fullWidth value={filter.message} onChange={handleFilterChange} onFocus={handleFilterFocus} disabled={loading || actionLoading || !selectedConfigName} />
        </Paper>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, minHeight: '52px' }}>
          <Box>
            {totalCount > 0 && !loading && (
              <TablePagination
                rowsPerPageOptions={[10, 25, 50, 100]}
                component="div"
                count={totalCount}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="表示件数:"
              />
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {selectedConfigName && (
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: '100px', textAlign: 'right', mr: 1 }}>
                合計 <strong>{selectedObjectIDs.size}</strong> 件選択中
              </Typography>
            )}
            <Button
              variant="outlined"
              onClick={handleSelectPage}
              disabled={messages.length === 0 || loading || actionLoading || !selectedConfigName}
            >
              このページを選択
            </Button>
            <Tooltip title="現在のフィルター条件に一致するすべての項目を選択します">
              <span>
                <Button
                  variant="outlined"
                  onClick={handleSelectAllFiltered}
                  disabled={totalCount === 0 || loading || actionLoading || !selectedConfigName}
                >
                  全件選択
                </Button>
              </span>
            </Tooltip>
            <Tooltip title="すべての選択を解除します">
              <span>
                <Button
                  onClick={handleClearSelection}
                  disabled={selectedObjectIDs.size === 0 || loading || actionLoading || !selectedConfigName}
                  color="error"
                  variant="text"
                  startIcon={<ClearIcon />}
                  sx={{ minWidth: 'auto', padding: '6px 8px', ml: 1 }}
                >
                  選択クリア
                </Button>
              </span>
            </Tooltip>
          </Box>
        </Box>

        {/* --- ローディング中の表示 --- */}
        {(loading || actionLoading) && (<Box sx={{ display: "flex", justifyContent: "center", alignItems: 'center', p: 4, minHeight: TABLE_AREA_MIN_HEIGHT_PX, opacity: 0.5 }}> <CircularProgress /> </Box>)}

        {/* --- テーブル描画エリア --- */}
        {!loading && !actionLoading && selectedConfigName && (
          <>
            {messages.length > 0 ? (
              <TableContainer sx={{ maxHeight: TABLE_AREA_MIN_HEIGHT_PX }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox" sx={{ minWidth: 60 }}></TableCell>
                      <TableCell sx={{ minWidth: 150 }}>ObjectID</TableCell>
                      <TableCell sx={{ minWidth: 120 }}>ErrorNo</TableCell>
                      <TableCell sx={{ minWidth: 100 }}>ErrorType</TableCell>
                      <TableCell sx={{ minWidth: 150 }}>MessageObjectID</TableCell>
                      <TableCell sx={{ minWidth: 200 }}>{langMap?.country1 && langMap.country1.trim() !== '' ? `${langMap.country1} (Country1)` : 'Country1'}</TableCell>
                      <TableCell sx={{ minWidth: 200 }}>{langMap?.country2 && langMap.country2.trim() !== '' ? `${langMap.country2} (Country2)` : 'Country2'}</TableCell>
                      <TableCell sx={{ minWidth: 200 }}>{langMap?.country3 && langMap.country3.trim() !== '' ? `${langMap.country3} (Country3)` : 'Country3'}</TableCell>
                      <TableCell sx={{ minWidth: 200 }}>{langMap?.country4 && langMap.country4.trim() !== '' ? `${langMap.country4} (Country4)` : 'Country4'}</TableCell>
                      <TableCell sx={{ minWidth: 200 }}>{langMap?.country5 && langMap.country5.trim() !== '' ? `${langMap.country5} (Country5)` : 'Country5'}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {messages.map((msg) => (
                      <TableRow key={msg.objectID} hover role="checkbox" tabIndex={-1} selected={selectedObjectIDs.has(msg.objectID)} onClick={() => handleToggleSelect(msg.objectID)} sx={{ cursor: 'pointer' }}>
                        <TableCell padding="checkbox"> <Checkbox color="primary" checked={selectedObjectIDs.has(msg.objectID)} /> </TableCell>
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
            ) : (<Box sx={{ display: "flex", justifyContent: "center", alignItems: 'center', p: 4, minHeight: TABLE_AREA_MIN_HEIGHT_PX, }}> <Typography sx={{ p: 4, textAlign: 'center' }}> {totalCount > 0 ? "このページにはデータがありません。" : "検索条件に一致するデータがありません。"} </Typography> </Box>)}
          </>
        )}

        {/* --- DB未選択表示 --- */}
        {!loading && !actionLoading && !selectedConfigName && (<Box sx={{ display: "flex", justifyContent: "center", alignItems: 'center', p: 4, minHeight: TABLE_AREA_MIN_HEIGHT_PX, }}> <Typography sx={{ fontSize: "1.3rem", p: 4, textAlign: 'center', mb: 20 }}> 環境設定を選択してください </Typography> </Box>)}
      </Paper>
    </Container>
  );
};

export default ErrorMessageDisplay;