import React, { useEffect } from 'react';
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

interface FlowEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  onUpdate: (title: string, description: string) => void;
  onChange: (field: string, value: string) => void;
}

const FlowEditDialog: React.FC<FlowEditDialogProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  onUpdate, 
  onChange
}) => {
  console.log('[FlowDialog] Rendering with:', { isOpen, title, description });

  useEffect(() => {
    if (isOpen) {
      console.log('[FlowDialog] Dialog opened');
    } else {
      console.log('[FlowDialog] Dialog closed');
    }
  }, [isOpen]);

  const handleUpdate = () => {
    console.log('[FlowDialog] Updating flow with:', { title, description });
    onUpdate(title, description);
    onClose();
  };

  const handleChange = (field: string, value: string) => {
    console.log('[FlowDialog] Field changed:', field, 'new value:', value);
    onChange(field, value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Flow</DialogTitle>
          <DialogDescription>
            Update your flow title and description here.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            value={title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Flow Title"
            className="mb-2"
          />
          <Textarea
            value={description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Flow Description"
            className="mb-2"
          />
        </div>
        <DialogFooter>
          <Button onClick={handleUpdate}>Update</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default React.memo(FlowEditDialog);