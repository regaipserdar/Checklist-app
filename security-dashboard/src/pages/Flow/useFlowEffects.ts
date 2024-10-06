// Flow/useFlowEffects.ts
// Bu hook, Flow bileşeninin yan etkilerini (effects) yönetir.

import { useEffect } from 'react';
import pb from '../../services/Pb-getFlowService';

export const useFlowEffects = (state: any, actions: any) => {
  // Flow yükleme effect'i
  useEffect(() => {
    const loadFlow = async () => {
      state.setIsLoading(true);
      try {
        if (state.flowId && state.flowId !== 'new') {
          const record = await pb.collection('flows').getOne(state.flowId);
          state.setFlowTitle(record.title);
          state.setFlowDescription(record.description);
          await loadNodesAndEdges(state.flowId);
        } else if (!state.flowId || state.flowId === 'new') {
          state.setIsNewFlowModalOpen(true);
        }
      } catch (error) {
        console.error('Error loading flow:', error);
        if (error instanceof Error && (error as any).status === 404) {
          state.setIsNewFlowModalOpen(true);
        } else {
          state.setAlert({
            title: "Error",
            description: error instanceof Error ? error.message : 'Failed to load the flow. Please try again.',
            variant: "destructive"
          });
        }
      } finally {
        state.setIsLoading(false);
      }
    };

    loadFlow();
  }, [state.flowId]);

  // Node'ları ve Edge'leri yükleme fonksiyonu
  const loadNodesAndEdges = async (flowId: string) => {
    try {
      const nodes = await pb.collection('nodes').getFullList({
        filter: `flow="${flowId}"`,
      });
      state.setNodes(nodes.map((node: any) => ({
        id: node.id,
        type: 'customNode',
        position: JSON.parse(node.position),
        data: {
          ...JSON.parse(node.data),
          nodeType: node.types,
          pocketbaseId: node.id
        },
      })));

      const edges = await pb.collection('edges').getFullList({
        filter: `flow="${flowId}"`,
        expand: 'source,target',
      });
      state.setEdges(edges.map((edge: any) => ({
        id: edge.id,
        source: edge.expand?.source?.id,
        target: edge.expand?.target?.id,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        label: edge.label,
      })));
    } catch (error) {
      console.error('Error loading nodes and edges:', error);
      state.setAlert({
        title: "Error",
        description: "Failed to load nodes and edges. Please try again.",
        variant: "destructive"
      });
    }
  };

  // SaveNodes fonksiyonunu ayarlama effect'i
  useEffect(() => {
    if (actions.setSaveNodes && typeof actions.setSaveNodes === 'function') {
      actions.setSaveNodes(() => actions.saveNodesAndEdges);
    }
  }, [actions.setSaveNodes, actions.saveNodesAndEdges]);

  return { loadNodesAndEdges };
};