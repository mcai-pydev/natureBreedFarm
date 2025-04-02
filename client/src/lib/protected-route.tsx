import React from 'react';
import { Route, Redirect, useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
  requiredRole?: string | string[];
}

export function ProtectedRoute({ path, component: Component, requiredRole }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  
  // Helper function to check if user has required role
  const hasRequiredRole = (user: any, requiredRole?: string | string[]) => {
    if (!requiredRole) return true;
    if (!user) return false;
    
    const userRole = user.role;
    
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(userRole);
    }
    
    return requiredRole === userRole;
  };

  return (
    <Route path={path}>
      {() => {
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }
        
        if (!user) {
          // Redirect to login if not authenticated
          setLocation('/auth');
          return null;
        }
        
        if (!hasRequiredRole(user, requiredRole)) {
          // Redirect to unauthorized page if doesn't have required role
          return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
              <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
              <p className="text-gray-600 mb-6 text-center">
                You don't have permission to access this page.
              </p>
              <button 
                className="px-4 py-2 bg-primary text-white rounded-md"
                onClick={() => setLocation('/')}
              >
                Go Home
              </button>
            </div>
          );
        }
        
        // If authenticated and has required role, render the component
        return <Component />;
      }}
    </Route>
  );
}