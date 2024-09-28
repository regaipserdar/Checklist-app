import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserFlows, Flow } from './Pb-getFlowService';

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
        const flows = await getUserFlows();
        setSystemFlows(flows.filter(flow => flow.isSystemFlow));
      } catch (err) {
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

  const fetchUserFlows = async () => {
    setLoading(true);
    try {
      const flows = await getUserFlows();
      setUserFlows(flows.filter(flow => !flow.isSystemFlow));
      setError(null);
    } catch (err) {
      setError('Failed to load user flows');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserFlows();
  }, []);

  const refreshUserFlows = async () => {
    await fetchUserFlows();
  };

  return (
    <UserFlowContext.Provider value={{ userFlows, loading, error, refreshUserFlows }}>
      {children}
    </UserFlowContext.Provider>
  );
};