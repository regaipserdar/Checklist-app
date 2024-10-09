import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Edit, ArrowLeft } from 'lucide-react';

interface FlowHeaderProps {
  title: string;
  onEditFlow: () => void;
  onBackToDashboard: () => void;
}

const FlowHeader: React.FC<FlowHeaderProps> = ({ title, onEditFlow, onBackToDashboard }) => {

  useEffect(() => {
    console.log("[FlowHeader] - FlowHeader component mounted");
    console.log("[FlowHeader] - Received title:", title);
  
    return () => {
      console.log("FlowHeader component unmounted");
    };
  }, [title, onEditFlow, onBackToDashboard]);

  return (
    <div className="mb-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold">{title || 'Untitled Flow - [FlowHeader]'}</h1>
      <div className="space-x-2">
        <Button 
          onClick={() => {
            console.log("Edit Flow button clicked");
            onEditFlow();
          }} 
          variant="outline" 
          size="sm"
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit Flow
        </Button>
        <Button 
          onClick={() => {
            console.log("Back to Dashboard button clicked");
            onBackToDashboard();
          }} 
          variant="outline"
          size="sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default FlowHeader;