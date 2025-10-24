import React, { useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
// アイコンをインポート
import MenuIcon from '@mui/icons-material/Menu';
import DBIcon from '@mui/icons-material/Storage';
import MessageIcon from '@mui/icons-material/Message';
import ErrorIcon from '@mui/icons-material/SmsFailed';
import HomeIcon from '@mui/icons-material/Home';

const drawerWidth = 320; // メニューの幅

const MainLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // メニュー項目と遷移先
  const menuItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/' },
    { text: '環境設定', icon: <DBIcon />, path: '/db-connection' },
    { text: 'メッセージリソース変換', icon: <MessageIcon />, path: '/message-resource' },
    { text: 'エラーメッセージリソース変換', icon: <ErrorIcon />, path: '/error-messages' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileOpen(false); // メニューを閉じる
  };

  const drawerContent = (
    <Box sx={{ width: drawerWidth }} role="presentation">
      <Toolbar /> {/* AppBarと同じ高さのスペーサー */}
      <List>
        {menuItems.map((item) => (
          <ListItemButton key={item.text} onClick={() => handleNavigation(item.path)}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* CSSの正規化 */}
      <CssBaseline />

      {/* 上部バー */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: '#4ab5e2ff',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          <Box
            component="img"
            src="/icon.png"
            alt="icon"
            sx={{
              height: 'auto',
              width: 80,
              mr: 1.5,
            }}
          />

          <Typography variant="h6" noWrap component="div">
            Resource Convert
          </Typography>
        </Toolbar>
      </AppBar>

      {/* サイドメニュー（Drawer） */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // モバイルでのパフォーマンス向上のため
        }}
        sx={{
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* メインコンテンツ */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar /> {/* AppBarの高さ分だけスペースを空ける */}
        
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout;