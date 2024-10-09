import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

// Globally disable auto cancellation
pb.autoCancellation(false);

export interface Flow {
  id: string;
  title: string;
  description: string;
  isSystemFlow: boolean;
  isShared: boolean;
  creator: string[];
}

export const getUserFlows = async (): Promise<Flow[]> => {
  try {
    console.log('Fetching flows from server');
    const records = await pb.collection('flows').getFullList<Flow>({
      sort: '-created',
      requestKey: `getFlows_${Date.now()}`,
    });

    console.log('Received records from PocketBase:', records.length);

    return records.map(record => ({
      id: record.id,
      title: record.title,
      description: record.description,
      isSystemFlow: record.isSystemFlow,
      isShared: record.isShared,
      creator: record.creator,
    }));
  } catch (error) {
    console.error('Error fetching flows:', error);
    throw error;
  }
};

export const getCurrentUser = () => pb.authStore.model;

export default pb;