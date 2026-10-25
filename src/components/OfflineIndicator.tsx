import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline && !showReconnected) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
      {isOffline ? (
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 text-white text-xs font-semibold shadow-lg">
          <WifiOff className="w-4 h-4 animate-pulse" />
          <span>Modo sin conexión activo (PWA)</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-lg">
          <Wifi className="w-4 h-4" />
          <span>Conexión restablecida</span>
        </div>
      )}
    </div>
  );
};
