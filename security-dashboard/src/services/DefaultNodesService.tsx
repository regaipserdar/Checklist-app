import { Node } from 'reactflow';

export interface DefaultNode {
  type: string;
  label: string;
  backgroundColor: string;
  borderColor: string;
}

const defaultNodes: DefaultNode[] = [
  { type: 'start', label: 'Start Node', backgroundColor: '#6ede87', borderColor: '#3fa252' },
  { type: 'end', label: 'End Node', backgroundColor: '#ff9a9a', borderColor: '#ff5757' },
  { type: 'normal', label: 'Process Node', backgroundColor: '#ffcc66', borderColor: '#ffaa00' },
  { type: 'sticky_note', label: 'Sticky Note', backgroundColor: '#ffd700', borderColor: '#ffa500' },
];

export const getDefaultNodes = (): DefaultNode[] => defaultNodes;

export const createDefaultNode = (type: string, position: { x: number, y: number }, label?: string): Node => {
  const nodeData = defaultNodes.find(node => node.type === type);
  if (!nodeData) throw new Error(`Unknown node type: ${type}`);

  return {
    id: `${type}_${Date.now()}`,
    type: 'customNode',
    position,
    data: { 
      label: label || nodeData.label, 
      type: nodeData.type,
      backgroundColor: nodeData.backgroundColor,
      borderColor: nodeData.borderColor,
      description: '',
      tips: '',
      usable_pentest_tools: '',
      inputCount: 0,
      outputCount: 0,
      order: 0,
    },
  };
};

// PocketBase'e kaydetmeden önce node tipini dönüştürmek için kullanılacak fonksiyon
export const mapNodeType = (reactFlowType: string): string => {
  switch (reactFlowType) {
    case 'start':
      return 'start';
    case 'end':
      return 'end';
    case 'sticky_note':
      return 'sticky_note';
    default:
      return 'normal';
  }
};