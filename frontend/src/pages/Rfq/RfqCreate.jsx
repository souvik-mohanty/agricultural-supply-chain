import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import PageLayout from '../../components/ui/PageLayout';
import Notice from '../../components/ui/Notice';
import { SelectField, TextAreaField, TextField } from '../../components/ui/FormField';
import { LoadingState } from '../../components/ui/PageState';
import { useAuth } from '../../auth/useAuth';
import { useProducts } from '../../hooks/useApiData';
import { createRfq } from '../../service/rfqApi';
import { getErrorMessage } from '../../lib/errors';
import { todayIso } from '../../lib/format';
import { keys } from '../../lib/queryKeys';

const today = todayIso();

// Every input arrives as a string; the schema validates it and submit() converts it.
const schema = z.object({
  productId: z.string().min(1, 'Choose a product'),
  quantity: z
    .string()
    .min(1, 'Enter the quantity you need')
    .refine((v) => Number.isInteger(Number(v)) && Number(v) >= 1, 'Enter a whole number of at least 1'),
  unit: z.string().max(20, 'Use at most 20 characters'),
  targetPricePerUnit: z.string().refine((v) => v === '' || Number(v) > 0, 'The price must be greater than 0'),
  deliveryLocation: z.string().trim().min(1, 'Enter where the goods should be delivered').max(200, 'Use at most 200 characters'),
  requiredDeliveryDate: z.string().refine((v) => v === '' || v >= today, 'The delivery date cannot be in the past'),
  requirements: z.string().max(1000, 'Use at most 1000 characters'),
  deadline: z.string().min(1, 'Choose the last day sellers can answer').refine((v) => v === '' || v >= today, 'The deadline cannot be in the past'),
});

const RfqCreate = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const products = useProducts();
  const [serverError, setServerError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      productId: params.get('productId') ?? '',
      quantity: '',
      unit: 'kg',
      targetPricePerUnit: '',
      deliveryLocation: '',
      requiredDeliveryDate: '',
      requirements: '',
      deadline: '',
    },
  });

  const create = useMutation({
    mutationFn: (values) =>
      createRfq({
        productId: values.productId,
        quantity: Number(values.quantity),
        unit: values.unit.trim() || undefined,
        targetPricePerUnit: values.targetPricePerUnit === '' ? undefined : Number(values.targetPricePerUnit),
        deliveryLocation: values.deliveryLocation.trim(),
        requiredDeliveryDate: values.requiredDeliveryDate || undefined,
        requirements: values.requirements.trim() || undefined,
        deadline: values.deadline,
      }),
    onSuccess: ({ data }) => {
      queryClient.invalidateQueries({ queryKey: keys.rfqs });
      navigate(`/rfqs/${data.id}`, { state: { flash: 'Your quote request was sent to the seller.' } });
    },
    onError: (error) => setServerError(getErrorMessage(error, 'Could not send the quote request.')),
  });

  const onSubmit = (values) => {
    setServerError(null);
    create.mutate(values);
  };

  // Sellers cannot ask themselves for a quote.
  const choices = (products.data ?? []).filter((p) => p.farmerId !== user.id);

  return (
    <PageLayout title="Request a quote" subtitle="Tell the seller what you need. They reply with a price you can accept or reject." narrow>
      <Notice type="error">{serverError}</Notice>
      {products.isPending ? (
        <LoadingState />
      ) : products.isError ? (
        <Notice type="error">{getErrorMessage(products.error, 'Could not load the products.')}</Notice>
      ) : (
        <form className="ui-form ui-card" onSubmit={handleSubmit(onSubmit)} noValidate>
          <SelectField id="productId" label="Product" error={errors.productId?.message} {...register('productId')}>
            <option value="">Choose a product…</option>
            {choices.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.category})
              </option>
            ))}
          </SelectField>

          <div className="ui-form-row">
            <TextField id="quantity" label="Quantity needed" type="number" min="1" inputMode="numeric" error={errors.quantity?.message} {...register('quantity')} />
            <TextField id="unit" label="Unit" hint="For example kg, quintal or tonne" error={errors.unit?.message} {...register('unit')} />
            <TextField
              id="targetPricePerUnit"
              label="Target price per unit (₹, optional)"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              error={errors.targetPricePerUnit?.message}
              {...register('targetPricePerUnit')}
            />
          </div>

          <TextField id="deliveryLocation" label="Delivery location" error={errors.deliveryLocation?.message} {...register('deliveryLocation')} />

          <div className="ui-form-row">
            <TextField
              id="requiredDeliveryDate"
              label="Needed by (optional)"
              type="date"
              min={today}
              error={errors.requiredDeliveryDate?.message}
              {...register('requiredDeliveryDate')}
            />
            <TextField
              id="deadline"
              label="Quote deadline"
              type="date"
              min={today}
              hint="After this day the request expires"
              error={errors.deadline?.message}
              {...register('deadline')}
            />
          </div>

          <TextAreaField id="requirements" label="Additional requirements (optional)" error={errors.requirements?.message} {...register('requirements')} />

          <div className="pg-actions">
            <button type="submit" className="ui-btn primary" disabled={create.isPending}>
              {create.isPending ? 'Sending…' : 'Send quote request'}
            </button>
            <Link className="ui-btn ghost" to="/rfqs">
              Cancel
            </Link>
          </div>
        </form>
      )}
    </PageLayout>
  );
};

export default RfqCreate;
