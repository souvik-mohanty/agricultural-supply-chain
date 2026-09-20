import React from 'react';

// Inline success / error / info banner. Errors are announced to screen readers immediately.
const Notice = ({ type = 'info', children }) => {
  if (!children) {
    return null;
  }
  return (
    <div className={`ui-notice ${type}`} role={type === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
};

export default Notice;
