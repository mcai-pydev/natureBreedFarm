import React, { createContext, ReactNode, useContext, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Define administrative roles (all possible variations)
// Important: This must match the ADMIN_ROLES array in server/auth.ts
const ADMIN_ROLES = ['Admin', 'admin', 'ADMIN', 'administrator', 'Administrator'];

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
          credentials: "include", // Include cookies for session fallback
          headers
        });
        
        console.log("User fetch response status:", response.status);
        
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            console.log("User is not authenticated");
            // Clear invalid token if present
            if (token) {
              console.log("Clearing invalid token");
              removeStoredToken();
            }
            return null;
          }
          
          // For 502 errors, which could be temporary server issues, just log and return null
          if (response.status === 502) {
            console.warn("Server gateway error (502), might be temporary");
            return null;
          }
          
          // For other errors, try to get error details from response
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to fetch user data: ${response.status}`);
        }
        
        const userData = await response.json();
        console.log("Authenticated as:", userData.username, "with role:", userData.role);
        return userData;
      } catch (error) {
        console.error("Auth error:", error);
        // If token exists but failed to authenticate, clear it
        if (token) {
          console.log("Authentication error with token, clearing it as precaution");
          removeStoredToken();
        }
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
      console.log("Attempting login for:", credentials.username);
      
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
        credentials: "include", // Include cookies in the request
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Login failed:", errorData.message || "Unknown error");
        throw new Error(errorData.message || "Login failed");
      }
      
      const data = await response.json() as AuthResponse;
      console.log("Login successful for:", credentials.username);
      return data;
    },
    onSuccess: (data: AuthResponse) => {
      // Store the JWT token
      if (data.token) {
        console.log("Storing authentication token in localStorage");
        storeToken(data.token);
      } else {
        console.warn("No token received from server");
      }
      
      // Update user data in cache
      console.log("Updating user data in cache:", data.user.username);
      queryClient.setQueryData(["/api/me"], data.user);
      
      // Success notification
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
      console.error("Login mutation error:", error.message);
      removeStoredToken(); // Clear any existing token on login failure
      
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      console.log("Logging out user...");
      
      // First try server-side logout for session
      try {
        // Prepare headers with JWT token if available
        const headers: HeadersInit = {
          "Accept": "application/json",
          "Content-Type": "application/json"
        };
        
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
          console.log("Including JWT token in logout request");
        }
        
        const response = await fetch("/api/logout", {
          method: "POST",
          headers,
          credentials: "include" // Include cookies to clear session
        });
        
        if (!response.ok) {
          console.warn("Server logout failed, but continuing with client-side logout");
        } else {
          console.log("Server logout successful");
        }
      } catch (error) {
        console.warn("Server logout error, but continuing with client-side logout:", error);
      }
      
      // Always remove the token regardless of server-side logout success
      console.log("Removing locally stored token");
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
      console.log("Registering new user:", userData.username);
      
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(userData),
        credentials: "include" // Include cookies for session creation
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Registration failed:", errorData.message || "Unknown error");
        throw new Error(errorData.message || "Registration failed");
      }
      
      const data = await response.json() as AuthResponse;
      
      // If we receive a token, store it
      if (data.token) {
        console.log("Storing registration token");
        storeToken(data.token);
      }
      
      console.log("Registration successful for:", userData.username);
      return data.user;
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