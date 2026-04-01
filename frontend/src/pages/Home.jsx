import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { FadeIn } from '../components/ui/Motion';
import {
  HiOutlineShoppingBag, HiOutlineLightningBolt, HiOutlineShieldCheck,
  HiOutlineTruck, HiOutlineCreditCard, HiOutlineStar, HiOutlineGift
} from 'react-icons/hi';

const perks = [
  {
    icon: HiOutlineTruck,
    title: 'Free Shipping',
    desc: 'Free delivery on all orders over $50. No hidden fees.'
  },
  {
    icon: HiOutlineShieldCheck,
    title: 'Secure Checkout',
    desc: 'Your payment info is always protected with encryption.'
  },
  {
    icon: HiOutlineLightningBolt,
    title: 'Fast Delivery',
    desc: 'Get your orders delivered within 2-5 business days.'
  },
  {
    icon: HiOutlineCreditCard,
    title: 'Easy Payments',
    desc: 'Multiple payment options for a seamless experience.'
  },
  {
    icon: HiOutlineStar,
    title: 'Top Quality',
    desc: 'Curated products from trusted brands you love.'
  },
  {
    icon: HiOutlineGift,
    title: '24/7 Support',
    desc: 'Our support team is always here to help you out.'
  }
];

const categories = [
  { name: 'Electronics', emoji: '💻', color: 'from-blue-500 to-cyan-500' },
  { name: 'Clothing', emoji: '👕', color: 'from-pink-500 to-rose-500' },
  { name: 'Books', emoji: '📚', color: 'from-amber-500 to-orange-500' },
  { name: 'Food', emoji: '🍕', color: 'from-green-500 to-emerald-500' },
  { name: 'Sports', emoji: '⚽', color: 'from-purple-500 to-violet-500' },
  { name: 'Other', emoji: '🎁', color: 'from-gray-500 to-slate-500' }
];

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="mesh-bg">
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        {/* Floating orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-500/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <FadeIn>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium mb-6">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  New arrivals every week
                </div>
              </FadeIn>

              <FadeIn delay={0.1}>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-extrabold leading-[1.1] mb-6">
                  Shop
                  <span className="gradient-text">Ease</span>
                  <br />
                  <span className="text-3xl sm:text-4xl lg:text-5xl text-gray-500 dark:text-gray-400 font-bold">
                    Your Favourite Store v1
                  </span>
                </h1>
              </FadeIn>

              <FadeIn delay={0.2}>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-lg leading-relaxed mb-8">
                  Discover thousands of products at unbeatable prices. From electronics to fashion,
                  we&apos;ve got everything you need — delivered right to your door.
                </p>
              </FadeIn>

              <FadeIn delay={0.3}>
                <div className="flex flex-wrap gap-4">
                  <Link to="/products" className="btn-primary text-base !py-3.5 !px-8">
                    <HiOutlineShoppingBag className="w-5 h-5" />
                    Browse Products
                  </Link>
                  {!isAuthenticated && (
                    <Link to="/register" className="btn-secondary text-base !py-3.5 !px-8">
                      Create Account
                    </Link>
                  )}
                </div>
              </FadeIn>

              <FadeIn delay={0.4}>
                <div className="flex items-center gap-6 mt-10">
                  <div className="text-center">
                    <p className="text-2xl font-bold gradient-text">10K+</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Products</p>
                  </div>
                  <div className="w-px h-10 bg-gray-200 dark:bg-gray-800" />
                  <div className="text-center">
                    <p className="text-2xl font-bold gradient-text">50K+</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Happy Customers</p>
                  </div>
                  <div className="w-px h-10 bg-gray-200 dark:bg-gray-800" />
                  <div className="text-center">
                    <p className="text-2xl font-bold gradient-text">Free</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Shipping over $50</p>
                  </div>
                </div>
              </FadeIn>
            </div>

            {/* Hero Visual - Trending Products */}
            <FadeIn delay={0.3}>
              <div className="hidden lg:block relative">
                <div className="glass-card p-8 space-y-4">
                  <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
                    <HiOutlineStar className="w-5 h-5 text-amber-500" />
                    Trending Now
                  </h3>
                  {[
                    { name: 'Wireless Headphones', price: '$79.99', tag: 'Best Seller', emoji: '🎧', color: 'bg-blue-500' },
                    { name: 'Running Shoes', price: '$129.99', tag: 'New', emoji: '👟', color: 'bg-emerald-500' },
                    { name: 'Smart Watch Pro', price: '$249.99', tag: 'Popular', emoji: '⌚', color: 'bg-purple-500' },
                    { name: 'Organic Coffee Beans', price: '$24.99', tag: 'Top Rated', emoji: '☕', color: 'bg-orange-500' },
                    { name: 'Yoga Mat Premium', price: '$49.99', tag: 'Trending', emoji: '🧘', color: 'bg-pink-500' }
                  ].map((item, i) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    >
                      <span className="text-2xl">{item.emoji}</span>
                      <span className="font-medium text-sm flex-1">{item.name}</span>
                      <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{item.price}</span>
                      <span className="badge-primary text-[10px]">{item.tag}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Glow effect */}
                <div className="absolute -inset-4 bg-gradient-to-r from-primary-500/10 to-accent-500/10 rounded-3xl blur-2xl -z-10" />
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-display font-bold mb-3">Shop by Category</h2>
              <p className="text-gray-500 dark:text-gray-400">Browse our wide range of product categories</p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat, i) => (
              <FadeIn key={cat.name} delay={i * 0.05}>
                <Link
                  to={`/products?category=${cat.name.toLowerCase()}`}
                  className="glass-card p-6 text-center card-hover group cursor-pointer"
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center mx-auto mb-3 text-2xl group-hover:scale-110 transition-transform shadow-lg`}>
                    {cat.emoji}
                  </div>
                  <p className="font-semibold text-sm">{cat.name}</p>
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Perks */}
      <section className="py-20 bg-white/50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl font-display font-bold mb-3">Why Shop With Us</h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                We go the extra mile to make your shopping experience seamless
              </p>
            </div>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {perks.map((perk, i) => (
              <FadeIn key={perk.title} delay={i * 0.08}>
                <div className="glass-card p-6 card-hover group">
                  <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4 group-hover:bg-primary-200 dark:group-hover:bg-primary-900/50 transition-colors">
                    <perk.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{perk.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{perk.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {!isAuthenticated && (
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <FadeIn>
              <div className="glass-card p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-accent-500/5" />
                <div className="relative z-10">
                  <h2 className="text-3xl font-display font-bold mb-4">Ready to Start Shopping?</h2>
                  <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto mb-8">
                    Create a free account to unlock exclusive deals, track your orders, and enjoy a personalised experience.
                  </p>
                  <div className="flex justify-center gap-4">
                    <Link to="/register" className="btn-primary text-base !py-3.5 !px-8">
                      Create Account
                    </Link>
                    <Link to="/login" className="btn-secondary text-base !py-3.5 !px-8">
                      Sign In
                    </Link>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>
      )}
    </div>
  );
}
