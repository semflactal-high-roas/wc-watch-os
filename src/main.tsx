import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ProvisionalTournamentBracketBeta from './ProvisionalTournamentBracketBeta';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <ProvisionalTournamentBracketBeta />
  </React.StrictMode>,
);
