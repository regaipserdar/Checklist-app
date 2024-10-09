import { useCallback, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Connection, Edge, addEdge, Node, XYPosition } from 'reactflow';
import pb from '../../services/Pb-getFlowService';
import { useAuth } from '../../context/AuthContext';
import { createSystemFlowNodes } from '../../services/SystemFlow-Nodes';
import { createDefaultNode } from '../../services/DefaultNodesService';
import { getUserFlows, getFlowDetails, refreshUserFlows, refreshFlowDetails } from '../../services/UserFlowService';
import { saveService } from '../../services/SaveService';
import { useToast } from "@/hooks/use-toast";

export const useFlowActions = (state: ReturnType<typeof import('./useFlowState').useFlowState>) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const loadingRef = useRef(false);
  const renderCountRef = useRef(0);
  const { toast } = useToast();

  useEffect(() => {
    renderCountRef.current += 1;
    console.log(`[useFlowActions] rendered ${renderCountRef.current} times`);
    return () => console.log('[useFlowActions] cleanup');
  });

  const onConnect = useCallback((params: Connection | Edge) => {
    console.log('[useFlowActions] onConnect called with params:', params);
    const newEdge: Edge = {
      id: `e${params.source}-${params.target}`,
      source: params.source!,
      target: params.target!,
      type: 'smoothstep',
    };
    state.setEdges((eds) => {
      const newEdges = addEdge(newEdge, eds);
      console.log('[useFlowActions] New edges after connection:', newEdges);
      return newEdges;
    });
  }, [state.setEdges]);

  const loadFlow = useCallback(async (flowId: string) => {
    console.log(`[useFlowActions] loadFlow called with flowId: ${flowId}`);
    
    if (loadingRef.current) {
      console.log('[useFlowActions] Loading already in progress, skipping this request');
      return;
    }
    
    loadingRef.current = true;
    console.log('[useFlowActions] Loading started');
    state.setIsLoading(true);
  
    try {
      if (flowId && flowId !== 'new') {
        console.log(`[useFlowActions] Fetching existing flow with flowId: ${flowId}`);
        const flowDetails = await getFlowDetails(flowId);
        console.log(`[useFlowActions] Successfully loaded flow details for flowId: ${flowId}`, flowDetails);
        
        state.setFlowId(flowDetails.id);
        state.setFlowTitle(flowDetails.title);
        state.setFlowDescription(flowDetails.description);
        
        console.log('[useFlowActions] Setting nodes:', flowDetails.nodes);
        state.setNodes(flowDetails.nodes);
        
        console.log('[useFlowActions] Setting edges:', flowDetails.edges);
        state.setEdges(flowDetails.edges);
        
      } else if (user) {
        console.log(`[useFlowActions] flowId is 'new' or missing. Fetching user flows for userId: ${user.id}`);
        const userFlows = await getUserFlows(user.id);
        console.log(`[useFlowActions] Successfully loaded ${userFlows.length} flows for userId: ${user.id}`);
        
        const flowNodes = userFlows.map((flow, index) => 
          createUserFlowNode(flow, { x: index * 200, y: 100 })
        );
        console.log('[useFlowActions] Created flow nodes:', flowNodes);
        
        state.setNodes(flowNodes);
        state.setEdges([]);
      }
    } catch (error) {
      console.error('[useFlowActions] Error loading flow:', error);
      
      state.setAlert({
        title: 'Error',
        description: 'Failed to load flow. Please try again.',
        variant: 'destructive',
      });
    } finally {
      state.setIsLoading(false);
      loadingRef.current = false;
      console.log('[useFlowActions] Flow loading process completed');
    }
  }, [state, user]);

  const refreshFlow = useCallback(async (flowId: string) => {
    console.log('[useFlowActions] refreshFlow called with flowId:', flowId);
    if (flowId && flowId !== 'new') {
      const { nodes, edges } = await refreshFlowDetails(flowId);
      console.log('[useFlowActions] Refreshed flow details:', { nodes, edges });
      state.setNodes(nodes);
      state.setEdges(edges);
    } else if (user) {
      const userFlows = await refreshUserFlows(user.id);
      console.log('[useFlowActions] Refreshed user flows:', userFlows);
      const flowNodes = userFlows.map((flow, index) => 
        createUserFlowNode(flow, { x: index * 200, y: 100 })
      );
      console.log('[useFlowActions] Refreshed flow nodes:', flowNodes);
      state.setNodes(flowNodes);
      state.setEdges([]);
    }
  }, [state, user]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    console.log('[useFlowActions] onDragOver called');
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    async (event: React.DragEvent) => {
      console.log('[useFlowActions] onDrop called');
      event.preventDefault();

      if (!state.reactFlowWrapper.current) {
        console.log('[useFlowActions] React flow wrapper not initialized');
        return;
      }

      const reactFlowBounds = state.reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');
      console.log('[useFlowActions] Dropped item type:', type);

      const position = state.reactFlowInstanceRef.current?.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      }) || { x: 0, y: 0 };
      console.log('[useFlowActions] Drop position:', position);

      let parsedData;
      try {
        parsedData = JSON.parse(type);
        console.log('[useFlowActions] Parsed drop data:', parsedData);
      } catch (error) {
        console.log('[useFlowActions] Drop data is not JSON, using as is');
        parsedData = { type: type };
      }

      if (parsedData.type === 'systemFlow') {
        console.log('[useFlowActions] Handling system flow drop');
        const systemFlow = state.systemFlows.find((flow: any) => flow.id === parsedData.flowId);
        if (systemFlow) {
          const result = await createSystemFlowNodes(systemFlow, position);
          console.log('[useFlowActions] Created system flow nodes:', result);
          state.setNodes((nds) => [...nds, ...result.nodes]);
          state.setEdges((eds) => [...eds, ...result.edges]);
        }
      } else if (parsedData.type === 'userFlow') {
        console.log('[useFlowActions] Handling user flow drop');
        const userFlow = state.userFlows.find((flow: any) => flow.id === parsedData.flowId);
        if (userFlow) {
          const newNode = createUserFlowNode(userFlow, position);
          console.log('[useFlowActions] Created user flow node:', newNode);
          state.setNodes((nds) => [...nds, newNode]);
        }
      } else {
        console.log('[useFlowActions] Handling default node drop');
        const newNode = createDefaultNode(parsedData.type, position);
        console.log('[useFlowActions] Created default node:', newNode);
        state.setNodes((nds) => [...nds, newNode]);
      }
    },
    [state]
  );

  const createUserFlowNode = (userFlow: any, position: XYPosition) => {
    console.log('[useFlowActions] Creating user flow node:', userFlow, position);
    return {
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
    };
  };

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    console.log('[useFlowActions] Node clicked:', node);
    state.setSelectedNode(node);
    state.setEditedNodeData({ 
      label: node.data.label, 
      description: node.data.description || '',
      tips: node.data.tips || '',
      usable_pentest_tools: node.data.usable_pentest_tools || '',
    });
    state.setIsDrawerOpen(true);
  }, [state]);

  const handleEdit = useCallback((node: Node) => {
    console.log('[useFlowActions] Editing node:', node);
    state.setSelectedNode(node);
    state.setEditedNodeData({ 
      label: node.data.label, 
      description: node.data.description || '',
      tips: node.data.tips || '',
      usable_pentest_tools: node.data.usable_pentest_tools || '',
    });
    state.setIsDrawerOpen(true);
  }, [state]);

  const handleDelete = useCallback((nodeId: string) => {
    console.log('[useFlowActions] Deleting node:', nodeId);
    state.setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    state.setSelectedNode(null);
    state.setIsDrawerOpen(false);
    state.setAlert({
      title: "Node Deleted",
      description: "The node has been successfully removed.",
      variant: "destructive"
    });
  }, [state]);

  const handleNodeDataChange = useCallback((field: string, value: string) => {
    console.log('[useFlowActions] Node data changed:', field, value);
    state.setEditedNodeData((prev) => ({ ...prev, [field]: value }));
  }, [state]);

  const handleSaveNodeData = useCallback((updatedData: any) => {
    console.log('[useFlowActions] Saving node data:', updatedData);
    if (state.selectedNode) {
      state.setNodes((nds) =>
        nds.map((node) =>
          node.id === state.selectedNode.id
            ? { ...node, data: { ...node.data, ...updatedData } }
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

  const handleSave = useCallback(async () => {
    console.log('[useFlowActions] Saving flow');
    if (!user) {
      console.error('[useFlowActions] No user logged in');
      state.setAlert({
        title: "Error",
        description: "You must be logged in to save a flow.",
        variant: "destructive"
      });
      return;
    }
  
    try {
      console.log('[useFlowActions] Setting pending changes in SaveService');
      saveService.setPendingChanges({
        flowId: state.flowId,
        flowTitle: state.flowTitle,
        flowDescription: state.flowDescription,
        nodes: state.nodes,
        edges: state.edges,
        userId: user.id,
      });
  
      console.log('[useFlowActions] Calling saveChanges in SaveService');
      const result = await saveService.saveChanges(toast);  // toast fonksiyonunu argüman olarak geçirin
      console.log('[useFlowActions] Flow saved with result:', result);
  
      if (result) {
        state.setFlowId(result.flowId);
        state.setNodes(result.nodes);
        state.setEdges(result.edges);
        state.setAlert({
          title: "Success",
          description: `Flow ${state.flowId ? 'updated' : 'created'} successfully.`,
          variant: "default"
        });
        state.setIsFlowModalOpen(false);
  
        if (!state.flowId) {
          console.log('[useFlowActions] Navigating to new flow page');
          navigate(`/flows/${result.flowId}`, { replace: true });
        }
      } else {
        throw new Error('Failed to save flow: No result returned');
      }
    } catch (error) {
      console.error('[useFlowActions] Error saving flow:', error);
      state.setAlert({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to save the flow. Please try again.',
        variant: "destructive"
      });
    }
  }, [state, user, navigate, toast]);



  const handleCreateNewFlow = useCallback(async () => {
    console.log('[useFlowActions] Creating new flow');
    try {
      const newFlow = await pb.collection('flows').create({
        title: state.flowTitle,
        description: state.flowDescription,
        creator: user?.id,
        isSystemFlow: false,
        isShared: true,
      });
      console.log('[useFlowActions] New flow created:', newFlow);
      state.setFlowId(newFlow.id);
      state.setIsNewFlowModalOpen(false);
      navigate(`/flows/${newFlow.id}`, { replace: true });
      state.setAlert({
        title: "Success",
        description: "New flow created successfully.",
        variant: "default"
      });
    } catch (error) {
      console.error('[useFlowActions] Error creating new flow:', error);
      state.setAlert({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to create new flow. Please try again.',
        variant: "destructive"
      });
    }
  }, [state, user, navigate]);

  const handleBackToDashboard = useCallback(() => {
    console.log('[useFlowActions] Navigating back to dashboard');
    navigate('/');
  }, [navigate]);

  return useMemo(() => ({
    onConnect,
    onDragOver,
    onDrop,
    onNodeClick,
    handleEdit,
    loadFlow,
    isLoading: loadingRef.current,
    refreshFlow,
    handleDelete,
    handleNodeDataChange,
    handleSaveNodeData,
    handleSave,
    handleCreateNewFlow,
    handleBackToDashboard,
  }), [
    onConnect, onDrop, onNodeClick, handleEdit, loadFlow, refreshFlow,
    handleDelete, handleNodeDataChange, handleSaveNodeData, handleSave,
    handleCreateNewFlow, handleBackToDashboard
  ]);
};