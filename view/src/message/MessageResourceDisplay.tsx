// 表形式で表示
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

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

function MessageResourceDisplay() {
  const [labels, setLabels] = useState<EditableLabel[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleConvert = () => {
    // messageId が入力されていなければ objectID を使う
    const updatedLabels = labels.map(label => ({
      ...label,
      messageId: label.messageId?.trim() || label.objectID,
    }));

    navigate("/properties", { state: { labels: updatedLabels } });
  };

  useEffect(() => {
    fetch("http://localhost:8080/api/labels")
      .then((response) => response.json())
      .then((data: SLocalizationLabel[]) => {
        setLabels(data);
        setLoading(false);})
      .catch((error) => {
        console.error(error);
        setLoading(false);});
  }, []);

  if (loading) {
    return <div className="p-4">読み込み中...</div>;
  }

  return (
    <div className="App">
      <h2>メッセージリソース</h2>
      <button onClick={handleConvert}>変換</button>
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
    </div>
  );
}

export default MessageResourceDisplay;
