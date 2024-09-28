import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { login as authLogin, logout as authLogout, getCurrentUser, isAuthenticated, AuthUser } from '../services/Authservice';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticatedState, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = () => {
      setIsLoading(true);
      try {
        const currentUser = getCurrentUser();
        setUser(currentUser);
        setIsAuthenticated(isAuthenticated());
      } catch (error) {
        console.error('Error checking auth status:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // We can't directly listen to auth changes with the new structure,
    // so we might need to implement a different strategy for real-time updates
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const authUser = await authLogin(email, password);
      setUser(authUser);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Login failed', error);
      return false;
    }
  };

  const logout = () => {
    authLogout();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: isAuthenticatedState, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};