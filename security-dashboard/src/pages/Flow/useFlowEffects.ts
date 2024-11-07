import { useEffect } from 'react';
import pb from '../../services/Pb-getFlowService';
import { FlowState } from './useFlowState';

export const useFlowEffects = (state: FlowState, actions: any) => {
  useEffect(() => {
    console.log('[useFlowEffects] Effect triggered with flowId:', state.flowId);
    
    const loadFlow = async () => {
      console.log('[useFlowEffects] Starting to load flow');
      state.setIsLoading(true);
      
      try {
        if (state.flowId && state.flowId !== 'new') {
          console.log('[useFlowEffects] Fetching flow data for ID:', state.flowId);
          const record = await pb.collection('flows').getOne(state.flowId);
          console.log('[useFlowEffects] Flow data fetched:', record);
          
          state.setFlowTitle(record.title);
          state.setFlowDescription(record.description);
          
          console.log('[useFlowEffects] Loading nodes and edges');
          await loadNodesAndEdges(state.flowId);
          
        } else if (!state.flowId || state.flowId === 'new') {
          console.log('[useFlowEffects] New flow detected, opening modal');
          state.setIsFlowModalOpen(true); // Düzeltildi
        }
      } catch (error) {
        console.error('[useFlowEffects] Error loading flow:', error);
        if (error instanceof Error && (error as any).status === 404) {
          console.log('[useFlowEffects] Flow not found, opening new flow modal');
          state.setIsFlowModalOpen(true); // Düzeltildi
        } else {
          state.setAlert({
            title: "Error",
            description: error instanceof Error ? error.message : 'Failed to load the flow. Please try again.',
            variant: "destructive"
          });
        }
      } finally {
        console.log('[useFlowEffects] Flow loading completed');
        state.setIsLoading(false);
      }
    };

    loadFlow();
  }, [state.flowId]);

  const loadNodesAndEdges = async (flowId: string) => {
    console.log('[useFlowEffects] Starting to load nodes and edges for flow:', flowId);
    
    try {
      console.log('[useFlowEffects] Fetching nodes');
      const nodes = await pb.collection('nodes').getFullList({
        filter: `flow="${flowId}"`,
      });
      console.log('[useFlowEffects] Nodes fetched:', nodes);

      const processedNodes = nodes.map((node: any) => {
        console.log('[useFlowEffects] Processing node:', node.id);
        return {
          id: node.id,
          type: 'customNode',
          position: JSON.parse(node.position),
          data: {
            ...JSON.parse(node.data),
            nodeType: node.types,
            pocketbaseId: node.id
          },
        };
      });

      console.log('[useFlowEffects] Setting processed nodes');
      state.setNodes(processedNodes);

      console.log('[useFlowEffects] Fetching edges');
      const edges = await pb.collection('edges').getFullList({
        filter: `flow="${flowId}"`,
        expand: 'source,target',
      });
      console.log('[useFlowEffects] Edges fetched:', edges);

      const processedEdges = edges.map((edge: any) => ({
        id: edge.id,
        source: edge.expand?.source?.id,
        target: edge.expand?.target?.id,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        label: edge.label,
      }));

      console.log('[useFlowEffects] Setting processed edges');
      state.setEdges(processedEdges);

    } catch (error) {
      console.error('[useFlowEffects] Error loading nodes and edges:', error);
      state.setAlert({
        title: "Error",
        description: "Failed to load nodes and edges. Please try again.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    console.log('[useFlowEffects] Setting up save nodes function');
    if (actions.setSaveNodes && typeof actions.setSaveNodes === 'function') {
      actions.setSaveNodes(() => actions.saveNodesAndEdges);
    }
  }, [actions.setSaveNodes, actions.saveNodesAndEdges]);

  return { loadNodesAndEdges };
};