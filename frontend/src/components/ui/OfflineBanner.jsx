import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' && !navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-3 bg-secondary px-4 py-2 text-xs uppercase tracking-widest text-primary shadow-lg"
          role="status"
          aria-live="polite"
        >
          <WifiOff size={16} className="animate-pulse" />
          <span>Mất kết nối Internet — Đang hiển thị bản lưu trữ đệm ngoại tuyến.</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
