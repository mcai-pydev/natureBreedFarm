// Role-Based Access Control (RBAC) Middleware

// User Roles
export enum UserRoles {
  ADMIN = 'admin',
  MANAGER = 'manager',
  STAFF = 'staff',
  CUSTOMER = 'customer'
}

// Permission Types
export enum Permissions {
  // Product permissions
  READ_PRODUCT = 'read:product',
  CREATE_PRODUCT = 'create:product',
  UPDATE_PRODUCT = 'update:product',
  DELETE_PRODUCT = 'delete:product',
  
  // Order permissions
  READ_ORDER = 'read:order',
  READ_ALL_ORDERS = 'read:all_orders',
  CREATE_ORDER = 'create:order',
  UPDATE_ORDER = 'update:order',
  DELETE_ORDER = 'delete:order',
  
  // Animal permissions
  READ_ANIMAL = 'read:animal',
  CREATE_ANIMAL = 'create:animal',
  UPDATE_ANIMAL = 'update:animal',
  DELETE_ANIMAL = 'delete:animal',
  
  // Other permissions
  READ_ANALYTICS = 'read:analytics',
  MANAGE_NEWSLETTERS = 'manage:newsletters',
  MANAGE_BULK_ORDERS = 'manage:bulk_orders',
  
  // User permissions
  READ_USER = 'read:user',
  CREATE_USER = 'create:user',
  UPDATE_USER = 'update:user',
  DELETE_USER = 'delete:user',
}

// Role configuration with permissions
export const ROLE_PERMISSIONS = {
  admin: Object.values(Permissions), // Admin has all permissions
  manager: [
    Permissions.READ_PRODUCT,
    Permissions.CREATE_PRODUCT,
    Permissions.UPDATE_PRODUCT,
    Permissions.READ_ORDER,
    Permissions.READ_ALL_ORDERS,
    Permissions.UPDATE_ORDER,
    Permissions.READ_ANIMAL,
    Permissions.CREATE_ANIMAL,
    Permissions.UPDATE_ANIMAL,
    Permissions.READ_ANALYTICS,
    Permissions.MANAGE_NEWSLETTERS,
    Permissions.MANAGE_BULK_ORDERS,
    Permissions.READ_USER,
  ],
  staff: [
    Permissions.READ_PRODUCT,
    Permissions.UPDATE_PRODUCT,
    Permissions.READ_ORDER,
    Permissions.READ_ALL_ORDERS,
    Permissions.READ_ANIMAL,
    Permissions.READ_ANALYTICS,
  ],
  customer: [
    Permissions.READ_PRODUCT,
    Permissions.CREATE_ORDER,
    Permissions.READ_ORDER,
  ],
};

// Helper to get default permissions for a role
export function getDefaultPermissionsForRole(role: string): string[] {
  return ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || [];
}

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