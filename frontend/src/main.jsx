import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import './styles/app.css';
import { queryClient } from './lib/queryClient';
import AuthProvider from './auth/AuthProvider';
import BackendGate from './components/BackendGate/BackendGate';

// BackendGate waits for the (free-tier) server to wake up before anything calls the API.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BackendGate>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </BackendGate>
  </React.StrictMode>
);
