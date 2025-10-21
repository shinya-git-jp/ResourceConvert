import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import "../index.css";
import Home from "../home";
import DbConnection from '../dbConnection/DbConnection';
import MessageResourceDisplay  from "../message/MessageResourceDisplay";
import { MessageResourceConvert } from "../message/MessageResourceConvert";
import ErrorMessageDisplay from "../errorMessage/ErrorMessageDisplay";
import ErrorMessageConvert from "../errorMessage/ErrorMessageConvert";

import AppMenu from '../menu/AppMenu';

const Router: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppMenu />}>
          <Route index element={<Home />} />
          <Route path="/db-connection" element={<DbConnection />} />
          <Route path="/message-resource" element={<MessageResourceDisplay />} />
          <Route path="/properties" element={<MessageResourceConvert />} />
          <Route path="/error-messages" element={<ErrorMessageDisplay />} />
          <Route path="/error-messages-xml" element={<ErrorMessageConvert />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default Router;