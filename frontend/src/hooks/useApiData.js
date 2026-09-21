import { useQuery } from '@tanstack/react-query';
import { keys } from '../lib/queryKeys';
import { fetchAllProducts, getProductById } from '../service/productApi';
import { getMyOrders, getOrder, getSellerOrders } from '../service/orderApi';
import { getRfq, listRfqs } from '../service/rfqApi';
import { getCart } from '../service/cartApi';
import { getInbox } from '../service/notificationApi';
import { getComplaints, getUsers } from '../service/adminApi';
import { getReadyForDelivery } from '../service/warehouseApi';
import { getDemoAccounts } from '../service/authApi';
import { getAllQueries, getArticles, getMyQueries } from '../service/advisoryApi';

// Thin wrappers so pages share cache keys and the "unwrap axios .data" step.
const data = (request) => async () => (await request()).data;

export const useProducts = (category) =>
  useQuery({ queryKey: keys.products(category), queryFn: data(() => fetchAllProducts(category)) });

export const useProduct = (id) =>
  useQuery({ queryKey: keys.product(id), queryFn: data(() => getProductById(id)), enabled: Boolean(id) });

export const useCart = (enabled = true) => useQuery({ queryKey: keys.cart, queryFn: data(getCart), enabled });

export const useMyOrders = () => useQuery({ queryKey: keys.orders, queryFn: data(getMyOrders) });

export const useOrder = (id) => useQuery({ queryKey: keys.order(id), queryFn: data(() => getOrder(id)) });

export const useSellerOrders = (enabled = true) =>
  useQuery({ queryKey: keys.sellerOrders, queryFn: data(getSellerOrders), enabled });

// The dummy accounts the backend lists in demo mode. An empty list (or a failed request) means "no demo mode".
export const useDemoAccounts = () =>
  useQuery({
    queryKey: keys.demoAccounts,
    queryFn: async () => {
      const list = (await getDemoAccounts()).data;
      return Array.isArray(list) ? list : [];
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

export const useRfqs = () => useQuery({ queryKey: keys.rfqs, queryFn: data(listRfqs) });

export const useRfq = (id) => useQuery({ queryKey: keys.rfq(id), queryFn: data(() => getRfq(id)) });

export const useInbox = () => useQuery({ queryKey: keys.inbox, queryFn: data(getInbox) });

export const useUsers = () => useQuery({ queryKey: keys.users, queryFn: data(getUsers) });

export const useComplaints = () => useQuery({ queryKey: keys.complaints, queryFn: data(getComplaints) });

export const useReadyEntries = () => useQuery({ queryKey: keys.warehouseReady, queryFn: data(getReadyForDelivery) });

export const useArticles = () => useQuery({ queryKey: keys.articles, queryFn: data(getArticles) });

export const useMyQueries = (enabled = true) =>
  useQuery({ queryKey: keys.myQueries, queryFn: data(getMyQueries), enabled });

export const useAllQueries = (enabled = true) =>
  useQuery({ queryKey: keys.allQueries, queryFn: data(getAllQueries), enabled });
