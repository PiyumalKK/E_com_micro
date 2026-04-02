import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { productAPI, orderAPI, healthAPI } from '../api/axios';
import { PageTransition, FadeIn, StaggerContainer, StaggerItem } from '../components/ui/Motion';
import Loader from '../components/ui/Loader';
import toast from 'react-hot-toast';
import {
  HiOutlineCube, HiOutlineShoppingBag, HiOutlineCurrencyDollar,
  HiOutlineUsers, HiOutlinePlus, HiOutlineRefresh,
  HiOutlineStatusOnline, HiOutlineStatusOffline,
  HiOutlinePencil, HiOutlineTrash, HiOutlineChevronDown
} from 'react-icons/hi';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0 });
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [health, setHealth] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Product form state
  const [showProductForm, setShowProductForm] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '', description: '', price: '', category: 'electronics', stock: '', imageUrl: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const [productsRes, ordersRes] = await Promise.all([
        productAPI.getAll({ limit: 50 }),
        orderAPI.getAllAdmin({ limit: 50 })
      ]);

      setProducts(productsRes.data.products);
      setOrders(ordersRes.data.orders);

      const revenue = ordersRes.data.orders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + o.totalAmount, 0);

      setStats({
        products: productsRes.data.pagination.total,
        orders: ordersRes.data.pagination.total,
        revenue
      });

      // Check health
      try {
        const healthResults = await Promise.allSettled([
          healthAPI.gateway(),
          healthAPI.users(),
          healthAPI.products(),
          healthAPI.orders(),
          healthAPI.notifications()
        ]);
        const names = ['gateway', 'users', 'products', 'orders', 'notifications'];
        const h = {};
        healthResults.forEach((r, i) => {
          h[names[i]] = r.status === 'fulfilled' ? 'healthy' : 'unhealthy';
        });
        setHealth(h);
      } catch {
        // ignore health check errors
      }
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...productForm,
        price: parseFloat(productForm.price),
        stock: parseInt(productForm.stock)
      };

      if (editingId) {
        await productAPI.update(editingId, data);
        toast.success('Product updated');
      } else {
        await productAPI.create(data);
        toast.success('Product created');
      }

      setShowProductForm(false);
      setEditingId(null);
      setProductForm({ name: '', description: '', price: '', category: 'electronics', stock: '', imageUrl: '' });
      fetchDashboard();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save product');
    }
  };

  const handleEditProduct = (product) => {
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      stock: product.stock.toString(),
      imageUrl: product.imageUrl || ''
    });
    setEditingId(product._id);
    setShowProductForm(true);
    setActiveTab('products');
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await productAPI.delete(id);
      toast.success('Product deleted');
      fetchDashboard();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete');
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await orderAPI.updateStatus(orderId, status);
      toast.success(`Order status updated to ${status}`);
      fetchDashboard();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update');
    }
  };

  if (loading) return <Loader fullScreen />;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'products', label: 'Products' },
    { id: 'orders', label: 'Orders' },
    { id: 'health', label: 'Health' }
  ];

  return (
    <PageTransition>
      <div className="page-container">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">Admin Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your ShopEase platform</p>
          </div>
          <button onClick={fetchDashboard} className="btn-secondary text-sm">
            <HiOutlineRefresh className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                {
                  label: 'Total Products',
                  value: stats.products,
                  icon: HiOutlineCube,
                  color: 'from-blue-500 to-cyan-500',
                  bg: 'bg-blue-50 dark:bg-blue-900/20'
                },
                {
                  label: 'Total Orders',
                  value: stats.orders,
                  icon: HiOutlineShoppingBag,
                  color: 'from-purple-500 to-pink-500',
                  bg: 'bg-purple-50 dark:bg-purple-900/20'
                },
                {
                  label: 'Revenue',
                  value: `$${stats.revenue.toFixed(2)}`,
                  icon: HiOutlineCurrencyDollar,
                  color: 'from-emerald-500 to-teal-500',
                  bg: 'bg-emerald-50 dark:bg-emerald-900/20'
                }
              ].map((stat, i) => (
                <FadeIn key={stat.label} delay={i * 0.1}>
                  <div className="glass-card p-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                        <stat.icon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>

            {/* Recent Orders */}
            <div className="glass-card p-6">
              <h2 className="font-bold text-lg mb-4">Recent Orders</h2>
              <div className="space-y-3">
                {orders.slice(0, 5).map(order => (
                  <div key={order._id} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex-1">
                      <p className="font-medium text-sm">#{order._id.slice(-8).toUpperCase()}</p>
                      <p className="text-xs text-gray-400">{order.items.length} items • {order.userName}</p>
                    </div>
                    <span className="font-bold text-sm">${order.totalAmount.toFixed(2)}</span>
                    <span className={`badge text-[10px] ${
                      order.status === 'cancelled' ? 'badge-danger' :
                      order.status === 'delivered' ? 'badge-success' : 'badge-primary'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold text-lg">Manage Products ({stats.products})</h2>
              <button
                onClick={() => {
                  setShowProductForm(!showProductForm);
                  setEditingId(null);
                  setProductForm({ name: '', description: '', price: '', category: 'electronics', stock: '', imageUrl: '' });
                }}
                className="btn-primary text-sm"
              >
                <HiOutlinePlus className="w-4 h-4" />
                {showProductForm ? 'Cancel' : 'Add Product'}
              </button>
            </div>

            {/* Product Form */}
            {showProductForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="glass-card p-6 mb-6"
              >
                <h3 className="font-bold mb-4">{editingId ? 'Edit Product' : 'New Product'}</h3>
                <form onSubmit={handleProductSubmit} className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <input
                      value={productForm.name}
                      onChange={e => setProductForm(p => ({ ...p, name: e.target.value }))}
                      required className="input-field" placeholder="Product name"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={productForm.description}
                      onChange={e => setProductForm(p => ({ ...p, description: e.target.value }))}
                      required rows={3} className="input-field" placeholder="Product description"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Price ($)</label>
                    <input
                      type="number" step="0.01" min="0"
                      value={productForm.price}
                      onChange={e => setProductForm(p => ({ ...p, price: e.target.value }))}
                      required className="input-field" placeholder="29.99"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Stock</label>
                    <input
                      type="number" min="0"
                      value={productForm.stock}
                      onChange={e => setProductForm(p => ({ ...p, stock: e.target.value }))}
                      required className="input-field" placeholder="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <select
                      value={productForm.category}
                      onChange={e => setProductForm(p => ({ ...p, category: e.target.value }))}
                      className="input-field"
                    >
                      {['electronics', 'clothing', 'books', 'food', 'sports', 'other'].map(c => (
                        <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Product Image</label>
                    <div className="flex items-center gap-3">
                      <label className={`btn-secondary text-sm cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                        {uploading ? 'Uploading...' : 'Upload Image'}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files[0];
                            if (!file) return;
                            setUploading(true);
                            try {
                              const res = await productAPI.uploadImage(file);
                              setProductForm(p => ({ ...p, imageUrl: res.data.imageUrl }));
                              toast.success('Image uploaded');
                            } catch (err) {
                              toast.error(err.response?.data?.error || 'Upload failed');
                            } finally {
                              setUploading(false);
                              e.target.value = '';
                            }
                          }}
                        />
                      </label>
                      {productForm.imageUrl && (
                        <div className="flex items-center gap-2">
                          <img src={productForm.imageUrl} alt="Preview" className="w-10 h-10 rounded-lg object-cover" />
                          <button type="button" onClick={() => setProductForm(p => ({ ...p, imageUrl: '' }))} className="text-xs text-red-500 hover:text-red-400">Remove</button>
                        </div>
                      )}
                    </div>
                    <input
                      value={productForm.imageUrl}
                      onChange={e => setProductForm(p => ({ ...p, imageUrl: e.target.value }))}
                      className="input-field mt-2 text-xs" placeholder="Or paste URL manually"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <button type="submit" className="btn-primary">
                      {editingId ? 'Update Product' : 'Create Product'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Products List */}
            <StaggerContainer className="space-y-3">
              {products.map(product => (
                <StaggerItem key={product._id}>
                  <div className="glass-card p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 p-2">
                      <img src={{electronics: '/images/categories/electronics.png', clothing: '/images/categories/clothing.png', books: '/images/categories/books.png', food: '/images/categories/food.png', sports: '/images/categories/sports.png', other: '/images/categories/other.png'}[product.category] || '/images/categories/other.png'} alt={product.category} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{product.name}</h3>
                      <p className="text-xs text-gray-400">{product.category} • Stock: {product.stock}</p>
                    </div>
                    <span className="font-bold text-primary-600 dark:text-primary-400">${product.price.toFixed(2)}</span>
                    <div className="flex gap-1">
                      <button onClick={() => handleEditProduct(product)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-primary-500 transition-colors">
                        <HiOutlinePencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteProduct(product._id)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-red-500 transition-colors">
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            <h2 className="font-bold text-lg mb-6">Manage Orders ({stats.orders})</h2>
            <StaggerContainer className="space-y-3">
              {orders.map(order => (
                <StaggerItem key={order._id}>
                  <div className="glass-card p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Link to={`/orders/${order._id}`} className="font-semibold text-sm hover:text-primary-500 transition-colors">
                            #{order._id.slice(-8).toUpperCase()}
                          </Link>
                          <span className={`badge text-[10px] ${
                            order.status === 'cancelled' ? 'badge-danger' :
                            order.status === 'delivered' ? 'badge-success' : 'badge-primary'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {order.userName} • {order.items.length} items • {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="font-bold">${order.totalAmount.toFixed(2)}</span>
                      {order.status !== 'cancelled' && order.status !== 'delivered' && (
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                          className="input-field !w-auto !py-2 text-sm"
                        >
                          {['pending', 'confirmed', 'processing', 'shipped', 'delivered'].map(s => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        )}

        {/* Health Tab */}
        {activeTab === 'health' && (
          <div>
            <h2 className="font-bold text-lg mb-6">Service Health</h2>
            <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: 'API Gateway', key: 'gateway', port: 3000 },
                { name: 'User Service', key: 'users', port: 3001 },
                { name: 'Product Service', key: 'products', port: 3002 },
                { name: 'Order Service', key: 'orders', port: 3003 },
                { name: 'Notification Service', key: 'notifications', port: 3004 }
              ].map(svc => {
                const isHealthy = health[svc.key] === 'healthy';
                return (
                  <StaggerItem key={svc.key}>
                    <div className="glass-card p-5">
                      <div className="flex items-center gap-3">
                        {isHealthy ? (
                          <HiOutlineStatusOnline className="w-6 h-6 text-emerald-500" />
                        ) : (
                          <HiOutlineStatusOffline className="w-6 h-6 text-red-500" />
                        )}
                        <div>
                          <h3 className="font-semibold text-sm">{svc.name}</h3>
                          <p className="text-xs text-gray-400">Port {svc.port}</p>
                        </div>
                        <span className={`ml-auto text-xs font-medium ${isHealthy ? 'text-emerald-500' : 'text-red-500'}`}>
                          {isHealthy ? 'Healthy' : 'Down'}
                        </span>
                      </div>
                    </div>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
