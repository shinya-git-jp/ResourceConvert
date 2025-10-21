import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { ErrorMessage } from "../types/ErrorMessage";

const ErrorMessageXmlConvert: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const initialMessages: ErrorMessage[] = (location.state as { messages: ErrorMessage[] })?.messages || []; 
    
    const [messages] = useState<ErrorMessage[]>(initialMessages); 
    const [selectedLang, setSelectedLang] = useState<keyof ErrorMessage>("country1");


    const generateXmlPreview = () => {
        const xmlItems = messages.map((msg) => {
            let type: string;
            if (msg.errorType === "1") {
                type = "error";
            } else if (msg.errorType === "2") {
                type = "warning";
            } else if (msg.errorType === "3" || msg.errorType === "4") {
                type = "info";
            } else {
                type = "info"; //デフォルト
            }

            const messageText = msg[selectedLang] || "";
            return `  <error code="${msg.errorNo}">
    <type>${type}</type>
    <message>${messageText}</message>
  </error>`;
        });

        return `<?xml version="1.0" encoding="UTF-8"?>\n<error-messages>\n${xmlItems.join(
            "\n"
        )}\n</error-messages>`;
    };

    // バックエンドでXML生成してダウンロード
    const handleDownload = async () => {
        const filename = prompt("ファイル名を入力してください", "output.xml") || "output.xml";
        try {
            // 現在のAPIエンドポイント (固定DB)
            const response = await fetch(
                `http://localhost:8080/api/error-messages/xml?lang=${selectedLang}`
            );

            if (!response.ok) throw new Error("XML生成に失敗");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename.endsWith(".xml") ? filename : filename + ".xml";
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
            alert("XMLダウンロードに失敗しました");
        }
    };

    return (
        <div style={{ padding: "20px" }}>
            <h2>変換結果</h2>
            {/* ダウンロードボタンは一旦残しますが、上記の注意点があります */}
            <button onClick={handleDownload} style={{ marginLeft: "20px" }}> 
                ダウンロード (※固定DB) 
            </button>
            <button onClick={() => navigate(-1)}>戻る</button>
            <div style={{ marginBottom: "10px" }}>
                表示言語:
                <select
                    value={selectedLang}
                    onChange={(e) => setSelectedLang(e.target.value as keyof ErrorMessage)}
                    style={{ marginLeft: "5px" }}
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
                // generateXmlPreview は location.state からの messages を使う
                value={generateXmlPreview()} 
                rows={30}
                cols={120}
                style={{ whiteSpace: "pre-wrap" }}
            />
        </div>
    );
};

export default ErrorMessageXmlConvert;