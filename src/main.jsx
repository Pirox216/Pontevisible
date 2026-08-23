import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.jsx';
import NotFound from './pages/NotFound.jsx';
import './index.css'; // Estilos globales, variables de marca y reset CSS

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta principal: Todo tu Dashboard actual */}
          <Route path="/" element={<App />} />
          
          {/* Ruta para cualquier URL que no exista (Página 404) */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>,
);