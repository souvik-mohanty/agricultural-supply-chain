import React from 'react';
import './Logo.css';

// The AgroLink logo. It is drawn from two transparent silhouettes used as CSS masks, so it takes the theme's colours
// (dark text on light pages, light text on dark ones) instead of showing a white box like the original PNG would.
//   layout="inline"   icon and name side by side (navbar)
//   layout="stacked"  icon above the name (sign-in pages, loading screen)
//   tone="dark"       for surfaces that are always dark: lighter green icon and white name
const Logo = ({ layout = 'inline', tone, className = '' }) => (
  <span className={`brand brand-${layout}${tone === 'dark' ? ' brand-on-dark' : ''} ${className}`.trim()} role="img" aria-label="AgroLink">
    <span className="brand-icon" aria-hidden="true" />
    <span className="brand-word" aria-hidden="true" />
  </span>
);

export default Logo;
