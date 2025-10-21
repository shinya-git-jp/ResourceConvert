import React, { useState, useEffect } from "react";
import type { DbConfig } from "../types/DbConfig";

const LOCAL_STORAGE_KEY = "dbConfigs";

const DbConnection: React.FC = () => {
  const [configs, setConfigs] = useState<DbConfig[]>([]);
  const [currentConfig, setCurrentConfig] = useState<DbConfig>({
    name: "",
    dbType: "MySQL",
    host: "",
    port: "" as any,
    dbName: "",
    username: "",
    password: "",
  });

  // 初期ロード
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

    const updatedConfigs = [...configs.filter(c => c.name !== currentConfig.name), currentConfig];
    setConfigs(updatedConfigs);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedConfigs));
    alert("保存しました");
  };

  const handleSelect = (name: string) => {
    const selected = configs.find(c => c.name === name);
    if (selected) setCurrentConfig(selected);
  };

  const handleDelete = (name: string) => {
  if (!window.confirm(`${name} を削除しますか？`)) return;
  const updatedConfigs = configs.filter(c => c.name !== name);
  setConfigs(updatedConfigs);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedConfigs));
  };

  const handleTestConnection = async () => {
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

  return (
    <div style={{ padding: "20px" }}>
      <h2>DB接続設定</h2>

      <div style={{ marginBottom: "10px" }}>
        <label>設定名: 
          <input type="text" value={currentConfig.name} onChange={e => setCurrentConfig({...currentConfig, name: e.target.value})} />
        </label>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label>DBタイプ:
          <select value={currentConfig.dbType} onChange={e => setCurrentConfig({...currentConfig, dbType: e.target.value as "MySQL" | "PostgreSQL"})}>
            <option value="MySQL">MySQL</option>
            <option value="PostgreSQL">PostgreSQL</option>
            <option value="Oracle">Oracle</option>
            <option value="SQLServer">SQLServer</option>
          </select>
        </label>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label>ホスト: 
          <input type="text" value={currentConfig.host} onChange={e => setCurrentConfig({...currentConfig, host: e.target.value})} />
        </label>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label>ポート: 
          <input type="number" value={currentConfig.port} onChange={e => setCurrentConfig({...currentConfig, port: parseInt(e.target.value)})} />
        </label>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label>DB名: 
          <input type="text" value={currentConfig.dbName} onChange={e => setCurrentConfig({...currentConfig, dbName: e.target.value})} />
        </label>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label>ユーザー名: 
          <input type="text" value={currentConfig.username} onChange={e => setCurrentConfig({...currentConfig, username: e.target.value})} />
        </label>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label>パスワード: 
          <input type="password" value={currentConfig.password} onChange={e => setCurrentConfig({...currentConfig, password: e.target.value})} />
        </label>
      </div>
      
      <button onClick={handleTestConnection}>接続確認</button>
      <button onClick={handleSave}>保存</button>
      
      

      <div style={{ marginTop: "20px" }}>
        <h3>保存済み設定</h3>
        {configs.map(c => (
          <div key={c.name}>
            <span>{c.name}</span>
            <button onClick={() => handleSelect(c.name)} style={{ marginLeft: "10px" }}>選択</button>
            <button onClick={() => handleDelete(c.name)} style={{ marginLeft: "10px" }}>削除</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DbConnection;
