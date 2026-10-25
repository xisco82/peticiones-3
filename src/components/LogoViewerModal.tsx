import React, { useState, useEffect, useRef } from 'react';
import { X, RotateCw, Play, Pause, RotateCcw, Sparkles, ExternalLink, ShieldCheck } from 'lucide-react';
import { APP_BRAND } from '../constants/branding';

interface LogoViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogoViewerModal: React.FC<LogoViewerModalProps> = ({ isOpen, onClose }) => {
  const [rotation, setRotation] = useState(0);
  const [isContinuous, setIsContinuous] = useState(false);
  const [spinCount, setSpinCount] = useState(0);
  const [isEntering, setIsEntering] = useState(false);
  const [speed, setSpeed] = useState<number>(0.8); // animation duration in seconds
  const continuousIntervalRef = useRef<any>(null);

  // Playful subtle sound synthesis with Web Audio API (safe, optional, gentle)
  const playWhooshSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(520, ctx.currentTime + 0.15);
      osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.36);
    } catch {
      // AudioContext may be restricted by browser until user gesture; harmless
    }
  };

  // On open, reset and trigger initial dramatic roll animation
  useEffect(() => {
    if (isOpen) {
      setIsEntering(true);
      setRotation(-720);
      setIsContinuous(false);
      setSpinCount(0);

      // Trigger entrance roll into view
      const timer = setTimeout(() => {
        setRotation(0);
        setIsEntering(false);
        playWhooshSound();
      }, 50);

      return () => clearTimeout(timer);
    } else {
      setIsContinuous(false);
    }
  }, [isOpen]);

  // Handle continuous spinning
  useEffect(() => {
    if (isContinuous) {
      continuousIntervalRef.current = setInterval(() => {
        setRotation(prev => prev + 360);
        setSpinCount(prev => prev + 1);
      }, 700);
    } else {
      if (continuousIntervalRef.current) {
        clearInterval(continuousIntervalRef.current);
        continuousIntervalRef.current = null;
      }
    }
    return () => {
      if (continuousIntervalRef.current) {
        clearInterval(continuousIntervalRef.current);
      }
    };
  }, [isContinuous]);

  // Keyboard shortcut: ESC closes
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleRoll(360);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleRoll = (degrees: number = 360) => {
    setSpeed(0.85);
    setRotation(prev => prev + degrees);
    setSpinCount(prev => prev + Math.round(Math.abs(degrees) / 360));
    playWhooshSound();
  };

  const handleFastSpin = () => {
    setSpeed(1.2);
    setRotation(prev => prev + 1080); // 3 full spins
    setSpinCount(prev => prev + 3);
    playWhooshSound();
  };

  const handleReset = () => {
    setIsContinuous(false);
    setSpeed(0.5);
    setRotation(0);
    setSpinCount(0);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="logo-modal-title"
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 text-center overflow-hidden flex flex-col items-center"
        onClick={e => e.stopPropagation()}
      >
        {/* Decorative backdrop glow */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-amber-500/10 dark:bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition z-10"
          aria-label="Cerrar ventana"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Title */}
        <div className="mb-4 space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Logotipo Oficial Interactivo</span>
          </div>
          <h2 id="logo-modal-title" className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {APP_BRAND.name}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            ¡Haz clic sobre el logo para hacerlo rodar a toda velocidad!
          </p>
        </div>

        {/* Logo Stage / Rolling Arena */}
        <div className="relative my-4 flex flex-col items-center justify-center">
          {/* Subtle rolling platform shadow */}
          <div className="w-44 h-8 rounded-full bg-slate-900/10 dark:bg-black/40 blur-md absolute -bottom-3" />

          {/* Rolling Logo Button */}
          <button
            type="button"
            onClick={() => handleRoll(360)}
            title="¡Haz clic para rodar!"
            className="group relative cursor-pointer outline-none focus:ring-4 focus:ring-indigo-500/40 rounded-full transition-transform active:scale-95"
          >
            <div
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: isContinuous
                  ? `transform ${speed}s linear`
                  : `transform ${speed}s cubic-bezier(0.25, 1.4, 0.5, 1)`,
              }}
              className="w-44 h-44 sm:w-52 sm:h-52 rounded-3xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 p-4 shadow-xl shadow-indigo-500/10 flex items-center justify-center select-none overflow-hidden"
            >
              <img
                src={APP_BRAND.logoUrl}
                alt={APP_BRAND.name}
                className="w-full h-full object-contain pointer-events-none drop-shadow-md"
                onError={e => {
                  (e.currentTarget as HTMLImageElement).src = APP_BRAND.localLogoUrl;
                }}
              />
            </div>

            {/* Click to roll hover badge */}
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md opacity-80 group-hover:opacity-100 group-hover:scale-105 transition">
              🔄 ¡Tócame para rodar!
            </span>
          </button>
        </div>

        {/* Spin Counter */}
        <div className="mt-2 mb-4 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2">
          <span>Vueltas completadas:</span>
          <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-mono text-sm">
            {spinCount}
          </span>
          <span className="text-[11px] text-slate-400 font-normal">({rotation}°)</span>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          <button
            onClick={() => handleRoll(360)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white shadow-md shadow-indigo-600/20 transition"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Rodar (+360°)</span>
          </button>

          <button
            onClick={handleFastSpin}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 active:scale-95 text-white shadow-md shadow-amber-500/20 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Súper Giro (+1080°)</span>
          </button>

          <button
            onClick={() => setIsContinuous(!isContinuous)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition active:scale-95 ${
              isContinuous
                ? 'bg-rose-500 hover:bg-rose-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
            }`}
          >
            {isContinuous ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isContinuous ? 'Pausar Giro' : 'Giro Continuo'}</span>
          </button>

          <button
            onClick={handleReset}
            className="p-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Restablecer posición inicial"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Copyright & Creator Information */}
        <div className="w-full pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
            <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>{APP_BRAND.copyrightText}</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            {APP_BRAND.name} • {APP_BRAND.subtitle}
          </p>
          <div className="pt-2">
            <a
              href={APP_BRAND.logoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <span>Ver imagen original en alta resolución</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
