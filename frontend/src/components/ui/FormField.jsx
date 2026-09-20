import React from 'react';

// Label + control + hint + error, wired for screen readers (aria-invalid / aria-describedby / role="alert").
// Use with React Hook Form: <TextField id="name" label="Name" error={errors.name?.message} {...register('name')} />
export const TextField = ({ id, label, error, hint, as = 'input', children, ...props }) => {
  const Control = as;
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined;
  return (
    <div className="ui-field">
      <label htmlFor={id}>{label}</label>
      <Control id={id} className="ui-input" aria-invalid={error ? 'true' : undefined} aria-describedby={describedBy} {...props}>
        {children}
      </Control>
      {hint && (
        <p className="ui-hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      {error && (
        <p className="ui-error" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export const SelectField = (props) => <TextField as="select" {...props} />;

export const TextAreaField = ({ rows = 4, ...props }) => <TextField as="textarea" rows={rows} {...props} />;
