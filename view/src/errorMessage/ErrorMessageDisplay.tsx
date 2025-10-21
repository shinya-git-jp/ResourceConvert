// src/errorMessage/ErrorMessageDisplay.tsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ErrorMessage } from "../types/ErrorMessage";
import type { DbConfig } from "../types/DbConfig"; // DbConfig をインポート

const LOCAL_STORAGE_KEY = "dbConfigs";

const ErrorMessageDisplay: React.FC = () => {
  const [messages, setMessages] = useState<ErrorMessage[]>([]);
  const [loading, setLoading] = useState(false); // 初期状態 false
  const navigate = useNavigate();

  // DB接続設定関連の state
  const [dbConfigs, setDbConfigs] = useState<DbConfig[]>([]);
  const [selectedConfigName, setSelectedConfigName] = useState<string>("");

  // DB設定をローカルストレージから読み込む
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const configs: DbConfig[] = JSON.parse(saved);
      setDbConfigs(configs);
      if (configs.length > 0) {
        setSelectedConfigName(configs[0].name); // デフォルトで最初の設定を選択
      }
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
    setMessages([]); // クリア

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
      .then((data) => {
        setMessages(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("エラーメッセージ取得失敗:", err);
        alert(err.message || "エラーメッセージ取得失敗");
        setLoading(false);
      });
  };



  const handleNavigateToConvert = () => {
    navigate("/error-messages-xml", { state: { messages: messages } });
  };


  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">エラーメッセージリソース</h2>
      
      <div style={{ marginBottom: "16px" }}>
        <label>DB接続設定:
          <select
            value={selectedConfigName}
            onChange={(e) => setSelectedConfigName(e.target.value)}
            style={{ marginLeft: "8px", marginRight: "8px" }}
          >
            <option value="">-- 選択してください --</option>
            {dbConfigs.map(config => (
              <option key={config.name} value={config.name}>
                {config.name}
              </option>
            ))}
          </select>
        </label>
        <button onClick={handleFetchData} disabled={loading || !selectedConfigName}>
          {loading ? "読み込み中..." : "データ取得"}
        </button>
      </div>

      <button 
        onClick={handleNavigateToConvert}
        disabled={messages.length === 0}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded">変換</button>
      
      {loading && <div className="p-4">読み込み中...</div>}
      
      {!loading && messages.length > 0 && (
        <table className="w-full border-collapse border border-gray-400 text-sm">
          {/* ... (thead/tbody の内容は変更なし) ... */}
          <thead className="bg-gray-200">
            <tr>
              <th className="border border-gray-400 p-2">ObjectID</th>
              <th className="border border-gray-400 p-2">ErrorNo</th>
              <th className="border border-gray-400 p-2">ErrorType</th>
              <th className="border border-gray-400 p-2">MessageObjectID</th>
              <th className="border border-gray-400 p-2">country1</th>
              <th className="border border-gray-400 p-2">country2</th>
              <th className="border border-gray-400 p-2">country3</th>
              <th className="border border-gray-400 p-2">country4</th>
              <th className="border border-gray-400 p-2">country5</th>
            </tr>
          </thead>
          <tbody>
            {messages.map((msg) => (
              <tr key={msg.objectID} className="hover:bg-gray-100">
                <td className="border border-gray-400 p-2">{msg.objectID}</td>
                <td className="border border-gray-400 p-2">{msg.errorNo}</td>
                <td className="border border-gray-400 p-2">{msg.errorType}</td>
                <td className="border border-gray-400 p-2">{msg.messageObjectID}</td>
                <td className="border border-gray-400 p-2">{msg.country1}</td>
                <td className="border border-gray-400 p-2">{msg.country2}</td>
                <td className="border border-gray-400 p-2">{msg.country3}</td>
                <td className="border border-gray-400 p-2">{msg.country4}</td>
                <td className="border border-gray-400 p-2">{msg.country5}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!loading && messages.length === 0 && (
          <p>データを取得してください。</p>
      )}
    </div>
  );
};

export default ErrorMessageDisplay;