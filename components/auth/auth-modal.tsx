'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import Image from 'next/image';
import { AuthForm } from './auth-form';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [currentMode, setCurrentMode] = useState<'login' | 'signup'>(initialMode);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync mode when initialMode changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentMode(initialMode);
    }
  }, [isOpen, initialMode]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md transition-opacity"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="min-h-full flex items-center justify-center p-4 sm:p-6 text-center">
        <div
          className="relative w-full max-w-md stadium-card bg-field-surface border border-field-border p-6 sm:p-8 shadow-2xl rounded-2xl glow-pitch-sm text-left my-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-xl text-text-secondary hover:text-ball-white hover:bg-field-card border border-transparent hover:border-field-border transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-pitch-hover mb-3 shadow-[0_0_15px_-3px_rgba(34,197,94,0.3)]">
              <Image
                src="/logo.png"
                alt="TourneyPass"
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
            <h2 className="text-2xl font-black font-brand uppercase tracking-wider text-ball-white">
              {currentMode === 'login' ? 'Iniciar Sesión' : 'Crea tu Cuenta'}
            </h2>
            <p className="text-xs text-text-secondary mt-1">
              {currentMode === 'login'
                ? 'Accede para gestionar y seguir tus torneos'
                : 'Únete para organizar tus torneos entre amigos'}
            </p>
          </div>

          {/* Auth Form */}
          <AuthForm
            initialMode={currentMode}
            onSuccess={onClose}
            onModeChange={setCurrentMode}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
