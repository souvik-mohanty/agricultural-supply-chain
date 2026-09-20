import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import PageLayout from '../../components/ui/PageLayout';
import Notice from '../../components/ui/Notice';
import { TextAreaField, TextField } from '../../components/ui/FormField';
import { fileComplaint } from '../../service/adminApi';
import { getErrorMessage } from '../../lib/errors';

const schema = z.object({
  against: z.string().trim().min(1, 'Say who or what the complaint is about'),
  message: z.string().trim().min(10, 'Please describe the problem in at least 10 characters').max(2000, 'Use at most 2000 characters'),
});

const NewComplaint = () => {
  const [result, setResult] = useState(null); // { type, text }
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { against: '', message: '' } });

  const send = useMutation({
    mutationFn: (values) => fileComplaint(values),
    onSuccess: () => {
      setResult({ type: 'success', text: 'Thank you. Your complaint was sent to the administrators.' });
      reset();
    },
    onError: (error) => setResult({ type: 'error', text: getErrorMessage(error, 'Could not send your complaint.') }),
  });

  return (
    <PageLayout title="Report a problem" subtitle="Tell the administrators about a user, product or order that needs attention" narrow>
      <Notice type={result?.type}>{result?.text}</Notice>
      <form className="ui-form ui-card" noValidate onSubmit={handleSubmit((values) => { setResult(null); send.mutate(values); })}>
        <TextField id="against" label="About" hint="A username, product name or order id" error={errors.against?.message} {...register('against')} />
        <TextAreaField id="message" label="What happened?" rows={6} error={errors.message?.message} {...register('message')} />
        <div className="pg-actions">
          <button type="submit" className="ui-btn primary" disabled={send.isPending}>
            {send.isPending ? 'Sending…' : 'Send complaint'}
          </button>
        </div>
      </form>
    </PageLayout>
  );
};

export default NewComplaint;
