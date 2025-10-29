import { useEffect, useState, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../App.css"; // 必要であればスタイルを適用
import type { DbConfig, LanguageMap } from "../types/DbConfig";
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
  InputAdornment,
  IconButton,
  type SelectChangeEvent,
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

// --- Type Definitions ---
interface PagedResponse<T> {
  content: T[];
  totalElements: number;
}
interface SLocalizationLabel {
  objectID: string;
  categoryName: string;
  country1: string;
  country2?: string;
  country3?: string;
  country4?: string;
  country5?: string;
}
// EditableLabel は不要

// filter state の型を明示的に定義
interface FilterState {
  objectID: string;
  categoryName: string;
  message: string;
}

// 保存する状態の型
interface DisplayStateToSave {
  selectedConfigName: string;
  page: number;
  rowsPerPage: number;
  filter: FilterState; // typeof filter の代わりに FilterState を使用
  selectedObjectIDs: string[]; // Set は JSON にできないため Array で保存
  messageIdMap: Record<string, string>;
}


// --- Constants ---
const LOCAL_STORAGE_KEY = "dbConfigs";
const SESSION_STORAGE_KEY = "messageDisplayState"; // sessionStorage 用のキー
const TABLE_AREA_MIN_HEIGHT_PX = 600;

// --- Component ---
function MessageResourceDisplay() {
  // --- States ---
  const [selectedConfigName, setSelectedConfigName] = useState<string>("");
  const [selectedObjectIDs, setSelectedObjectIDs] = useState(new Set<string>());
  const [messageIdMap, setMessageIdMap] = useState<Record<string, string>>({}); // メッセージIDの入力値を保持

  const [labels, setLabels] = useState<SLocalizationLabel[]>([]); // API から取得したデータ
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [dbConfigs, setDbConfigs] = useState<DbConfig[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState<FilterState>({ // useState に FilterState 型を適用
    objectID: "",
    categoryName: "",
    message: ""
  });
  const [focusedInputId, setFocusedInputId] = useState<string | null>(null); // To restore focus after re-render
  const [isRestored, setIsRestored] = useState<boolean | null>(null); // 状態復元フラグ (初期値 null)

  // --- Refs ---
  const objectIdInputRef = useRef<HTMLInputElement>(null);
  const categoryInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  // --- Hooks ---
  const navigate = useNavigate();
  const location = useLocation();
  const debouncedFilter = useDebounce(filter, 500);

  // --- Data Fetching Logic ---
  const fetchData = useCallback(async (
    configName: string,
    currentFilter: FilterState,
    currentPage: number,
    currentSize: number
  ) => {
    const selectedConfig = dbConfigs.find(c => c.name === configName);
    if (!selectedConfig) return;

    // フェッチ開始時にフォーカスIDクリア (ただし、メッセージID入力欄編集中は維持する可能性も考慮)
    // if (!focusedInputId?.startsWith('messageId-')) { // もしフィルター入力中にフェッチが走るなら
    //    setFocusedInputId(null);
    // }
    setLoading(true);

    const { name, languageMap, ...configForBackend } = selectedConfig;
    const requestBody = { ...configForBackend, filter: currentFilter, page: currentPage, size: currentSize };

    try {
      const response = await fetch("http://localhost:8080/api/labels/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`データ取得失敗 (HTTP ${response.status})`);
      }

      const data: PagedResponse<SLocalizationLabel> = await response.json();
      setLabels(data.content); // APIからのデータをそのままセット
      setTotalCount(data.totalElements);
      // messageIdMap はここでは更新しない (入力値は保持される)

    } catch (error: any) {
      console.error("Failed to fetch labels:", error);
      alert(error.message || "データ取得に失敗しました");
      setLabels([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
    // dbConfigs の変更時のみ関数を再生成
  }, [dbConfigs]);

  // --- Effects ---
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
        setMessageIdMap(savedState.messageIdMap);
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        console.log("State restored from sessionStorage:", savedState);
        restored = true;
      } catch (e) {
        console.error("Failed to parse state from sessionStorage", e);
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }
    setIsRestored(restored); // 復元成否をマーク

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]); // ブラウザバックでもトリガー

  // Fetch data when parameters change AFTER initial load/restore is determined
  useEffect(() => {
    // 復元処理が終わっていない場合は何もしない
    if (isRestored === null) return;

    // 設定が選択されていない場合
    if (!selectedConfigName) {
      setLabels([]);
      setTotalCount(0);
      // 復元されていない場合（通常の初期表示 or 設定クリア時）は選択と入力をクリア
      if (!isRestored) {
        setSelectedObjectIDs(new Set());
        setMessageIdMap({});
      }
      return;
    }

    // 状態復元直後 or パラメータ変更時にデータ取得
    // debouncedFilter を使ってフェッチする
    fetchData(selectedConfigName, debouncedFilter, page, rowsPerPage);

  }, [selectedConfigName, debouncedFilter, page, rowsPerPage, isRestored, fetchData]);

  // Debounced filter effect: reset page only
  useEffect(() => {
    // 復元時や設定未選択時は何もしない
    if (isRestored === null || !selectedConfigName) return;
    // フィルター入力が完了したらページをリセット
    // 簡易的な比較。厳密にはオブジェクト比較が必要な場合も
    if (JSON.stringify(filter) !== JSON.stringify(debouncedFilter)) {
      setPage(0);
    }
  }, [debouncedFilter, isRestored, selectedConfigName, filter]);

  // Restore focus to filter input
  useEffect(() => {
    // ローディング中や、復元直後は何もしない
    if (loading || isRestored === null) return;

    if (focusedInputId && focusedInputId.startsWith('filter-')) {
      let inputToFocus: HTMLInputElement | null = null;
      switch (focusedInputId) {
        case 'filter-objectID':
          inputToFocus = objectIdInputRef.current; break;
        case 'filter-categoryName':
          inputToFocus = categoryInputRef.current; break;
        case 'filter-message':
          inputToFocus = messageInputRef.current; break;
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
    // isRestored も依存配列に追加して、復元直後にフォーカスが当たらないようにする
  }, [loading, focusedInputId, isRestored]);

  // --- Derived State ---
  const selectedConfig = dbConfigs.find(c => c.name === selectedConfigName);
  const langMap = selectedConfig?.languageMap;

  // --- Handlers ---
  const handleNavigateToConvert = async () => {
    if (selectedObjectIDs.size === 0) {
      alert("変換するデータが選択されていません");
      return;
    }
    if (!selectedConfig) {
      alert("環境設定を選択してください");
      return;
    }

    // sessionStorage に現在の状態を保存
    const stateToSave: DisplayStateToSave = {
      selectedConfigName,
      page,
      rowsPerPage,
      filter,
      selectedObjectIDs: Array.from(selectedObjectIDs),
      messageIdMap
    };
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(stateToSave));
      console.log("State saved to sessionStorage:", stateToSave);
    } catch (e) {
      console.error("Failed to save state to sessionStorage", e);
      alert("画面状態の保存に失敗しました。");
      return;
    }


    setActionLoading(true);
    try {
      const { name, languageMap, ...configForBackend } = selectedConfig;
      const requestBody = {
        dbConfig: configForBackend,
        objectIDs: Array.from(selectedObjectIDs)
      };

      const response = await fetch("http://localhost:8080/api/labels/fetch/by-ids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let errorText = `選択データの取得失敗 (HTTP ${response.status})`;
        try { const errorData = await response.text(); if (errorData) errorText += `: ${errorData}`; } catch (_) { }
        throw new Error(errorText);
      }

      const selectedLabelsData: SLocalizationLabel[] = await response.json();

      const updatedLabels = selectedLabelsData.map(backendLabel => ({
        ...backendLabel,
        messageId: messageIdMap[backendLabel.objectID] || "",
      }));

      navigate("/properties", {
        state: { labels: updatedLabels, languageMap: langMap }
      });

    } catch (error: any) {
      console.error("選択データの取得または画面遷移エラー:", error);
      alert(error.message || "処理中にエラーが発生しました");
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } finally {
      setActionLoading(false);
    }
  };

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

  const handleSelectPage = () => {
    const currentPageObjectIDs = labels.map(l => l.objectID);
    setSelectedObjectIDs(prevSet => {
      const newSet = new Set(prevSet);
      currentPageObjectIDs.forEach(id => newSet.add(id));
      return newSet;
    });
  };

  const handleClearSelection = () => {
    setSelectedObjectIDs(new Set());
    // setMessageIdMap({}); // 必要に応じてコメント解除
  };

  const handleSelectAllFiltered = async () => {
    if (!selectedConfig) {
      alert("環境設定を選択してください");
      return;
    }
    setActionLoading(true);
    try {
      const { name, languageMap, ...configForBackend } = selectedConfig;
      // ★ filter ではなく debouncedFilter を使う（ユーザー入力を待ってから実行）
      const requestBody = { ...configForBackend, filter: debouncedFilter };

      const response = await fetch("http://localhost:8080/api/labels/fetch/ids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let errorText = `全IDの取得失敗 (HTTP ${response.status})`;
        try { const errorData = await response.text(); if (errorData) errorText += `: ${errorData}`; } catch (_) { }
        throw new Error(errorText);
      }
      const allIDs: string[] = await response.json();
      setSelectedObjectIDs(new Set(allIDs));

    } catch (error: any) {
      console.error("Error fetching all filtered IDs:", error);
      alert(error.message || "全件選択中にエラーが発生しました");
    } finally {
      setActionLoading(false);
    }
  };

  // フィルター入力ハンドラ (フォーカス記憶)
  const handleFilterFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    setFocusedInputId(event.target.id);
  };

  // フィルター入力ハンドラ (値更新)
  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFilter(prev => ({ ...prev, [name]: value }));
  };

  //フィルタークリアボタンのハンドラ
  const handleClearFilterField = (fieldName: keyof FilterState) => {
    setFilter(prev => ({ ...prev, [fieldName]: '' }));
    // 対応する input 要素にフォーカスを戻す
    switch (fieldName) {
      case 'objectID': objectIdInputRef.current?.focus(); break;
      case 'categoryName': categoryInputRef.current?.focus(); break;
      case 'message': messageInputRef.current?.focus(); break;
    }
  };

  // ページネーションハンドラ (ページ変更)
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // ページネーションハンドラ (表示件数変更)
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // 表示件数変更時は必ず0ページ目に戻す
  };

  // テーブルヘッダー言語名取得ヘルパー
  const getLangHeader = (key: keyof LanguageMap): string => {
    const mappedName = langMap?.[key];
    const defaultName = key.charAt(0).toUpperCase() + key.slice(1);
    return (mappedName && mappedName.trim() !== '') ? `${mappedName} (${defaultName})` : defaultName;
  }


  // --- Render ---
  return (
    <Container maxWidth="lg" sx={{ mt: 4, width: 1500 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        メッセージリソース変換
      </Typography>
      <Paper elevation={3} sx={{ p: 3, overflowX: 'auto' }}>

        {/* --- Top Action Button --- */}
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

        {/* --- DB Selection & Loading Indicator --- */}
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
              {dbConfigs.map(config => (
                <MenuItem key={config.name} value={config.name}>
                  {config.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {(loading || actionLoading) && <CircularProgress size={24} sx={{ ml: 2 }} />}
        </Box>

        {/* --- Filter Inputs --- */}
        <Paper
          elevation={1}
          sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, p: 2, flexWrap: 'wrap' }}
        >
          <SearchIcon color="action" sx={{ mr: 1, flexShrink: 0 }} />
          <TextField
            id="filter-objectID"
            name="objectID"
            inputRef={objectIdInputRef}
            label="ObjectID"
            variant="outlined"
            size="small"
            sx={{ flexGrow: 1, minWidth: '150px' }}
            value={filter.objectID}
            onChange={handleFilterChange}
            onFocus={handleFilterFocus}
            disabled={loading || actionLoading || !selectedConfigName}
            InputProps={{
              endAdornment: filter.objectID ? (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="clear objectID filter"
                    onClick={() => handleClearFilterField('objectID')}
                    edge="end"
                    size="small"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />
          <TextField
            id="filter-categoryName"
            name="categoryName"
            inputRef={categoryInputRef}
            label="Category"
            variant="outlined"
            size="small"
            sx={{ flexGrow: 1, minWidth: '150px' }}
            value={filter.categoryName}
            onChange={handleFilterChange}
            onFocus={handleFilterFocus}
            disabled={loading || actionLoading || !selectedConfigName}
            InputProps={{
              endAdornment: filter.categoryName ? (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="clear categoryName filter"
                    onClick={() => handleClearFilterField('categoryName')}
                    edge="end"
                    size="small"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />
          <TextField
            id="filter-message"
            name="message"
            inputRef={messageInputRef}
            label="メッセージ"
            variant="outlined"
            size="small"
            sx={{ flexGrow: 2, minWidth: '200px' }}
            value={filter.message}
            onChange={handleFilterChange}
            onFocus={handleFilterFocus}
            disabled={loading || actionLoading || !selectedConfigName}
            InputProps={{
              endAdornment: filter.message ? (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="clear message filter"
                    onClick={() => handleClearFilterField('message')}
                    edge="end"
                    size="small"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />
        </Paper>

        {/* --- Pagination (Left) & Selection Actions (Right) --- */}
        <Box
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, minHeight: '52px', flexWrap: 'wrap', gap: 2 }}
        >
          {/* Left: Pagination */}
          <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: { xs: 'center', md: 'flex-start' } }}>
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
                sx={{ '.MuiTablePagination-toolbar': { pl: { xs: 0, sm: 2 } }, '.MuiTablePagination-spacer': { display: { xs: 'none', sm: 'block' } } }}
              />
            )}
          </Box>

          {/* Right: Selection Buttons & Count */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
            {selectedConfigName && (
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: '100px', textAlign: 'right', mr: 1 }}>
                合計 <strong>{selectedObjectIDs.size}</strong> 件選択中
              </Typography>
            )}
            {/* Page Select Button */}
            <Button
              variant="outlined"
              onClick={handleSelectPage}
              disabled={labels.length === 0 || loading || actionLoading || !selectedConfigName}
            >
              このページを選択
            </Button>
            {/* Filter Select Button */}
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
            {/* Clear Button */}
            <Tooltip title="すべての選択を解除します">
              <span>
                <Button
                  onClick={handleClearSelection}
                  disabled={selectedObjectIDs.size === 0 || loading || actionLoading || !selectedConfigName}
                  color="error"
                  variant="text"
                  startIcon={<ClearIcon fontSize="small" />}
                  sx={{ minWidth: 'auto', padding: '5px 6px', ml: 1 }}
                >
                  選択クリア
                </Button>
              </span>
            </Tooltip>
          </Box>
        </Box>

        {/* --- Loading Overlay --- */}
        {(loading || actionLoading) && (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: 'center', p: 4, minHeight: TABLE_AREA_MIN_HEIGHT_PX, opacity: 0.5 }}>
            <CircularProgress />
          </Box>
        )}

        {/* --- Table Area --- */}
        {!loading && !actionLoading && selectedConfigName && (
          <>
            {labels.length > 0 ? (
              <TableContainer sx={{ maxHeight: TABLE_AREA_MIN_HEIGHT_PX }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox" sx={{ width: '60px' }}></TableCell>
                      <TableCell sx={{ minWidth: 170 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          メッセージID(任意)
                          <Tooltip title="Propertiesファイルのキーとして使用するIDです。未入力の場合はObjectIDが使用されます。">
                            <HelpOutlineIcon sx={{ fontSize: '1rem', ml: 0.5, color: 'text.secondary', cursor: 'help' }} />
                          </Tooltip>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ minWidth: 150 }}>Object ID</TableCell>
                      <TableCell sx={{ minWidth: 150 }}>Category</TableCell>
                      <TableCell sx={{ minWidth: 200 }}>{getLangHeader('country1')}</TableCell>
                      <TableCell sx={{ minWidth: 200 }}>{getLangHeader('country2')}</TableCell>
                      <TableCell sx={{ minWidth: 200 }}>{getLangHeader('country3')}</TableCell>
                      <TableCell sx={{ minWidth: 200 }}>{getLangHeader('country4')}</TableCell>
                      <TableCell sx={{ minWidth: 200 }}>{getLangHeader('country5')}</TableCell>
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
                            size="small"
                          />
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <TextField
                            variant="standard"
                            size="small"
                            value={messageIdMap[label.objectID] ?? ""}
                            placeholder={label.objectID}
                            onFocus={(_e) => setFocusedInputId(null)} // フォーカス復元を抑制
                            onChange={(e) => {
                              const newValue = e.target.value;
                              const objectID = label.objectID;
                              // messageIdMap のみ更新
                              setMessageIdMap(currentMap => ({
                                ...currentMap,
                                [objectID]: newValue,
                              }));
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
            ) : (
              // No Data Message
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: 'center', p: 4, minHeight: TABLE_AREA_MIN_HEIGHT_PX }}>
                <Typography sx={{ p: 4, textAlign: 'center' }}>
                  {totalCount > 0 ? "このページにはデータがありません。" : "検索条件に一致するデータがありません。"}
                </Typography>
              </Box>
            )}
          </>
        )}

        {/* --- DB Not Selected Message --- */}
        {!loading && !actionLoading && !selectedConfigName && (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: 'center', p: 4, minHeight: TABLE_AREA_MIN_HEIGHT_PX }}>
            <Typography sx={{ fontSize: "1.3rem", p: 4, textAlign: 'center', mb: 20 }}>
              環境設定を選択してください
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
}

export default MessageResourceDisplay;