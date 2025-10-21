// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// import './index.css';
import Router from './router'; // router/index.tsx を import

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router />
  </StrictMode>
);
