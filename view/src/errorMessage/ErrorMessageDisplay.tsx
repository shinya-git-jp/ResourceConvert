import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ErrorMessage } from "../types/ErrorMessage";

const ErrorMessageDisplay: React.FC = () => {
  const [messages, setMessages] = useState<ErrorMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();


  useEffect(() => {
    fetch("http://localhost:8080/api/error-messages")
      .then((res) => res.json())
      .then((data) => {
        setMessages(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("エラーメッセージ取得失敗:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-4">読み込み中...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">エラーメッセージリソース</h2>
      <button 
        onClick={() => navigate("/error-messages-xml")}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded">変換</button>
      <table className="w-full border-collapse border border-gray-400 text-sm">
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
    </div>
  );
};

export default ErrorMessageDisplay;