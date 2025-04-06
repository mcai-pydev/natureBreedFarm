import React, { createContext, ReactNode, useContext, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Define administrative roles (all possible variations)
const ADMIN_ROLES = ['Admin', 'admin', 'ADMIN', 'Manager', 'manager', 'MANAGER', 'Owner', 'owner', 'OWNER'];

// User type based on schema
interface User {
  id: number;
  username: string;
  name: string;
  email?: string;
  role: string;
  permissions: string[];
  avatar?: string;
  isActive: boolean;
}

interface AuthResponse {
  user: User;
  token: string;
}

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loginMutation: any;
  logoutMutation: any;
  registerMutation: any;
};

// Token storage helper functions
const storeToken = (token: string) => {
  localStorage.setItem('authToken', token);
};

const getStoredToken = (): string | null => {
  return localStorage.getItem('authToken');
};

const removeStoredToken = () => {
  localStorage.removeItem('authToken');
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const token = getStoredToken();
  
  // Query to fetch user data using JWT token if available
  const {
    data: user,
    error,
    isLoading,
    refetch
  } = useQuery<User | null, Error>({
    queryKey: ["/api/me"],
    queryFn: async () => {
      try {
        console.log("Fetching user data...");
        
        // Prepare headers with JWT token if available
        const headers: HeadersInit = {
          "Accept": "application/json",
          "Cache-Control": "no-cache, no-store"
        };
        
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
          console.log("Using JWT token for authentication");
        } else {
          console.log("No JWT token available, falling back to session");
        }
        
        const response = await fetch("/api/me", {
          credentials: "include", // Include credentials for session fallback
          headers
        });
        
        console.log("User fetch response status:", response.status);
        
        if (!response.ok) {
          if (response.status === 401) {
            console.log("User is not authenticated");
            // Clear invalid token if present
            if (token) {
              console.log("Clearing invalid token");
              removeStoredToken();
            }
            return null;
          }
          throw new Error(`Failed to fetch user data: ${response.status}`);
        }
        
        const userData = await response.json();
        console.log("Authenticated as:", userData.username, "with role:", userData.role);
        return userData;
      } catch (error) {
        console.error("Auth error:", error);
        return null;
      }
    },
    // Only run this query if the app has loaded or we have a token
    enabled: true,
    staleTime: 1000 * 60 * 5, // Consider data stale after 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 1, // Retry once if fetch fails
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Login failed");
      }
      
      return await response.json() as AuthResponse;
    },
    onSuccess: (data: AuthResponse) => {
      // Store the JWT token
      if (data.token) {
        console.log("Storing authentication token");
        storeToken(data.token);
      }
      
      // Update user data in cache
      queryClient.setQueryData(["/api/me"], data.user);
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.user.name}!`,
      });
      
      // Redirect based on role
      if (ADMIN_ROLES.includes(data.user.role)) {
        console.log('Admin login detected, redirecting to dashboard');
        window.location.href = '/dashboard';
      } else {
        console.log('Regular user login detected, redirecting to shop');
        window.location.href = '/shop';
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // First try server-side logout for session
      try {
        const response = await fetch("/api/logout", {
          method: "POST",
        });
        
        if (!response.ok) {
          console.warn("Server logout failed, but continuing with client-side logout");
        }
      } catch (error) {
        console.warn("Server logout error, but continuing with client-side logout:", error);
      }
      
      // Always remove the token regardless of server-side logout success
      removeStoredToken();
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/me"], null);
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
      
      // Redirect to auth page after logout
      window.location.href = '/auth';
    },
    onError: (error: Error) => {
      toast({
        title: "Logout error",
        description: "Error during logout, but you've been logged out of this device",
        variant: "destructive",
      });
      // Still remove user data from cache to ensure logged out state
      queryClient.setQueryData(["/api/me"], null);
      
      // Redirect to auth page even after an error
      window.location.href = '/auth';
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Registration failed");
      }
      
      const data = await response.json();
      return data;
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/me"], user);
      toast({
        title: "Registration successful",
        description: `Welcome, ${user.name}!`,
      });
      
      // Redirect based on role (though most newly registered users will be regular users)
      if (ADMIN_ROLES.includes(user.role)) {
        window.location.href = '/dashboard';
      } else {
        window.location.href = '/shop';
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Calculate derived state
  const isAuthenticated = !!user;
  const isAdmin = !!user && ADMIN_ROLES.includes(user?.role || '');
  
  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        token,
        isAuthenticated,
        isAdmin,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}