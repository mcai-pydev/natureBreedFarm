import React from 'react';
import { Route, Redirect } from 'wouter';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
  requiredRole?: string | string[];
}

export function ProtectedRoute({ path, component: Component, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  
  // Define admin role variations to match server-side
  const ADMIN_ROLES = ['Admin', 'admin', 'ADMIN', 'administrator', 'Administrator'];
  
  // Helper function to check if user has required role with case-insensitive support
  const hasRequiredRole = (user: any, requiredRole?: string | string[]) => {
    if (!requiredRole) return true;
    if (!user) return false;
    
    const userRole = user.role || '';
    
    // Special case for admin roles - accept any variation of 'admin' from the defined list
    if (Array.isArray(requiredRole) && requiredRole.some(role => ADMIN_ROLES.includes(role))) {
      return ADMIN_ROLES.includes(userRole);
    }
    
    if (ADMIN_ROLES.includes(requiredRole as string) && ADMIN_ROLES.includes(userRole)) {
      return true;
    }
    
    // Regular role check
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(userRole);
    }
    
    return requiredRole === userRole;
  };

  return (
    <Route path={path}>
      {() => {
        // Still loading? Show loading spinner
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }
        
        // No user? Redirect to auth page
        if (!user) {
          console.log("Not authenticated, redirecting to /auth");
          return <Redirect to="/auth" />;
        }
        
        // User doesn't have required role? Show access denied
        if (!hasRequiredRole(user, requiredRole)) {
          console.log(`User ${user.username} has role ${user.role} but needs ${requiredRole}`);
          return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
              <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
              <p className="text-gray-600 mb-6 text-center">
                You don't have permission to access this page.
              </p>
              <a 
                href="/"
                className="px-4 py-2 bg-primary text-white rounded-md cursor-pointer"
              >
                Go Home
              </a>
            </div>
          );
        }
        
        // User is authenticated and has required role, render the component
        console.log(`Rendering protected route ${path} for ${user.username}`);
        return <Component />;
      }}
    </Route>
  );
}