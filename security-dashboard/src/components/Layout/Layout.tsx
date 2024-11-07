import React, { useState, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ReactFlowProvider } from 'reactflow';
import Sidebar from '../Sidebar/Sidebar';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import log from 'loglevel';

const Layout: React.FC = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();

  const toggleSidebar = useCallback(() => {
    log.debug('[Layout] Toggling sidebar:', !isSidebarExpanded);
    setIsSidebarExpanded(prev => !prev);
  }, [isSidebarExpanded]);

  const handleSearch = useCallback((term: string) => {
    log.debug('[Layout] Search term updated:', term);
    setSearchTerm(term);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <Header 
        onToggleSidebar={toggleSidebar}
        isSidebarExpanded={isSidebarExpanded}
        onSearch={handleSearch}
      />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar 
          isExpanded={isSidebarExpanded} 
          searchTerm={searchTerm} 
          key={location.key} // Add this
        />
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 overflow-hidden relative">
            <ReactFlowProvider>
              <Outlet key={location.pathname} /> {/* Add key here */}
            </ReactFlowProvider>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default React.memo(Layout);