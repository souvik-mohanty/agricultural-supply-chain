import { ROLES, BUYER_ROLES } from '../auth/roles.js';

// One place that decides which links each role sees. Only screens backed by real endpoints are listed.
const PUBLIC = [
  { label: 'Marketplace', to: '/products' },
  { label: 'Categories', to: '/categories' },
  { label: 'Advisory', to: '/advisory' },
  { label: 'About', to: '/about' },
];

const DASHBOARD = { label: 'Dashboard', to: '/dashboard' };
const MARKETPLACE = { label: 'Marketplace', to: '/products' };
const ADVISORY = { label: 'Advisory', to: '/advisory' };

const BY_ROLE = {
  [ROLES.FARMER]: [
    DASHBOARD,
    MARKETPLACE,
    { label: 'My products', to: '/manage/products' },
    { label: 'Quote requests', to: '/rfqs' },
    { label: 'Orders', to: '/orders' },
    ADVISORY,
    { label: 'Ask an advisor', to: '/queries' },
  ],
  [ROLES.ADMIN]: [
    DASHBOARD,
    { label: 'Products', to: '/manage/products' },
    { label: 'Users', to: '/admin/users' },
    { label: 'Complaints', to: '/admin/complaints' },
    { label: 'Reports', to: '/admin/reports' },
    { label: 'Quote requests', to: '/rfqs' },
    { label: 'Warehouse', to: '/warehouse' },
    ADVISORY,
  ],
  [ROLES.MANAGER]: [DASHBOARD, MARKETPLACE, { label: 'Warehouse', to: '/warehouse' }, ADVISORY],
  [ROLES.WAREHOUSE_OPERATOR]: [DASHBOARD, MARKETPLACE, { label: 'Warehouse', to: '/warehouse' }],
  [ROLES.ADVISOR]: [DASHBOARD, ADVISORY, { label: 'Farmer queries', to: '/queries' }],
  [ROLES.CARRIER]: [DASHBOARD, MARKETPLACE],
};

const BUYER_LINKS = [
  DASHBOARD,
  MARKETPLACE,
  { label: 'Quote requests', to: '/rfqs' },
  { label: 'Orders', to: '/orders' },
  { label: 'Payments', to: '/payments' },
  ADVISORY,
];

export const navItemsFor = (role) => {
  if (!role) return PUBLIC;
  if (BUYER_ROLES.includes(role)) return BUYER_LINKS;
  return BY_ROLE[role] ?? [DASHBOARD, MARKETPLACE];
};
