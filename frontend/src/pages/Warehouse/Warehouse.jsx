import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import PageLayout from '../../components/ui/PageLayout';
import Notice from '../../components/ui/Notice';
import StatusBadge from '../../components/ui/StatusBadge';
import { TextField } from '../../components/ui/FormField';
import { EmptyState, QueryBoundary } from '../../components/ui/PageState';
import { useReadyEntries } from '../../hooks/useApiData';
import { getByLocation, markReady, storeCrop } from '../../service/warehouseApi';
import { getErrorMessage } from '../../lib/errors';
import { formatDateTime } from '../../lib/format';
import { keys } from '../../lib/queryKeys';

const schema = z.object({
  cropName: z.string().trim().min(1, 'Enter the crop'),
  farmerId: z.string().trim().min(1, 'Enter the farmer’s user id'),
  warehouseLocation: z.string().trim().min(1, 'Enter the warehouse location'),
  quantity: z.string().min(1, 'Enter the quantity').refine((v) => Number(v) > 0, 'The quantity must be greater than 0'),
});

const EntriesTable = ({ entries, onMarkReady, busy }) => (
  <div className="ui-table-wrap">
    <table className="ui-table">
      <caption className="ui-sr-only">Warehouse entries</caption>
      <thead>
        <tr>
          <th scope="col">Crop</th>
          <th scope="col">Location</th>
          <th scope="col" className="num">Quantity</th>
          <th scope="col">Stored</th>
          <th scope="col">Status</th>
          {onMarkReady && <th scope="col"><span className="ui-sr-only">Actions</span></th>}
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) => (
          <tr key={entry.id}>
            <td>{entry.cropName}</td>
            <td>{entry.warehouseLocation}</td>
            <td className="num">{entry.quantity}</td>
            <td>{formatDateTime(entry.entryTime)}</td>
            <td><StatusBadge status={entry.readyForDelivery ? 'READY' : 'STORED'} /></td>
            {onMarkReady && (
              <td>
                {!entry.readyForDelivery && (
                  <button type="button" className="ui-btn ghost small" onClick={() => onMarkReady(entry.id)} disabled={busy}>
                    Mark ready
                  </button>
                )}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// The backend lists stored crops by location and the ones ready for delivery; there is no "list everything" endpoint.
const Warehouse = () => {
  const queryClient = useQueryClient();
  const ready = useReadyEntries();
  const [location, setLocation] = useState('');
  const [lookup, setLookup] = useState('');
  const [notice, setNotice] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { cropName: '', farmerId: '', warehouseLocation: '', quantity: '' } });

  const byLocation = useQuery({
    queryKey: keys.warehouseLocation(lookup),
    queryFn: async () => (await getByLocation(lookup)).data,
    enabled: lookup !== '',
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['warehouse'] });
  };

  const store = useMutation({
    mutationFn: (values) => storeCrop({ ...values, quantity: Number(values.quantity) }),
    onSuccess: ({ data }) => {
      setNotice({ type: 'success', text: `${data.cropName} stored at ${data.warehouseLocation}.` });
      reset();
      refresh();
    },
    onError: (error) => setNotice({ type: 'error', text: getErrorMessage(error, 'Could not store the crop.') }),
  });

  const mark = useMutation({
    mutationFn: markReady,
    onSuccess: () => {
      setNotice({ type: 'success', text: 'Marked ready for delivery.' });
      refresh();
    },
    onError: (error) => setNotice({ type: 'error', text: getErrorMessage(error) }),
  });

  return (
    <PageLayout title="Warehouse" subtitle="Store crops and mark them ready for delivery">
      <Notice type={notice?.type}>{notice?.text}</Notice>

      <div className="ui-grid-2">
        <section className="ui-card" aria-labelledby="wh-store">
          <h2 id="wh-store">Store a crop</h2>
          <form className="ui-form" noValidate onSubmit={handleSubmit((values) => { setNotice(null); store.mutate(values); })}>
            <TextField id="cropName" label="Crop" error={errors.cropName?.message} {...register('cropName')} />
            <TextField id="farmerId" label="Farmer (user id)" error={errors.farmerId?.message} {...register('farmerId')} />
            <div className="ui-form-row">
              <TextField id="warehouseLocation" label="Warehouse location" error={errors.warehouseLocation?.message} {...register('warehouseLocation')} />
              <TextField id="wh-quantity" label="Quantity" type="number" min="0" step="0.01" error={errors.quantity?.message} {...register('quantity')} />
            </div>
            <div className="pg-actions">
              <button type="submit" className="ui-btn primary" disabled={store.isPending}>
                {store.isPending ? 'Saving…' : 'Store crop'}
              </button>
            </div>
          </form>
        </section>

        <section className="ui-card" aria-labelledby="wh-find">
          <h2 id="wh-find">Find stored crops</h2>
          <form className="ui-toolbar" onSubmit={(e) => { e.preventDefault(); setLookup(location.trim()); }}>
            <div className="ui-field grow">
              <label htmlFor="wh-location">Warehouse location</label>
              <input id="wh-location" className="ui-input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="For example Pune" />
            </div>
            <button type="submit" className="ui-btn ghost" disabled={!location.trim()}>Search</button>
          </form>
          {lookup === '' ? (
            <p className="pg-sub">Enter a location to see what is stored there.</p>
          ) : (
            <QueryBoundary query={byLocation} empty={<EmptyState title={`Nothing stored at “${lookup}”`} />}>
              {(list) => <EntriesTable entries={list} onMarkReady={(id) => mark.mutate(id)} busy={mark.isPending} />}
            </QueryBoundary>
          )}
        </section>
      </div>

      <section className="pg-section" aria-labelledby="wh-ready">
        <h2 id="wh-ready">Ready for delivery</h2>
        <QueryBoundary query={ready} empty={<EmptyState title="Nothing ready yet" message="Mark stored crops as ready and they will be listed here." />}>
          {(list) => <EntriesTable entries={list} />}
        </QueryBoundary>
      </section>
    </PageLayout>
  );
};

export default Warehouse;
