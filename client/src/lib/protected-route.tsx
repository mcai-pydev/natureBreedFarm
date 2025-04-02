import React from 'react';
import { Route, Redirect, useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';

// Using basic authentication check for now, will enhance with proper auth context later
const isAuthenticated = () => {
  // This will be replaced by proper auth check from auth context
  return true;
};

// Helper function to check if user has required role
const hasRequiredRole = (requiredRole?: string | string[]) => {
  // This will be replaced by actual role check
  if (!requiredRole) return true;
  
  // Mock user role for now
  const userRole = 'admin';
  
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userRole);
  }
  
  return requiredRole === userRole;
};

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
  requiredRole?: string | string[];
}

export function ProtectedRoute({ path, component: Component, requiredRole }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();

  // Simulate loading state
  const [isLoading, setIsLoading] = React.useState(true);
  
  // Check authentication after simulated loading
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

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
        
        if (!isAuthenticated()) {
          // Redirect to login if not authenticated
          setLocation('/auth');
          return null;
        }
        
        if (!hasRequiredRole(requiredRole)) {
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