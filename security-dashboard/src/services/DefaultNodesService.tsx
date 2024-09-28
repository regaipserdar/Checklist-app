import { Node } from 'reactflow';

export interface DefaultNode {
  type: string;
  label: string;
  backgroundColor: string;
  borderColor: string;
}

const defaultNodes: DefaultNode[] = [
  { type: 'startNode', label: 'Start Node', backgroundColor: '#6ede87', borderColor: '#3fa252' },
  { type: 'endNode', label: 'End Node', backgroundColor: '#ff9a9a', borderColor: '#ff5757' },
  { type: 'processNode', label: 'Process Node', backgroundColor: '#ffcc66', borderColor: '#ffaa00' },
  { type: 'stickyNote', label: 'Sticky Note', backgroundColor: '#ffd700', borderColor: '#ffa500' },
];

export const getDefaultNodes = (): DefaultNode[] => defaultNodes;

export const createDefaultNode = (type: string, position: { x: number, y: number }, label: string, description: string): Node => {
  const nodeData = defaultNodes.find(node => node.type === type);
  if (!nodeData) throw new Error(`Unknown node type: ${type}`);

  return {
    id: `${type}_${Date.now()}`,
    type: 'customNode',
    position,
    data: { 
      label, 
      description, 
      type: nodeData.type,
      backgroundColor: nodeData.backgroundColor,
      borderColor: nodeData.borderColor
    },
  };
};