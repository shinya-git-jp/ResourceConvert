import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { ErrorMessage } from "../types/ErrorMessage";
import type { DbConfig } from "../types/DbConfig";
import useDebounce from "../hooks/useDebounce";

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

const LOCAL_STORAGE_KEY = "dbConfigs";
const TABLE_AREA_MIN_HEIGHT_PX = 600;

const ErrorMessageDisplay: React.FC = () => {
  const [messages, setMessages] = useState<ErrorMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  const [dbConfigs, setDbConfigs] = useState<DbConfig[]>([]);
  const [selectedConfigName, setSelectedConfigName] = useState<string>("");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);

  const [selectedObjectIDs, setSelectedObjectIDs] = useState(new Set<string>());

  const [filter, setFilter] = useState({ objectID: "", errorNo: "", errorType: "", message: "" });
  const debouncedFilter = useDebounce(filter, 500);

  const [focusedInputId, setFocusedInputId] = useState<string | null>(null);
  const objectIdInputRef = useRef<HTMLInputElement>(null);
  const errorNoInputRef = useRef<HTMLInputElement>(null);
  const errorTypeInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  // データ取得ロジック (useCallback の依存配列は dbConfigs のみ)
  const fetchData = useCallback(async (
    configName: string,
    currentFilter: typeof filter,
    currentPage: number,
    currentSize: number,
    shouldResetSelection: boolean = false
  ) => {
    const selectedConfig = dbConfigs.find(c => c.name === configName);
    if (!selectedConfig) {
      setMessages([]);
      setTotalCount(0);
      setSelectedObjectIDs(new Set()); // ★ 設定がない場合もクリア
      return;
    }
    setLoading(true);
    if (shouldResetSelection) {
      setSelectedObjectIDs(new Set());
    }
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
      if (shouldResetSelection) setSelectedObjectIDs(new Set()); // ★ エラー時もリセット
    } finally {
      setLoading(false);
    }
  }, [dbConfigs]); // ★ 依存配列は dbConfigs のみ

  // --- useEffect フック ---

  // ローカルストレージからDB設定を読み込み
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try { // ★ try-catch を追加
        const configs: DbConfig[] = JSON.parse(saved);
        setDbConfigs(configs);
      } catch (e) {
        console.error("Failed to parse DB configs from localStorage", e);
      }
    }
  }, []);

  // DB設定変更時にデータを取得 (選択状態をリセット)
  useEffect(() => {
    if (!selectedConfigName) {
      setMessages([]);
      setTotalCount(0);
      setSelectedObjectIDs(new Set());
      return;
    }
    setPage(0); // DB設定変更時は0ページ目に戻す
    fetchData(selectedConfigName, filter, 0, rowsPerPage, true); // ★ リセット true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConfigName]); // ★ 依存配列は selectedConfigName のみ

  // フィルター変更時にデータを取得 (選択状態を保持)
  useEffect(() => {
    if (!selectedConfigName) return; // DB設定がない場合は何もしない
    setPage(0); // フィルター変更時は0ページ目に戻す
    // ★ 修正点: フィルター変更時は選択状態をリセットしない (false)
    fetchData(selectedConfigName, debouncedFilter, 0, rowsPerPage, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedFilter]); // ★ 依存配列は debouncedFilter のみ

  // ページネーション変更時にデータを取得 (選択状態を保持)
  useEffect(() => {
    if (!selectedConfigName) return; // DB設定がない場合は何もしない
    fetchData(selectedConfigName, filter, page, rowsPerPage, false); // ★ リセット false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage]); // ★ 依存配列は page, rowsPerPage のみ

  // フォーカス復元ロジック (変更なし)
  useEffect(() => { if (!loading && focusedInputId) { let inputToFocus: HTMLInputElement | null = null; switch (focusedInputId) { case 'filter-error-objectID': inputToFocus = objectIdInputRef.current; break; case 'filter-errorNo': inputToFocus = errorNoInputRef.current; break; case 'filter-errorType': inputToFocus = errorTypeInputRef.current; break; case 'filter-errorMessage': inputToFocus = messageInputRef.current; break; } if (inputToFocus) setTimeout(() => inputToFocus?.focus(), 0); } }, [loading, focusedInputId]);

  // --- Derived State ---
  const selectedConfig = dbConfigs.find(c => c.name === selectedConfigName);
  const langMap = selectedConfig?.languageMap;

  // --- Handlers ---

  // メインの変換ボタンハンドラ (変更なし)
  const handleNavigateToConvert = async () => { if (selectedObjectIDs.size === 0) { alert("変換するデータが選択されていません"); return; } if (!selectedConfig) { alert("環境設定を選択してください"); return; } setActionLoading(true); try { const { name, languageMap, ...configForBackend } = selectedConfig; const requestBody = { dbConfig: configForBackend, objectIDs: Array.from(selectedObjectIDs) }; const response = await fetch("http://localhost:8080/api/error-messages/fetch/by-ids", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestBody), }); if (!response.ok) { throw new Error(`選択データの取得失敗 (HTTP ${response.status})`); } const selectedMessagesData: ErrorMessage[] = await response.json(); navigate("/error-messages-xml", { state: { messages: selectedMessagesData, languageMap: langMap } }); } catch (error: any) { console.error("選択データの取得または画面遷移エラー:", error); alert(error.message || "処理中にエラーが発生しました"); } finally { setActionLoading(false); } };

  // 選択関連ハンドラ (変更なし)
  const handleToggleSelect = (objectID: string) => { setSelectedObjectIDs(prevSet => { const newSet = new Set(prevSet); if (newSet.has(objectID)) newSet.delete(objectID); else newSet.add(objectID); return newSet; }); };
  const handleSelectPage = () => { const currentPageObjectIDs = messages.map(m => m.objectID); setSelectedObjectIDs(prevSet => { const newSet = new Set(prevSet); currentPageObjectIDs.forEach(id => newSet.add(id)); return newSet; }); };
  const handleClearSelection = () => { setSelectedObjectIDs(new Set()); };
  const handleSelectAllFiltered = async () => { if (!selectedConfig) { alert("環境設定を選択してください"); return; } setActionLoading(true); try { const { name, languageMap, ...configForBackend } = selectedConfig; const requestBody = { ...configForBackend, filter: filter }; const response = await fetch("http://localhost:8080/api/error-messages/fetch/ids", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestBody), }); if (!response.ok) { throw new Error(`全IDの取得失敗 (HTTP ${response.status})`); } const allIDs: string[] = await response.json(); setSelectedObjectIDs(new Set(allIDs)); } catch (error: any) { console.error("全ID取得エラー:", error); alert(error.message || "全件選択中にエラーが発生しました"); } finally { setActionLoading(false); } };

  // フィルターハンドラ (変更なし)
  const handleFilterFocus = (event: React.FocusEvent<HTMLInputElement>) => { setFocusedInputId(event.target.id); };
  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => { const { name, value } = event.target; setFilter(prev => ({ ...prev, [name]: value })); };

  // ページネーションハンドラ (変更なし)
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