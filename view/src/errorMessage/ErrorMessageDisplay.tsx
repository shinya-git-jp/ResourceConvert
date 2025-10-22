import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ErrorMessage } from "../types/ErrorMessage";
import type { DbConfig } from "../types/DbConfig"; // DbConfig をインポート

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
  type SelectChangeEvent,
} from "@mui/material";

const LOCAL_STORAGE_KEY = "dbConfigs";
const TABLE_AREA_MIN_HEIGHT_PX = 600;

const ErrorMessageDisplay: React.FC = () => {
  const [messages, setMessages] = useState<ErrorMessage[]>([]);
  const [loading, setLoading] = useState(false); // 初期状態 false
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
    // setMessages([]); // クリア
    setSelectedObjectIDs(new Set()); // 選択もクリア

    // APIエンドポイントを /api/error-messages/fetch に変更
    fetch("http://localhost:8080/api/error-messages/fetch", {
      method: "POST", // POSTメソッド
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(selectedConfig), // 選択したDB設定を送信
    })
      .then((response) => {
         if (!response.ok) {
          throw new Error(`データ取得失敗 (HTTP ${response.status})`);
        }
        return response.json();
      })
      .then((data: ErrorMessage[]) => {
        setMessages(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("エラーメッセージ取得失敗:", err);
        alert(err.message || "エラーメッセージ取得失敗");
        setMessages([]); // エラー時はクリア
        setLoading(false);
      });
  };

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
      const allObjectIDs = new Set(messages.map(m => m.objectID));
      setSelectedObjectIDs(allObjectIDs);
    }
  };

  const isAllSelected = messages.length > 0 && selectedObjectIDs.size === messages.length;

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
          {messages.length > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mr: 3 }}>
              <strong>{selectedObjectIDs.size} / {messages.length}</strong> 件選択中
            </Typography>
          )}
          <Button 
            onClick={handleSelectAll} 
            size="medium"
            variant="outlined"
            disabled={messages.length === 0}
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
      
        {!loading && messages.length > 0 && (
          <TableContainer sx={{ maxHeight: TABLE_AREA_MIN_HEIGHT_PX }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" sx={{ minWidth: 60 }}>
                  </TableCell>
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

        {!loading && messages.length === 0 && (
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
};

export default ErrorMessageDisplay;