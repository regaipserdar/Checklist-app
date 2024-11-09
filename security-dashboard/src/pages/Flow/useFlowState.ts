import { useState, useRef, MutableRefObject, useEffect } from 'react';
import { Node, Edge, ReactFlowInstance } from 'reactflow';
import { useParams } from 'react-router-dom';
import { CustomNodeData } from '@/components/CustomNode';
import { useSaveService } from '../../services/SaveService';

export interface AlertState {
  title: string;
  description: string;
  variant: 'default' | 'destructive';
}

export interface FlowState {
  flowId: string | null;
  reactFlowWrapper: MutableRefObject<HTMLDivElement | null>;
  setFlowId: React.Dispatch<React.SetStateAction<string | null>>;
  nodes: Node<CustomNodeData>[];
  setNodes: React.Dispatch<React.SetStateAction<Node<CustomNodeData>[]>>;
  edges: Edge[];
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  flowTitle: string;
  setFlowTitle: React.Dispatch<React.SetStateAction<string>>;
  flowDescription: string;
  setFlowDescription: React.Dispatch<React.SetStateAction<string>>;
  selectedNode: Node<CustomNodeData> | null;
  setSelectedNode: React.Dispatch<React.SetStateAction<Node<CustomNodeData> | null>>;
  isDrawerOpen: boolean;
  isFlowModalOpen: boolean;
  setIsFlowModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  alert: AlertState | null;
  setAlert: React.Dispatch<React.SetStateAction<AlertState | null>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  reactFlowInstanceRef: MutableRefObject<ReactFlowInstance | null>;
}

export const useFlowState = (): FlowState => {
  console.log('[useFlowState] Initializing flow state hook');
  
  const { flowId: paramFlowId } = useParams<{ flowId?: string }>();
  const { loadFlow } = useSaveService();
  
  console.log('[useFlowState] Flow ID from params:', paramFlowId);
  
  const [flowId, setFlowId] = useState<string | null>(
    paramFlowId && paramFlowId !== 'new' ? paramFlowId : null
  );
  const [isFlowModalOpen, setIsFlowModalOpen] = useState(false);
  
  const reactFlowWrapper = useRef<HTMLDivElement | null>(null);
  const reactFlowInstanceRef = useRef<ReactFlowInstance | null>(null);
  
  const [nodes, setNodes] = useState<Node<CustomNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [flowTitle, setFlowTitle] = useState('');
  const [flowDescription, setFlowDescription] = useState('');
  const [selectedNode, setSelectedNode] = useState<Node<CustomNodeData> | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initial data load
  useEffect(() => {
    const loadFlowData = async () => {
      if (!flowId) return;

      console.log('[useFlowState] Loading flow data for ID:', flowId);
      setIsLoading(true);

      try {
        const flowInfo = await loadFlow(flowId);
        if (flowInfo) {
          console.log('[useFlowState] Flow data loaded:', flowInfo);
          setFlowTitle(flowInfo.title);
          setFlowDescription(flowInfo.description);
        }
      } catch (error) {
        console.error('[useFlowState] Error loading flow:', error);
        setAlert({
          title: "Error",
          description: "Failed to load flow data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadFlowData();
  }, [flowId, loadFlow]);

  // Log state changes
  useEffect(() => {
    console.log('[useFlowState] State updated:', {
      flowId,
      flowTitle,
      nodesCount: nodes.length,
      edgesCount: edges.length,
      isLoading,
      reactFlowInstance: !!reactFlowInstanceRef.current,
      wrapperElement: !!reactFlowWrapper.current
    });
  }, [flowId, flowTitle, nodes, edges, isLoading]);

  return {
    flowId,
    setFlowId,
    reactFlowWrapper,
    nodes,
    setNodes,
    edges,
    setEdges,
    flowTitle,
    setFlowTitle,
    flowDescription,
    setFlowDescription,
    selectedNode,
    setSelectedNode,
    isFlowModalOpen,
    setIsFlowModalOpen,
    isDrawerOpen,
    setIsDrawerOpen,
    alert,
    setAlert,
    isLoading,
    setIsLoading,
    reactFlowInstanceRef,
  };
};