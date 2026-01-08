// Permission constants for role-based access control

export const ROLES = {
  ADMIN: "admin",
  MEMBER: "member",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// Check if user has required role
export function hasRole(userRole: Role, requiredRole: Role): boolean {
  if (requiredRole === ROLES.MEMBER) {
    return true; // Both admin and member satisfy member requirement
  }
  return userRole === ROLES.ADMIN;
}

// Project-level permissions
export const PROJECT_PERMISSIONS = {
  CREATE: [ROLES.ADMIN, ROLES.MEMBER], // All users can create projects
  UPDATE: [ROLES.ADMIN], // Only project admins
  DELETE: [ROLES.ADMIN], // Only project admins
  ADD_MEMBER: [ROLES.ADMIN], // Only project admins
  REMOVE_MEMBER: [ROLES.ADMIN], // Only project admins
} as const;

// Task permissions
export const TASK_PERMISSIONS = {
  CREATE: [ROLES.ADMIN, ROLES.MEMBER],
  UPDATE: [ROLES.ADMIN, ROLES.MEMBER],
  DELETE: [ROLES.ADMIN],
  ASSIGN: [ROLES.ADMIN, ROLES.MEMBER],
} as const;
