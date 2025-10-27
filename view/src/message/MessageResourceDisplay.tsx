import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
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

// 型定義
interface PagedResponse<T> { content: T[]; totalElements: number; }
interface SLocalizationLabel { objectID: string; categoryName: string; country1: string; country2?: string; country3?: string; country4?: string; country5?: string; }
interface EditableLabel extends SLocalizationLabel { messageId?: string; }

const LOCAL_STORAGE_KEY = "dbConfigs";
const TABLE_AREA_MIN_HEIGHT_PX = 600;

function MessageResourceDisplay() {
  const [labels, setLabels] = useState<EditableLabel[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  const [dbConfigs, setDbConfigs] = useState<DbConfig[]>([]);
  const [selectedConfigName, setSelectedConfigName] = useState<string>("");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [totalCount, setTotalCount] = useState(0);

  const [selectedObjectIDs, setSelectedObjectIDs] = useState(new Set<string>());

  const [filter, setFilter] = useState({ objectID: "", categoryName: "", message: "" });
  const debouncedFilter = useDebounce(filter, 500);

  const [focusedInputId, setFocusedInputId] = useState<string | null>(null);
  const objectIdInputRef = useRef<HTMLInputElement>(null);
  const categoryInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  // データ取得ロジック
  const fetchData = useCallback(async (configName: string, currentFilter: typeof filter, currentPage: number, currentSize: number, shouldResetSelection: boolean = false) => { const selectedConfig = dbConfigs.find(c => c.name === configName); if (!selectedConfig) { setLabels([]); setTotalCount(0); setSelectedObjectIDs(new Set()); return; } setLoading(true); if (shouldResetSelection) { setSelectedObjectIDs(new Set()); } const { name, languageMap, ...configForBackend } = selectedConfig; const requestBody = { ...configForBackend, filter: currentFilter, page: currentPage, size: currentSize }; try { const response = await fetch("http://localhost:8080/api/labels/fetch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestBody) }); if (!response.ok) throw new Error(`データ取得失敗 (HTTP ${response.status})`); const data: PagedResponse<SLocalizationLabel> = await response.json(); const editableData = data.content.map(d => ({ ...d, messageId: "" })); setLabels(editableData); setTotalCount(data.totalElements); } catch (error: any) { console.error(error); alert(error.message || "データ取得に失敗しました"); setLabels([]); setTotalCount(0); if (shouldResetSelection) setSelectedObjectIDs(new Set()); } finally { setLoading(false); } }, [dbConfigs]);

  // useEffect フック
  useEffect(() => { const saved = localStorage.getItem(LOCAL_STORAGE_KEY); if (saved) { const configs: DbConfig[] = JSON.parse(saved); setDbConfigs(configs); } }, []);
  useEffect(() => { if (selectedConfigName) { setPage(0); fetchData(selectedConfigName, filter, 0, rowsPerPage, true); } else { setLabels([]); setTotalCount(0); setSelectedObjectIDs(new Set()); } /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [selectedConfigName, fetchData]);
  useEffect(() => { if (selectedConfigName) { setPage(0); fetchData(selectedConfigName, debouncedFilter, 0, rowsPerPage, true); } /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [debouncedFilter, selectedConfigName, fetchData]);
  useEffect(() => { if (selectedConfigName) { fetchData(selectedConfigName, filter, page, rowsPerPage, false); } /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [page, rowsPerPage]);
  useEffect(() => { if (!loading && focusedInputId) { let inputToFocus: HTMLInputElement | null = null; switch (focusedInputId) { case 'filter-objectID': inputToFocus = objectIdInputRef.current; break; case 'filter-categoryName': inputToFocus = categoryInputRef.current; break; case 'filter-message': inputToFocus = messageInputRef.current; break; } if (inputToFocus) setTimeout(() => inputToFocus?.focus(), 0); } }, [loading, focusedInputId]);

  const selectedConfig = dbConfigs.find(c => c.name === selectedConfigName);
  const langMap = selectedConfig?.languageMap;

  // メインの変換ボタンハンドラ
  const handleNavigateToConvert = async () => { if (selectedObjectIDs.size === 0) { alert("変換するデータが選択されていません"); return; } if (!selectedConfig) { alert("環境設定を選択してください"); return; } setActionLoading(true); try { const { name, languageMap, ...configForBackend } = selectedConfig; const requestBody = { dbConfig: configForBackend, objectIDs: Array.from(selectedObjectIDs) }; const response = await fetch("http://localhost:8080/api/labels/fetch/by-ids", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestBody), }); if (!response.ok) { throw new Error(`選択データの取得失敗 (HTTP ${response.status})`); } const selectedLabelsData: SLocalizationLabel[] = await response.json(); const updatedLabels = selectedLabelsData.map(label => ({ ...label, messageId: "" })); navigate("/properties", { state: { labels: updatedLabels, languageMap: langMap } }); } catch (error: any) { console.error("選択データの取得または画面遷移エラー:", error); alert(error.message || "処理中にエラーが発生しました"); } finally { setActionLoading(false); } };

  // --- 選択関連ハンドラ ---
  const handleToggleSelect = (objectID: string) => { setSelectedObjectIDs(prevSet => { const newSet = new Set(prevSet); if (newSet.has(objectID)) newSet.delete(objectID); else newSet.add(objectID); return newSet; }); };

  const handleSelectPage = () => {
    const currentPageObjectIDs = labels.map(l => l.objectID);
    setSelectedObjectIDs(prevSet => {
      const newSet = new Set(prevSet);
      currentPageObjectIDs.forEach(id => newSet.add(id));
      return newSet;
    });
  };
  const handleClearSelection = () => { setSelectedObjectIDs(new Set()); };
  const handleSelectAllFiltered = async () => { if (!selectedConfig) { alert("環境設定を選択してください"); return; } setActionLoading(true); try { const { name, languageMap, ...configForBackend } = selectedConfig; const requestBody = { ...configForBackend, filter: filter }; const response = await fetch("http://localhost:8080/api/labels/fetch/ids", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestBody), }); if (!response.ok) { throw new Error(`全IDの取得失敗 (HTTP ${response.status})`); } const allIDs: string[] = await response.json(); setSelectedObjectIDs(new Set(allIDs)); } catch (error: any) { console.error("全ID取得エラー:", error); alert(error.message || "全件選択中にエラーが発生しました"); } finally { setActionLoading(false); } };


  const handleFilterFocus = (event: React.FocusEvent<HTMLInputElement>) => { setFocusedInputId(event.target.id); };
  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => { const { name, value } = event.target; setFilter(prev => ({ ...prev, [name]: value })); };

  const handleChangePage = (_event: unknown, newPage: number) => { setPage(newPage); };
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => { setRowsPerPage(parseInt(event.target.value, 10)); setPage(0); };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, width: 1500 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        メッセージリソース変換
      </Typography>
      <Paper elevation={3} sx={{ p: 3, overflowX: 'auto' }}>

        <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", mb: 2 }}>
          <Tooltip title="チェックボックスで選択したすべての項目（複数ページにまたがる場合も含む）を変換画面に送ります"><span><Button size="large" variant="contained" onClick={handleNavigateToConvert} disabled={selectedObjectIDs.size === 0 || loading || actionLoading}>選択した{selectedObjectIDs.size}件を変換</Button></span></Tooltip>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <FormControl sx={{ minWidth: 240, mr: 2 }} size="small"><InputLabel id="db-config-select-label">環境設定</InputLabel><Select labelId="db-config-select-label" label="環境設定" value={selectedConfigName} onChange={(e: SelectChangeEvent<string>) => setSelectedConfigName(e.target.value)} disabled={loading || actionLoading}><MenuItem value=""><em>-- 選択してください --</em></MenuItem>{dbConfigs.map(config => (<MenuItem key={config.name} value={config.name}>{config.name}</MenuItem>))}</Select></FormControl>{(loading || actionLoading) && <CircularProgress size={24} sx={{ ml: 2 }} />}
        </Box>

        <Paper elevation={1} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, p: 2 }}>
          <SearchIcon color="action" sx={{ mr: 1 }} /><TextField id="filter-objectID" name="objectID" inputRef={objectIdInputRef} label="ObjectID (部分一致)" variant="outlined" size="small" fullWidth value={filter.objectID} onChange={handleFilterChange} onFocus={handleFilterFocus} disabled={loading || actionLoading || !selectedConfigName} /><TextField id="filter-categoryName" name="categoryName" inputRef={categoryInputRef} label="Category (部分一致)" variant="outlined" size="small" fullWidth value={filter.categoryName} onChange={handleFilterChange} onFocus={handleFilterFocus} disabled={loading || actionLoading || !selectedConfigName} /><TextField id="filter-message" name="message" inputRef={messageInputRef} label="メッセージ (部分一致)" variant="outlined" size="small" fullWidth value={filter.message} onChange={handleFilterChange} onFocus={handleFilterFocus} disabled={loading || actionLoading || !selectedConfigName} />
        </Paper>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, minHeight: '52px' }}>
          <Box>
            {totalCount > 0 && !loading &&
              (<TablePagination rowsPerPageOptions={[10, 25, 50, 100]} component="div" count={totalCount} rowsPerPage={rowsPerPage} page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="表示件数:" />)}
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
              disabled={labels.length === 0 || loading || actionLoading || !selectedConfigName}
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
            {labels.length > 0 ? (
              <TableContainer sx={{ maxHeight: TABLE_AREA_MIN_HEIGHT_PX }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox" sx={{ minWidth: 60 }}></TableCell>
                      <TableCell sx={{ minWidth: 170 }}>メッセージID（任意）</TableCell><TableCell sx={{ minWidth: 150 }}>Object ID</TableCell><TableCell sx={{ minWidth: 150 }}>Category</TableCell><TableCell sx={{ minWidth: 200 }}>{langMap?.country1 && langMap.country1.trim() !== '' ? `${langMap.country1} (Country1)` : 'Country1'}</TableCell><TableCell sx={{ minWidth: 200 }}>{langMap?.country2 && langMap.country2.trim() !== '' ? `${langMap.country2} (Country2)` : 'Country2'}</TableCell><TableCell sx={{ minWidth: 200 }}>{langMap?.country3 && langMap.country3.trim() !== '' ? `${langMap.country3} (Country3)` : 'Country3'}</TableCell><TableCell sx={{ minWidth: 200 }}>{langMap?.country4 && langMap.country4.trim() !== '' ? `${langMap.country4} (Country4)` : 'Country4'}</TableCell><TableCell sx={{ minWidth: 200 }}>{langMap?.country5 && langMap.country5.trim() !== '' ? `${langMap.country5} (Country5)` : 'Country5'}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {labels.map((label) => (
                      <TableRow key={label.objectID} hover role="checkbox" tabIndex={-1} selected={selectedObjectIDs.has(label.objectID)} onClick={() => handleToggleSelect(label.objectID)} sx={{ cursor: 'pointer' }}>
                        <TableCell padding="checkbox"> <Checkbox color="primary" checked={selectedObjectIDs.has(label.objectID)} /> </TableCell>
                        <TableCell
                          onClick={(e) => e.stopPropagation()}>
                          <TextField variant="standard" size="small" value={label.messageId ?? ""} placeholder={label.objectID}
                            onChange={(e) => { const newLabels = labels.map((l) => l.objectID === label.objectID ? { ...l, messageId: e.target.value } : l); setLabels(newLabels); }} sx={{ minWidth: 150 }} />

                        </TableCell>
                        <TableCell>{label.objectID}</TableCell><TableCell>{label.categoryName}</TableCell><TableCell>{label.country1}</TableCell><TableCell>{label.country2}</TableCell><TableCell>{label.country3}</TableCell><TableCell>{label.country4}</TableCell><TableCell>{label.country5}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (<Box sx={{ display: "flex", justifyContent: "center", alignItems: 'center', p: 4, minHeight: TABLE_AREA_MIN_HEIGHT_PX, }}>
              <Typography sx={{ p: 4, textAlign: 'center' }}>
                {totalCount > 0 ? "このページにはデータがありません。" : "検索条件に一致するデータがありません。"}
              </Typography>
            </Box>)}
          </>
        )}

        {/* --- DB未選択表示 --- */}
        {!loading && !actionLoading && !selectedConfigName && (<Box sx={{ display: "flex", justifyContent: "center", alignItems: 'center', p: 4, minHeight: TABLE_AREA_MIN_HEIGHT_PX, }}> <Typography sx={{ fontSize: "1.3rem", p: 4, textAlign: 'center', mb: 20 }}> 環境設定を選択してください </Typography> </Box>)}
      </Paper>
    </Container>
  );
}

export default MessageResourceDisplay;