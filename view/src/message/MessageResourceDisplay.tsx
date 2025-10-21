import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import type { DbConfig } from "../types/DbConfig"; // DbConfig をインポート

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

function MessageResourceDisplay() {
  const [labels, setLabels] = useState<EditableLabel[]>([]);
  const [loading, setLoading] = useState(false); // 初期状態は false に
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
    setLabels([]); // 取得前にリストをクリア
    setSelectedObjectIDs(new Set());

    // DB接続情報をPOSTで送信する
    fetch("http://localhost:8080/api/labels/fetch", {
      method: "POST", // POSTメソッドに変更
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
      .then((data: SLocalizationLabel[]) => {
        // EditableLabel に変換 (messageId を空で初期化)
        const editableData = data.map(d => ({ ...d, messageId: "" }));
        setLabels(editableData);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        alert(error.message || "データ取得に失敗しました");
        setLoading(false);
      });
  };

  // 変換画面への遷移
  const handleConvert = () => {
    // 選択されているラベルのみをフィルタリング
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
    if (selectedObjectIDs.size === labels.length) {
      setSelectedObjectIDs(new Set());
    } else {
      const allObjectIDs = new Set(labels.map(l => l.objectID));
      setSelectedObjectIDs(allObjectIDs);
    }
  };

  const isAllSelected = labels.length > 0 && selectedObjectIDs.size === labels.length;

  return (
    <div className="App">
      <h2>メッセージリソース</h2>

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

      <div style={{ margin: "10px 0", display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: "90%" }}>
        <button 
          onClick={handleConvert} 
          disabled={selectedObjectIDs.size === 0}
        >
          変換
        </button>
        <div>
          <button onClick={handleSelectAll} disabled={labels.length === 0} style={{ marginRight: "10px" }}>
            {isAllSelected ? "全解除" : "全選択"}
          </button>
          <strong>{selectedObjectIDs.size} / {labels.length} 件選択中</strong>
        </div>
      </div>

      {loading && <div className="p-4">読み込み中...</div>}
      
      {!loading && labels.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>メッセージID</th>
              <th>Object ID</th>
              <th>Category</th>
              <th>Country1</th>
              <th>Country2</th>
              <th>Country3</th>
              <th>Country4</th>
              <th>Country5</th>
            </tr>
          </thead>
          <tbody>
            {labels.map((label) => (
            <tr key={label.objectID}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedObjectIDs.has(label.objectID)}
                  onChange={() => handleToggleSelect(label.objectID)}
                />
              </td>
              <td>
                <input
                  type="text"
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
                />
              </td>
              <td>{label.objectID}</td>
              <td>{label.categoryName}</td>
              <td>{label.country1}</td>
              <td>{label.country2}</td>
              <td>{label.country3}</td>
              <td>{label.country4}</td>
              <td>{label.country5}</td>
            </tr>
          ))}
          </tbody>
        </table>
      )}
      {!loading && labels.length === 0 && (
          <p>データを取得してください。</p>
      )}
    </div>
  );
}

export default MessageResourceDisplay;