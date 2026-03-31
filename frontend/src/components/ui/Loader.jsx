import { motion } from 'framer-motion';
import clsx from 'clsx';

export default function Loader({ size = 'md', className, fullScreen = false }) {
  const sizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };

  const spinner = (
    <motion.div
      className={clsx(
        'rounded-full border-primary-200 dark:border-gray-700 border-t-primary-500',
        sizes[size],
        className
      )}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
  );

  if (fullScreen) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          {spinner}
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  return spinner;
}
