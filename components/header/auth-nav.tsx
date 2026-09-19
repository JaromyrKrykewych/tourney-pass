'use client';

import { AuthModal } from '@/components/auth';
import { createClient } from '@/lib/supabase/client';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { ChevronDown, LogOut, PlusCircle, Trophy } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface AuthNavProps {
  initialUser: User | null;
}

export function AuthNav({ initialUser }: AuthNavProps) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'login' | 'signup'>('login');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const router = useRouter();
  const supabase = createClient();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Keep user in sync with server-rendered prop
  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  // Listen to explicit auth state changes (sign in / sign out)
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      // Ignore initial session event to prevent infinite refresh loop with server components
      if (event === 'INITIAL_SESSION') return;

      setUser(session?.user ?? null);

      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        router.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleOpenLogin = () => {
    setModalMode('login');
    setModalOpen(true);
  };

  const handleOpenSignup = () => {
    setModalMode('signup');
    setModalOpen(true);
  };

  const handleSignOut = async () => {
    setDropdownOpen(false);
    await supabase.auth.signOut();
    setUser(null);
    router.refresh();
  };

  // User display name & initial
  const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name || '';
  const email = user?.email || '';
  const displayName = fullName || email.split('@')[0] || 'Jugador';
  const initial = (fullName || email || 'J').charAt(0).toUpperCase();

  return (
    <>
      <div className="flex items-center gap-2.5 sm:gap-3">
        {user ? (
          /* Authenticated User Menu */
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-2 rounded-xl bg-field-surface hover:bg-field-card border border-field-border transition-all cursor-pointer group"
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
            >
              {/* User Avatar */}
              <div className="w-8 h-8 rounded-lg bg-pitch-dark/60 text-pitch-hover font-bold font-heading text-sm flex items-center justify-center border border-pitch/30 shadow-inner group-hover:border-pitch-hover transition-colors">
                {initial}
              </div>

              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-ball-white leading-tight max-w-30 truncate">
                  {displayName}
                </span>
                <span className="text-[10px] text-text-secondary leading-tight truncate max-w-30">
                  {email}
                </span>
              </div>

              <ChevronDown
                className={`w-4 h-4 text-text-secondary transition-transform duration-200 ${dropdownOpen ? 'rotate-180 text-pitch' : ''
                  }`}
              />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-field-surface border border-field-border shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* Mobile User Header */}
                <div className="sm:hidden px-3 py-2 border-b border-field-border/60 mb-1">
                  <p className="text-xs font-bold text-ball-white truncate">{displayName}</p>
                  <p className="text-[10px] text-text-secondary truncate">{email}</p>
                </div>

                <div className="space-y-0.5">
                  <Link
                    href="/tournaments"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-ball-white rounded-xl hover:bg-field-card hover:text-pitch-hover transition-colors"
                  >
                    <Trophy className="w-4 h-4 text-pitch" />
                    <span>Mis Torneos</span>
                  </Link>

                  <Link
                    href="/tournaments/new"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-ball-white rounded-xl hover:bg-field-card hover:text-pitch-hover transition-colors"
                  >
                    <PlusCircle className="w-4 h-4 text-pitch-hover" />
                    <span>Crear Nuevo Torneo</span>
                  </Link>
                </div>

                <div className="border-t border-field-border/60 my-1"></div>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-400 hover:text-red-300 rounded-xl hover:bg-red-950/30 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-red-400" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Unauthenticated buttons */
          <>
            <button
              type="button"
              onClick={handleOpenLogin}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-text-secondary hover:text-ball-white transition-colors cursor-pointer font-heading tracking-wide"
            >
              Iniciar Sesión
            </button>

            <button
              type="button"
              onClick={handleOpenSignup}
              className="px-3.5 sm:px-5 py-2 rounded-xl bg-pitch hover:bg-pitch-hover text-field-bg font-extrabold text-xs sm:text-sm transition-all shadow-[0_0_15px_-3px_rgba(34,197,94,0.4)] hover:shadow-[0_0_20px_-2px_rgba(74,222,128,0.5)] cursor-pointer font-heading tracking-wide uppercase"
            >
              Crear Cuenta
            </button>
          </>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialMode={modalMode}
      />
    </>
  );
}
