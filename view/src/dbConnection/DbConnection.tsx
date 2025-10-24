import React, { useState, useEffect } from "react";
import type { DbConfig, LanguageMap } from "../types/DbConfig";
import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  TextField,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  Tabs,
  Tab,
} from "@mui/material";


import DeleteIcon from "@mui/icons-material/Delete";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

const LOCAL_STORAGE_KEY = "dbConfigs";

const defaultLanguageMap: LanguageMap = {
  country1: "en",
  country2: "",
  country3: "",
  country4: "",
  country5: "",
};

const DbConnection: React.FC = () => {
  const [configs, setConfigs] = useState<DbConfig[]>([]);
  const [currentConfig, setCurrentConfig] = useState<DbConfig>({
    name: "",
    dbType: "MySQL",
    host: "",
    port: "",
    dbName: "",
    username: "",
    password: "",
    languageMap: defaultLanguageMap,
  });
  const [showPassword, setShowPassword] = useState(false); 
  const [currentTab, setCurrentTab] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      setConfigs(JSON.parse(saved));
    }
  }, []);

  const handleSave = () => {
    if (!currentConfig.name) {
      alert("設定名を入力してください");
      return;
    }
    const updatedConfigs = [
      ...configs.filter((c) => c.name !== currentConfig.name),
      currentConfig,
    ];
    setConfigs(updatedConfigs);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedConfigs));
    alert("保存しました");
  };

  const handleSelect = (name: string) => {
    const selected = configs.find((c) => c.name === name);
    if (selected) {
      setCurrentConfig({
        ...selected,
        port: selected.port ?? '',
        languageMap: selected.languageMap || defaultLanguageMap,
      });
    }
  };

  const handleDelete = (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    if (!window.confirm(`${name} を削除しますか？`)) return;
    const updatedConfigs = configs.filter((c) => c.name !== name);
    setConfigs(updatedConfigs);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedConfigs));
    if (currentConfig.name === name) {
      handleNewSetting();
    }
  };

  const handleTestConnection = async () => {
    if (currentConfig.port === "") {
        alert("ポート番号を入力してください。");
        return;
    }
    try {
      const response = await fetch("http://localhost:8080/api/db/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentConfig),
      });
      const result = await response.text();
      alert(result);
    } catch (error) {
      alert("接続確認中にエラーが発生しました");
      console.error(error);
    }
  };

  const handleNewSetting = () => {
    setCurrentConfig({
      name: "",
      dbType: "MySQL",
      host: "",
      port: "",
      dbName: "",
      username: "",
      password: "",
      languageMap: defaultLanguageMap,
    });
    setCurrentTab(0);
  };

  // フォーム入力の汎用ハンドラ
  const handleChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> |
  { target: { name: string; value: unknown } }
) => {
  const { name, value } = e.target;
  let processedValue: string | number | unknown = value;

  if (name === "port") {
      if (value === "") {
        processedValue = "";
      } else {
         const numValue = Number(value);
         if (!isNaN(numValue)) {
            processedValue = numValue;
         } else {
            processedValue = value;
         }
      }
    } else if (name === "dbType") {
       processedValue = value as string;
    }

  setCurrentConfig({
    ...currentConfig,
    [name]: processedValue as any,
  });
};

  const handleLanguageMapChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentConfig(prev => ({
      ...prev,
      languageMap: {
        ...prev.languageMap,
        [name]: value,
      },
    }));
  };

  const renderForm = () => (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6">
          {currentConfig.name ? "環境設定-修正" : "環境設定-新規"}
        </Typography>
        <Button variant="contained" onClick={handleSave}>
          保存
        </Button>
      </Box>

      <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="データベース設定" />
        <Tab label="言語設定" />
        {/* <Tab label="出力設定" disabled /> */}
      </Tabs>

      {currentTab === 0 && (
        <Box component="form" noValidate autoComplete="off">
          <TextField
            fullWidth
            margin="normal"
            label="設定名"
            name="name"
            value={currentConfig.name}
            onChange={handleChange}
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel id="db-type-label">データベースタイプ</InputLabel>
            <Select
              labelId="db-type-label"
              label="データベースタイプ"
              name="dbType"
              value={currentConfig.dbType}
              onChange={handleChange as any} // Select用
            >
              <MenuItem value="MySQL">MySQL</MenuItem>
              <MenuItem value="PostgreSQL">PostgreSQL</MenuItem>
              <MenuItem value="Oracle">Oracle</MenuItem>
              <MenuItem value="SQLServer">SQLServer</MenuItem>
            </Select>
          </FormControl>

          <Grid container spacing={2}>
            <Grid size={{xs:8}}>
              <TextField
                fullWidth
                margin="normal"
                label="ホスト"
                name="host"
                value={currentConfig.host}
                onChange={handleChange}
              />
            </Grid>
            <Grid size={{xs:4}}>
              <TextField
                fullWidth
                margin="normal"
                label="ポート"
                name="port"
                type="number"
                value={currentConfig.port}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
          
          <TextField
            fullWidth
            margin="normal"
            label="データベース名"
            name="dbName"
            value={currentConfig.dbName}
            onChange={handleChange}
          />
          
          <TextField
            fullWidth
            margin="normal"
            label="ユーザー名"
            name="username"
            value={currentConfig.username}
            onChange={handleChange}
          />
          
          <TextField
            fullWidth
            margin="normal"
            label="パスワード"
            name="password"
            type={showPassword ? "text" : "password"}
            value={currentConfig.password}
            onChange={handleChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    onMouseDown={(e) => e.preventDefault()}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            variant="outlined"
            onClick={handleTestConnection}
            sx={{ mt: 2 }}
          >
            接続確認
          </Button>
        </Box>
      )}
      {currentTab === 1 && (
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            データベースの各カラム（Country1〜5）が、どの言語に対応するかを設定します。
          </Typography>
          <TextField
            fullWidth margin="normal" label="Country1"
            name="country1"
            value={currentConfig.languageMap.country1}
            onChange={handleLanguageMapChange}
            helperText="例: en"
          />
          <TextField
            fullWidth margin="normal" label="Country2"
            name="country2"
            value={currentConfig.languageMap.country2}
            onChange={handleLanguageMapChange}
            helperText="例: ja"
          />
          <TextField
            fullWidth margin="normal" label="Country3"
            name="country3"
            value={currentConfig.languageMap.country3}
            onChange={handleLanguageMapChange}
          />
          <TextField
            fullWidth margin="normal" label="Country4"
            name="country4"
            value={currentConfig.languageMap.country4}
            onChange={handleLanguageMapChange}
          />
          <TextField
            fullWidth margin="normal" label="Country5"
            name="country5"
            value={currentConfig.languageMap.country5}
            onChange={handleLanguageMapChange}
          />
        </Box>
      )}
    </Paper>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Grid container spacing={3}>
        <Grid size={{xs:8, md:4}}>
          <Typography variant="h6" gutterBottom>
            保存済み設定
          </Typography>
          <Button onClick={handleNewSetting} fullWidth variant="outlined" sx={{ mb: 1 }}>
            ＋ 新規
          </Button>
          <Paper sx={{ maxHeight: 500, overflow: 'auto' }}>
            <List component="nav">
              {configs.map((c) => (
                <ListItemButton
                  key={c.name}
                  selected={currentConfig.name === c.name}
                  onClick={() => handleSelect(c.name)}
                >
                  <ListItemText primary={c.name} />
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={(e) => handleDelete(e, c.name)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemButton>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid size ={{xs:12,md:8}}>
          {renderForm()}
        </Grid>
      </Grid>
    </Container>
  );
};

export default DbConnection;