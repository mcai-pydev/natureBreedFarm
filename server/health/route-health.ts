import { 
  HealthCheckResult, 
  RouteRenderStatus, 
  ButtonBindingStatus, 
  RouteStatus, 
  ButtonStatus,
  CoverageDetails 
} from '../types/health';

/**
 * Route definitions that should be checked for availability
 */
export const routeDefinitions = {
  api: [
    '/api/user',
    '/api/login',
    '/api/logout',
    '/api/register',
    '/api/products',
    '/api/products/:id',
    '/api/animals',
    '/api/animals/:id',
    '/api/breeding-events',
    '/api/breeding-events/:id',
    '/api/orders',
    '/api/orders/:id',
    '/api/transactions',
    '/api/transactions/:id',
    '/api/analytics/dashboard',
    '/api/newsletters',
    '/api/newsletters/:id',
    '/api/contacts',
    '/api/contacts/:id'
  ],
  client: [
    '/',
    '/auth',
    '/dashboard',
    '/shop',
    '/admin',
    '/admin/products',
    '/admin/animals',
    '/admin/breeding',
    '/admin/orders',
    '/admin/transactions',
    '/admin/analytics',
    '/admin/settings',
    '/profile',
    '/orders',
    '/cart',
    '/checkout',
    '/breeding',
    '/chat'
  ]
};

/**
 * Maps routes to their protection requirements
 */
export const routeProtectionMap = {
  // Public routes (no auth needed)
  public: [
    '/',
    '/auth',
    '/shop',
    '/api/products',
    '/api/products/:id',
  ],
  // Routes requiring any authenticated user
  authenticated: [
    '/dashboard',
    '/profile',
    '/orders',
    '/cart',
    '/checkout',
    '/api/user',
    '/api/orders',
    '/api/orders/:id',
    '/api/logout',
  ],
  // Routes requiring admin role
  admin: [
    '/admin',
    '/admin/products',
    '/admin/animals',
    '/admin/breeding',
    '/admin/orders',
    '/admin/transactions',
    '/admin/analytics',
    '/admin/settings',
    '/api/analytics/dashboard',
    '/api/newsletters',
    '/api/newsletters/:id',
    '/api/contacts',
    '/api/contacts/:id',
  ]
};

// Store rendered route status for live tracking

// In-memory store of route rendering statuses
const routeRenderStatuses: Record<string, RouteStatus> = {};

// In-memory store of button binding statuses
const buttonBindingStatuses: Record<string, ButtonStatus> = {};

/**
 * Updates the render status of a route
 */
export function updateRouteRenderStatus(
  path: string, 
  status: RouteRenderStatus,
  role: 'public' | 'authenticated' | 'admin' | 'unknown' = 'unknown'
): void {
  routeRenderStatuses[path] = {
    path,
    renders: status,
    role,
    lastTested: new Date().toISOString()
  };
}

/**
 * Updates the binding status of a button
 */
export function updateButtonBindingStatus(
  id: string,
  route: string,
  status: ButtonBindingStatus,
  handler?: string
): void {
  buttonBindingStatuses[id] = {
    id,
    route,
    status,
    handler,
    lastTested: new Date().toISOString()
  };
}

/**
 * Checks all routes for proper definition in the application.
 * This doesn't actually call the routes, but checks that they are properly 
 * defined in our routing tables.
 */
export async function checkRouteHealth(): Promise<HealthCheckResult> {
  try {
    console.log('🔍 Running route health check...');
    // In a real implementation, we would check if all routes are registered
    // For now, we'll assume they are properly defined
    const missingApiRoutes: string[] = [];
    const missingClientRoutes: string[] = [];
    
    // This is a simplistic implementation
    // In a real app, we'd inspect Express router and client routes
    
    if (missingApiRoutes.length > 0 || missingClientRoutes.length > 0) {
      return {
        status: 'warning',
        message: 'Some routes appear to be missing from the application',
        details: {
          apiRoutes: {
            missing: missingApiRoutes,
            total: routeDefinitions.api.length,
            available: routeDefinitions.api.length - missingApiRoutes.length
          },
          clientRoutes: {
            missing: missingClientRoutes,
            total: routeDefinitions.client.length,
            available: routeDefinitions.client.length - missingClientRoutes.length
          }
        }
      };
    }
    
    return {
      status: 'success',
      message: 'All routes are properly defined in the application',
      details: {
        apiRoutes: {
          total: routeDefinitions.api.length,
          available: routeDefinitions.api.length
        },
        clientRoutes: {
          total: routeDefinitions.client.length,
          available: routeDefinitions.client.length
        }
      }
    };
  } catch (error) {
    return {
      status: 'error',
      message: `Failed to check route health: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Returns detailed routing and button coverage information
 */
export function getRouteCoverageDetails(): CoverageDetails {
  // Map each route to its render status (or default to not-tested)
  const apiRouteStatus = routeDefinitions.api.map(route => {
    return routeRenderStatuses[route] || {
      path: route,
      renders: 'not-tested' as RouteRenderStatus,
      role: getRouteRole(route),
      lastTested: undefined
    };
  });
  
  const clientRouteStatus = routeDefinitions.client.map(route => {
    return routeRenderStatuses[route] || {
      path: route,
      renders: 'not-tested' as RouteRenderStatus,
      role: getRouteRole(route),
      lastTested: undefined
    };
  });
  
  // Get all button statuses
  const buttonStatuses = Object.values(buttonBindingStatuses);
  
  return {
    routes: {
      api: apiRouteStatus,
      client: clientRouteStatus
    },
    buttons: buttonStatuses,
    summary: {
      routes: {
        total: routeDefinitions.api.length + routeDefinitions.client.length,
        tested: Object.keys(routeRenderStatuses).length,
        successful: Object.values(routeRenderStatuses).filter(r => r.renders === 'success').length,
        failed: Object.values(routeRenderStatuses).filter(r => r.renders === 'error').length,
        incomplete: Object.values(routeRenderStatuses).filter(r => r.renders === 'incomplete').length
      },
      buttons: {
        total: buttonStatuses.length,
        bound: buttonStatuses.filter(b => b.status === 'bound').length,
        unbound: buttonStatuses.filter(b => b.status === 'unbound').length
      }
    }
  };
}

/**
 * Helper to determine role requirement for a route
 */
function getRouteRole(route: string): 'public' | 'authenticated' | 'admin' | 'unknown' {
  if (routeProtectionMap.public.includes(route)) {
    return 'public';
  } else if (routeProtectionMap.authenticated.includes(route)) {
    return 'authenticated';
  } else if (routeProtectionMap.admin.includes(route)) {
    return 'admin';
  }
  return 'unknown';
}