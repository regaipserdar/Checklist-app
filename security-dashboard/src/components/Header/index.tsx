import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "next-themes";
import { Sun, Moon, Copy, Download, Github, Save, ChevronLeft, ChevronRight, Hexagon } from "lucide-react";
import UserProfileDropdown from './UserProfile';

interface HeaderProps {
  onSave: () => void;
  onToggleSidebar: () => void;
  isSidebarExpanded: boolean;
  onSearch: (term: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onSave, onToggleSidebar, isSidebarExpanded, onSearch }) => {
  const { theme, setTheme } = useTheme();
  const [selectedBranch, setSelectedBranch] = useState("master");
  const [searchTerm, setSearchTerm] = useState("");

  const branches = ["master", "main", "dev"]; // Dummy branch data

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    onSearch(e.target.value);
  };

  return (
    <header className="bg-background text-foreground p-4 flex justify-between items-center border-b border-border">
      {/* Left Section - Sidebar Toggle, Pentest Checklist Logo, and Search */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="bg-primary rounded-full p-2">
            <Hexagon className="h-6 w-6 text-primary-foreground" />
          </div>
          {isSidebarExpanded && (
            <span className="text-xl font-bold">Pentest Checklist</span>
          )}
        </div>
        <Button
          onClick={onToggleSidebar}
          variant="ghost"
          size="icon"
          className="text-foreground hover:text-foreground/80"
          title={isSidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isSidebarExpanded ? (
            <ChevronLeft className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </Button>
        <Input
          type="search"
          placeholder="Search..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-64"
        />
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
