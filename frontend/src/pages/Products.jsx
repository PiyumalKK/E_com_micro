import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { productAPI } from '../api/axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { PageTransition, StaggerContainer, StaggerItem } from '../components/ui/Motion';
import Loader from '../components/ui/Loader';
import EmptyState from '../components/ui/EmptyState';
import {
  HiOutlineSearch, HiOutlineShoppingCart, HiOutlineEye,
  HiOutlineFilter, HiOutlineShoppingBag
} from 'react-icons/hi';

const CATEGORIES = ['all', 'electronics', 'clothing', 'books', 'food', 'sports', 'other'];
const CATEGORY_IMAGES = {
  all: null, electronics: '/images/categories/electronics.png', clothing: '/images/categories/clothing.png', books: '/images/categories/books.png',
  food: '/images/categories/food.png', sports: '/images/categories/sports.png', other: '/images/categories/other.png'
};

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'all');
  const [page, setPage] = useState(1);
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    fetchProducts();
  }, [category, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProducts = async (searchTerm) => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (category !== 'all') params.category = category;
      if (searchTerm || search) params.search = searchTerm ?? search;

      const { data } = await productAPI.getAll(params);
      setProducts(data.products);
      setPagination(data.pagination);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts(search);
    const params = {};
    if (search) params.search = search;
    if (category !== 'all') params.category = category;
    setSearchParams(params);
  };

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    setPage(1);
    const params = {};
    if (cat !== 'all') params.category = cat;
    if (search) params.search = search;
    setSearchParams(params);
  };

  return (
    <PageTransition>
      <div className="page-container">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">Products</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Discover our curated collection of products
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="input-field !pl-12 !pr-24"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary !py-1.5 !px-4 text-sm"
            >
              Search
            </button>
          </form>
        </div>

        {/* Categories */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-thin">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                category === cat
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {CATEGORY_IMAGES[cat] ? <img src={CATEGORY_IMAGES[cat]} alt={cat} className="w-5 h-5 object-contain" /> : <HiOutlineShoppingBag className="w-5 h-5" />}
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {/* Results */}
        {loading ? (
          <Loader fullScreen />
        ) : products.length === 0 ? (
          <EmptyState
            icon={HiOutlineShoppingBag}
            title="No products found"
            description="Try adjusting your search or filter to find what you're looking for."
            action={
              <button onClick={() => { setSearch(''); setCategory('all'); setPage(1); fetchProducts(''); }}
                className="btn-primary text-sm">
                Clear Filters
              </button>
            }
          />
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing {products.length} of {pagination.total} products
              </p>
            </div>

            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <StaggerItem key={product._id}>
                  <ProductCard product={product} onAddToCart={addItem} isAuthenticated={isAuthenticated} />
                </StaggerItem>
              ))}
            </StaggerContainer>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="btn-secondary text-sm !py-2 disabled:opacity-40"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                      page === p
                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                        : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={page >= pagination.pages}
                  className="btn-secondary text-sm !py-2 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </PageTransition>
  );
}

function ProductCard({ product, onAddToCart, isAuthenticated }) {
  const inStock = product.stock > 0;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="glass-card overflow-hidden group"
    >
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-20 h-20 opacity-40">
            <img src={CATEGORY_IMAGES[product.category] || '/images/categories/other.png'} alt={product.category} className="w-full h-full object-contain" />
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
          <Link
            to={`/products/${product._id}`}
            className="btn-primary text-xs !py-2 !px-4 w-full justify-center"
          >
            <HiOutlineEye className="w-4 h-4" /> View Details
          </Link>
        </div>

        {/* Stock Badge */}
        {!inStock && (
          <div className="absolute top-3 right-3 badge-danger">Out of Stock</div>
        )}
        {inStock && product.stock <= 5 && (
          <div className="absolute top-3 right-3 badge-warning">Only {product.stock} left</div>
        )}

        {/* Category Badge */}
        <div className="absolute top-3 left-3 badge-primary">
          {product.category}
        </div>
      </div>

      {/* Info */}
      <div className="p-5">
        <Link to={`/products/${product._id}`}>
          <h3 className="font-semibold truncate hover:text-primary-500 transition-colors">{product.name}</h3>
        </Link>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 h-10">{product.description}</p>

        <div className="flex items-center justify-between mt-4">
          <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
            ${product.price.toFixed(2)}
          </span>
          {isAuthenticated && inStock && (
            <button
              onClick={() => onAddToCart(product)}
              className="p-2.5 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
              title="Add to cart"
            >
              <HiOutlineShoppingCart className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
