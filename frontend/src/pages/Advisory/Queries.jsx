import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import PageLayout from '../../components/ui/PageLayout';
import Notice from '../../components/ui/Notice';
import StatusBadge from '../../components/ui/StatusBadge';
import { TextAreaField } from '../../components/ui/FormField';
import { EmptyState, QueryBoundary } from '../../components/ui/PageState';
import { useAuth } from '../../auth/useAuth';
import { ADVISORY_STAFF_ROLES } from '../../auth/roles';
import { useAllQueries, useMyQueries } from '../../hooks/useApiData';
import { respondToQuery, submitQuery } from '../../service/advisoryApi';
import { getErrorMessage } from '../../lib/errors';
import { formatDate } from '../../lib/format';
import { keys } from '../../lib/queryKeys';

const questionSchema = z.object({ question: z.string().trim().min(10, 'Please describe your question in at least 10 characters').max(2000, 'Use at most 2000 characters') });
const answerSchema = z.object({ response: z.string().trim().min(1, 'Write your answer') });

const AskForm = () => {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(questionSchema), defaultValues: { question: '' } });

  const ask = useMutation({
    mutationFn: ({ question }) => submitQuery(question),
    onSuccess: () => {
      setNotice({ type: 'success', text: 'Your question was sent. An advisor will answer it here.' });
      reset();
      queryClient.invalidateQueries({ queryKey: keys.myQueries });
    },
    onError: (error) => setNotice({ type: 'error', text: getErrorMessage(error, 'Could not send your question.') }),
  });

  return (
    <section className="ui-card" aria-labelledby="ask">
      <h2 id="ask">Ask an advisor</h2>
      <Notice type={notice?.type}>{notice?.text}</Notice>
      <form className="ui-form" noValidate onSubmit={handleSubmit((values) => { setNotice(null); ask.mutate(values); })}>
        <TextAreaField id="question" label="Your question" rows={4} error={errors.question?.message} {...register('question')} />
        <div className="pg-actions">
          <button type="submit" className="ui-btn primary" disabled={ask.isPending}>{ask.isPending ? 'Sending…' : 'Send question'}</button>
        </div>
      </form>
    </section>
  );
};

const AnswerForm = ({ query }) => {
  const queryClient = useQueryClient();
  const [error, setError] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(answerSchema), defaultValues: { response: '' } });

  const answer = useMutation({
    mutationFn: ({ response }) => respondToQuery(query.id, response),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.allQueries }),
    onError: (e) => setError(getErrorMessage(e, 'Could not send the answer.')),
  });

  return (
    <form className="ui-form" noValidate onSubmit={handleSubmit((values) => { setError(null); answer.mutate(values); })}>
      <Notice type="error">{error}</Notice>
      <TextAreaField id={`answer-${query.id}`} label="Your answer" rows={3} error={errors.response?.message} {...register('response')} />
      <div className="pg-actions">
        <button type="submit" className="ui-btn primary small" disabled={answer.isPending}>{answer.isPending ? 'Sending…' : 'Send answer'}</button>
      </div>
    </form>
  );
};

const QueryCard = ({ query, canAnswer }) => (
  <article className="ui-card">
    <p className="mk-meta">
      {canAnswer ? `${query.farmerName} · ` : ''}asked {formatDate(query.submittedDate)}{' '}
      <StatusBadge status={query.advisorResponse ? 'RESOLVED' : 'OPEN'} />
    </p>
    <p style={{ whiteSpace: 'pre-wrap' }}><strong>{query.question}</strong></p>
    {query.advisorResponse ? (
      <>
        <p style={{ whiteSpace: 'pre-wrap' }}>{query.advisorResponse}</p>
        <p className="mk-meta">Answered {formatDate(query.responseDate)}</p>
      </>
    ) : canAnswer ? (
      <AnswerForm query={query} />
    ) : (
      <p className="pg-sub">Waiting for an advisor to answer.</p>
    )}
  </article>
);

// Farmers (and any user) ask questions and read the answers; advisors and admins see every question and answer it.
const Queries = () => {
  const { role } = useAuth();
  const isStaff = ADVISORY_STAFF_ROLES.includes(role);
  const mine = useMyQueries(!isStaff);
  const all = useAllQueries(isStaff);
  const list = isStaff ? all : mine;

  return (
    <PageLayout title={isStaff ? 'Farmer questions' : 'Ask an advisor'} subtitle={isStaff ? 'Answer questions from farmers' : 'Your questions and the advice you received'}>
      {!isStaff && <AskForm />}
      <section className={isStaff ? '' : 'pg-section'} aria-labelledby="q-list">
        <h2 id="q-list">{isStaff ? 'All questions' : 'My questions'}</h2>
        <QueryBoundary
          query={list}
          empty={<EmptyState title={isStaff ? 'No questions yet' : 'You have not asked anything yet'} message={isStaff ? undefined : 'Send your first question above.'} />}
        >
          {(items) => (
            <div className="ui-grid-2">
              {[...items].reverse().map((q) => (
                <QueryCard key={q.id} query={q} canAnswer={isStaff} />
              ))}
            </div>
          )}
        </QueryBoundary>
      </section>
    </PageLayout>
  );
};

export default Queries;
