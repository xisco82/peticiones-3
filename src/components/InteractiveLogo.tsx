import React, { useState } from 'react';
import { useLogoModal } from '../context/LogoModalContext';
import { APP_BRAND } from '../constants/branding';

interface InteractiveLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showHoverHint?: boolean;
}

export const InteractiveLogo: React.FC<InteractiveLogoProps> = ({
  size = 'md',
  className = '',
  showHoverHint = true,
}) => {
  const { openLogoModal } = useLogoModal();
  const [isHovered, setIsHovered] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8 rounded-lg p-1',
    md: 'w-11 h-11 rounded-xl p-1',
    lg: 'w-16 h-16 rounded-2xl p-1.5',
    xl: 'w-20 h-20 rounded-2xl p-2',
  }[size];

  return (
    <button
      type="button"
      onClick={openLogoModal}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title="¡Haz clic para abrir y rodar el logotipo!"
      className={`group relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-center flex-shrink-0 cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 ${sizeClasses} ${className}`}
      aria-label="Abrir animación del logo de Hotel HM Gran Fiesta"
    >
      <img
        src={APP_BRAND.logoUrl}
        alt={APP_BRAND.name}
        className={`w-full h-full object-contain transition-transform duration-500 select-none ${
          isHovered ? 'rotate-12 scale-110' : 'rotate-0'
        }`}
        onError={e => {
          (e.currentTarget as HTMLImageElement).src = APP_BRAND.localLogoUrl;
        }}
      />

      {/* Tiny roll icon hint */}
      {showHoverHint && (
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center shadow-xs opacity-0 group-hover:opacity-100 transition-opacity">
          🔄
        </span>
      )}
    </button>
  );
};
