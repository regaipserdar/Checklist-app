import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  node: Node | null;
  onSave: (updatedData: any) => void;
}

const NodeDrawer: React.FC<NodeDrawerProps> = ({ isOpen, onClose, node, onSave }) => {
  const { toast } = useToast();
  const [editedData, setEditedData] = useState({
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
    if (node) {
      setEditedData({
        label: node.data.label || '',
        description: node.data.description || '',
        tips: node.data.tips || '',
        usable_pentest_tools: node.data.usable_pentest_tools || '',
      });
    }
  }, [node]);

  const handleChange = (field: string, value: string) => {
    setEditedData(prev => ({ ...prev, [field]: value }));

    if (['label', 'description', 'tips'].includes(field) && value.trim() === '') {
      setErrors(prev => ({ ...prev, [field]: `${field} is required.` }));
    } else {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSave = () => {
    const requiredFields = ['label', 'description', 'tips'];
    let hasErrors = false;

    requiredFields.forEach(field => {
      if (editedData[field as keyof typeof editedData].trim() === '') {
        setErrors(prev => ({ ...prev, [field]: `${field} is required.` }));
        hasErrors = true;
      }
    });

    if (hasErrors) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
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
            {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}

            <Textarea
              value={editedData.tips}
              onChange={(e) => handleChange('tips', e.target.value)}
              className="mb-2"
              placeholder="Tips"
            />
            {errors.tips && <p className="text-red-500 text-sm">{errors.tips}</p>}

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