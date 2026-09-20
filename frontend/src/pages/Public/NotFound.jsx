import React from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '../../components/ui/PageLayout';
import { EmptyState } from '../../components/ui/PageState';

const NotFound = () => (
  <PageLayout narrow>
    <EmptyState
      title="Page not found"
      message="The page you are looking for does not exist or has moved."
      action={
        <Link className="ui-btn primary" to="/">
          Back to the home page
        </Link>
      }
    />
  </PageLayout>
);

export default NotFound;
