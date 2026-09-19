// src/router/RouterComponent.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import appRoutes from './app.routes';

const RouterComponent = () => {
  return (
    <Routes>
      {appRoutes.map(({ path, element }, index) => (
        <Route key={index} path={path} element={element} />
      ))}
    </Routes>
  );
};

export default RouterComponent;
