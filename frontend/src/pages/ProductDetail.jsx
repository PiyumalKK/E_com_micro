import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { productAPI } from '../api/axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { PageTransition } from '../components/ui/Motion';
import Loader from '../components/ui/Loader';
import {
  HiOutlineShoppingCart, HiOutlineArrowLeft, HiOutlineMinus,
  HiOutlinePlus, HiOutlineTag, HiOutlineCube, HiOutlineCheckCircle
} from 'react-icons/hi';

const CATEGORY_ICONS = {
  electronics: '💻', clothing: '👕', books: '📚',
  food: '🍕', sports: '⚽', other: '🎁'
};

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProduct();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const { data } = await productAPI.getOne(id);
      setProduct(data.product);
    } catch {
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen />;
  if (!product) return null;

  const inStock = product.stock > 0;

  return (
    <PageTransition>
      <div className="page-container">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-8">
          <Link to="/products" className="text-gray-500 dark:text-gray-400 hover:text-primary-500 transition-colors flex items-center gap-1">
            <HiOutlineArrowLeft className="w-4 h-4" />
            Products
          </Link>
          <span className="text-gray-300 dark:text-gray-700">/</span>
          <span className="text-gray-900 dark:text-gray-100 font-medium truncate">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card overflow-hidden aspect-square flex items-center justify-center"
          >
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[120px] opacity-30">
                {CATEGORY_ICONS[product.category] || '📦'}
              </span>
            )}
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="badge-primary">{product.category}</span>
                {inStock ? (
                  <span className="badge-success flex items-center gap-1">
                    <HiOutlineCheckCircle className="w-3 h-3" /> In Stock
                  </span>
                ) : (
                  <span className="badge-danger">Out of Stock</span>
                )}
              </div>
              <h1 className="text-3xl lg:text-4xl font-display font-bold">{product.name}</h1>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-primary-600 dark:text-primary-400">
                ${product.price.toFixed(2)}
              </span>
            </div>

            <div className="glass-card p-5 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <HiOutlineCube className="w-5 h-5 text-gray-400" />
                <span className="text-gray-500 dark:text-gray-400">Stock Available:</span>
                <span className="font-semibold">{product.stock} units</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <HiOutlineTag className="w-5 h-5 text-gray-400" />
                <span className="text-gray-500 dark:text-gray-400">Category:</span>
                <span className="font-semibold capitalize">{product.category}</span>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{product.description}</p>
            </div>

            {/* Quantity & Add to Cart */}
            {isAuthenticated && inStock && (
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">Quantity:</span>
                  <div className="flex items-center rounded-xl border border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-l-xl"
                    >
                      <HiOutlineMinus className="w-4 h-4" />
                    </button>
                    <span className="px-6 py-2 font-semibold text-center min-w-[3rem]">{quantity}</span>
                    <button
                      onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                      className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-r-xl"
                    >
                      <HiOutlinePlus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-sm text-gray-400">
                    Total: <span className="font-bold text-gray-900 dark:text-gray-100">${(product.price * quantity).toFixed(2)}</span>
                  </span>
                </div>

                <button
                  onClick={() => addItem(product, quantity)}
                  className="btn-primary w-full !py-4 text-base"
                >
                  <HiOutlineShoppingCart className="w-5 h-5" />
                  Add to Cart
                </button>
              </div>
            )}

            {!isAuthenticated && (
              <div className="glass-card p-5 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Sign in to purchase this product</p>
                <Link to="/login" className="btn-primary text-sm">Sign In</Link>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
