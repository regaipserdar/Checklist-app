import pb from './Pb-getFlowService';

export const getOne = async (collectionName: string, id: string, expand?: string) => {
  try {
    const record = await pb.collection(collectionName).getOne(id, { expand });
    return record;
  } catch (error) {
    console.error(`Error fetching ${collectionName} record:`, error);
    throw error;
  }
};

export const getList = async (collectionName: string, page = 1, perPage = 50, filters = '', sort = '-created') => {
  try {
    const records = await pb.collection(collectionName).getList(page, perPage, {
      filter: filters,
      sort: sort,
    });
    return records;
  } catch (error) {
    console.error(`Error fetching ${collectionName} list:`, error);
    throw error;
  }
};

export const create = async (collectionName: string, data: any) => {
  try {
    const record = await pb.collection(collectionName).create(data);
    return record;
  } catch (error) {
    console.error(`Error creating ${collectionName} record:`, error);
    throw error;
  }
};

export const update = async (collectionName: string, id: string, data: any) => {
  try {
    const record = await pb.collection(collectionName).update(id, data);
    return record;
  } catch (error) {
    console.error(`Error updating ${collectionName} record:`, error);
    throw error;
  }
};

export const remove = async (collectionName: string, id: string) => {
  try {
    await pb.collection(collectionName).delete(id);
  } catch (error) {
    console.error(`Error deleting ${collectionName} record:`, error);
    throw error;
  }
};

export const getFullList = async (collectionName: string, options = {}) => {
  try {
    const records = await pb.collection(collectionName).getFullList(options);
    return records;
  } catch (error) {
    console.error(`Error fetching full list of ${collectionName}:`, error);
    throw error;
  }
};