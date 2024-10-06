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
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  const toggleSidebar = useCallback(() => {
    setIsSidebarExpanded(prev => !prev);
  }, []);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header 
        onSave={handleSave} 
        onToggleSidebar={toggleSidebar}
        isSidebarExpanded={isSidebarExpanded}
        onSearch={handleSearch}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isExpanded={isSidebarExpanded} searchTerm={searchTerm} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <main className="flex-1 overflow-auto bg-background p-4">
            <Outlet context={{ setSaveNodes }} />
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Layout;

export function useSaveNodes() {
  return useOutletContext<ContextType>();
}