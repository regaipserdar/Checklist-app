import React, { createContext, useContext, useState, useEffect } from 'react';
import pb from './Pb-getFlowService';
import { Flow } from './Pb-getFlowService';
import { useAuth } from '../context/AuthContext';
import { getUserFlows, refreshUserFlows as refreshUserFlowsService } from './UserFlowService';

// System Flow Context
interface SystemFlowContextType {
  systemFlows: Flow[];
  loading: boolean;
  error: string | null;
}

const SystemFlowContext = createContext<SystemFlowContextType>({
  systemFlows: [],
  loading: false,
  error: null,
});

export const useSystemFlows = () => useContext(SystemFlowContext);

export const SystemFlowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [systemFlows, setSystemFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSystemFlows = async () => {
      console.log('Fetching system flows...');
      try {
        const flows = await pb.collection('flows').getFullList<Flow>({
          sort: '-created',
          filter: 'isSystemFlow = true',
        });
        console.log('Fetched system flows:', flows);
        setSystemFlows(flows);
      } catch (err) {
        console.error('Failed to fetch system flows:', err);
        setError('Failed to load system flows');
      } finally {
        setLoading(false);
        console.log('System flow fetch process complete. Loading state set to false.');
      }
    };

    fetchSystemFlows();
  }, []);

  return (
    <SystemFlowContext.Provider value={{ systemFlows, loading, error }}>
      {children}
    </SystemFlowContext.Provider>
  );
};

// User Flow Context
interface UserFlowContextType {
  userFlows: Flow[];
  loading: boolean;
  error: string | null;
  refreshUserFlows: () => Promise<void>;
}

const UserFlowContext = createContext<UserFlowContextType>({
  userFlows: [],
  loading: false,
  error: null,
  refreshUserFlows: async () => {},
});

export const useUserFlows = () => useContext(UserFlowContext);

export const UserFlowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userFlows, setUserFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  const fetchUserFlows = async () => {
    if (!isAuthenticated || !user) {
      console.log('User not authenticated or user information not available. Skipping user flow fetch. @FlowContexts.tsx');
      setUserFlows([]);
      setLoading(false);
      return;
    }

    console.log('Fetching user flows for user:', user.id);
    setLoading(true);

    try {
      const flows = await getUserFlows(user.id);
      console.log('Fetched user flows: @FlowContexts.tsx', flows);
      setUserFlows(flows);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch user flows:', err);
      setError('Failed to load user flows');
    } finally {
      setLoading(false);
      console.log('User flow fetch process complete. Loading state set to false. @FlowContexts.tsx');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserFlows();
    }
  }, [isAuthenticated, user]);

  const refreshUserFlows = async () => {
    if (!isAuthenticated || !user) {
      console.log('User not authenticated or user information not available. Skipping refresh user flow. @FlowContexts.tsx');
      return;
    }
  
    console.log('Refreshing user flows...@FlowContexts.tsx');
    await refreshUserFlowsService(user.id);
    await fetchUserFlows();
  };

  return (
    <UserFlowContext.Provider value={{ userFlows, loading, error, refreshUserFlows }}>
      {children}
    </UserFlowContext.Provider>
  );
};