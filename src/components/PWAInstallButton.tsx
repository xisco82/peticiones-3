import React from 'react';
import { Download, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();

  if (isInstalled) {
    return (
      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
        <span>Instalada</span>
      </div>
    );
  }

  if (!isInstallable) return null;

  return (
    <button
      onClick={promptInstall}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition shadow-2xs active:scale-95"
      title="Instalar aplicación en pantalla de inicio"
    >
      <Download className="w-3.5 h-3.5" />
      <span>Instalar App</span>
    </button>
  );
};
