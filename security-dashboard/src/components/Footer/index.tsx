import React from 'react';
import { Coffee, Heart } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background text-foreground py-4 border-t border-border">
      <div className="container mx-auto px-4">
        {/* Tek satırda her şeyi hizalayacak flex yapı */}
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} Flow-Checklist.
          </p>

          <a
            href="https://www.buymeacoffee.com/your-profile"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center transition-colors"
          >
            <Coffee className="w-4 h-4 mr-1" />
            Buy me a coffee
          </a>

          <p className="text-sm text-muted-foreground">
            Version: {import.meta.env.VITE_APP_VERSION}
          </p>
          <p className="text-xs flex text-muted-foreground">Developed with <Heart className="w-3 h-3 mx-1 text-red-500" /> by rsk</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
