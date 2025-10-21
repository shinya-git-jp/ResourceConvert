// src/ResourceSelect.tsx
import React from "react";
import { useNavigate } from "react-router-dom"; // React Router v6想定

const Home: React.FC = () => {
  const navigate = useNavigate();

  const goToDBConnection = () => {
    navigate("/db-connection");
  };

  const goToMessageResource = () => {
    navigate("/message-resource");
  };

  const goToErrorResource = () => {
    navigate("/error-messages");
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Home</h2>
      <button onClick={goToDBConnection} style={{ margin: "10px" }}>
        DB接続設定
      </button>
      <button onClick={goToMessageResource} style={{ margin: "10px" }}>
        メッセージリソース
      </button>
      <button onClick={goToErrorResource} style={{ margin: "10px" }}>
        エラーメッセージリソース
      </button>
    </div>
  );
};

export default Home;
