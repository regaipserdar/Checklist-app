import React from 'react';
import { Button } from "@/components/ui/button";
import { Edit, ArrowLeft, Save } from 'lucide-react';
import log from 'loglevel';

interface FlowHeaderProps {
  title: string;
  onEditFlow: () => void;
  onSaveFlow: () => void;
  onBackToDashboard: () => void;
}

const FlowHeader: React.FC<FlowHeaderProps> = ({ 
  title, 
  onEditFlow, 
  onSaveFlow, 
  onBackToDashboard 
}) => {
  return (
    <div className="mb-4 flex justify-between items-center">
      {/* Sol tarafa alınan Dashboard butonu */}
      <div className="flex items-center space-x-2">
        <Button 
          onClick={() => {
            log.debug("[FlowHeader] Back to Dashboard button clicked");
            onBackToDashboard();
          }} 
          variant="outline"
          size="sm"
          className="hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      {/* Başlık */}
      <h1 className="text-2xl font-bold">{title || 'Untitled Flow'}</h1>
      
      {/* Edit ve Save Butonları */}
      <div className="flex space-x-2">
        <Button 
          onClick={() => {
            log.debug("[FlowHeader] Edit Flow button clicked");
            onEditFlow();
          }} 
          variant="outline" 
          size="sm"
          className="hover:bg-gray-200 transition-colors"
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit Flow
        </Button>
        
        <Button 
          onClick={() => {
            log.debug("[FlowHeader] Save Flow button clicked");
            onSaveFlow();
          }} 
          variant="outline" 
          size="sm"
          className="hover:bg-gray-200 transition-colors"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Flow
        </Button>
      </div>
    </div>
  );
};

export default FlowHeader;
