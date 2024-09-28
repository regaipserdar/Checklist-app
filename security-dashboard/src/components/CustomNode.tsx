import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

interface CustomNodeData {
  label: string;
  type: string;
  backgroundColor: string;
  borderColor: string;
  description?: string;
}

const CustomNode: React.FC<NodeProps<CustomNodeData>> = ({ data }) => {
  const style = {
    background: data.backgroundColor,
    border: `1px solid ${data.borderColor}`,
    padding: '10px',
    borderRadius: '5px',
  };

  return (
    <div style={style}>
      {data.type !== 'startNode' && data.type !== 'stickyNote' && (
        <Handle type="target" position={Position.Top} />
      )}
      <div>{data.label}</div>
      {data.type !== 'endNode' && data.type !== 'stickyNote' && (
        <Handle type="source" position={Position.Bottom} />
      )}
    </div>
  );
};

export default CustomNode;