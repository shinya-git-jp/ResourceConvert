import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  type SelectChangeEvent,
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

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
interface EditableLabel extends SLocalizationLabel {
  messageId?: string; // User-editable key for properties file
}

// --- Constants ---
const LOCAL_STORAGE_KEY = "dbConfigs";
const TABLE_AREA_MIN_HEIGHT_PX = 600;

// --- Component ---
function MessageResourceDisplay() {
  // --- States ---
  const [labels, setLabels] = useState<EditableLabel[]>([]); // Data for the current page
  const [messageIdMap, setMessageIdMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false); // Loading state for fetching data
  const [actionLoading, setActionLoading] = useState(false); // Loading state for button actions (select all, navigate)
  const [dbConfigs, setDbConfigs] = useState<DbConfig[]>([]);
  const [selectedConfigName, setSelectedConfigName] = useState<string>("");
  const [page, setPage] = useState(0); // Current page number (0-based)
  const [rowsPerPage, setRowsPerPage] = useState(25); // Items per page
  const [totalCount, setTotalCount] = useState(0); // Total items matching filter
  const [selectedObjectIDs, setSelectedObjectIDs] = useState(new Set<string>()); // Holds selected IDs across pages
  const [filter, setFilter] = useState({
    objectID: "",
    categoryName: "",
    message: ""
  });
  const [focusedInputId, setFocusedInputId] = useState<string | null>(null); // To restore focus after re-render

  // --- Refs ---
  const objectIdInputRef = useRef<HTMLInputElement>(null);
  const categoryInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  // --- Hooks ---
  const navigate = useNavigate();
  const debouncedFilter = useDebounce(filter, 500); // Debounce filter input

  // --- Data Fetching Logic ---
  const fetchData = useCallback(async (
    configName: string,
    currentFilter: typeof filter,
    currentPage: number,
    currentSize: number,
    shouldResetSelectionAndInputs: boolean = false
  ) => {
    const selectedConfig = dbConfigs.find(c => c.name === configName);
    if (!selectedConfig) {
      setLabels([]);
      setTotalCount(0);
      setSelectedObjectIDs(new Set());
      setMessageIdMap({});
      return;
    }

    setLoading(true);
    if (shouldResetSelectionAndInputs) {
      setSelectedObjectIDs(new Set());
      setMessageIdMap({});
    }

    const { name, languageMap, ...configForBackend } = selectedConfig;
    const requestBody = {
      ...configForBackend,
      filter: currentFilter,
      page: currentPage,
      size: currentSize
    };

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

      setMessageIdMap(prevMap => {
        const dataWithUserInputs = data.content.map(d => ({
          ...d,
          messageId: prevMap[d.objectID] || ""
        }));
        setLabels(dataWithUserInputs);
        setTotalCount(data.totalElements);
        return prevMap;
      });


    } catch (error: any) {
      console.error("Failed to fetch labels:", error);
      alert(error.message || "データ取得に失敗しました");
      setLabels([]);
      setTotalCount(0);
      if (shouldResetSelectionAndInputs) {
        setSelectedObjectIDs(new Set());
        setMessageIdMap({});
      }
    } finally {
      setLoading(false);
    }
  }, [dbConfigs]);

  // --- Effects ---
  // Load DB configurations from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const configs: DbConfig[] = JSON.parse(saved);
        setDbConfigs(configs);
      } catch (e) {
        console.error("Failed to parse DB configs from localStorage", e);
      }
    }
  }, []);


  useEffect(() => {
    if (!selectedConfigName) {
      setLabels([]);
      setTotalCount(0);
      setSelectedObjectIDs(new Set());
      setMessageIdMap({});
      return;
    }
    setPage(0);
    fetchData(selectedConfigName, filter, 0, rowsPerPage, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConfigName]);

  useEffect(() => {
    if (!selectedConfigName) return;
    setPage(0);
    fetchData(selectedConfigName, debouncedFilter, 0, rowsPerPage, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedFilter]);

  useEffect(() => {
    if (!selectedConfigName) return;
    fetchData(selectedConfigName, filter, page, rowsPerPage, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage]);

  // Restore focus to the filter input after data loading finishes
  useEffect(() => {
    if (!loading && focusedInputId) {
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
        setTimeout(() => inputToFocus?.focus(), 0);
      }
    }
  }, [loading, focusedInputId]);

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

      const updatedLabels = selectedLabelsData.map(backendLabel => {
        const messageIdValue = messageIdMap[backendLabel.objectID] || "";
        return {
          ...backendLabel,
          messageId: messageIdValue,
        };
      });

      navigate("/properties", {
        state: { labels: updatedLabels, languageMap: langMap }
      });

    } catch (error: any) {
      console.error("選択データの取得または画面遷移エラー:", error);
      alert(error.message || "処理中にエラーが発生しました");
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
    // setMessageIdMap({});
  };

  const handleSelectAllFiltered = async () => {
    if (!selectedConfig) {
      alert("環境設定を選択してください");
      return;
    }
    setActionLoading(true);
    try {
      const { name, languageMap, ...configForBackend } = selectedConfig;
      const requestBody = { ...configForBackend, filter: filter };

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

  // ページネーションハンドラ (ページ変更)
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // ページネーションハンドラ (表示件数変更)
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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
                      <TableCell sx={{ minWidth: 170 }}>メッセージID（任意）</TableCell>
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
                            value={label.messageId ?? ""}
                            placeholder={label.objectID}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              const objectID = label.objectID;

                              setLabels(currentLabels =>
                                currentLabels.map(l =>
                                  l.objectID === objectID ? { ...l, messageId: newValue } : l
                                )
                              );

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