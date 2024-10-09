import { Node, Edge } from 'reactflow';
import pb from './Pb-getFlowService';
import { CacheService } from './CacheService';

export interface Flow {
  id: string;
  title: string;
  isSystemFlow: boolean;
  description: string;
  creator: string[];
  isShared: boolean;
}

export const createUserFlowNode = (flow: Flow, position: { x: number, y: number }): Node => {
  console.log('Creating user flow node:', flow);
  return {
    id: `userFlow_${flow.id}`,
    type: 'customNode',
    position,
    data: { 
      label: flow.title, 
      type: 'userFlow',
      flowId: flow.id,
    },
  };
};

export const createNewFlow = async (userId: string, title: string, description: string): Promise<Flow> => {
  console.log('Creating new flow for user:', userId);
  const newFlowData = {
    title: title ? title : `${userId}_flow_${Date.now()}`,
    isSystemFlow: false,
    creator: [userId],
    description: description || '',
    isShared: false,
  };

  try {
    const record = await pb.collection('flows').create(newFlowData);
    console.log('New flow created:', record);

    const newFlow: Flow = {
      id: record.id,
      title: record.title,
      isSystemFlow: record.isSystemFlow,
      description: record.description,
      creator: record.creator,
      isShared: record.isShared,
    };

    return newFlow;
  } catch (error) {
    console.error('Error creating new flow:', error);
    throw error;
  }
};

export const getUserFlows = async (userId: string): Promise<Flow[]> => {
  const cacheKey = `userFlows_${userId}`;
  console.log(`[getUserFlows] Checking cache for key: ${cacheKey}`);

  const cachedFlows = CacheService.get<Flow[]>(cacheKey);
  if (cachedFlows) {
    console.log(`[getUserFlows] Cache hit for key: ${cacheKey}`);
    return cachedFlows;
  }

  console.log(`[getUserFlows] Cache miss for key: ${cacheKey}. Fetching from database.`);
  try {
    const records = await pb.collection('flows').getFullList({
      filter: `creator.id ?~ "${userId}" && isSystemFlow=false`,
      sort: '-created',
    });

    const userFlows: Flow[] = records.map(record => ({
      id: record.id,
      title: record.title,
      isSystemFlow: record.isSystemFlow,
      description: record.description,
      creator: record.creator,
      isShared: record.isShared,
    }));

    console.log(`[getUserFlows] Successfully fetched ${userFlows.length} flows for userId: ${userId}`);
    CacheService.set(cacheKey, userFlows);
    return userFlows;
  } catch (error) {
    console.error(`[getUserFlows] Error fetching user flows for userId: ${userId}`, error);
    throw error;
  }
};

export const getFlowDetails = async (flowId: string): Promise<{
  id: string;
  title: string;
  description: string;
  isSystemFlow: boolean;
  isShared: boolean;
  creator: string;
  nodes: Node[];
  edges: Edge[];
}> => {
  const functionName = 'getFlowDetails';
  console.log(`[${functionName}] Function called with flowId:`, flowId);

  const cacheKey = `flowDetails_${flowId}`;
  const cachedDetails = CacheService.get<ReturnType<typeof getFlowDetails>>(cacheKey);

  if (cachedDetails) {
    console.log(`[${functionName}] Returning cached details for flowId: ${flowId}`);
    return cachedDetails;
  }

  try {
    console.log(`[${functionName}] Fetching flow data from collection for flowId: ${flowId}`);
    const flowData = await pb.collection('flows').getOne(flowId);
    
    console.log(`[${functionName}] Fetching nodes data for flowId: ${flowId}`);
    const nodesData = await pb.collection('nodes').getFullList({
      filter: `flow="${flowId}"`,
    });

    console.log(`[${functionName}] Fetching edges data for flowId: ${flowId}`);
    const edgesData = await pb.collection('edges').getFullList({
      filter: `flow="${flowId}"`,
    });

    console.log(`[${functionName}] Processing nodes data for flowId: ${flowId}`);
    const nodes: Node[] = nodesData.map((node: any) => ({
      id: node.id,
      type: 'customNode',
      position: JSON.parse(node.position),
      data: {
        label: node.title,
        description: node.description,
        tips: node.tips,
        type: node.types,
        inputCount: node.inputCount,
        outputCount: node.outputCount,
        usable_pentest_tools: node.usable_pentest_tools,
      },
    }));

    console.log(`[${functionName}] Processing edges data for flowId: ${flowId}`);
    const edges: Edge[] = edgesData.map((edge: any) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      label: edge.label,
    }));

    const result = {
      id: flowData.id,
      title: flowData.title,
      description: flowData.description,
      isSystemFlow: flowData.isSystemFlow,
      isShared: flowData.isShared,
      creator: flowData.creator,
      nodes,
      edges,
    };

    console.log(`[${functionName}] Caching the result for flowId: ${flowId}`);
    CacheService.set(cacheKey, result);

    console.log(`[${functionName}] Successfully fetched and processed flow details for flowId: ${flowId}`);
    return result;
  } catch (error) {
    console.error(`[${functionName}] Error fetching flow details for flowId: ${flowId}`, error);
    throw error;
  }
};

export const refreshUserFlows = async (userId: string): Promise<Flow[]> => {
  const cacheKey = `userFlows_${userId}`;
  console.log(`[refreshUserFlows] Clearing cache for key: ${cacheKey}`);
  CacheService.clear(cacheKey);

  console.log(`[refreshUserFlows] Refreshing user flows for userId: ${userId}`);
  return getUserFlows(userId);
};

export const refreshFlowDetails = async (flowId: string): Promise<{ nodes: Node[], edges: Edge[] }> => {
  const cacheKey = `flowDetails_${flowId}`;
  console.log(`[refreshFlowDetails] Clearing cache for key: ${cacheKey}`);
  CacheService.clear(cacheKey);

  console.log(`[refreshFlowDetails] Refreshing flow details for flowId: ${flowId}`);
  return getFlowDetails(flowId);
};