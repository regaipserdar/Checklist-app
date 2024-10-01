// src/components/Layout/index.tsx

import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar';
import Header from '../Header';
import Footer from '../Footer';

const Layout: React.FC = () => {
  const handleSave = () => {
    // Save işlemi burada gerçekleştirilecek
    console.log('Saving...');
  };
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
      <Header onSave={handleSave} />
        <main className="flex-1 overflow-auto bg-background p-4">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;