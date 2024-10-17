// useFlowState.ts
import { useState, useRef, MutableRefObject, useCallback, useMemo, useEffect } from 'react';
import { 
  Node, 
  Edge, 
  ReactFlowInstance, 
  useNodesState, 
  useEdgesState, 
  OnNodesChange, 
  OnEdgesChange 
} from 'reactflow';
import { useParams } from 'react-router-dom';
import log from 'loglevel';

// Log seviyesini ayarlayın (production'da INFO veya WARN kullanabilirsiniz)
log.setLevel(process.env.NODE_ENV === 'production' ? log.levels.INFO : log.levels.DEBUG);

export interface FlowState {
  flowId: string | null;
  reactFlowWrapper: MutableRefObject<HTMLDivElement | null>;
  setFlowId: React.Dispatch<React.SetStateAction<string | null>>;
  nodes: Node[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  onNodesChange: OnNodesChange;
  edges: Edge[];
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  onEdgesChange: OnEdgesChange;
  flowTitle: string;
  setFlowTitle: React.Dispatch<React.SetStateAction<string>>;
  flowDescription: string;
  setFlowDescription: React.Dispatch<React.SetStateAction<string>>;
  selectedNode: Node | null;
  setSelectedNode: React.Dispatch<React.SetStateAction<Node | null>>;
  isDrawerOpen: boolean;
  setIsDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isFlowModalOpen: boolean;
  setIsFlowModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isNewFlowModalOpen: boolean;
  setIsNewFlowModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  alert: AlertState | null;
  setAlert: React.Dispatch<React.SetStateAction<AlertState | null>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  editedNodeData: EditedNodeData;
  setEditedNodeData: React.Dispatch<React.SetStateAction<EditedNodeData>>;
  reactFlowInstanceRef: MutableRefObject<ReactFlowInstance | null>;
  systemFlows: any[];
  setSystemFlows: React.Dispatch<React.SetStateAction<any[]>>;
  userFlows: any[];
  setUserFlows: React.Dispatch<React.SetStateAction<any[]>>;
  setPendingChanges: (changes: Partial<FlowState>) => void;
}

interface AlertState {
  title: string;
  description: string;
  variant: 'default' | 'destructive';
}

interface EditedNodeData {
  label: string;
  description: string;
  tips: string;
  usable_pentest_tools: string;
}

export const useFlowState = (): FlowState => {
  log.debug("Initializing useFlowState");

  const { flowId: paramFlowId } = useParams<{ flowId?: string }>();
  const [flowId, setFlowId] = useState<string | null>(paramFlowId && paramFlowId !== 'new' ? paramFlowId : null);
  const reactFlowWrapper = useRef<HTMLDivElement | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [flowTitle, setFlowTitle] = useState('');
  const [flowDescription, setFlowDescription] = useState('');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFlowModalOpen, setIsFlowModalOpen] = useState(false);
  const [isNewFlowModalOpen, setIsNewFlowModalOpen] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editedNodeData, setEditedNodeData] = useState<EditedNodeData>({ 
    label: '', 
    description: '', 
    tips: '', 
    usable_pentest_tools: '' 
  });
  const [systemFlows, setSystemFlows] = useState<any[]>([]);
  const [userFlows, setUserFlows] = useState<any[]>([]);
  const reactFlowInstanceRef = useRef<ReactFlowInstance | null>(null);

  const setPendingChanges = useCallback((changes: Partial<FlowState>) => {
    log.debug('Setting pending changes:', changes);
    Object.entries(changes).forEach(([key, value]) => {
      switch (key) {
        case 'flowId':
          setFlowId(value as string | null);
          break;
        case 'nodes':
          setNodes(value as Node[]);
          break;
        case 'edges':
          setEdges(value as Edge[]);
          break;
        case 'flowTitle':
          setFlowTitle(value as string);
          break;
        case 'flowDescription':
          setFlowDescription(value as string);
          break;
        case 'selectedNode':
          setSelectedNode(value as Node | null);
          break;
        case 'isDrawerOpen':
          setIsDrawerOpen(value as boolean);
          break;
        case 'isFlowModalOpen':
          setIsFlowModalOpen(value as boolean);
          break;
        case 'isNewFlowModalOpen':
          setIsNewFlowModalOpen(value as boolean);
          break;
        case 'alert':
          setAlert(value as AlertState | null);
          break;
        case 'isLoading':
          setIsLoading(value as boolean);
          break;
        case 'editedNodeData':
          setEditedNodeData(value as EditedNodeData);
          break;
        case 'systemFlows':
          setSystemFlows(value as any[]);
          break;
        case 'userFlows':
          setUserFlows(value as any[]);
          break;
      }
    });
  }, [setNodes, setEdges]);

  const state = useMemo(() => ({
    flowId,
    reactFlowWrapper,
    setFlowId,
    nodes,
    setNodes,
    onNodesChange,
    edges,
    setEdges,
    onEdgesChange,
    flowTitle,
    setFlowTitle,
    flowDescription,
    setFlowDescription,
    selectedNode,
    setSelectedNode,
    isDrawerOpen,
    setIsDrawerOpen,
    isFlowModalOpen,
    setIsFlowModalOpen,
    isNewFlowModalOpen,
    setIsNewFlowModalOpen,
    alert,
    setAlert,
    isLoading,
    setIsLoading,
    editedNodeData,
    setEditedNodeData,
    reactFlowInstanceRef,
    systemFlows,
    setSystemFlows,
    userFlows,
    setUserFlows,
    setPendingChanges,
  }), [
    flowId, nodes, edges, flowTitle, flowDescription, selectedNode, 
    isDrawerOpen, isFlowModalOpen, isNewFlowModalOpen, alert, isLoading, 
    editedNodeData, systemFlows, userFlows, onNodesChange, onEdgesChange, 
    setPendingChanges
  ]);

  log.debug("useFlowState initialized", { 
    flowId: state.flowId, 
    nodesCount: state.nodes.length, 
    edgesCount: state.edges.length 
  });

  useEffect(() => {
    log.debug('[useFlowState] Nodes or edges updated:', { nodes, edges });
  }, [nodes, edges]);

  return state;
};