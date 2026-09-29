export type UserRole = 'admin' | 'user' | 'buyer' | 'tenant' | 'agent' | 'owner' | 'seller';

export enum Permission {
  CAN_MANAGE_PROPERTIES = 'CAN_MANAGE_PROPERTIES',
  CAN_PUBLISH_PROPERTIES = 'CAN_PUBLISH_PROPERTIES',
  CAN_DELETE_PROPERTIES = 'CAN_DELETE_PROPERTIES',
  CAN_VIEW_ENQUIRIES = 'CAN_VIEW_ENQUIRIES',
  CAN_MANAGE_USERS = 'CAN_MANAGE_USERS',
  CAN_SUBMIT_ENQUIRY = 'CAN_SUBMIT_ENQUIRY',
  CAN_SAVE_FAVORITES = 'CAN_SAVE_FAVORITES',
}

export const RolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    Permission.CAN_MANAGE_PROPERTIES,
    Permission.CAN_PUBLISH_PROPERTIES,
    Permission.CAN_DELETE_PROPERTIES,
    Permission.CAN_VIEW_ENQUIRIES,
    Permission.CAN_MANAGE_USERS,
    Permission.CAN_SUBMIT_ENQUIRY,
    Permission.CAN_SAVE_FAVORITES,
  ],
  user: [
    Permission.CAN_SUBMIT_ENQUIRY,
    Permission.CAN_SAVE_FAVORITES,
  ],
  buyer: [
    Permission.CAN_SUBMIT_ENQUIRY,
    Permission.CAN_SAVE_FAVORITES,
  ],
  tenant: [
    Permission.CAN_SUBMIT_ENQUIRY,
    Permission.CAN_SAVE_FAVORITES,
  ],
  agent: [
    Permission.CAN_SUBMIT_ENQUIRY,
    Permission.CAN_SAVE_FAVORITES,
  ],
  owner: [
    Permission.CAN_SUBMIT_ENQUIRY,
    Permission.CAN_SAVE_FAVORITES,
  ],
  seller: [
    Permission.CAN_SUBMIT_ENQUIRY,
    Permission.CAN_SAVE_FAVORITES,
  ],
};

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  location: string;
  memberSince: string;
  verified: boolean;
  savedSearchesCount: number;
  scheduledToursCount: number;
  inquiriesCount: number;
  requiresPasswordChange?: boolean;
  isDefaultPassword?: boolean;
  preferences: {
    currency: string;
    notificationsEnabled: boolean;
    newsletter: boolean;
    darkMode: boolean;
  };
}

/**
 * RBAC Helper to check if a user has a specific permission
 */
export function hasPermission(
  user: UserProfile | null,
  permission: Permission
): boolean {
  if (!user) return false;
  const permissions = RolePermissions[user.role] || [];
  return permissions.includes(permission);
}

/**
 * Helper to check if user is an Administrator
 */
export function isUserAdmin(user: UserProfile | null): boolean {
  return user?.role === 'admin';
}

/**
 * Helper to check if user is an Agent
 */
export function isUserAgent(user: UserProfile | null): boolean {
  return user?.role === 'agent';
}

/**
 * Helper to check if session is a public browsing user (no admin/agent privileges)
 */
export function isPublicUser(user: UserProfile | null): boolean {
  return !user || (user.role !== 'admin' && user.role !== 'agent');
}
