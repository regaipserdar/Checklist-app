import { Node as ReactFlowNode, Edge } from 'reactflow';
import { Flow } from './Pb-getFlowService';
import pb from './Pb-getFlowService';

type CustomNode = ReactFlowNode & { id: string };

interface FlowNode {
  id: string;
  title: string;
  description: string;
  tips: string;
  flow: string[]; // relation field
  position: string; // JSON string
  order: number;
  types: 'start' | 'end' | 'normal' | 'sticky_note';
  inputCount: number;
  outputCount: number;
  usable_pentest_tools: string;
}

const HORIZONTAL_SPACING = 250;
const VERTICAL_SPACING = 150;

export const createSystemFlowNodes = async (flow: Flow, startPosition: { x: number, y: number }): Promise<{ nodes: CustomNode[], edges: Edge[] }> => {
  console.log('Creating system flow nodes for flow:', flow);
  const flowNodes: FlowNode[] = await fetchFlowNodes(flow.id);
  console.log('Fetched flow nodes:', flowNodes);
  
  // Node'ları sırala
  flowNodes.sort((a, b) => (a.order || 0) - (b.order || 0));
  
  const nodes: CustomNode[] = [];
  const edges: Edge[] = [];
  
  flowNodes.forEach((flowNode, index) => {
    // Her node için pozisyon hesapla
    const position = {
      x: startPosition.x + (index % 3) * HORIZONTAL_SPACING,
      y: startPosition.y + Math.floor(index / 3) * VERTICAL_SPACING
    };
    
    // Node oluştur
    const node: CustomNode = {
      id: flowNode.id,
      type: 'customNode',
      position,
      data: {
        label: flowNode.title,
        description: flowNode.description,
        tips: flowNode.tips,
        type: flowNode.types,
        usable_pentest_tools: flowNode.usable_pentest_tools,
        inputCount: flowNode.inputCount,
        outputCount: flowNode.outputCount,
      },
    };
    
    nodes.push(node);
    console.log('Created node:', node);
    
    // Bir sonraki node ile bağlantı oluştur (son node hariç)
    if (index < flowNodes.length - 1) {
      const edge: Edge = {
        id: `e${flowNode.id}-${flowNodes[index + 1].id}`,
        source: flowNode.id,
        target: flowNodes[index + 1].id,
        type: 'smoothstep',
      };
      edges.push(edge);
      console.log('Created edge:', edge);
    }
  });
  
  console.log('Final nodes:', nodes);
  console.log('Final edges:', edges);
  return { nodes, edges };
};

// API'den flow node'larını çekmek için yardımcı fonksiyon
async function fetchFlowNodes(flowId: string): Promise<FlowNode[]> {
  try {
    console.log('Fetching flow nodes for flow ID:', flowId);
    const records = await pb.collection('nodes').getFullList<FlowNode>({
      filter: `flow="${flowId}"`,
      sort: 'order',
    });
    console.log('Fetched records:', records);
    return records.map(record => ({
      ...record,
      position: record.position || '{"x": 0, "y": 0}',
    }));
  } catch (error) {
    console.error('Error fetching flow nodes:', error);
    throw error;
  }
}