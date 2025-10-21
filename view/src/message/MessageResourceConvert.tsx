import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "../App.css";

interface EditableLabel {
  objectID: string;
  categoryName: string;
  country1: string;
  country2?: string;
  country3?: string;
  country4?: string;
  country5?: string;
  messageId?: string;
}

export const MessageResourceConvert = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialLabels: EditableLabel[] = (location.state as { labels: EditableLabel[] })?.labels || [];
  const [labels] = useState<EditableLabel[]>(initialLabels);
  const [selectedCountry, setSelectedCountry] = useState<keyof EditableLabel>("country1");

  // ダウンロード用バックエンド呼び出し
  const handleDownload = async () => {
  try {
    const response = await fetch("http://localhost:8080/api/labels/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(labels.map(label => ({
        ...label,
        country1: label[selectedCountry] // 選択中の言語を右辺にセット
      })))
    });

    if (!response.ok) throw new Error("生成失敗");

    const text = await response.text();

    // ファイル名をユーザーに入力させる
    const filename = prompt("ファイル名を入力してください", "output.properties") || "output.properties";

    const blob = new Blob([text], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename; // 入力値をファイル名に
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error(err);
    alert("プロパティ生成に失敗しました");
  }
};

  return (
    <div className="App">
      <h2>変換結果</h2>
      <button onClick={handleDownload}>ダウンロード</button>
      <button onClick={() => navigate(-1)}>戻る</button>
      <div style={{ marginBottom: "16px" }}>
        表示言語:
        <select
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value as keyof EditableLabel)}
        >
          <option value="country1">Country1</option>
          <option value="country2">Country2</option>
          <option value="country3">Country3</option>
          <option value="country4">Country4</option>
          <option value="country5">Country5</option>
        </select>
      </div>

      <h3>プレビュー</h3>
      <textarea
        readOnly
        value={labels.map(label => {
          const key = label.messageId || label.objectID;
          const value = label[selectedCountry] || "";
          return `${key}=${value}`;
        }).join("\n")}
        rows={50}
        cols={100}
        style={{ whiteSpace: "pre-wrap" }}
      />
    </div>
  );
};
