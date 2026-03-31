import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderAPI } from '../api/axios';
import { PageTransition, StaggerContainer, StaggerItem } from '../components/ui/Motion';
import Loader from '../components/ui/Loader';
import EmptyState from '../components/ui/EmptyState';
import { HiOutlineShoppingBag, HiOutlineEye, HiOutlineCalendar } from 'react-icons/hi';

const STATUS_STYLES = {
  pending: 'badge-warning',
  confirmed: 'badge-primary',
  processing: 'badge-primary',
  shipped: 'badge-success',
  delivered: 'badge-success',
  cancelled: 'badge-danger'
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchOrders();
  }, [page]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await orderAPI.getAll({ page, limit: 10 });
      setOrders(data.orders || []);
      setPagination(data.pagination || {});
    } catch {
      setOrders([]);
      setPagination({});
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <PageTransition>
      <div className="page-container">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">My Orders</h1>
          <p className="text-gray-500 dark:text-gray-400">Track and manage your orders</p>
        </div>

        {orders.length === 0 ? (
          <EmptyState
            icon={HiOutlineShoppingBag}
            title="No orders yet"
            description="Your order history will appear here once you make a purchase."
            action={<Link to="/products" className="btn-primary text-sm">Start Shopping</Link>}
          />
        ) : (
          <StaggerContainer className="space-y-4">
            {orders.map((order) => (
              <StaggerItem key={order._id}>
                <Link
                  to={`/orders/${order._id}`}
                  className="glass-card p-5 flex flex-col sm:flex-row sm:items-center gap-4 card-hover block"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <HiOutlineShoppingBag className="w-6 h-6 text-primary-500" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold text-sm">
                        Order #{order._id.slice(-8).toUpperCase()}
                      </h3>
                      <span className={STATUS_STYLES[order.status]}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {order.items.length} item{order.items.length > 1 ? 's' : ''} •{' '}
                      {order.items.map(i => i.productName).join(', ')}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                      <HiOutlineCalendar className="w-3 h-3" />
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-4">
                    <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                      ${order.totalAmount.toFixed(2)}
                    </span>
                    <HiOutlineEye className="w-5 h-5 text-gray-400" />
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}

        {pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="btn-secondary text-sm !py-2 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm font-medium">
              Page {page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
              disabled={page >= pagination.pages}
              className="btn-secondary text-sm !py-2 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
