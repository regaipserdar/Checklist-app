import React, { useState, useCallback, useEffect } from 'react';
import { Outlet, useOutletContext } from 'react-router-dom';
import Sidebar from '../Sidebar';
import Header from '../Header';
import Footer from '../Footer';


type ContextType = { 
  setSaveNodes: (fn: () => void) => void;
  triggerSave: () => void;
};

const Layout: React.FC = () => {
  const [saveNodesFunction, setSaveNodesFunction] = useState<(() => void) | null>(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');


  const setSaveNodes = useCallback((fn: () => void) => {
    console.log('[Layout] Setting saveNodes function');
    setSaveNodesFunction(() => fn);
  }, []);

  const triggerSave = useCallback(() => {
    console.log('[Layout] Triggering save');
    
    if (saveNodesFunction) {
      saveNodesFunction();
    } else {
      console.warn('[Layout] Save function is not set');
      return; // Eğer saveNodesFunction tanımlı değilse, işlemi burada sonlandır
    }
  
    // saveChanges'i çağırmayı kaldırıyoruz, çünkü bu işlem Flow bileşeninde yapılacak
  }, [saveNodesFunction]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarExpanded(prev => !prev);
  }, []);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  // useEffect kullanarak yan etkileri yönetin
  useEffect(() => {
    // Gerekli başlangıç işlemleri burada yapılabilir
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header 
        onSave={triggerSave}
        onToggleSidebar={toggleSidebar}
        isSidebarExpanded={isSidebarExpanded}
        onSearch={handleSearch}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isExpanded={isSidebarExpanded} searchTerm={searchTerm} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <main className="flex-1 overflow-auto bg-background p-4">
            <Outlet context={{ setSaveNodes, triggerSave }} />
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