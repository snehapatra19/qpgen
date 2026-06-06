import React, { createContext, useContext, useState } from 'react';
const AppContext = createContext(null);
export function AppProvider({ children }) {
  const [results, setResults] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('qpgen_api_key') || '');
  const saveApiKey = (key) => { setApiKey(key); localStorage.setItem('qpgen_api_key', key); };
  return (
    <AppContext.Provider value={{ results, setResults, sessionId, setSessionId, isProcessing, setIsProcessing, apiKey, saveApiKey }}>
      {children}
    </AppContext.Provider>
  );
}
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
