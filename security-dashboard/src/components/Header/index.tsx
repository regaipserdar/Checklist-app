import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Sun, Moon, Copy, Download, Github, Save } from "lucide-react";
import UserProfileDropdown from './UserProfile';

interface HeaderProps {
  onSave: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSave }) => {
  const { theme, setTheme } = useTheme();
  const [selectedBranch, setSelectedBranch] = useState("master");

  const branches = ["master", "main", "dev"]; // Dummy branch data

  return (
    <header className="bg-background text-foreground p-4 flex justify-between items-center border-b border-border">
      {/* Left Section - GitHub Icon and Repo */}
      <div className="flex items-center space-x-4">
        <Github className="w-6 h-6" />
        <span className="text-muted-foreground font-semibold">MyAwesomeRepo</span>
      </div>
      
      {/* Center Section - Branch Selection and Action Buttons */}
      <div className="flex items-center space-x-4">
        {/* Branch Selection */}
        <div className="flex items-center space-x-2">
          <label htmlFor="branch-select" className="text-muted-foreground">
            Branch:
          </label>
          <select
            id="branch-select"
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="bg-background border border-border text-foreground rounded-md p-1"
          >
            {branches.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>
        </div>

        {/* Save Button */}
        <Button onClick={onSave} variant="outline" size="sm">
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>


        {/* GitHub Push Button */}
        <Button variant="outline" size="sm" className="text-foreground hover:text-foreground/80">
          <Github className="w-4 h-4 mr-2" />
          Push to GitHub
        </Button>
      </div>

      {/* Right Section - Action Icons */}
      <div className="flex items-center space-x-2">
        {/* Theme Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="text-foreground hover:text-foreground/80"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* Copy Button */}
        <Button variant="ghost" size="icon" className="text-foreground hover:text-foreground/80">
          <span className="sr-only">Copy</span>
          <Copy className="w-5 h-5" />
        </Button>

        {/* Download Button */}
        <Button variant="ghost" size="icon" className="text-foreground hover:text-foreground/80">
          <span className="sr-only">Download</span>
          <Download className="w-5 h-5" />
        </Button>

        {/* User Profile Dropdown */}
        <UserProfileDropdown />
      </div>
    </header>
  );
};

export default Header;