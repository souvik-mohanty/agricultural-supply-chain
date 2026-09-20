import React, { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import PageLayout from '../../components/ui/PageLayout';
import Notice from '../../components/ui/Notice';
import StatusBadge from '../../components/ui/StatusBadge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { TextAreaField, TextField } from '../../components/ui/FormField';
import { QueryBoundary } from '../../components/ui/PageState';
import { useAuth } from '../../auth/useAuth';
import { useRfq } from '../../hooks/useApiData';
import { acceptQuote, cancelRfq, rejectQuote, submitQuote } from '../../service/rfqApi';
import { payForRfq } from '../../service/checkout';
import { getErrorMessage } from '../../lib/errors';
import { formatCurrency, formatDate, formatDateTime, todayIso } from '../../lib/format';
import { keys } from '../../lib/queryKeys';

const today = todayIso();

const quoteSchema = z.object({
  pricePerUnit: z.string().min(1, 'Enter your price per unit').refine((v) => Number(v) > 0, 'The price must be greater than 0'),
  quantity: z
    .string()
    .min(1, 'Enter the quantity you can supply')
    .refine((v) => Number.isInteger(Number(v)) && Number(v) >= 1, 'Enter a whole number of at least 1'),
  deliveryDate: z.string().refine((v) => v === '' || v >= today, 'The delivery date cannot be in the past'),
  notes: z.string().max(1000, 'Use at most 1000 characters'),
});

const QuoteForm = ({ rfq, onSubmit, busy }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      pricePerUnit: rfq.quote ? String(rfq.quote.pricePerUnit) : '',
      quantity: String(rfq.quote?.quantity ?? rfq.quantity),
      deliveryDate: rfq.quote?.deliveryDate ?? '',
      notes: rfq.quote?.notes ?? '',
    },
  });

  return (
    <form
      className="ui-form"
      noValidate
      onSubmit={handleSubmit((values) =>
        onSubmit({
          pricePerUnit: Number(values.pricePerUnit),
          quantity: Number(values.quantity),
          deliveryDate: values.deliveryDate || undefined,
          notes: values.notes.trim() || undefined,
        }),
      )}
    >
      <div className="ui-form-row">
        <TextField id="pricePerUnit" label={`Price per ${rfq.unit} (₹)`} type="number" min="0" step="0.01" inputMode="decimal" error={errors.pricePerUnit?.message} {...register('pricePerUnit')} />
        <TextField id="quote-quantity" label={`Quantity you can supply (${rfq.unit})`} type="number" min="1" error={errors.quantity?.message} {...register('quantity')} />
        <TextField id="deliveryDate" label="Delivery date (optional)" type="date" min={today} error={errors.deliveryDate?.message} {...register('deliveryDate')} />
      </div>
      <TextAreaField id="notes" label="Notes for the buyer (optional)" error={errors.notes?.message} {...register('notes')} />
      <div className="pg-actions">
        <button type="submit" className="ui-btn primary" disabled={busy}>
          {busy ? 'Sending…' : rfq.quote ? 'Replace my quote' : 'Send quote'}
        </button>
      </div>
    </form>
  );
};

const RfqDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const rfqQuery = useRfq(id);
  const [notice, setNotice] = useState(location.state?.flash ? { type: 'success', text: location.state.flash } : null);
  const [confirm, setConfirm] = useState(null); // 'reject' | 'cancel' | 'accept'
  const [paying, setPaying] = useState(false);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: keys.rfq(id) });
    queryClient.invalidateQueries({ queryKey: keys.rfqs });
    queryClient.invalidateQueries({ queryKey: keys.unread });
  };

  const done = (text, response) => {
    if (response) queryClient.setQueryData(keys.rfq(id), response.data); // the API returns the updated RFQ
    setConfirm(null);
    setNotice({ type: 'success', text });
    refresh();
  };
  const failed = (error) => {
    setConfirm(null);
    setNotice({ type: 'error', text: getErrorMessage(error) });
  };

  const quote = useMutation({
    mutationFn: (body) => submitQuote(id, body),
    onSuccess: (response) => done('Your quote was sent to the buyer.', response),
    onError: failed,
  });
  const accept = useMutation({
    mutationFn: () => acceptQuote(id),
    onSuccess: (response) => done('You accepted the quote. You can now create the order and pay.', response),
    onError: failed,
  });
  const reject = useMutation({
    mutationFn: () => rejectQuote(id),
    onSuccess: (response) => done('You rejected the quote.', response),
    onError: failed,
  });
  const cancel = useMutation({
    mutationFn: () => cancelRfq(id),
    onSuccess: (response) => done('The quote request was cancelled.', response),
    onError: failed,
  });

  const pay = async () => {
    setNotice(null);
    setPaying(true);
    try {
      await payForRfq(id);
      setNotice({ type: 'success', text: 'Payment successful. Your order has been placed.' });
      queryClient.invalidateQueries({ queryKey: keys.orders });
      refresh();
    } catch (error) {
      setNotice(
        error.message === 'Payment cancelled'
          ? { type: 'info', text: 'Payment cancelled. You can try again; the reserved stock is released after 30 minutes.' }
          : { type: 'error', text: getErrorMessage(error, 'Could not create the order.') },
      );
      refresh();
    } finally {
      setPaying(false);
    }
  };

  return (
    <PageLayout>
      <p>
        <Link to="/rfqs">← All quote requests</Link>
      </p>
      <Notice type={notice?.type}>{notice?.text}</Notice>

      <QueryBoundary query={rfqQuery} isEmpty={() => false}>
        {(rfq) => {
          const isBuyer = rfq.buyerId === user.id;
          const isSeller = rfq.sellerId === user.id;
          const canQuote = isSeller && (rfq.status === 'OPEN' || rfq.status === 'QUOTED');
          const busy = quote.isPending || accept.isPending || reject.isPending || cancel.isPending;

          return (
            <>
              <header className="pg-header">
                <div>
                  <h1>Quote request: {rfq.productName}</h1>
                  <p className="pg-sub">
                    {isBuyer ? `To ${rfq.sellerName}` : `From ${rfq.buyerName}`} · sent {formatDateTime(rfq.createdAt)}
                  </p>
                </div>
                <StatusBadge status={rfq.status} />
              </header>

              <div className="ui-grid-2">
                <section className="ui-card" aria-labelledby="rfq-request">
                  <h2 id="rfq-request">The request</h2>
                  <dl className="ui-kv">
                    <dt>Product</dt>
                    <dd><Link to={`/products/${rfq.productId}`}>{rfq.productName}</Link></dd>
                    <dt>Quantity</dt>
                    <dd>{rfq.quantity} {rfq.unit}</dd>
                    {rfq.targetPricePerUnit != null && (
                      <>
                        <dt>Target price</dt>
                        <dd>{formatCurrency(rfq.targetPricePerUnit)} per {rfq.unit}</dd>
                      </>
                    )}
                    <dt>Deliver to</dt>
                    <dd>{rfq.deliveryLocation}</dd>
                    <dt>Needed by</dt>
                    <dd>{formatDate(rfq.requiredDeliveryDate)}</dd>
                    <dt>Answer by</dt>
                    <dd>{formatDate(rfq.deadline)}</dd>
                    {rfq.requirements && (
                      <>
                        <dt>Requirements</dt>
                        <dd>{rfq.requirements}</dd>
                      </>
                    )}
                  </dl>
                </section>

                <section className="ui-card" aria-labelledby="rfq-quote">
                  <h2 id="rfq-quote">The quote</h2>
                  {rfq.quote ? (
                    <dl className="ui-kv">
                      <dt>Price</dt>
                      <dd>{formatCurrency(rfq.quote.pricePerUnit)} per {rfq.unit}</dd>
                      <dt>Quantity offered</dt>
                      <dd>{rfq.quote.quantity} {rfq.unit}</dd>
                      <dt>Total</dt>
                      <dd><strong>{formatCurrency(rfq.quote.pricePerUnit * rfq.quote.quantity)}</strong></dd>
                      <dt>Delivery date</dt>
                      <dd>{formatDate(rfq.quote.deliveryDate)}</dd>
                      {rfq.quote.notes && (
                        <>
                          <dt>Notes</dt>
                          <dd>{rfq.quote.notes}</dd>
                        </>
                      )}
                      <dt>Quoted</dt>
                      <dd>{formatDateTime(rfq.quote.quotedAt)}</dd>
                    </dl>
                  ) : (
                    <p className="pg-sub">No quote yet.{isBuyer && rfq.status === 'OPEN' ? ' The seller has been notified.' : ''}</p>
                  )}
                </section>
              </div>

              <section className="ui-card pg-section" aria-labelledby="rfq-actions">
                <h2 id="rfq-actions">{canQuote ? 'Your answer' : 'What next'}</h2>

                {canQuote && <QuoteForm rfq={rfq} busy={quote.isPending} onSubmit={(body) => { setNotice(null); quote.mutate(body); }} />}

                {isBuyer && rfq.status === 'QUOTED' && (
                  <div className="pg-actions">
                    <button type="button" className="ui-btn primary" onClick={() => setConfirm('accept')} disabled={busy}>Accept quote</button>
                    <button type="button" className="ui-btn danger" onClick={() => setConfirm('reject')} disabled={busy}>Reject quote</button>
                  </div>
                )}

                {isBuyer && rfq.status === 'ACCEPTED' && (
                  <>
                    {rfq.orderId && (
                      <p>
                        An order exists for this quote: <Link to={`/orders/${rfq.orderId}`}>view order</Link>. If it is still unpaid you can create a new one after it expires or is cancelled.
                      </p>
                    )}
                    <div className="pg-actions">
                      <button type="button" className="ui-btn primary" onClick={pay} disabled={paying}>
                        {paying ? 'Processing…' : `Create order and pay ${formatCurrency(rfq.quote.pricePerUnit * rfq.quote.quantity)}`}
                      </button>
                    </div>
                    <p className="ui-hint">The order is priced from this quote, not from the catalogue. Payment is confirmed by the server.</p>
                  </>
                )}

                {isBuyer && (rfq.status === 'OPEN' || rfq.status === 'QUOTED') && (
                  <div className="pg-actions" style={{ marginTop: '0.75rem' }}>
                    <button type="button" className="ui-btn ghost" onClick={() => setConfirm('cancel')} disabled={busy}>Cancel this request</button>
                  </div>
                )}

                {isSeller && rfq.status === 'QUOTED' && <p className="ui-hint">You can replace your quote until the buyer answers.</p>}
                {isSeller && rfq.status === 'ACCEPTED' && <p>The buyer accepted your quote. They will create and pay the order; you will see it under Orders.</p>}
                {['REJECTED', 'CANCELLED', 'EXPIRED'].includes(rfq.status) && <p className="pg-sub">This request is closed ({rfq.status.toLowerCase()}).</p>}
              </section>

              <ConfirmDialog
                open={confirm === 'accept'}
                title="Accept this quote?"
                confirmLabel="Accept quote"
                busy={accept.isPending}
                onConfirm={() => accept.mutate()}
                onCancel={() => setConfirm(null)}
              >
                You will be able to create the order at {formatCurrency(rfq.quote?.pricePerUnit ?? 0)} per {rfq.unit}.
              </ConfirmDialog>
              <ConfirmDialog
                open={confirm === 'reject'}
                title="Reject this quote?"
                confirmLabel="Reject quote"
                danger
                busy={reject.isPending}
                onConfirm={() => reject.mutate()}
                onCancel={() => setConfirm(null)}
              >
                The seller will be told. This cannot be undone.
              </ConfirmDialog>
              <ConfirmDialog
                open={confirm === 'cancel'}
                title="Cancel this request?"
                confirmLabel="Cancel request"
                danger
                busy={cancel.isPending}
                onConfirm={() => cancel.mutate()}
                onCancel={() => setConfirm(null)}
              >
                The seller will be told that you no longer need a quote.
              </ConfirmDialog>
            </>
          );
        }}
      </QueryBoundary>
    </PageLayout>
  );
};

export default RfqDetail;
