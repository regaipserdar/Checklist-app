import React, { useState, useCallback } from 'react';
import { Outlet, useOutletContext } from 'react-router-dom';
import Sidebar from '../Sidebar';
import Header from '../Header';
import Footer from '../Footer';
import { saveService } from '../../services/SaveService';
import { useToast } from "@/hooks/use-toast";

type ContextType = { 
  setSaveNodes: (fn: () => void) => void;
  triggerSave: () => void;
};

const Layout: React.FC = () => {
  const [saveNodesFunction, setSaveNodesFunction] = useState<(() => void) | null>(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // setSaveNodes callback fonksiyonu ile kaydetme fonksiyonunu ayarla
  const setSaveNodes = useCallback((fn: () => void) => {
    console.log('[Layout] Setting saveNodes function');
    setSaveNodesFunction(() => fn);
  }, []);

  // triggerSave callback fonksiyonu ile kaydetme işlemini tetikleme
  const triggerSave = useCallback(() => {
    console.log('[Layout] Triggering save');
    
    if (saveNodesFunction) {
      saveNodesFunction();  // Eğer kaydetme fonksiyonu varsa çalıştır
    } else {
      console.warn('[Layout] Save function is not set');  // Eğer kaydetme fonksiyonu yoksa uyarı ver
    }

    saveService.saveChanges(toast).then(() => {
      console.log('[Layout] Save completed');  // Başarılı kaydetme işlemi
    }).catch((error) => {
      console.error('[Layout] Save failed:', error);  // Kaydetme işlemi başarısız olursa hata logla
    });
  }, [saveNodesFunction, toast]);

  // Sidebar genişletme/küçültme işlemi
  const toggleSidebar = useCallback(() => {
    setIsSidebarExpanded(prev => !prev);
  }, []);

  // Arama işlemi
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header 
        onSave={triggerSave}  // Kaydetme işlemi için tetikleyici
        onToggleSidebar={toggleSidebar}  // Sidebar açma/kapatma işlemi
        isSidebarExpanded={isSidebarExpanded}  // Sidebar'ın durumu (açık/kapalı)
        onSearch={handleSearch}  // Arama terimini işleme
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isExpanded={isSidebarExpanded} searchTerm={searchTerm} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <main className="flex-1 overflow-auto bg-background p-4">
            <Outlet context={{ setSaveNodes, triggerSave }} /> {/* İçerik alanı */}
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Layout;

// useSaveNodes fonksiyonu ile context'ten setSaveNodes ve triggerSave'i kullanma
export function useSaveNodes() {
  return useOutletContext<ContextType>();
}