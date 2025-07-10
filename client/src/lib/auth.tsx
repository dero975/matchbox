import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User, LoginData, InsertUser } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: InsertUser) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(() => {
    // Initialize user from localStorage if available
    try {
      const savedUser = localStorage.getItem('matchbox_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      localStorage.removeItem('matchbox_user');
      return null;
    }
  });

  // Check if user is authenticated on app start - automatic login restoration
  const { data: authData, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: 1, // Retry once in case of network issues
    refetchOnWindowFocus: true, // Check auth status when app gains focus
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });

  useEffect(() => {
    if (authData?.user) {
      setUser(authData.user);
      localStorage.setItem('matchbox_user', JSON.stringify(authData.user));
    } else if (authData === null && !isLoading) {
      setUser(null);
      localStorage.removeItem('matchbox_user');
    }
  }, [authData, isLoading]);

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
      // Save user data and login timestamp to localStorage
      localStorage.setItem('matchbox_user', JSON.stringify(data.user));
      localStorage.setItem('matchbox_last_login', Date.now().toString());
      queryClient.invalidateQueries();
    },
    onError: (error: any) => {
      throw new Error(error.message || "Errore durante il login");
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      return response.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
      // Save user data and registration timestamp to localStorage
      localStorage.setItem('matchbox_user', JSON.stringify(data.user));
      localStorage.setItem('matchbox_last_login', Date.now().toString());
      queryClient.invalidateQueries();
    },
    onError: (error: any) => {
      throw new Error(error.message || "Errore durante la registrazione");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/logout");
      return response.json();
    },
    onSuccess: () => {
      setUser(null);
      // Clear localStorage on logout
      localStorage.removeItem('matchbox_user');
      localStorage.removeItem('matchbox_last_login');
      // Clear all cached queries
      queryClient.clear();
    },
    onError: (error: any) => {
      // Clear user data even if logout request fails
      setUser(null);
      localStorage.removeItem('matchbox_user');
      localStorage.removeItem('matchbox_last_login');
      throw new Error(error.message || "Errore durante il logout");
    },
  });

  const login = async (data: LoginData) => {
    await loginMutation.mutateAsync(data);
  };

  const register = async (data: InsertUser) => {
    await registerMutation.mutateAsync(data);
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
