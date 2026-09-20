import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import PageLayout from '../../components/ui/PageLayout';
import Notice from '../../components/ui/Notice';
import Pagination from '../../components/ui/Pagination';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { EmptyState, QueryBoundary } from '../../components/ui/PageState';
import { useAuth } from '../../auth/useAuth';
import { ROLES } from '../../auth/roles';
import { usePagination } from '../../hooks/usePagination';
import { useProducts } from '../../hooks/useApiData';
import { deleteProduct, productImageUrl } from '../../service/productApi';
import { getErrorMessage } from '../../lib/errors';
import { formatCurrency } from '../../lib/format';

// Farmers manage their own products; admins can see, edit and delete everyone's.
const MyProducts = () => {
  const { user, role } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const products = useProducts();
  const [search, setSearch] = useState('');
  const [toDelete, setToDelete] = useState(null);
  const [notice, setNotice] = useState(location.state?.flash ? { type: 'success', text: location.state.flash } : null);

  const isAdmin = role === ROLES.ADMIN;

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (products.data ?? [])
      .filter((p) => isAdmin || p.farmerId === user.id)
      .filter((p) => !needle || p.name.toLowerCase().includes(needle) || (p.category ?? '').toLowerCase().includes(needle));
  }, [products.data, search, isAdmin, user.id]);
  const { page, setPage, totalPages, pageItems } = usePagination(visible, 10);

  const remove = useMutation({
    mutationFn: (product) => deleteProduct(product.id),
    onSuccess: (_, product) => {
      setToDelete(null);
      setNotice({ type: 'success', text: `${product.name} was deleted.` });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error) => {
      setToDelete(null);
      setNotice({ type: 'error', text: getErrorMessage(error, 'Could not delete the product.') });
    },
  });

  return (
    <PageLayout
      title={isAdmin ? 'Products' : 'My products'}
      subtitle={isAdmin ? 'All products on the platform' : 'Products you have listed'}
      actions={role === ROLES.FARMER && <Link className="ui-btn primary" to="/manage/products/new">Add a product</Link>}
    >
      <Notice type={notice?.type}>{notice?.text}</Notice>

      <div className="ui-toolbar">
        <div className="ui-field grow">
          <label htmlFor="mp-search">Search</label>
          <input id="mp-search" className="ui-input" type="search" placeholder="Name or category" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      <QueryBoundary
        query={products}
        isEmpty={(list) => list.filter((p) => isAdmin || p.farmerId === user.id).length === 0}
        empty={
          <EmptyState
            title={isAdmin ? 'No products on the platform yet' : 'You have not listed any products'}
            message={isAdmin ? undefined : 'Add your first product so buyers can find it and ask you for quotes.'}
            action={role === ROLES.FARMER && <Link className="ui-btn primary" to="/manage/products/new">Add a product</Link>}
          />
        }
      >
        {() =>
          visible.length === 0 ? (
            <EmptyState title="No products match your search" />
          ) : (
            <>
              <div className="ui-table-wrap">
                <table className="ui-table">
                  <caption className="ui-sr-only">Products</caption>
                  <thead>
                    <tr>
                      <th scope="col"><span className="ui-sr-only">Photo</span></th>
                      <th scope="col">Name</th>
                      <th scope="col">Category</th>
                      <th scope="col" className="num">Price / unit</th>
                      <th scope="col" className="num">In stock</th>
                      <th scope="col"><span className="ui-sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((product) => {
                      const image = productImageUrl(product);
                      return (
                        <tr key={product.id}>
                          <td>{image ? <img className="mp-thumb" src={image} alt="" loading="lazy" /> : <span className="mp-thumb mk-noimg" aria-hidden="true" />}</td>
                          <td><Link to={`/products/${product.id}`}>{product.name}</Link></td>
                          <td>{product.category}</td>
                          <td className="num">{formatCurrency(product.pricePerUnit)}</td>
                          <td className="num">{product.quantityAvailable}</td>
                          <td>
                            <div className="ui-row-actions">
                              <Link className="ui-btn ghost small" to={`/manage/products/${product.id}/edit`}>Edit</Link>
                              <button type="button" className="ui-btn danger small" onClick={() => setToDelete(product)}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </>
          )
        }
      </QueryBoundary>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete this product?"
        confirmLabel="Delete product"
        danger
        busy={remove.isPending}
        onConfirm={() => remove.mutate(toDelete)}
        onCancel={() => setToDelete(null)}
      >
        {toDelete && <>“{toDelete.name}” and its photos will be removed. Existing orders keep their own copy of the product name and price.</>}
      </ConfirmDialog>
    </PageLayout>
  );
};

export default MyProducts;
