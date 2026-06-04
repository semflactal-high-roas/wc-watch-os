import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BetaDisplayPolish } from './components/BetaDisplayPolish';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <BetaDisplayPolish />
  </React.StrictMode>,
);
