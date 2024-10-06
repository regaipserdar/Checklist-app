// Flow/FlowDialog.tsx
// Bu bileşen, Flow düzenleme ve oluşturma arayüzünü içerir.

import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FlowDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  onSave: () => void;
  onChange: (field: string, value: string) => void;
}

const FlowDialog: React.FC<FlowDialogProps> = ({ isOpen, onClose, title, description, onSave, onChange }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Flow</DialogTitle>
          <DialogDescription>
            Make changes to your flow here.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            value={title}
            onChange={(e) => onChange('title', e.target.value)}
            placeholder="Flow Title"
            className="mb-2"
          />
          <Textarea
            value={description}
            onChange={(e) => onChange('description', e.target.value)}
            placeholder="Flow Description"
            className="mb-2"
          />
        </div>
        <DialogFooter>
          <Button onClick={onSave}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FlowDialog;