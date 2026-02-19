/**
 * Role-Based Access Control Configuration
 * Defines roles and their permissions for the TriLink Platform
 */

export enum Role {
  BUYER = 'Buyer',
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
  PROCESS_PAYMENT = 'process:payment',
  
  // Disputes
  CREATE_DISPUTE = 'create:dispute',
  VIEW_DISPUTE = 'view:dispute',
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
    Permission.VIEW_RFQ,
    Permission.VIEW_BID,
    Permission.EVALUATE_BID,
    Permission.CREATE_CONTRACT,
    Permission.VIEW_CONTRACT,
    Permission.SIGN_CONTRACT,
    Permission.VIEW_SHIPMENT,
    Permission.TRACK_SHIPMENT,
    Permission.VIEW_PAYMENT,
    Permission.CREATE_DISPUTE,
    Permission.VIEW_DISPUTE,
    Permission.VIEW_ANALYTICS,
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
    Permission.CREATE_DISPUTE,
    Permission.VIEW_DISPUTE,
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
    Permission.VIEW_PAYMENT,
    Permission.CREATE_DISPUTE,
    Permission.VIEW_DISPUTE,
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
    Permission.CREATE_DISPUTE,
    Permission.VIEW_DISPUTE,
  ],
  
  [Role.SERVICE_PROVIDER]: [
    Permission.VIEW_RFQ,
    Permission.RESPOND_RFQ,
    Permission.CREATE_BID,
    Permission.VIEW_BID,
    Permission.VIEW_CONTRACT,
    Permission.VIEW_SHIPMENT,
    Permission.VIEW_PAYMENT,
    Permission.CREATE_DISPUTE,
    Permission.VIEW_DISPUTE,
  ],
  
  [Role.GOVERNMENT]: [
    Permission.VIEW_PURCHASE_REQUEST,
    Permission.VIEW_RFQ,
    Permission.VIEW_BID,
    Permission.VIEW_CONTRACT,
    Permission.VIEW_SHIPMENT,
    Permission.VIEW_PAYMENT,
    Permission.VIEW_DISPUTE,
    Permission.ESCALATE_DISPUTE,
    Permission.VIEW_GOVERNMENT_ANALYTICS,
    Permission.VIEW_COMPANIES,
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
 * Get all permissions for a role
 */
export const getRolePermissions = (role: Role): Permission[] => {
  return rolePermissions[role] || [];
};
