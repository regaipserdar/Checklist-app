import React from 'react';
import { BrowserRouter as Router, useRoutes } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext';
import { SystemFlowProvider, UserFlowProvider } from './services/FlowContexts';
import routes from './routes';
import { Toaster } from "@/components/ui/toaster"

const AppRoutes = () => {
  const element = useRoutes(routes);
  return element;
};

const App: React.FC = () => {
  const hexagonSvg = encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>'
  );
  const faviconUrl = `data:image/svg+xml;charset=utf-8,${hexagonSvg}`;

  return (
    <HelmetProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <SystemFlowProvider>
            <UserFlowProvider>
              <Helmet>
                <title>Pentest Checklist</title>
                <link rel="icon" type="image/svg+xml" href={faviconUrl} />
              </Helmet>
              <div className="min-h-screen w-full flex flex-col bg-background text-foreground">
                <Router>
                  <AppRoutes />
                  <Toaster />
                </Router>
              </div>
            </UserFlowProvider>
          </SystemFlowProvider>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
};

export default App;