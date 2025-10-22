import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import type { DbConfig } from "../types/DbConfig";

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

  // DB設定をローカルストレージから読み込む
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const configs: DbConfig[] = JSON.parse(saved);
      setDbConfigs(configs);
    }
  }, []);

  // データ取得処理 (動的DB接続)
  const handleFetchData = () => {
    const selectedConfig = dbConfigs.find(c => c.name === selectedConfigName);
    if (!selectedConfig) {
      alert("DB接続設定を選択してください");
      return;
    }

    setLoading(true);
    // setLabels([]); // 取得前にリストをクリア
    setSelectedObjectIDs(new Set());

    fetch("http://localhost:8080/api/labels/fetch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(selectedConfig),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`データ取得失敗 (HTTP ${response.status})`);
        }
        return response.json();
      })
      .then((data: SLocalizationLabel[]) => {
        const editableData = data.map(d => ({ ...d, messageId: "" }));
        setLabels(editableData);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        alert(error.message || "データ取得に失敗しました");
        setLabels([]);
        setLoading(false);
      });
  };

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

    navigate("/properties", { state: { labels: updatedLabels } });
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

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedObjectIDs(new Set());
    } else {
      const allObjectIDs = new Set(labels.map(l => l.objectID));
      setSelectedObjectIDs(allObjectIDs);
    }
  };

  const isAllSelected = labels.length > 0 && selectedObjectIDs.size === labels.length;

  return (
    <Container maxWidth="lg" sx={{ mt: 4 , width:1500}}>
      <Paper elevation={3} sx={{ p: 3 , overflowX:'auto'}}>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6">
            メッセージリソース変換
          </Typography>
          <Button
            size="large"
            variant="contained"
            onClick={handleConvert}
            disabled={selectedObjectIDs.size === 0}
          >
            変換
          </Button>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <FormControl sx={{ minWidth: 240, mr: 2 }} size="small">
            <InputLabel id="db-config-select-label">DB接続設定</InputLabel>
            <Select
              labelId="db-config-select-label"
              label="DB接続設定"
              value={selectedConfigName}
              onChange={(e: SelectChangeEvent<string>) => setSelectedConfigName(e.target.value)}
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
          <Button
            sx={{ minWidth: '150px' }}
            variant="outlined"
            onClick={handleFetchData}
            disabled={loading || !selectedConfigName}
          >
            {loading ? <CircularProgress size={24} sx={{mr: 1}} /> : null}
            {loading ? "読み込み中..." : "データ取得"}
          </Button>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 1, minHeight: '30px' }}>
          {labels.length > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mr: 3 }}>
              <strong>{selectedObjectIDs.size} / {labels.length}</strong> 件選択中
            </Typography>
          )}
          <Button 
                onClick={handleSelectAll} 
                size="medium"
                variant="outlined"
                disabled={labels.length === 0}
              >
                {isAllSelected ? '全件解除' : '全件選択'}
          </Button>
        </Box>

          {loading && (
            <Box 
              sx={{ 
                display: "flex", 
                justifyContent: "center", 
                alignItems: 'center',
                p: 4, 
                minHeight: TABLE_AREA_MIN_HEIGHT_PX,
              }}
            >
              <CircularProgress />
            </Box>
          )}
        
        {labels.length > 0 && (
          <TableContainer sx={{ maxHeight: TABLE_AREA_MIN_HEIGHT_PX, }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" sx={{ minWidth: 60 }}>
                  </TableCell>
                  <TableCell sx={{ minWidth: 170 }}>メッセージID</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>Object ID</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>Category</TableCell>
                  <TableCell sx={{ minWidth: 200 }}>Country1</TableCell>
                  <TableCell sx={{ minWidth: 200 }}>Country2</TableCell>
                  <TableCell sx={{ minWidth: 200 }}>Country3</TableCell>
                  <TableCell sx={{ minWidth: 200 }}>Country4</TableCell>
                  <TableCell sx={{ minWidth: 200 }}>Country5</TableCell>
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
                        placeholder="任意で入力"
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
            データを取得してください。
          </Typography>
        </Box>
        )}
      </Paper>
    </Container>
  );
}

export default MessageResourceDisplay;