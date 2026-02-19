/**
 * Role-Based Access Control Configuration
 * Defines roles and their permissions for the TriLink Platform
 */

export enum Role {
  BUYER = 'Buyer',
  COMPANY_MANAGER = 'Company Manager',
  SUPPLIER = 'Supplier',
  LOGISTICS = 'Logistics',
  CLEARANCE = 'Clearance',
  SERVICE_PROVIDER = 'Service Provider',
  GOVERNMENT = 'Government',
  ADMIN = 'Admin',
}

export enum Permission {
  // Purchase Requests
  CREATE_PURCHASE_REQUEST = 'create:purchase-request',
  VIEW_PURCHASE_REQUEST = 'view:purchase-request',
  UPDATE_PURCHASE_REQUEST = 'update:purchase-request',
  DELETE_PURCHASE_REQUEST = 'delete:purchase-request',
  APPROVE_PURCHASE_REQUEST = 'approve:purchase-request',

  // RFQs
  CREATE_RFQ = 'create:rfq',
  VIEW_RFQ = 'view:rfq',
  UPDATE_RFQ = 'update:rfq',
  RESPOND_RFQ = 'respond:rfq',

  // Bids
  CREATE_BID = 'create:bid',
  VIEW_BID = 'view:bid',
  UPDATE_BID = 'update:bid',
  EVALUATE_BID = 'evaluate:bid',

  // Contracts
  CREATE_CONTRACT = 'create:contract',
  VIEW_CONTRACT = 'view:contract',
  UPDATE_CONTRACT = 'update:contract',
  SIGN_CONTRACT = 'sign:contract',

  // Shipments
  CREATE_SHIPMENT = 'create:shipment',
  VIEW_SHIPMENT = 'view:shipment',
  UPDATE_SHIPMENT = 'update:shipment',
  TRACK_SHIPMENT = 'track:shipment',
  UPDATE_GPS = 'update:gps',

  // Payments
  CREATE_PAYMENT = 'create:payment',
  VIEW_PAYMENT = 'view:payment',
  UPDATE_PAYMENT = 'update:payment',
  DELETE_PAYMENT = 'delete:payment',
  PROCESS_PAYMENT = 'process:payment',

  // Disputes
  CREATE_DISPUTE = 'create:dispute',
  VIEW_DISPUTE = 'view:dispute',
  UPDATE_DISPUTE = 'update:dispute',
  DELETE_DISPUTE = 'delete:dispute',
  RESOLVE_DISPUTE = 'resolve:dispute',
  ESCALATE_DISPUTE = 'escalate:dispute',

  // Analytics
  VIEW_ANALYTICS = 'view:analytics',
  VIEW_GOVERNMENT_ANALYTICS = 'view:government-analytics',

  // Users & Companies
  VIEW_USERS = 'view:users',
  MANAGE_USERS = 'manage:users',
  VIEW_COMPANIES = 'view:companies',
  MANAGE_COMPANIES = 'manage:companies',

  // Admin
  ADMIN_ALL = 'admin:all',

  // New Enhanced Permissions
  APPROVE_PAYMENT = 'approve:payment',
  REJECT_PAYMENT = 'reject:payment',
  RETRY_PAYMENT = 'retry:payment',
  VIEW_PAYMENT_SCHEDULE = 'view:payment-schedule',
  MANAGE_PAYMENT_SCHEDULE = 'manage:payment-schedule',

  // Contract Amendments
  CREATE_AMENDMENT = 'create:amendment',
  VIEW_AMENDMENT = 'view:amendment',
  APPROVE_AMENDMENT = 'approve:amendment',
  REJECT_AMENDMENT = 'reject:amendment',

  // Enhanced Shipment Tracking
  MANAGE_GPS_TRACKING = 'manage:gps-tracking',
  VIEW_GPS_HISTORY = 'view:gps-history',

  // Enhanced Dispute Management
  ASSIGN_DISPUTE = 'assign:dispute',
  CLOSE_DISPUTE = 'close:dispute',

  // Document Management
  UPLOAD_DOCUMENT = 'upload:document',
  DELETE_DOCUMENT = 'delete:document',
  VIEW_DOCUMENT = 'view:document',

  // Reporting & Analytics
  EXPORT_DATA = 'export:data',
  VIEW_REPORTS = 'view:reports',
  GENERATE_REPORTS = 'generate:reports',
}

/**
 * Role-Permission Mapping
 * Each role has explicit permissions defined
 */
export const rolePermissions: Record<Role, Permission[]> = {
  [Role.BUYER]: [
    Permission.CREATE_PURCHASE_REQUEST,
    Permission.VIEW_PURCHASE_REQUEST,
    Permission.UPDATE_PURCHASE_REQUEST,
    Permission.DELETE_PURCHASE_REQUEST,
    Permission.CREATE_RFQ,
    Permission.VIEW_RFQ,
    Permission.UPDATE_RFQ,
    Permission.VIEW_BID,
    Permission.EVALUATE_BID,
    Permission.CREATE_CONTRACT,
    Permission.VIEW_CONTRACT,
    Permission.UPDATE_CONTRACT,
    // SIGN_CONTRACT removed - only Company Manager can sign contracts
    Permission.VIEW_SHIPMENT,
    Permission.TRACK_SHIPMENT,
    Permission.VIEW_PAYMENT,
    Permission.UPDATE_PAYMENT,
    Permission.APPROVE_PAYMENT,
    Permission.REJECT_PAYMENT,
    Permission.VIEW_PAYMENT_SCHEDULE,
    Permission.CREATE_DISPUTE,
    Permission.VIEW_DISPUTE,
    Permission.UPDATE_DISPUTE,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_DOCUMENT,
    Permission.UPLOAD_DOCUMENT,
    Permission.VIEW_REPORTS,
  ],

  [Role.COMPANY_MANAGER]: [
    // All Buyer permissions
    Permission.CREATE_PURCHASE_REQUEST,
    Permission.VIEW_PURCHASE_REQUEST,
    Permission.UPDATE_PURCHASE_REQUEST,
    Permission.DELETE_PURCHASE_REQUEST,
    Permission.CREATE_RFQ,
    Permission.VIEW_RFQ,
    Permission.UPDATE_RFQ,
    Permission.VIEW_BID,
    Permission.EVALUATE_BID,
    Permission.CREATE_CONTRACT,
    Permission.VIEW_CONTRACT,
    Permission.UPDATE_CONTRACT,
    Permission.SIGN_CONTRACT,
    Permission.VIEW_SHIPMENT,
    Permission.TRACK_SHIPMENT,
    Permission.VIEW_PAYMENT,
    Permission.UPDATE_PAYMENT,
    Permission.APPROVE_PAYMENT,
    Permission.REJECT_PAYMENT,
    Permission.VIEW_PAYMENT_SCHEDULE,
    Permission.MANAGE_PAYMENT_SCHEDULE,
    Permission.CREATE_DISPUTE,
    Permission.VIEW_DISPUTE,
    Permission.UPDATE_DISPUTE,
    Permission.VIEW_ANALYTICS,
    // Additional Manager permissions
    Permission.APPROVE_PURCHASE_REQUEST,
    Permission.VIEW_USERS,
    Permission.MANAGE_USERS,
    Permission.VIEW_COMPANIES,
    Permission.MANAGE_COMPANIES,
    Permission.CREATE_AMENDMENT,
    Permission.VIEW_AMENDMENT,
    Permission.APPROVE_AMENDMENT,
    Permission.VIEW_DOCUMENT,
    Permission.UPLOAD_DOCUMENT,
    Permission.DELETE_DOCUMENT,
    Permission.VIEW_REPORTS,
    Permission.GENERATE_REPORTS,
    Permission.EXPORT_DATA,
  ],

  [Role.SUPPLIER]: [
    Permission.VIEW_RFQ,
    Permission.RESPOND_RFQ,
    Permission.CREATE_BID,
    Permission.VIEW_BID,
    Permission.UPDATE_BID,
    Permission.VIEW_CONTRACT,
    Permission.SIGN_CONTRACT,
    Permission.VIEW_SHIPMENT,
    Permission.VIEW_PAYMENT,
    Permission.VIEW_PAYMENT_SCHEDULE,
    Permission.CREATE_DISPUTE,
    Permission.VIEW_DISPUTE,
    Permission.UPDATE_DISPUTE,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_AMENDMENT,
    Permission.VIEW_DOCUMENT,
    Permission.UPLOAD_DOCUMENT,
    Permission.VIEW_REPORTS,
  ],

  [Role.LOGISTICS]: [
    Permission.VIEW_RFQ,
    Permission.RESPOND_RFQ,
    Permission.CREATE_BID,
    Permission.VIEW_BID,
    Permission.VIEW_CONTRACT,
    Permission.CREATE_SHIPMENT,
    Permission.VIEW_SHIPMENT,
    Permission.UPDATE_SHIPMENT,
    Permission.TRACK_SHIPMENT,
    Permission.UPDATE_GPS,
    Permission.MANAGE_GPS_TRACKING,
    Permission.VIEW_GPS_HISTORY,
    Permission.VIEW_PAYMENT,
    Permission.VIEW_PAYMENT_SCHEDULE,
    Permission.CREATE_DISPUTE,
    Permission.VIEW_DISPUTE,
    Permission.UPDATE_DISPUTE,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_DOCUMENT,
    Permission.UPLOAD_DOCUMENT,
    Permission.VIEW_REPORTS,
  ],

  [Role.CLEARANCE]: [
    Permission.VIEW_RFQ,
    Permission.RESPOND_RFQ,
    Permission.CREATE_BID,
    Permission.VIEW_BID,
    Permission.VIEW_CONTRACT,
    Permission.VIEW_SHIPMENT,
    Permission.UPDATE_SHIPMENT,
    Permission.VIEW_PAYMENT,
    Permission.VIEW_PAYMENT_SCHEDULE,
    Permission.CREATE_DISPUTE,
    Permission.VIEW_DISPUTE,
    Permission.UPDATE_DISPUTE,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_DOCUMENT,
    Permission.UPLOAD_DOCUMENT,
    Permission.VIEW_REPORTS,
  ],

  [Role.SERVICE_PROVIDER]: [
    Permission.VIEW_RFQ,
    Permission.RESPOND_RFQ,
    Permission.CREATE_BID,
    Permission.VIEW_BID,
    Permission.VIEW_CONTRACT,
    Permission.VIEW_SHIPMENT,
    Permission.VIEW_PAYMENT,
    Permission.VIEW_PAYMENT_SCHEDULE,
    Permission.CREATE_DISPUTE,
    Permission.VIEW_DISPUTE,
    Permission.UPDATE_DISPUTE,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_DOCUMENT,
    Permission.UPLOAD_DOCUMENT,
    Permission.VIEW_REPORTS,
  ],

  [Role.GOVERNMENT]: [
    Permission.VIEW_PURCHASE_REQUEST,
    Permission.APPROVE_PURCHASE_REQUEST,
    Permission.VIEW_RFQ,
    Permission.VIEW_BID,
    Permission.VIEW_CONTRACT,
    Permission.VIEW_SHIPMENT,
    Permission.VIEW_PAYMENT,
    Permission.VIEW_PAYMENT_SCHEDULE,
    Permission.VIEW_DISPUTE,
    Permission.ESCALATE_DISPUTE,
    Permission.RESOLVE_DISPUTE,
    Permission.ASSIGN_DISPUTE,
    Permission.CLOSE_DISPUTE,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_GOVERNMENT_ANALYTICS,
    Permission.VIEW_COMPANIES,
    Permission.VIEW_DOCUMENT,
    Permission.VIEW_REPORTS,
    Permission.GENERATE_REPORTS,
    Permission.EXPORT_DATA,
  ],

  [Role.ADMIN]: [
    Permission.ADMIN_ALL,
  ],
};

/**
 * Check if a role has a specific permission
 */
export const hasPermission = (role: Role, permission: Permission): boolean => {
  const permissions = rolePermissions[role] || [];
  return permissions.includes(Permission.ADMIN_ALL) || permissions.includes(permission);
};

/**
 * Check if user has permission (considering role and custom permissions)
 */
export const hasUserPermission = (
  role: Role,
  permission: Permission,
  customPermissions?: Permission[]
): boolean => {
  // Admin always has all permissions
  if (role === Role.ADMIN) {
    return true;
  }

  // Check custom permissions first (they can add permissions)
  if (customPermissions && customPermissions.includes(permission)) {
    return true;
  }

  // Check role permissions
  return hasPermission(role, permission);
};

/**
 * Get all permissions for a role
 */
export const getRolePermissions = (role: Role): Permission[] => {
  return rolePermissions[role] || [];
};

/**
 * Get all permissions for a user (role + custom permissions)
 */
export const getUserPermissions = (role: Role, customPermissions?: Permission[]): Permission[] => {
  const rolePerms = getRolePermissions(role);
  const customPerms = customPermissions || [];

  // Combine and deduplicate
  const allPermissions = [...new Set([...rolePerms, ...customPerms])];
  return allPermissions;
};
