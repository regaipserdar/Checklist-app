import { Node as ReactFlowNode } from 'reactflow';
import { Flow, getUserFlows } from './Pb-getFlowService';
import { create } from './apiService';
import { RecordModel } from 'pocketbase';

type CustomNode = ReactFlowNode & { id: string };

export const createUserFlowNode = (flow: Flow, position: { x: number, y: number }): CustomNode => {
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
  const newFlowData = {
    title: title || 'New Flow',
    isSystemFlow: false,
    creator: userId,
    description: description || '',
    isShared: false,
  };

  const record: RecordModel = await create('flows', newFlowData);

  // RecordModel'i Flow tipine dönüştürüyoruz
  const newFlow: Flow = {
    id: record.id,
    title: record.title as string,
    description: record.description as string,
    isSystemFlow: record.isSystemFlow as boolean,
    isShared: record.isShared as boolean,
    creator: record.creator as string,
  };

  return newFlow;
};

export const refreshUserFlows = async (): Promise<Flow[]> => {
  const flows = await getUserFlows();
  return flows.filter(flow => !flow.isSystemFlow);
};