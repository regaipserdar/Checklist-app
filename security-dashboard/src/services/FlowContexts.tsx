import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
      try {
        const flows = await pb.collection('flows').getFullList<Flow>({
          sort: '-created',
          filter: 'isSystemFlow = true',
        });
        setSystemFlows(flows);
      } catch (err) {
        console.error('Failed to fetch system flows:', err);
        setError('Failed to load system flows');
      } finally {
        setLoading(false);
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

  const fetchUserFlows = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setUserFlows([]);
      setLoading(false);
      return;
    }

    try {
      const flows = await getUserFlows(user.id);
      setUserFlows(flows);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch user flows:', err);
      setError('Failed to load user flows');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Initial fetch
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserFlows();
    }
  }, [isAuthenticated, fetchUserFlows]);

  const refreshUserFlows = useCallback(async () => {
    if (!isAuthenticated || !user) {
      return;
    }

    try {
      await refreshUserFlowsService(user.id);
      await fetchUserFlows();
    } catch (error) {
      console.error('Error refreshing user flows:', error);
      setError('Failed to refresh user flows');
    }
  }, [isAuthenticated, user, fetchUserFlows]);

  return (
    <UserFlowContext.Provider value={{ userFlows, loading, error, refreshUserFlows }}>
      {children}
    </UserFlowContext.Provider>
  );
};