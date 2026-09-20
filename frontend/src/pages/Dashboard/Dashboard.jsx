import React from 'react';
import PageLayout from '../../components/ui/PageLayout';
import { useAuth } from '../../auth/useAuth';
import { ROLES, BUYER_ROLES, roleLabel } from '../../auth/roles';
import BuyerDashboard from './BuyerDashboard';
import SellerDashboard from './SellerDashboard';
import AdminDashboard from './AdminDashboard';
import { AdvisorDashboard, CarrierDashboard, WarehouseDashboard } from './OtherDashboards';

// The landing page after login: one dashboard per role, each built only from what the backend can tell that role.
const Dashboard = () => {
  const { user, role } = useAuth();

  let content;
  if (BUYER_ROLES.includes(role)) content = <BuyerDashboard user={user} />;
  else if (role === ROLES.FARMER) content = <SellerDashboard user={user} />;
  else if (role === ROLES.ADMIN) content = <AdminDashboard />;
  else if (role === ROLES.MANAGER || role === ROLES.WAREHOUSE_OPERATOR) content = <WarehouseDashboard />;
  else if (role === ROLES.ADVISOR) content = <AdvisorDashboard />;
  else content = <CarrierDashboard />;

  return (
    <PageLayout title={`Welcome, ${user.username}`} subtitle={`Signed in as ${roleLabel(role)}`}>
      {content}
    </PageLayout>
  );
};

export default Dashboard;
