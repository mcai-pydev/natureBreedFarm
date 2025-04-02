// User Roles and Permissions Types
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
export const ROLE_PERMISSIONS: Record<string, string[]> = {
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