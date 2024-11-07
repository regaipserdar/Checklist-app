import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CustomNodeData } from '@/components/CustomNode';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useToast } from "@/hooks/use-toast";

interface NodeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  node: Node<CustomNodeData> | null;
  onSave: (updatedData: Partial<CustomNodeData>) => void;
}

const NodeDrawer: React.FC<NodeDrawerProps> = ({ isOpen, onClose, node, onSave }) => {
  const { toast } = useToast();
  const [editedData, setEditedData] = useState<Partial<CustomNodeData>>({
    label: '',
    description: '',
    tips: '',
    usable_pentest_tools: '',
  });
  
  const [errors, setErrors] = useState({
    label: '',
    description: '',
    tips: '',
  });

  useEffect(() => {
    if (node?.data) {
      setEditedData({
        label: node.data.label || '',
        description: node.data.description || '',
        tips: node.data.tips || '',
        usable_pentest_tools: node.data.usable_pentest_tools || '',
      });
    }
  }, [node]);

  const handleChange = (field: keyof CustomNodeData, value: string) => {
    setEditedData(prev => ({ ...prev, [field]: value }));

    if (['label'].includes(field) && value.trim() === '') {
      setErrors(prev => ({ ...prev, [field]: `${field} is required.` }));
    } else {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSave = () => {
    if (!editedData.label?.trim()) {
      setErrors(prev => ({ ...prev, label: 'Label is required.' }));
      toast({
        title: "Validation Error",
        description: "Label is required.",
        variant: "destructive",
      });
      return;
    }

    onSave(editedData);
    onClose();
    toast({
      title: "Success",
      description: "Node updated successfully.",
    });
  };

  if (!node) return null;

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Edit Node</DrawerTitle>
            <DrawerDescription>Make changes to your node here.</DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-0">
            <Input
              value={editedData.label}
              onChange={(e) => handleChange('label', e.target.value)}
              className="mb-2"
              placeholder="Node Label"
            />
            {errors.label && <p className="text-red-500 text-sm">{errors.label}</p>}
            
            <Textarea
              value={editedData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="mb-2"
              placeholder="Node Description"
            />

            <Textarea
              value={editedData.tips}
              onChange={(e) => handleChange('tips', e.target.value)}
              className="mb-2"
              placeholder="Tips"
            />

            <Textarea
              value={editedData.usable_pentest_tools}
              onChange={(e) => handleChange('usable_pentest_tools', e.target.value)}
              className="mb-2"
              placeholder="Usable Pentest Tools"
            />
          </div>
          <DrawerFooter>
            <Button onClick={handleSave}>Save changes</Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default NodeDrawer;