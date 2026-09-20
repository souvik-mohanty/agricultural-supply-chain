import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import PageLayout from '../../components/ui/PageLayout';
import Notice from '../../components/ui/Notice';
import { TextAreaField, TextField } from '../../components/ui/FormField';
import { EmptyState, QueryBoundary } from '../../components/ui/PageState';
import { useAuth } from '../../auth/useAuth';
import { ROLES } from '../../auth/roles';
import { useProduct, useProducts } from '../../hooks/useApiData';
import { buildProductFormData, createProduct, productImageUrl, updateProduct } from '../../service/productApi';
import { getErrorMessage } from '../../lib/errors';
import { uniqueCategories } from '../../lib/products';
import { keys } from '../../lib/queryKeys';

const MAX_IMAGES = 5;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // matches the backend's 10 MB per file

const schema = z.object({
  name: z.string().trim().min(1, 'Enter the product name'),
  category: z.string().trim().min(1, 'Enter or choose a category'),
  pricePerUnit: z.string().min(1, 'Enter the price per unit').refine((v) => Number(v) > 0, 'The price must be greater than 0'),
  quantityAvailable: z
    .string()
    .min(1, 'Enter the quantity available')
    .refine((v) => Number.isInteger(Number(v)) && Number(v) >= 1, 'Enter a whole number of at least 1'),
  qualityTag: z.string(),
  cropInfo: z.string(),
});

const EMPTY = { name: '', category: '', pricePerUnit: '', quantityAvailable: '', qualityTag: '', cropInfo: '' };

const Form = ({ product }) => {
  const editing = Boolean(product);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const catalogue = useProducts();
  const [files, setFiles] = useState([]);
  const [fileError, setFileError] = useState(null);
  const [serverError, setServerError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: product
      ? {
          name: product.name,
          category: product.category,
          pricePerUnit: String(product.pricePerUnit),
          quantityAvailable: String(product.quantityAvailable),
          qualityTag: product.qualityTag ?? '',
          cropInfo: product.cropInfo ?? '',
        }
      : EMPTY,
  });

  // Local previews of the chosen files; released when the selection changes.
  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  const onPickFiles = (event) => {
    const picked = Array.from(event.target.files ?? []);
    setFileError(null);
    if (picked.length > MAX_IMAGES) {
      setFileError(`Choose at most ${MAX_IMAGES} photos.`);
    } else if (picked.some((file) => !file.type.startsWith('image/'))) {
      setFileError('Only image files can be uploaded.');
    } else if (picked.some((file) => file.size > MAX_IMAGE_BYTES)) {
      setFileError('Each photo must be smaller than 10 MB.');
    } else {
      setFiles(picked);
      return;
    }
    event.target.value = '';
    setFiles([]);
  };

  const save = useMutation({
    mutationFn: (values) => {
      const body = buildProductFormData(values, files);
      return editing ? updateProduct(product.id, body) : createProduct(body);
    },
    onSuccess: ({ data }) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: keys.product(data.id) });
      navigate('/manage/products', { state: { flash: editing ? `${data.name} was updated.` : `${data.name} was added.` } });
    },
    onError: (error) => setServerError(getErrorMessage(error, 'Could not save the product.')),
  });

  const categories = uniqueCategories(catalogue.data ?? []);
  const currentImage = editing ? productImageUrl(product) : null;

  return (
    <form className="ui-form ui-card" noValidate onSubmit={handleSubmit((values) => { setServerError(null); save.mutate(values); })}>
      <Notice type="error">{serverError}</Notice>

      <TextField id="name" label="Product name" error={errors.name?.message} {...register('name')} />
      <TextField
        id="category"
        label="Category"
        list="category-options"
        hint="Pick an existing category or type a new one"
        error={errors.category?.message}
        {...register('category')}
      />
      <datalist id="category-options">
        {categories.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      <div className="ui-form-row">
        <TextField id="pricePerUnit" label="Price per unit (₹)" type="number" min="0" step="0.01" inputMode="decimal" error={errors.pricePerUnit?.message} {...register('pricePerUnit')} />
        <TextField id="quantityAvailable" label="Quantity available" type="number" min="1" inputMode="numeric" error={errors.quantityAvailable?.message} {...register('quantityAvailable')} />
      </div>

      <TextField id="qualityTag" label="Quality (optional)" hint="For example Grade A, Organic" {...register('qualityTag')} />
      <TextAreaField id="cropInfo" label="Crop details (optional)" hint="Variety, harvest time, growing region…" {...register('cropInfo')} />

      <div className="ui-field">
        <label htmlFor="images">Photos (optional)</label>
        <input id="images" className="ui-input" type="file" accept="image/*" multiple onChange={onPickFiles} aria-describedby="images-hint" />
        <p className="ui-hint" id="images-hint">
          Up to {MAX_IMAGES} images, 10 MB each. The first one is shown to buyers.
          {editing && ' Choosing new photos replaces the current ones.'}
        </p>
        {fileError && <p className="ui-error" role="alert">{fileError}</p>}
        {(previews.length > 0 || currentImage) && (
          <div className="pf-previews">
            {previews.length > 0
              ? previews.map((url, index) => <img key={url} src={url} alt={`New photo ${index + 1}`} />)
              : <img src={currentImage} alt="Current product" />}
          </div>
        )}
      </div>

      <div className="pg-actions">
        <button type="submit" className="ui-btn primary" disabled={save.isPending}>
          {save.isPending ? 'Saving…' : editing ? 'Save changes' : 'Add product'}
        </button>
        <Link className="ui-btn ghost" to="/manage/products">Cancel</Link>
      </div>
    </form>
  );
};

// Add (FARMER) or edit (FARMER for their own products, ADMIN for any).
const ProductForm = () => {
  const { id } = useParams();
  const { user, role } = useAuth();
  const productQuery = useProduct(id);

  if (!id) {
    return (
      <PageLayout title="Add a product" narrow>
        <Form />
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Edit product" narrow>
      <QueryBoundary query={productQuery} isEmpty={() => false}>
        {(product) =>
          role !== ROLES.ADMIN && product.farmerId !== user.id ? (
            <EmptyState title="Not your product" message="You can only edit products you listed." action={<Link className="ui-btn primary" to="/manage/products">Back to my products</Link>} />
          ) : (
            <Form product={product} />
          )
        }
      </QueryBoundary>
    </PageLayout>
  );
};

export default ProductForm;
