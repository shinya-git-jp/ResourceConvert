import React, { useEffect, useState } from "react"; // useState, useEffect を追加
import { useNavigate } from "react-router-dom"; // useNavigate を追加
import { Container, Typography, Box, Paper, Button, Grid, Alert } from "@mui/material"; // Button, Grid, Alert などを追加
import StorageIcon from '@mui/icons-material/Storage';
import MessageIcon from '@mui/icons-material/Message';
import ErrorIcon from '@mui/icons-material/SmsFailed';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest'; // 強調用アイコン

const LOCAL_STORAGE_KEY = "dbConfigs"; // DbConnection.tsx と合わせる

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [hasDbConfig, setHasDbConfig] = useState(false); // DB設定があるかどうかの状態

  // マウント時にlocalStorageを確認してDB設定の有無をチェック
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const configs = JSON.parse(saved);
        if (Array.isArray(configs) && configs.length > 0) {
          setHasDbConfig(true);
        }
      } catch (e) {
        console.error("Failed to parse DB configs from localStorage", e);
      }
    }
  }, []);

  const goToDBConnection = () => {
    navigate("/db-connection");
  };

  const goToMessageResource = () => {
    if (!hasDbConfig) {
      alert("先に環境設定を行ってください。");
      navigate("/db-connection");
    } else {
      navigate("/message-resource");
    }
  };

  const goToErrorResource = () => {
    if (!hasDbConfig) {
      alert("先に環境設定を行ってください。");
      navigate("/db-connection");
    } else {
      navigate("/error-messages");
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ textAlign: "center", my: 4 }}>
        <Box
          component="img"
          src="/icon.png"
          alt="Resource Convert Icon"
          sx={{ maxWidth: 150, height: 'auto', mb: 2 }}
        />
        <Typography variant="h3" component="h1" gutterBottom color="#4ab5e2ff">
          Resource Convert
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          データベース内のメッセージリソース・エラーメッセージリソースを指定形式に変換します。
        </Typography>
      </Box>

      {/* DB設定がない場合にアラートを表示 */}
      {!hasDbConfig && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          利用を開始するには、「環境設定」を行ってください。
        </Alert>
      )}

      <Grid container spacing={3} justifyContent="center" alignItems="stretch">
        {/* 環境設定カード */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Paper elevation={2} sx={{ p: 3, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 350 }}>
            <Box>
              <StorageIcon color={hasDbConfig ? "action" : "primary"} sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                環境設定
              </Typography>
              <Typography variant="body2" color="text.secondary">
                データベースへの接続情報、言語設定を
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                登録・編集します。
              </Typography>
            </Box>
            <Button
              variant={hasDbConfig ? "outlined" : "contained"} // 設定がなければ目立たせる
              startIcon={hasDbConfig ? <StorageIcon /> : <SettingsSuggestIcon />}
              onClick={goToDBConnection}
              fullWidth
            >
              {hasDbConfig ? "設定を確認・編集" : "設定を開始する"}
            </Button>
          </Paper>
        </Grid>

        {/* メッセージリソースカード */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Paper elevation={2} sx={{ p: 3, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 350 }}>
            <Box>
              <MessageIcon color="action" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                メッセージリソース変換
              </Typography>
              <Typography variant="body2" color="text.secondary">
                メッセージリソースを
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                .properties 形式に変換します。
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<MessageIcon />}
              onClick={goToMessageResource}
              disabled={!hasDbConfig} // 設定がない場合は無効
              fullWidth
            >
              変換を開始
            </Button>
          </Paper>
        </Grid>

        {/* エラーメッセージカード */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Paper elevation={2} sx={{ p: 3, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 350 }}>
            <Box>
              <ErrorIcon color="action" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                エラーメッセージリソース変換
              </Typography>
              <Typography variant="body2" color="text.secondary">
                エラーメッセージリソースを
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                .xml 形式に変換します。
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<ErrorIcon />}
              onClick={goToErrorResource}
              disabled={!hasDbConfig} // 設定がない場合は無効
              fullWidth
            >
              変換を開始
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Home;