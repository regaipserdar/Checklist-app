import pb from './Pb-getFlowService';

// Belirli bir koleksiyondan tek bir kayıt getirir
export const getOne = async (collectionName: string, id: string, expand?: string) => {
  console.log(`Fetching single record from ${collectionName} with id: ${id}`);
  try {
    const record = await pb.collection(collectionName).getOne(id, { expand });
    console.log(`Successfully fetched record from ${collectionName}:`, record);
    return record;
  } catch (error) {
    console.error(`Error fetching ${collectionName} record:`, error);
    throw error;
  }
};

// Belirli bir koleksiyondan kayıtları listeler
export const getList = async (collectionName: string, page = 1, perPage = 50, filters = '', sort = '-created') => {
  console.log(`Fetching list from ${collectionName}. Page: ${page}, PerPage: ${perPage}, Filters: ${filters}, Sort: ${sort}`);
  try {
    const records = await pb.collection(collectionName).getList(page, perPage, {
      filter: filters,
      sort: sort,
    });
    console.log(`Successfully fetched ${records.items.length} records from ${collectionName}`);
    return records;
  } catch (error) {
    console.error(`Error fetching ${collectionName} list:`, error);
    throw error;
  }
};

// Yeni bir kayıt oluşturur
export const create = async (collectionName: string, data: any) => {
  console.log(`Creating new record in ${collectionName}:`, data);
  try {
    const record = await pb.collection(collectionName).create(data);
    console.log(`Successfully created record in ${collectionName}:`, record);
    return record;
  } catch (error) {
    console.error(`Error creating ${collectionName} record:`, error);
    throw error;
  }
};

// Mevcut bir kaydı günceller
export const update = async (collectionName: string, id: string, data: any) => {
  console.log(`Updating record in ${collectionName} with id ${id}:`, data);
  try {
    const record = await pb.collection(collectionName).update(id, data);
    console.log(`Successfully updated record in ${collectionName}:`, record);
    return record;
  } catch (error) {
    console.error(`Error updating ${collectionName} record:`, error);
    throw error;
  }
};

// Bir kaydı siler
export const remove = async (collectionName: string, id: string) => {
  console.log(`Deleting record from ${collectionName} with id ${id}`);
  try {
    await pb.collection(collectionName).delete(id);
    console.log(`Successfully deleted record from ${collectionName} with id ${id}`);
  } catch (error) {
    console.error(`Error deleting ${collectionName} record:`, error);
    throw error;
  }
};

// Bir koleksiyondaki tüm kayıtları getirir
export const getFullList = async (collectionName: string, options = {}) => {
  console.log(`Fetching full list from ${collectionName} with options:`, options);
  try {
    const records = await pb.collection(collectionName).getFullList(options);
    console.log(`Successfully fetched ${records.length} records from ${collectionName}`);
    return records;
  } catch (error) {
    console.error(`Error fetching full list of ${collectionName}:`, error);
    throw error;
  }
};

export const saveFlow = async (flowData: any, flowId?: string) => {
  console.log(`Saving flow:`, flowData);
  try {
    const { nodes, edges, ...flowInfo } = flowData;
    
    if (!flowInfo.creator) {
      throw new Error('Creator ID is required');
    }

    let savedFlow;
    if (flowId) {
      // Update existing flow
      console.log(`Updating existing flow with id ${flowId}`);
      savedFlow = await pb.collection('flows').update(flowId, flowInfo);
    } else {
      // Create new flow
      console.log(`Creating new flow`);
      savedFlow = await pb.collection('flows').create(flowInfo);
    }
    console.log(`Successfully saved flow:`, savedFlow);

    // Save nodes
    console.log(`Saving ${nodes.length} nodes for flow ${savedFlow.id}`);
    for (const node of nodes) {
      await pb.collection('nodes').create({
        flow: savedFlow.id,
        ...node
      });
    }

    // Save edges
    console.log(`Saving ${edges.length} edges for flow ${savedFlow.id}`);
    for (const edge of edges) {
      await pb.collection('edges').create({
        flow: savedFlow.id,
        ...edge
      });
    }

    console.log(`Successfully saved flow and its nodes/edges`);
    return savedFlow;
  } catch (error) {
    console.error('Error saving flow:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to save flow: ${error.message}`);
    } else {
      throw new Error('Failed to save flow: Unknown error');
    }
  }
};


export const createNode = async (nodeData: any) => {
  console.log('Creating new node:', nodeData);
  try {
    const record = await pb.collection('nodes').create(nodeData);
    console.log('Successfully created node:', record);
    return record;
  } catch (error) {
    console.error('Error creating node:', error);
    throw error;
  }
};

// Edge'leri kaydetmek için örnek fonksiyon (ihtiyaca göre kullanılabilir)
// const saveEdges = async (flowId: string, edges: any[]) => {
//   console.log(`Saving edges for flow ${flowId}`);
//   await pb.collection('edges').delete(`flow="${flowId}"`);
//   for (const edge of edges) {
//     await pb.collection('edges').create({
//       flow: flowId,
//       edgeId: edge.id,
//       source: edge.source,
//       target: edge.target,
//     });
//   }
//   console.log(`Successfully saved ${edges.length} edges for flow ${flowId}`);
// };