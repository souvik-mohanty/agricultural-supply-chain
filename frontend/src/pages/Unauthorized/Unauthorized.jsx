import React from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '../../components/ui/PageLayout';
import { EmptyState } from '../../components/ui/PageState';
import { useAuth } from '../../auth/useAuth';

// Shown when a logged-in user opens a page their role does not allow (the backend refuses those requests too).
const Unauthorized = () => {
  const { isAuthenticated } = useAuth();
  return (
    <PageLayout narrow>
      <EmptyState
        title="You do not have access to this page"
        message="Your account’s role does not include this area. If you think this is a mistake, contact an administrator."
        action={
          <Link className="ui-btn primary" to={isAuthenticated ? '/dashboard' : '/login'}>
            {isAuthenticated ? 'Go to my dashboard' : 'Log in'}
          </Link>
        }
      />
    </PageLayout>
  );
};

export default Unauthorized;
