import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import appRoutes from './app.routes';
import { LoadingState } from '../components/ui/PageState';

// Pages are loaded on demand (see app.routes.jsx), so the first visit only downloads what it needs.
const RouterComponent = () => (
  <Suspense fallback={<LoadingState label="Loading…" fullPage />}>
    <Routes>
      {appRoutes.map(({ path, element }) => (
        <Route key={path} path={path} element={element} />
      ))}
    </Routes>
  </Suspense>
);

export default RouterComponent;
