import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { HiOutlineX, HiOutlinePlus, HiOutlineMinus, HiOutlineTrash, HiOutlineShoppingBag } from 'react-icons/hi';

export default function CartDrawer() {
  const { items, totalItems, totalPrice, isOpen, toggleCart, removeItem, updateQuantity, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    toggleCart();
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      navigate('/checkout');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleCart}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl z-[70] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <HiOutlineShoppingBag className="w-6 h-6 text-primary-500" />
                <h2 className="text-lg font-bold">Shopping Cart</h2>
                {totalItems > 0 && (
                  <span className="badge-primary">{totalItems}</span>
                )}
              </div>
              <button
                onClick={toggleCart}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                    <HiOutlineShoppingBag className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">Your cart is empty</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Add products to get started</p>
                </div>
              ) : (
                items.map((item) => (
                  <motion.div
                    key={item.productId}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50"
                  >
                    {/* Image placeholder */}
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/30 dark:to-accent-900/30 flex items-center justify-center flex-shrink-0">
                      <HiOutlineShoppingBag className="w-6 h-6 text-primary-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{item.name}</h3>
                      <p className="text-primary-600 dark:text-primary-400 font-bold text-sm mt-1">
                        ${item.price.toFixed(2)}
                      </p>

                      {/* Quantity controls */}
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors rounded-l-lg"
                          >
                            <HiOutlineMinus className="w-3 h-3" />
                          </button>
                          <span className="px-3 text-sm font-medium min-w-[2rem] text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            disabled={item.quantity >= item.stock}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors rounded-r-lg"
                          >
                            <HiOutlinePlus className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-sm">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-6 border-t border-gray-200 dark:border-gray-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                  <span className="text-xl font-bold">${totalPrice.toFixed(2)}</span>
                </div>

                <button onClick={handleCheckout} className="btn-primary w-full">
                  Proceed to Checkout
                </button>

                <button onClick={clearCart} className="btn-ghost w-full text-sm text-red-500 hover:text-red-600">
                  Clear Cart
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
