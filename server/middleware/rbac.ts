// Role-Based Access Control (RBAC) Middleware
import { UserRoles, Permissions, getDefaultPermissionsForRole } from '../types/roles';

// Middleware to check if a user has a specific permission
export function requirePermission(permission: Permissions) {
  return function(req: any, res: any, next: any) {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!req.user.permissions) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    if (req.user.permissions.includes(permission)) {
      return next();
    }

    return res.status(403).json({ message: 'Permission denied' });
  };
}

// Middleware to check if a user has a specific role
export function requireRole(role: string | string[]) {
  return function(req: any, res: any, next: any) {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const roles = Array.isArray(role) ? role : [role];
    
    if (req.user.role && roles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({ message: 'Role-based permission denied' });
  };
}