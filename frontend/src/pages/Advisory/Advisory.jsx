import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import PageLayout from '../../components/ui/PageLayout';
import Notice from '../../components/ui/Notice';
import { TextAreaField, TextField } from '../../components/ui/FormField';
import { EmptyState, QueryBoundary } from '../../components/ui/PageState';
import { useAuth } from '../../auth/useAuth';
import { ADVISORY_STAFF_ROLES } from '../../auth/roles';
import { useArticles } from '../../hooks/useApiData';
import { postArticle } from '../../service/advisoryApi';
import { getErrorMessage } from '../../lib/errors';
import { formatDate, humanize } from '../../lib/format';
import { keys } from '../../lib/queryKeys';

const schema = z.object({
  type: z.string().max(30, 'Use at most 30 characters'),
  title: z.string().trim().min(1, 'Enter a title').max(150, 'Use at most 150 characters'),
  content: z.string().trim().min(1, 'Write the article'),
});

const PublishForm = () => {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { type: 'tip', title: '', content: '' } });

  const publish = useMutation({
    mutationFn: (values) => postArticle({ ...values, type: values.type.trim() || undefined }),
    onSuccess: () => {
      setNotice({ type: 'success', text: 'Article published.' });
      reset({ type: 'tip', title: '', content: '' });
      queryClient.invalidateQueries({ queryKey: keys.articles });
    },
    onError: (error) => setNotice({ type: 'error', text: getErrorMessage(error, 'Could not publish the article.') }),
  });

  return (
    <section className="ui-card" aria-labelledby="publish">
      <h2 id="publish">Publish an article</h2>
      <Notice type={notice?.type}>{notice?.text}</Notice>
      <form className="ui-form" noValidate onSubmit={handleSubmit((values) => { setNotice(null); publish.mutate(values); })}>
        <div className="ui-form-row">
          <TextField id="type" label="Kind" hint="For example tip, blog or video" error={errors.type?.message} {...register('type')} />
          <TextField id="title" label="Title" error={errors.title?.message} {...register('title')} />
        </div>
        <TextAreaField id="content" label="Article" rows={6} error={errors.content?.message} {...register('content')} />
        <div className="pg-actions">
          <button type="submit" className="ui-btn primary" disabled={publish.isPending}>
            {publish.isPending ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      </form>
    </section>
  );
};

// Advice for farmers, readable without logging in. Advisors and admins can publish.
const Advisory = () => {
  const { isAuthenticated, role } = useAuth();
  const articles = useArticles();
  const canPublish = isAuthenticated && ADVISORY_STAFF_ROLES.includes(role);

  return (
    <PageLayout
      title="Advisory"
      subtitle="Tips and articles from agricultural advisors"
      actions={isAuthenticated && <Link className="ui-btn ghost" to="/queries">{canPublish ? 'Farmer questions' : 'Ask an advisor'}</Link>}
    >
      {canPublish && <PublishForm />}

      <section className="pg-section" aria-labelledby="articles">
        <h2 id="articles">Articles</h2>
        <QueryBoundary query={articles} empty={<EmptyState title="No articles yet" message="Advisors have not published anything yet. Check back soon." />}>
          {(list) => (
            <div className="ui-grid-2">
              {[...list].reverse().map((article) => (
                <article key={article.id} className="ui-card">
                  <p className="mk-meta">{humanize(article.type)} · {formatDate(article.postedDate)}</p>
                  <h3 style={{ margin: '0.2rem 0 0.5rem' }}>{article.title}</h3>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{article.content}</p>
                  <p className="mk-meta">By {article.advisorName}</p>
                </article>
              ))}
            </div>
          )}
        </QueryBoundary>
      </section>
    </PageLayout>
  );
};

export default Advisory;
