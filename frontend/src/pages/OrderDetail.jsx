import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { orderAPI } from '../api/axios';
import { PageTransition } from '../components/ui/Motion';
import Loader from '../components/ui/Loader';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft, HiOutlineCalendar, HiOutlineLocationMarker,
  HiOutlineShoppingBag, HiOutlineX
} from 'react-icons/hi';

const STATUS_STYLES = {
  pending: 'badge-warning',
  confirmed: 'badge-primary',
  processing: 'badge-primary',
  shipped: 'badge-success',
  delivered: 'badge-success',
  cancelled: 'badge-danger'
};

const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const { data } = await orderAPI.getOne(id);
      setOrder(data.order);
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
      await orderAPI.cancel(id);
      toast.success('Order cancelled');
      fetchOrder();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to cancel order');
    }
  };

  if (loading) return <Loader fullScreen />;
  if (!order) return (
    <div className="page-container text-center py-20">
      <h2 className="text-xl font-bold">Order not found</h2>
      <Link to="/orders" className="btn-primary mt-4 inline-block">Back to Orders</Link>
    </div>
  );

  const currentStep = STATUS_STEPS.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <PageTransition>
      <div className="page-container max-w-4xl">
        <Link to="/orders" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-500 mb-6 transition-colors">
          <HiOutlineArrowLeft className="w-4 h-4" />
          Back to Orders
        </Link>

        {/* Header */}
        <div className="glass-card p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-display font-bold">
                Order #{order._id.slice(-8).toUpperCase()}
              </h1>
              <div className="flex items-center gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <HiOutlineCalendar className="w-4 h-4" />
                {new Date(order.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`${STATUS_STYLES[order.status]} !text-sm !px-4 !py-1.5`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
              {!isCancelled && currentStep < 3 && (
                <button onClick={handleCancel} className="btn-ghost text-red-500 hover:text-red-600 text-sm">
                  <HiOutlineX className="w-4 h-4" /> Cancel
                </button>
              )}
            </div>
          </div>

          {/* Progress Steps */}
          {!isCancelled && (
            <div className="mt-8">
              <div className="flex items-center">
                {STATUS_STEPS.map((step, i) => (
                  <div key={step} className="flex items-center flex-1 last:flex-initial">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        i <= currentStep
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                      }`}>
                        {i + 1}
                      </div>
                      <span className={`text-[10px] mt-1 capitalize ${
                        i <= currentStep ? 'text-primary-600 dark:text-primary-400 font-semibold' : 'text-gray-400'
                      }`}>
                        {step}
                      </span>
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 rounded ${
                        i < currentStep ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Items */}
          <div className="lg:col-span-2">
            <div className="glass-card p-6">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <HiOutlineShoppingBag className="w-5 h-5 text-primary-500" />
                Order Items
              </h2>
              <div className="space-y-3">
                {order.items.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50"
                  >
                    <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                      <HiOutlineShoppingBag className="w-5 h-5 text-primary-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{item.productName}</h3>
                      <p className="text-xs text-gray-400">Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
                    </div>
                    <span className="font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-6">
            {/* Total */}
            <div className="glass-card p-6">
              <h3 className="font-bold mb-4">Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Items ({order.items.length})</span>
                  <span>${order.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping</span>
                  <span className="text-emerald-500">Free</span>
                </div>
                <hr className="border-gray-200 dark:border-gray-700 !my-3" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary-600 dark:text-primary-400">${order.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            {order.shippingAddress && (
              <div className="glass-card p-6">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <HiOutlineLocationMarker className="w-4 h-4 text-primary-500" />
                  Shipping To
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {order.shippingAddress.street}<br />
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}<br />
                  {order.shippingAddress.country}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
