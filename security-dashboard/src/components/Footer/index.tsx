import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background text-foreground py-4 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} Flow-Checklist. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            Developed by rsk | Version: {import.meta.env.VITE_APP_VERSION}
          </p>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          This is an open-source project. Use and modification of this content is subject to the terms specified by the developer.
        </p>
      </div>
    </footer>
  );
};

export default Footer;