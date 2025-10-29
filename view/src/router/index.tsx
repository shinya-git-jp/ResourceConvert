import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "../styles/index.css";
import Home from "../pages/home/Home";
import DbConnection from "../pages/db-connection/DbConnection";
import MessageResourceDisplay from "../features/message-resource/pages/MessageResourceDisplay";
import { MessageResourceConvert } from "../features/message-resource/pages/MessageResourceConvert";
import ErrorMessageDisplay from "../features/error-message/pages/ErrorMessageDisplay";
import ErrorMessageConvert from "../features/error-message/pages/ErrorMessageConvert";
import AppMenu from "../components/app-menu/AppMenu";

const Router: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppMenu />}>
          <Route index element={<Home />} />
          <Route path="/db-connection" element={<DbConnection />} />
          <Route
            path="/message-resource"
            element={<MessageResourceDisplay />}
          />
          <Route path="/properties" element={<MessageResourceConvert />} />
          <Route path="/error-messages" element={<ErrorMessageDisplay />} />
          <Route path="/error-messages-xml" element={<ErrorMessageConvert />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
