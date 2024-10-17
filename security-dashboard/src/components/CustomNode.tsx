import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from 'lucide-react';

interface CustomNodeData {
  label: string;
  type: string;
  description?: string;
  tips?: string;
  usable_pentest_tools?: string;
  isSelected?: boolean;
  onEdit?: (event: React.MouseEvent, nodeProps: NodeProps) => void;
  onDelete?: (event: React.MouseEvent, nodeId: string) => void;
}

const CustomNode: React.FC<NodeProps<CustomNodeData>> = ({
  id,
  data,
  isConnectable,
  selected,
  ...rest
}) => {
  if (data.type === 'sticky') {
    return (
      <div className={`sticky-note ${selected ? 'selected' : ''}`}>
        <div className="sticky-note-content">
          <div className="font-bold text-sm mb-2">{data.label}</div>
          {data.description && <div className="text-xs mb-2">{data.description}</div>}
        </div>
        <div className="sticky-note-actions">
          <Button
            size="icon"
            variant="ghost"
            onClick={(event) => data.onEdit && data.onEdit(event, { id, data, isConnectable, selected, ...rest })}
            className="h-6 w-6"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={(event) => data.onDelete && data.onDelete(event, id)}
            className="h-6 w-6"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  const nodeStyle = {
    background: getBackgroundColor(data.type),
    border: `.5px solid ${getBorderColor(data.type)}`,
    padding: '10px',
    borderRadius: '5px',
    minWidth: '200px',
    maxWidth: '300px',
  };

  return (
    <div style={nodeStyle} className={`custom-node relative ${selected ? 'selected' : ''}`}>
      {data.type !== 'start' && (
        <Handle type="target" position={Position.Top} isConnectable={isConnectable} />
      )}
      <div className="font-bold text-sm mb-2">{data.label}</div>
      {data.description && <div className="text-xs mb-2">{data.description}</div>}
      {data.tips && <div className="text-xs italic mb-2">Tips: {data.tips}</div>}
      {data.usable_pentest_tools && (
        <div className="text-xs">
          <strong>Tools:</strong> {data.usable_pentest_tools}
        </div>
      )}
      <div className="absolute top-0 right-0 flex">
        <Button
          size="icon"
          variant="ghost"
          onClick={(event) => data.onEdit && data.onEdit(event, { id, data, isConnectable, selected, ...rest })}
          className="h-6 w-6"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={(event) => data.onDelete && data.onDelete(event, id)}
          className="h-6 w-6"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      {data.type !== 'end' && (
        <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} />
      )}
    </div>
  );
};

function getBackgroundColor(type: string): string {
  switch (type) {
    case 'start': return '#6ede87';
    case 'end': return '#ff9a9a';
    case 'sticky_note': return '#ffd700';
    default: return '#ffcc66';
  }
}

function getBorderColor(type: string): string {
  switch (type) {
    case 'start': return '#3fa252';
    case 'end': return '#ff5757';
    case 'sticky_note': return '#ffa500';
    default: return '#ffaa00';
  }
}

export default React.memo(CustomNode);