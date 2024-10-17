import { useCallback, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Connection, Edge, Node, XYPosition, addEdge } from 'reactflow';
import pb from '../../services/Pb-getFlowService';
import { useAuth } from '../../context/AuthContext';
import { createSystemFlowNodes } from '../../services/SystemFlow-Nodes';
import { createDefaultNode } from '../../services/DefaultNodesService';
import { getUserFlows, getFlowDetails, refreshUserFlows, refreshFlowDetails } from '../../services/UserFlowService';
import { useSaveService } from '../../services/SaveService';
import { useToast } from "@/hooks/use-toast";
import log from 'loglevel';

export const useFlowActions = (state: ReturnType<typeof import('./useFlowState').useFlowState>) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const loadingRef = useRef(false);
  const renderCountRef = useRef(0);
  const { toast } = useToast();
  const { saveChanges } = useSaveService();

  useEffect(() => {
    renderCountRef.current += 1;
    log.debug(`[useFlowActions] rendered ${renderCountRef.current} times`);
    return () => log.debug('[useFlowActions] cleanup');
  });

  const onConnect = useCallback((params: Connection | Edge) => {
    log.debug('[useFlowActions] onConnect called with params:', params);
    const newEdge: Edge = {
      id: `e${params.source}-${params.target}`,
      source: params.source!,
      target: params.target!,
      type: 'smoothstep',
    };
    state.setEdges((eds) => addEdge(newEdge, eds));
  }, [state.setEdges]);

  const loadFlow = useCallback(async (flowId: string) => {
    log.debug(`[useFlowActions] loadFlow called with flowId: ${flowId}`);
    
    if (loadingRef.current) {
      log.debug('[useFlowActions] Loading already in progress, skipping this request');
      return;
    }
    
    loadingRef.current = true;
    log.debug('[useFlowActions] Loading started');
    state.setIsLoading(true);
  
    try {
      if (flowId && flowId !== 'new') {
        log.debug(`[useFlowActions] Fetching existing flow with flowId: ${flowId}`);
        const flowDetails = await getFlowDetails(flowId);
        log.debug(`[useFlowActions] Successfully loaded flow details for flowId: ${flowId}`, flowDetails);
        
        state.setFlowId(flowDetails.id);
        state.setFlowTitle(flowDetails.title);
        state.setFlowDescription(flowDetails.description);
        state.setNodes(flowDetails.nodes);
        state.setEdges(flowDetails.edges);
        
      } else if (user) {
        log.debug(`[useFlowActions] flowId is 'new' or missing. Fetching user flows for userId: ${user.id}`);
        const userFlows = await getUserFlows(user.id);
        log.debug(`[useFlowActions] Successfully loaded ${userFlows.length} flows for userId: ${user.id}`);
        
        const flowNodes = userFlows.map((flow, index) => 
          createUserFlowNode(flow, { x: index * 200, y: 100 })
        );
        log.debug('[useFlowActions] Created flow nodes:', flowNodes);
        
        state.setNodes(flowNodes);
        state.setEdges([]);
      }
    } catch (error) {
      log.error('[useFlowActions] Error loading flow:', error);
      toast({
        title: 'Error',
        description: 'Failed to load flow. Please try again.',
        variant: 'destructive',
      });
    } finally {
      state.setIsLoading(false);
      loadingRef.current = false;
      log.debug('[useFlowActions] Flow loading process completed');
    }
  }, [state, user, toast]);

  const refreshFlow = useCallback(async (flowId: string) => {
    log.debug('[useFlowActions] refreshFlow called with flowId:', flowId);
    if (flowId && flowId !== 'new') {
      const { nodes, edges } = await refreshFlowDetails(flowId);
      log.debug('[useFlowActions] Refreshed flow details:', { nodes, edges });
      state.setNodes(nodes);
      state.setEdges(edges);
    } else if (user) {
      const userFlows = await refreshUserFlows(user.id);
      log.debug('[useFlowActions] Refreshed user flows:', userFlows);
      const flowNodes = userFlows.map((flow, index) => 
        createUserFlowNode(flow, { x: index * 200, y: 100 })
      );
      log.debug('[useFlowActions] Refreshed flow nodes:', flowNodes);
      state.setNodes(flowNodes);
      state.setEdges([]);
    }
  }, [state, user]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    log.debug('[useFlowActions] onDragOver called');
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    async (event: React.DragEvent) => {
      log.debug('[useFlowActions] onDrop called');
      event.preventDefault();

      if (!state.reactFlowWrapper.current) {
        log.debug('[useFlowActions] React flow wrapper not initialized');
        return;
      }

      const reactFlowBounds = state.reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');
      log.debug('[useFlowActions] Dropped item type:', type);

      const position = state.reactFlowInstanceRef.current?.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      }) || { x: 0, y: 0 };
      log.debug('[useFlowActions] Drop position:', position);

      let parsedData;
      try {
        parsedData = JSON.parse(type);
        log.debug('[useFlowActions] Parsed drop data:', parsedData);
      } catch (error) {
        log.debug('[useFlowActions] Drop data is not JSON, using as is');
        parsedData = { type: type };
      }

      if (parsedData.type === 'systemFlow') {
        log.debug('[useFlowActions] Handling system flow drop');
        const systemFlow = state.systemFlows.find((flow: any) => flow.id === parsedData.flowId);
        if (systemFlow) {
          const result = await createSystemFlowNodes(systemFlow, position);
          log.debug('[useFlowActions] Created system flow nodes:', result);
          state.onNodesChange(result.nodes.map(node => ({ type: 'add', item: node })));
          state.onEdgesChange(result.edges.map(edge => ({ type: 'add', item: edge })));
        }
      } else if (parsedData.type === 'userFlow') {
        log.debug('[useFlowActions] Handling user flow drop');
        const userFlow = state.userFlows.find((flow: any) => flow.id === parsedData.flowId);
        if (userFlow) {
          const newNode = createUserFlowNode(userFlow, position);
          log.debug('[useFlowActions] Created user flow node:', newNode);
          state.onNodesChange([{ type: 'add', item: newNode }]);
        }
      } else {
        log.debug('[useFlowActions] Handling default node drop');
        const newNode = createDefaultNode(parsedData.type, position);
        log.debug('[useFlowActions] Created default node:', newNode);
        state.onNodesChange([{ type: 'add', item: newNode }]);
      }
    },
    [state]
  );

  const createUserFlowNode = (userFlow: any, position: XYPosition) => {
    log.debug('[useFlowActions] Creating user flow node:', userFlow, position);
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
    log.debug('[useFlowActions] Node clicked:', node);
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
    log.debug('[useFlowActions] Editing node:', node);
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
    log.debug('[useFlowActions] Deleting node:', nodeId);
    state.onNodesChange([{ type: 'remove', id: nodeId }]);
    state.setSelectedNode(null);
    state.setIsDrawerOpen(false);
    toast({
      title: "Node Deleted",
      description: "The node has been successfully removed.",
      variant: "destructive"
    });
  }, [state, toast]);

  const handleNodeDataChange = useCallback((field: string, value: string) => {
    log.debug('[useFlowActions] Node data changed:', field, value);
    state.setEditedNodeData((prev) => ({ ...prev, [field]: value }));
  }, [state]);

  const handleSaveNodeData = useCallback((updatedData: any) => {
    log.debug('[useFlowActions] Saving node data:', updatedData);
    if (state.selectedNode) {
      state.setNodes((nds) =>
        nds.map((node) =>
          node.id === state.selectedNode!.id
            ? { ...node, data: { ...node.data, ...updatedData } }
            : node
        )
      );
      state.setSelectedNode(null);
      state.setIsDrawerOpen(false);
      toast({
        title: "Node Updated",
        description: "The node has been successfully updated.",
      });
    }
  }, [state, toast]);

  const handleCreateNewFlow = useCallback(async () => {
    log.debug('[useFlowActions] Creating new flow');
    try {
      const newFlow = await pb.collection('flows').create({
        title: state.flowTitle,
        description: state.flowDescription,
        creator: user?.id,
        isSystemFlow: false,
        isShared: true,
      });
      log.debug('[useFlowActions] New flow created:', newFlow);
      state.setFlowId(newFlow.id);
      state.setIsNewFlowModalOpen(false);
      navigate(`/flows/${newFlow.id}`, { replace: true });
      toast({
        title: "Success",
        description: "New flow created successfully.",
      });
    } catch (error) {
      log.error('[useFlowActions] Error creating new flow:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to create new flow. Please try again.',
        variant: "destructive"
      });
    }
  }, [state, user, navigate, toast]);

  const handleBackToDashboard = useCallback(() => {
    log.debug('[useFlowActions] Navigating back to dashboard');
    navigate('/');
  }, [navigate]);


  //handlesave !! 


  const handleSave = useCallback(async () => {
  log.debug('[useFlowActions] Saving flow');
  if (!user) {
    log.error('[useFlowActions] No user logged in');
    toast({
      title: "Error",
      description: "You must be logged in to save a flow.",
      variant: "destructive"
    });
    return;
  }

  log.debug('[useFlowActions] Current state:', state);
  
  const changes = {
    flowId: state.flowId,
    flowTitle: state.flowTitle,
    flowDescription: state.flowDescription,
    nodes: state.nodes,
    edges: state.edges,
    userId: user.id,
  };
  
  log.debug('[useFlowActions] Preparing changes to save:', changes);
  
  try {
    log.debug('[useFlowActions] Calling saveChanges');
    const result = await saveChanges(changes);
    log.debug('[useFlowActions] Flow saved with result:', result);

    if (result) {
      state.setFlowId(result.flowId);
      state.setNodes(result.nodes);
      state.setEdges(result.edges);
      state.setIsFlowModalOpen(false);

      if (!state.flowId) {
        log.debug('[useFlowActions] Navigating to new flow page');
        navigate(`/flows/${result.flowId}`, { replace: true });
      }

      toast({
        title: "Success",
        description: "Flow saved successfully.",
      });
    } else {
      throw new Error('Save operation did not return a result');
    }
  } catch (error) {
    log.error('[useFlowActions] Error saving flow:', error);
    
    let errorMessage = 'Failed to save the flow. Please try again.';
    if (error instanceof Error) {
      log.error('[useFlowActions] Error details:', error.message);
      log.error('[useFlowActions] Error stack:', error.stack);
      errorMessage = error.message;
    }

    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive"
    });
  }
}, [state, user, navigate, saveChanges, toast]);

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
    onConnect,
    onDrop,
    onNodeClick,
    handleEdit,
    loadFlow,
    refreshFlow,
    handleDelete,
    handleNodeDataChange,
    handleSaveNodeData,
    handleSave,
    handleCreateNewFlow,
    handleBackToDashboard
  ]);
};