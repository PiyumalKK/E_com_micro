import { Link } from 'react-router-dom';
import { HiOutlineHeart } from 'react-icons/hi';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">SE</span>
              </div>
              <span className="font-display font-bold text-xl">
                Shop<span className="gradient-text">Ease</span>
              </span>
            </Link>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md leading-relaxed">
              Your go-to destination for quality products at great prices.
              Shop electronics, clothing, books and more with free shipping on orders over $50.
            </p>
            <div className="mt-4 flex gap-3">
              <span className="badge-primary">Free Shipping</span>
              <span className="badge-primary">Secure</span>
              <span className="badge-primary">Fast Delivery</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-2">
              {[
                { to: '/products', label: 'Products' },
                { to: '/orders', label: 'Orders' },
                { to: '/notifications', label: 'Notifications' },
                { to: '/profile', label: 'Profile' }
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary-500 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-wider">Categories</h3>
            <ul className="space-y-2">
              {['Electronics', 'Clothing', 'Books', 'Food', 'Sports'].map(cat => (
                <li key={cat}>
                  <Link
                    to={`/products?category=${cat.toLowerCase()}`}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary-500 transition-colors"
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="py-6 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-400 dark:text-gray-500">
            &copy; 2026 ShopEase. All rights reserved.
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 flex items-center gap-1">
            Made with <HiOutlineHeart className="w-4 h-4 text-red-400" /> for great shopping
          </p>
        </div>
      </div>
    </footer>
  );
}
