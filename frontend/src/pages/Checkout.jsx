import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { orderAPI } from '../api/axios';
import { useCart } from '../context/CartContext';
import { PageTransition } from '../components/ui/Motion';
import toast from 'react-hot-toast';
import {
  HiOutlineShoppingBag, HiOutlineLocationMarker,
  HiOutlineCreditCard, HiOutlineArrowLeft, HiOutlineCheck
} from 'react-icons/hi';

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });

  if (items.length === 0) {
    return (
      <PageTransition>
        <div className="page-container text-center py-20">
          <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-6">
            <HiOutlineShoppingBag className="w-10 h-10 text-gray-300" />
          </div>
          <h2 className="text-xl font-bold mb-2">Cart is Empty</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Add some products before checking out.</p>
          <Link to="/products" className="btn-primary">Browse Products</Link>
        </div>
      </PageTransition>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const orderData = {
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
        shippingAddress: address
      };
      const { data } = await orderAPI.create(orderData);
      clearCart();
      toast.success('Order placed successfully!');
      navigate(`/orders/${data.order._id}`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="page-container">
        <Link to="/products" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-500 mb-6 transition-colors">
          <HiOutlineArrowLeft className="w-4 h-4" />
          Continue Shopping
        </Link>

        <h1 className="text-3xl font-display font-bold mb-8">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Shipping Address */}
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card p-6">
                <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
                  <HiOutlineLocationMarker className="w-5 h-5 text-primary-500" />
                  Shipping Address
                </h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-2">Street Address</label>
                    <input
                      type="text"
                      value={address.street}
                      onChange={(e) => setAddress(prev => ({ ...prev, street: e.target.value }))}
                      placeholder="123 Main Street, Apt 4"
                      required
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">City</label>
                    <input
                      type="text"
                      value={address.city}
                      onChange={(e) => setAddress(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Colombo"
                      required
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">State / Province</label>
                    <input
                      type="text"
                      value={address.state}
                      onChange={(e) => setAddress(prev => ({ ...prev, state: e.target.value }))}
                      placeholder="Western"
                      required
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">ZIP / Postal Code</label>
                    <input
                      type="text"
                      value={address.zipCode}
                      onChange={(e) => setAddress(prev => ({ ...prev, zipCode: e.target.value }))}
                      placeholder="10100"
                      required
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Country</label>
                    <input
                      type="text"
                      value={address.country}
                      onChange={(e) => setAddress(prev => ({ ...prev, country: e.target.value }))}
                      placeholder="Sri Lanka"
                      required
                      className="input-field"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <div className="glass-card p-6 sticky top-24">
                <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
                  <HiOutlineCreditCard className="w-5 h-5 text-primary-500" />
                  Order Summary
                </h2>

                <div className="space-y-3 mb-5">
                  {items.map((item) => (
                    <div key={item.productId} className="flex justify-between items-start text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.name}</p>
                        <p className="text-gray-400 text-xs">Qty: {item.quantity}</p>
                      </div>
                      <span className="font-semibold ml-4">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <hr className="border-gray-200 dark:border-gray-700 my-4" />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-medium">${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Shipping</span>
                    <span className="text-emerald-500 font-medium">Free</span>
                  </div>
                </div>

                <hr className="border-gray-200 dark:border-gray-700 my-4" />

                <div className="flex justify-between items-center mb-6">
                  <span className="font-bold text-lg">Total</span>
                  <span className="font-bold text-2xl text-primary-600 dark:text-primary-400">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full !py-4 text-base disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <HiOutlineCheck className="w-5 h-5" />
                      Place Order
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </PageTransition>
  );
}
