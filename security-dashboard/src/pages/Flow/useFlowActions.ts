import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Connection, Edge, addEdge, Node, XYPosition } from 'reactflow';
import pb from '../../services/Pb-getFlowService';
import { useAuth } from '../../context/AuthContext';
import { FlowState } from './useFlowState';
import { createSystemFlowNodes } from '../../services/SystemFlow-Nodes';
import { createDefaultNode } from '../../services/DefaultNodesService';
import { saveNodesAndEdges, saveFlow } from '../../services/flowSaveService';


export const useFlowActions = (state: FlowState) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Bağlantı oluşturma işlemi
  const onConnect = useCallback((params: Connection | Edge) => {
    const newEdge: Edge = {
      id: `temp_${Date.now()}`, // Geçici bir ID oluşturuyoruz
      source: params.source!,
      target: params.target!,
      sourceHandle: params.sourceHandle ?? undefined,
      targetHandle: params.targetHandle ?? undefined,
      type: 'default', // veya kullanmak istediğiniz edge tipi
    };
    state.setEdges((eds: Edge[]) => addEdge(newEdge, eds));
  }, [state.setEdges]);

// kullanicinin flowlarinin bilgilerinin getirilmesi.
  const loadFlow = useCallback(async (flowId: string) => {
    state.setIsLoading(true);
    try {
      if (flowId && flowId !== 'new') {
        const record = await pb.collection('flows').getOne(flowId);
        state.setFlowTitle(record.title);
        state.setFlowDescription(record.description);

        const nodesData = await pb.collection('nodes').getFullList({
          filter: `flow="${flowId}"`,
        });
        const edgesData = await pb.collection('edges').getFullList({
          filter: `flow="${flowId}"`,
        });

        state.setNodes(nodesData.map((node: any) => ({
          ...node,
          position: JSON.parse(node.position),
          data: JSON.parse(node.data),
        })));
        state.setEdges(edgesData);
      }
    } catch (error) {
      console.error('Error loading flow:', error);
      state.setAlert({
        title: 'Error',
        description: 'Failed to load flow. Please try again.',
        variant: 'destructive',
      });
    } finally {
      state.setIsLoading(false);
    }
  }, [state]);

  // Sürükleme işlemi sırasında çalışan fonksiyon
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Node bırakma işlemi
  const onDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();
  
      if (!state.reactFlowWrapper.current) {
        console.error('React Flow wrapper is not initialized');
        return;
      }
  
      const type = event.dataTransfer.getData('application/reactflow');
  
      const position = state.reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
  
      let parsedData;
      try {
        parsedData = JSON.parse(type);
      } catch (error) {
        parsedData = { type: type };
      }
  
      if (parsedData.type === 'systemFlow') {
        const systemFlow = state.systemFlows.find((flow: any) => flow.id === parsedData.flowId);
        if (systemFlow) {
          const result = await createSystemFlowNodes(systemFlow, position);
          state.setNodes((nds: Node[]) => [...nds, ...result.nodes]);
          state.setEdges((eds: Edge[]) => [...eds, ...result.edges]);
        }
      } else if (parsedData.type === 'userFlow') {
        const userFlow = state.userFlows.find((flow: any) => flow.id === parsedData.flowId);
        if (userFlow) {
          const newNode = createUserFlowNode(userFlow, position);
          state.setNodes((nds: Node[]) => [...nds, newNode]);
        }
      } else {
        const newNode = createDefaultNode(parsedData.type, position);
        state.setNodes((nds: Node[]) => [...nds, newNode]);
      }
    },
    [state.reactFlowWrapper, state.reactFlowInstance, state.setNodes, state.setEdges, state.systemFlows, state.userFlows]
  );
  
  // Kullanıcı Flow node'u oluşturma
  const createUserFlowNode = (userFlow: any, position: XYPosition) => ({
    id: `userFlow-${userFlow.id}`,
    type: 'customNode',
    position,
    data: { 
      label: userFlow.title,
      type: 'userFlow',
      description: userFlow.description,
      tips: '',
      usable_pentest_tools: '',
    },
  });

  // Node tıklama işlemi
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    state.setSelectedNode(node);
    state.setEditedNodeData({ 
      label: node.data.label, 
      description: node.data.description || '',
      tips: node.data.tips || '',
      usable_pentest_tools: node.data.usable_pentest_tools || '',
    });
    state.setIsDrawerOpen(true);
  }, []);

  // Node düzenleme işlemi
  const handleEdit = useCallback((node: Node) => {
    state.setSelectedNode(node);
    state.setEditedNodeData({ 
      label: node.data.label, 
      description: node.data.description || '',
      tips: node.data.tips || '',
      usable_pentest_tools: node.data.usable_pentest_tools || '',
    });
    state.setIsDrawerOpen(true);
  }, []);

  // Node silme işlemi
  const handleDelete = useCallback((nodeId: string) => {
    state.setNodes((nds: Node[]) => nds.filter((node) => node.id !== nodeId));
    state.setSelectedNode(null);
    state.setIsDrawerOpen(false);
    state.setAlert({
      title: "Node Deleted",
      description: "The node has been successfully removed.",
      variant: "destructive"
    });
  }, []);

  // Node verilerini güncelleme işlemi
  const handleNodeDataChange = useCallback((field: string, value: string) => {
    state.setEditedNodeData((prev: any) => ({ ...prev, [field]: value }));
  }, []);

  // Node verilerini kaydetme işlemi
  const handleSaveNodeData = useCallback((updatedData: any) => {
    if (state.selectedNode) {
      state.setNodes((nds: Node[]) =>
        nds.map((node) =>
          node.id === state.selectedNode.id
            ? { 
                ...node, 
                data: { 
                  ...node.data, 
                  ...updatedData,
                } 
              }
            : node
        )
      );
      state.setSelectedNode(null);
      state.setIsDrawerOpen(false);
      state.setAlert({
        title: "Node Updated",
        description: "The node has been successfully updated.",
        variant: "default"
      });
    }
  }, [state]);

   // Node'ları ve Edge'leri kaydetme işlemi
   const handleSaveNodesAndEdges = useCallback(async () => {
    if (!state.flowId) {
      console.error('Flow ID is missing. Cannot save nodes and edges.');
      state.setAlert({
        title: "Error",
        description: "Flow ID is missing. Cannot save nodes and edges.",
        variant: "destructive"
      });
      return;
    }

    await saveNodesAndEdges({
      flowId: state.flowId,
      nodes: state.nodes,
      edges: state.edges,
      setNodes: state.setNodes,
      setAlert: state.setAlert,
    });
  }, [state.flowId, state.nodes, state.edges, state.setNodes, state.setAlert]);

  const handleSave = useCallback(async () => {
    if (!user) {
      console.error('No user logged in');
      state.setAlert({
        title: "Error",
        description: "You must be logged in to save a flow.",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await saveFlow({
        flowId: state.flowId,
        flowTitle: state.flowTitle,
        flowDescription: state.flowDescription,
        userId: user.id,
      });

      state.setFlowId(result.id);

      await handleSaveNodesAndEdges();

      state.setAlert({
        title: "Success",
        description: `Flow ${state.flowId ? 'updated' : 'created'} successfully.`,
        variant: "default"
      });
      state.setIsFlowModalOpen(false);

      if (!state.flowId) {
        navigate(`/flows/${result.id}`, { replace: true });
      }
    } catch (error) {
      console.error('Error saving flow:', error);
      state.setAlert({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to save the flow. Please try again.',
        variant: "destructive"
      });
    }
  }, [state, user, navigate, handleSaveNodesAndEdges]);

  // Yeni Flow oluşturma işlemi
  const handleCreateNewFlow = useCallback(async () => {
    try {
      const newFlow = await pb.collection('flows').create({
        title: state.flowTitle,
        description: state.flowDescription,
        creator: user?.id,
        isSystemFlow: false,
        isShared: true,
      });
      state.setFlowId(newFlow.id);
      state.setIsNewFlowModalOpen(false);
      navigate(`/flows/${newFlow.id}`, { replace: true });
      state.setAlert({
        title: "Success",
        description: "New flow created successfully.",
        variant: "default"
      });
    } catch (error) {
      console.error('Error creating new flow:', error);
      state.setAlert({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to create new flow. Please try again.',
        variant: "destructive"
      });
    }
  }, [state.flowTitle, state.flowDescription, user, navigate]);

  // Dashboard'a dönme işlemi
  const handleBackToDashboard = useCallback(() => {
    navigate('/');
  }, [navigate]);

  return {
    onConnect,
    onDragOver,
    onDrop,
    onNodeClick,
    handleEdit,
    loadFlow,
    handleDelete,
    handleNodeDataChange,
    handleSaveNodeData,
    handleSaveNodesAndEdges,
    handleSave,
    handleCreateNewFlow,
    handleBackToDashboard,
    saveNodesAndEdges,
  };
};

