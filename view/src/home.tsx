// src/ResourceSelect.tsx
import React from "react";
// import { useNavigate } from "react-router-dom"; // React Router v6想定

// MUIコンポーネントをインポート
import { Container, Typography, Box } from "@mui/material";

const Home: React.FC = () => {
  // const navigate = useNavigate();

  // const goToDBConnection = () => {
  //   navigate("/db-connection");
  // };

  // const goToMessageResource = () => {
  //   navigate("/message-resource");
  // };

  // const goToErrorResource = () => {
  //   navigate("/error-messages");
  // };

  return (
    <Container>
      <Box sx={{ textAlign: "center", marginTop: "20px" }}>
        <Typography variant="h3" component="h2" gutterBottom color="primary">
          Resource Convert
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom>
          ようこそ
        </Typography>
        <Typography variant="body1">
          サイドメニューから操作を選択してください。
        </Typography>
      </Box>
    </Container>
  );
};

export default Home;