import { useCallback, useState, useRef, useEffect } from 'react';
import { 
  Node, 
  Edge, 
  useReactFlow, 
  addEdge, 
  Connection, 
  applyNodeChanges, 
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  XYPosition,
  NodeProps,
  Viewport,
  ReactFlowInstance
} from 'reactflow';
import { useSaveService } from '../../services/SaveService';
import pb from '../../services/Pb-getFlowService';
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';
import log from 'loglevel';
import { createUserFlowNodes } from '../../services/UserFlowService';
import { CustomNodeData } from '@/components/CustomNode';

interface FlowData {
  nodes: Node[];
  edges: Edge[];
  viewport: Viewport;
}

// interface SaveData {
//   flowId: string | null;
//   title: string;
//   description: string;
//   flow: FlowData;
//   userId: string;
// }

// Log level ayarı
log.setLevel('debug');

export const useFlowActions = (initialNodes: Node[], initialEdges: Edge[]) => {
  // State tanımlamaları
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node<CustomNodeData> | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  // Hook'lar
  const { getViewport, project } = useReactFlow();
  const { saveChanges } = useSaveService();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Referanslar
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);

  // Effect'ler
  useEffect(() => {
    log.debug('[useFlowActions] Updating nodes ref:', nodes);
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    log.debug('[useFlowActions] Updating edges ref:', edges);
    edgesRef.current = edges;
  }, [edges]);

  // Yardımcı fonksiyonlar
  const prepareFlowData = useCallback((): FlowData => {
    const viewport = getViewport();
    
    const preparedNodes = nodesRef.current.map(node => ({
      id: node.id,
      type: 'customNode',
      position: node.position,
      data: {
        label: node.data.label,
        description: node.data.description,
        tips: node.data.tips,
        usable_pentest_tools: node.data.usable_pentest_tools,
        type: node.data.type,
      }
    }));

    const preparedEdges = edgesRef.current.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      type: edge.type
    }));

    return {
      nodes: preparedNodes,
      edges: preparedEdges,
      viewport
    };
  }, [getViewport]);

  // Node işlemleri
  const onNodeEdit = useCallback((event: React.MouseEvent, nodeProps: NodeProps<CustomNodeData>) => {
    log.info('[useFlowActions] Node edit triggered for node:', nodeProps);
    event.stopPropagation();
    
    const nodeToEdit = nodes.find(n => n.id === nodeProps.id);
    if (nodeToEdit) {
      setSelectedNode(nodeToEdit);
      setIsDrawerOpen(true);
    }
  }, [nodes]);

  const onNodeDelete = useCallback((event: React.MouseEvent, nodeId: string) => {
    log.info('[useFlowActions] Node delete triggered for nodeId:', nodeId);
    event.stopPropagation();
    
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    
    toast({
      title: "Success",
      description: "Node deleted successfully",
    });
  }, [toast]);

  const transformNode = useCallback((node: Node) => {
    log.debug('[useFlowActions] Transforming node:', node);
    return {
      ...node,
      type: 'customNode',
      data: {
        ...node.data,
        onEdit: onNodeEdit,
        onDelete: onNodeDelete,
        type: node.data.type || 'normal'
      }
    };
  }, [onNodeEdit, onNodeDelete]);

  // ReactFlow event handlers
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    log.debug('[useFlowActions] Processing nodes changes:', changes);
    setNodes((nds) => {
      const updatedNodes = applyNodeChanges(changes, nds);
      return updatedNodes.map(transformNode);
    });
  }, [transformNode]);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    log.debug('[useFlowActions] Processing edges changes:', changes);
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  const onConnect = useCallback((connection: Connection) => {
    log.debug('[useFlowActions] Creating new connection:', connection);
    setEdges((eds) => addEdge(connection, eds));
  }, []);

  // Flow işlemleri
  const onSave = useCallback(async (flowId: string, title: string, description: string) => {
    log.info('[useFlowActions] Save triggered:', { flowId, title, description });
    setIsLoading(true);

    try {
      const currentUser = pb.authStore.model;
      if (!currentUser || !currentUser.id) {
        throw new Error("No authenticated user found");
      }

      const flowData = prepareFlowData();
      const result = await saveChanges({
        flowId,
        title,
        description,
        flow: flowData,
        userId: currentUser.id,
      });

      log.info('[useFlowActions] Save completed successfully:', result);
      toast({
        title: "Success",
        description: "Flow saved successfully.",
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      log.error('[useFlowActions] Error saving flow:', error);
      toast({
        title: "Error",
        description: `Failed to save flow: ${errorMessage}`,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [prepareFlowData, saveChanges, toast]);

  const updateFlow = useCallback(async (flowId: string, title: string, description: string) => {
    log.info('[useFlowActions] Updating flow:', { flowId, title, description });
    setIsLoading(true);
    
    try {
      const flowData = prepareFlowData();
      const updateData = {
        title,
        description,
        flow: JSON.stringify(flowData),
        isSystemFlow: false,
        isShared: true,
      };

      const updatedFlow = await pb.collection('flows').update(flowId, updateData);
      
      toast({
        title: "Success",
        description: "Flow updated successfully.",
      });

      return {
        ...updatedFlow,
        flow: typeof updatedFlow.flow === 'string' ? JSON.parse(updatedFlow.flow) : updatedFlow.flow
      };
    } catch (error) {
      log.error('[useFlowActions] Error updating flow:', error);
      toast({
        title: "Error",
        description: "Failed to update flow. Please try again.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [prepareFlowData, toast]);

  // Drag & Drop işlemleri
  const onDrop = useCallback((event: React.DragEvent) => {
    log.debug('[useFlowActions] Drop event triggered');
    event.preventDefault();
    
    const reactFlowBounds = event.currentTarget.getBoundingClientRect();
    const position = project({
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top
    });

    const droppedData = event.dataTransfer.getData('application/reactflow');

    try {
      const parsedData = JSON.parse(droppedData);
      if (parsedData.type === 'systemFlow' || parsedData.type === 'userFlow') {
        loadAndCreateNodesForFlow(parsedData.flowId, position);
      } else {
        const newNode = transformNode({
          id: `node_${Date.now()}`,
          type: 'customNode',
          position,
          data: { 
            label: `${parsedData} node`,
            type: parsedData
          }
        });
        setNodes((nds) => nds.concat(newNode));
      }
    } catch (error) {
      const newNode = transformNode({
        id: `node_${Date.now()}`,
        type: 'customNode',
        position,
        data: { 
          label: `${droppedData} node`,
          type: droppedData
        }
      });
      setNodes((nds) => nds.concat(newNode));
    }
  }, [project, transformNode]);

  const loadAndCreateNodesForFlow = useCallback(async (flowId: string, position: XYPosition) => {
    log.info('[useFlowActions] Loading and creating nodes for flow:', flowId);
    try {
      const { nodes: newNodes, edges: newEdges } = await createUserFlowNodes({ id: flowId } as any);
      const offsetNodes = newNodes.map(node => ({
        ...transformNode(node),
        position: {
          x: node.position.x + position.x,
          y: node.position.y + position.y
        }
      }));
      
      setNodes((nds) => [...nds, ...offsetNodes]);
      setEdges((eds) => [...eds, ...newEdges]);

      toast({
        title: "Success",
        description: "Flow nodes loaded successfully.",
      });
    } catch (error) {
      log.error('[useFlowActions] Error loading and creating nodes:', error);
      toast({
        title: "Error",
        description: "Failed to load flow nodes. Please try again.",
        variant: "destructive"
      });
    }
  }, [toast, transformNode]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Diğer işlemler
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    log.info('[useFlowActions] Node clicked:', { nodeId: node.id });
    setSelectedNode(node as Node<CustomNodeData>);
    setIsDrawerOpen(true);
  }, []);

  const handleBackToDashboard = useCallback(() => {
    log.info('[useFlowActions] Navigating back to dashboard');
    navigate('/dashboard');
  }, [navigate]);

  const handleSaveNodeData = useCallback((nodeData: Partial<CustomNodeData>) => {
    log.info('[useFlowActions] Saving node data:', nodeData);
    if (!selectedNode) return;

    setNodes((nds) => 
      nds.map((node) => 
        node.id === selectedNode.id
          ? transformNode({
              ...node,
              data: { ...node.data, ...nodeData }
            })
          : node
      )
    );

    setIsDrawerOpen(false);
    setSelectedNode(null);

    toast({
      title: "Success",
      description: "Node updated successfully.",
    });
  }, [selectedNode, transformNode, toast]);

  const createNewFlow = useCallback(async (userId: string, title: string, description: string) => {
    log.info('[useFlowActions] Creating new flow:', { userId, title });
    setIsLoading(true);
    
    try {
      const newFlow = await pb.collection('flows').create({
        title,
        description,
        creator: userId,
        isSystemFlow: false,
        isShared: false,
        flow: JSON.stringify({ nodes: [], edges: [], viewport: getViewport() })
      });

      toast({
        title: "Success",
        description: "New flow created successfully.",
      });

      return newFlow;
    } catch (error) {
      log.error('[useFlowActions] Error creating new flow:', error);
      toast({
        title: "Error",
        description: "Failed to create new flow. Please try again.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast, getViewport]);

  // Hook'un dönüş değerleri
// useFlowActions.ts içinde return kısmı
return {
  // State
  nodes,
  edges,
  isLoading,
  selectedNode,
  isDrawerOpen,
  reactFlowInstance,

  // Setters
  setNodes,
  setEdges,
  setIsLoading,
  setSelectedNode,         // Eklendi
  setIsDrawerOpen,
  setReactFlowInstance,

  // Node işlemleri
  onNodeEdit,
  onNodeDelete,
  transformNode,
  handleSaveNodeData,

  // Flow işlemleri
  onSave,
  updateFlow,
  createNewFlow,

  // ReactFlow event handlers
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,

  // Drag & Drop
  onDrop,
  onDragOver,

  // Navigation
  handleBackToDashboard,
};
};