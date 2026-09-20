// Roles as defined by the backend (UserRole enum). Keep in sync with backend/.../user/UserRole.java.
export const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  CUSTOMER: 'CUSTOMER',
  FARMER: 'FARMER',
  BUYER: 'BUYER',
  CARRIER: 'CARRIER',
  WAREHOUSE_OPERATOR: 'WAREHOUSE_OPERATOR',
  ADVISOR: 'ADVISOR',
};

// Roles that can ask for quotes and place orders.
export const BUYER_ROLES = [ROLES.BUYER, ROLES.CUSTOMER];

// Roles that may open the warehouse screens (matches WarehouseController).
export const WAREHOUSE_ROLES = [ROLES.WAREHOUSE_OPERATOR, ROLES.MANAGER, ROLES.ADMIN];

// Roles that answer farmer queries and publish advisory content (matches AdvisoryController / QueryController).
export const ADVISORY_STAFF_ROLES = [ROLES.ADVISOR, ROLES.ADMIN];

export const isBuyerRole = (role) => BUYER_ROLES.includes(role);

const LABELS = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  CUSTOMER: 'Customer',
  FARMER: 'Farmer',
  BUYER: 'Buyer',
  CARRIER: 'Carrier',
  WAREHOUSE_OPERATOR: 'Warehouse operator',
  ADVISOR: 'Advisor',
};

export const roleLabel = (role) => LABELS[role] ?? role ?? '';
