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

interface NodeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  node: Node | null;
  onSave: (updatedData: any) => void;
}

const NodeDrawer: React.FC<NodeDrawerProps> = ({ isOpen, onClose, node, onSave }) => {
  const [editedData, setEditedData] = useState({
    label: '',
    description: '',
    tips: '',
    usable_pentest_tools: '',
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
  };

  const handleSave = () => {
    onSave(editedData);
    onClose();
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