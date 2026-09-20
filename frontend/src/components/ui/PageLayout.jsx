import React from 'react';
import Navbar from '../Navbar/Navbar';

// Shell for the app pages: skip link, role-aware navbar, one <main> landmark and an optional title row.
const PageLayout = ({ title, subtitle, actions, narrow = false, children }) => (
  <div className="pg-shell">
    <a className="ui-skip" href="#main-content">
      Skip to content
    </a>
    <Navbar />
    <main id="main-content" className={`pg-inner${narrow ? ' pg-narrow' : ''}`}>
      {(title || actions) && (
        <header className="pg-header">
          <div>
            {title && <h1>{title}</h1>}
            {subtitle && <p className="pg-sub">{subtitle}</p>}
          </div>
          {actions && <div className="pg-actions">{actions}</div>}
        </header>
      )}
      {children}
    </main>
  </div>
);

export default PageLayout;
