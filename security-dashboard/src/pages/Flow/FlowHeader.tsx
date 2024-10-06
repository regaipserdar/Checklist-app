// Flow/FlowHeader.tsx
// Bu bileşen, Flow'un başlığını ve kontrol düğmelerini içerir.

import React from 'react';
import { Button } from "@/components/ui/button";

interface FlowHeaderProps {
  title: string;
  onEditFlow: () => void;
  onBackToDashboard: () => void;
}

const FlowHeader: React.FC<FlowHeaderProps> = ({ title, onEditFlow, onBackToDashboard }) => {
  return (
    <div className="mb-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold">{title || 'Untitled Flow'}</h1>
      <div>
        <Button onClick={onEditFlow} variant="outline" className="mr-2">Edit Flow</Button>
        <Button onClick={onBackToDashboard} variant="outline">Back to Dashboard</Button>
      </div>
    </div>
  );
};

export default FlowHeader;