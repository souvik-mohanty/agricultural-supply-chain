import React, { useEffect, useId, useRef } from 'react';

// Accessible confirmation built on the native <dialog>: focus is trapped, Escape cancels.
const ConfirmDialog = ({ open, title, children, confirmLabel = 'Confirm', danger = false, busy = false, onConfirm, onCancel }) => {
  const ref = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="ui-dialog"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
    >
      <h2 id={titleId}>{title}</h2>
      <div className="ui-dialog-body">{children}</div>
      <div className="ui-dialog-actions">
        <button type="button" className="ui-btn ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="button" className={`ui-btn ${danger ? 'danger' : 'primary'}`} onClick={onConfirm} disabled={busy}>
          {busy ? 'Working…' : confirmLabel}
        </button>
      </div>
    </dialog>
  );
};

export default ConfirmDialog;
