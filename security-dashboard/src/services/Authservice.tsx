import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export const login = async (email: string, password: string): Promise<AuthUser> => {
  try {
    const authData = await pb.collection('users').authWithPassword(email, password);
    
    if (!authData.record) {
      throw new Error('Authentication failed');
    }

    return {
      id: authData.record.id,
      email: authData.record.email,
      name: authData.record.name,
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const logout = () => {
  pb.authStore.clear();
};

export const getCurrentUser = (): AuthUser | null => {
  if (pb.authStore.isValid) {
    const user = pb.authStore.model;
    return user ? {
      id: user.id,
      email: user.email,
      name: user.name,
    } : null;
  }
  return null;
};

export const isAuthenticated = (): boolean => {
  return pb.authStore.isValid;
};

export default pb;