import React, { useState, useCallback } from 'react';
import { Outlet, useOutletContext } from 'react-router-dom';
import Sidebar from '../Sidebar';
import Header from '../Header';
import Footer from '../Footer';

type ContextType = { 
  setSaveNodes: (fn: () => void) => void
};

const Layout: React.FC = () => {
  const [saveNodesFunction, setSaveNodesFunction] = useState<(() => void) | null>(null);
  
  const handleSave = useCallback(() => {
    console.log('Save button clicked');
    if (saveNodesFunction) {
      saveNodesFunction();
    } else {
      console.warn('saveNodes function is not set');
    }
  }, [saveNodesFunction]);
  
  const setSaveNodes = useCallback((fn: () => void) => {
    console.log('Setting saveNodes function');
    setSaveNodesFunction(() => fn);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onSave={handleSave} />
        <main className="flex-1 overflow-auto bg-background p-4">
          <Outlet context={{ setSaveNodes }} />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;

export function useSaveNodes() {
  return useOutletContext<ContextType>();
}