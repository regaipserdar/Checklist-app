import { Node, Edge } from 'reactflow';
import pb from './Pb-getFlowService';

interface SaveNodesAndEdgesParams {
  flowId: string;
  nodes: Node[];
  edges: Edge[];
  setNodes: (nodes: Node[]) => void;
  setAlert: (alert: { title: string; description: string; variant: 'default' | 'destructive' }) => void;
}

export const saveNodesAndEdges = async ({
  flowId,
  nodes,
  edges,
  setNodes,
  setAlert
}: SaveNodesAndEdgesParams) => {
  console.log('saveNodesAndEdges function called');
  if (!flowId) {
    console.error('Flow ID is missing. Cannot save nodes and edges.');
    setAlert({
      title: "Error",
      description: "Flow ID is missing. Cannot save nodes and edges.",
      variant: "destructive"
    });
    return;
  }

  console.log('Attempting to save nodes and edges for flow:', flowId);
  console.log('Current nodes:', nodes);
  console.log('Current edges:', edges);

  try {
    // Save nodes
    const savedNodes = await Promise.all(nodes.map(async (node) => {
      const nodeData = {
        title: node.data.label || '',
        description: node.data.description || '',
        tips: node.data.tips || '',
        flow: flowId,
        position: JSON.stringify(node.position),
        types: node.data.nodeType || 'normal',
        inputCount: node.data.inputCount || 0,
        outputCount: node.data.outputCount || 0,
        usable_pentest_tools: node.data.usable_pentest_tools || '',
      };

      console.log('Attempting to save node:', nodeData);

      if (!node.data.pocketbaseId) {
        try {
          console.log('Creating new node in PocketBase');
          const savedNode = await pb.collection('nodes').create(nodeData);
          console.log('Successfully created new node:', savedNode);
          return { ...node, data: { ...node.data, pocketbaseId: savedNode.id } };
        } catch (error) {
          console.error('Error creating new node:', error);
          throw error;
        }
      } else {
        try {
          console.log('Updating existing node in PocketBase');
          const updatedNode = await pb.collection('nodes').update(node.data.pocketbaseId, nodeData);
          console.log('Successfully updated node:', updatedNode);
          return node;
        } catch (error) {
          console.error('Error updating node:', error);
          throw error;
        }
      }
    }));

    console.log('Saved nodes:', savedNodes);
    setNodes(savedNodes);

    // Save edges
    const existingEdges = await pb.collection('edges').getFullList({
      filter: `flow="${flowId}"`,
    });

    console.log('Existing edges:', existingEdges);

    await Promise.all(edges.map(async (edge) => {
      const sourceNode = savedNodes.find(n => n.id === edge.source);
      const targetNode = savedNodes.find(n => n.id === edge.target);

      if (!sourceNode || !targetNode) {
        console.error('Source or target node not found. Skipping edge creation/update.');
        return null;
      }

      const edgeData = {
        flow: flowId,
        source: sourceNode.data.pocketbaseId,
        target: targetNode.data.pocketbaseId,
        sourceHandle: edge.sourceHandle ?? null,
        targetHandle: edge.targetHandle ?? null,
        label: edge.label || '',
      };

      console.log('Preparing edge data:', edgeData);

      try {
        console.log('Creating new edge in PocketBase');
        console.log('Edge data being sent to PocketBase:', edgeData);
        const newEdge = await pb.collection('edges').create(edgeData);
        console.log('Response from PocketBase (new edge):', newEdge);
        return newEdge;
      } catch (error) {
        console.error('Error creating new edge:', error);
        if (error instanceof Error) {
          console.error('Error details:', error.message);
        }
        if ((error as any).data) {
          console.error('API error details:', (error as any).data);
        }
        throw error;
      }
    }));

    // Delete edges that no longer exist
    await Promise.all(existingEdges.map(async (existingEdge) => {
      if (!edges.some(e => e.id === existingEdge.id)) {
        try {
          console.log('Deleting edge from PocketBase:', existingEdge.id);
          await pb.collection('edges').delete(existingEdge.id);
          console.log('Successfully deleted edge:', existingEdge.id);
        } catch (error) {
          console.error('Error deleting edge:', error);
          throw error;
        }
      }
    }));

    setAlert({
      title: "Success",
      description: "Nodes and edges saved successfully.",
      variant: "default"
    });

    console.log('Nodes and edges saved successfully');
  } catch (error) {
    console.error('Error saving nodes and edges:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    if ((error as any).data) {
      console.error('API error details:', (error as any).data);
    }
    setAlert({
      title: "Error",
      description: error instanceof Error ? error.message : 'Failed to save nodes and edges. Please try again.',
      variant: "destructive"
    });
  }
};

interface SaveFlowParams {
  flowId: string | null;
  flowTitle: string;
  flowDescription: string;
  userId: string;
}

export const saveFlow = async ({
  flowId,
  flowTitle,
  flowDescription,
  userId,
}: SaveFlowParams): Promise<{ id: string }> => {
  try {
    const flowData = {
      title: flowTitle,
      description: flowDescription,
      creator: userId,
      isSystemFlow: false,
      isShared: true,
    };

    let savedFlow;
    if (flowId) {
      savedFlow = await pb.collection('flows').update(flowId, flowData);
    } else {
      savedFlow = await pb.collection('flows').create(flowData);
    }

    return { id: savedFlow.id };
  } catch (error) {
    console.error('Error saving flow:', error);
    throw error;
  }
};