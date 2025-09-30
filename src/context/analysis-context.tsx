'use client';

import React, { createContext, useContext, useState, useRef } from 'react';

interface AnalysisContextType {
  isNewAnalysisRequested: boolean;
  requestNewAnalysis: () => void;
  resetNewAnalysisRequest: () => void;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export function AnalysisProvider({ children }: { children: React.ReactNode }) {
  const [isNewAnalysisRequested, setIsNewAnalysisRequested] = useState(false);
  
  const requestNewAnalysis = () => {
    setIsNewAnalysisRequested(true);
  };
  
  const resetNewAnalysisRequest = () => {
    setIsNewAnalysisRequested(false);
  };
  
  return (
    <AnalysisContext.Provider 
      value={{ 
        isNewAnalysisRequested, 
        requestNewAnalysis, 
        resetNewAnalysisRequest 
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (context === undefined) {
    throw new Error('useAnalysis must be used within an AnalysisProvider');
  }
  return context;
}