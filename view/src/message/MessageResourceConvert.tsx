import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
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
  const previewTextareaRef = useRef<HTMLTextAreaElement>(null);

  // ダウンロード用バックエンド呼び出し
  const handleDownload = async () => {
  try {
    const response = await fetch("http://localhost:8080/api/labels/properties/download", { 
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
          labels: labels,       
          lang: selectedCountry
       }) 
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`プロパティ生成失敗 (HTTP ${response.status}): ${errorText}`);
    }

    const text = await response.text(); 

    const filename = prompt("ファイル名を入力してください", "output.properties") || "output.properties";

    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, text], { type: "text/plain;charset=utf-8" }); 

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.endsWith(".properties") ? filename : filename + ".properties"; 
    a.click();
    window.URL.revokeObjectURL(url);

  } catch (err: any) {
    console.error(err);
    alert(`プロパティ生成に失敗しました: ${err.message}`); 
  }
};

  const handleCopyPreview = () => {
    if (previewTextareaRef.current) {
      const textToCopy = previewTextareaRef.current.value;
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          alert('コピーしました');
        })
        .catch(err => {
          console.error('コピーに失敗しました:', err);
          alert('コピーに失敗しました。');
        });
    }
  };

  const generatePreviewText = () => {
    return labels.map(label => {
        const key = label.messageId || label.objectID;
        const value = label[selectedCountry] || "";
        return `${key}=${value}`;
      }).join("\n");
  }

  return (
    <div className="App">
      <h2>変換結果</h2>
      <button onClick={handleDownload}>ダウンロード</button>
      <button onClick={() => navigate(-1)} style={{ marginLeft: "10px" }}>戻る</button>
      <div style={{ marginBottom: "16px", marginTop: "16px" }}>
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

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
          <h3>プレビュー</h3>
          <button onClick={handleCopyPreview} style={{ marginLeft: "10px" }}>
              コピー
          </button>
      </div>

      <textarea
        ref={previewTextareaRef}
        readOnly
        value={generatePreviewText()}
        rows={50}
        cols={100}
        style={{ whiteSpace: "pre-wrap" }}
      />
    </div>
  );
};
