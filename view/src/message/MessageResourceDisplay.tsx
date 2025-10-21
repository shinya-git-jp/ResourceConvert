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
        setLabels(data.map(d => ({ ...d, messageId: "" })));
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
    if (labels.length === 0) {
      alert("変換するデータがありません");
      return;
    }
    // messageId が入力されていなければ objectID を使う
    const updatedLabels = labels.map(label => ({
      ...label,
      messageId: label.messageId?.trim() || label.objectID,
    }));

    navigate("/properties", { state: { labels: updatedLabels } });
  };

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

      <button onClick={handleConvert} disabled={labels.length === 0}>変換</button>

      {loading && <div className="p-4">読み込み中...</div>}
      
      {!loading && labels.length > 0 && (
        <table>
          <thead>
            {/* ... (thead の内容は変更なし) ... */}
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
            {/* ... (tbody の内容は変更なし) ... */}
            {labels.map((label) => (
            <tr key={label.objectID}>
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