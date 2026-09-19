'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Mail, Lock, User, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AuthFormProps {
  initialMode?: 'login' | 'signup';
  onSuccess?: () => void;
  onModeChange?: (mode: 'login' | 'signup') => void;
}

export function AuthForm({ initialMode = 'login', onSuccess, onModeChange }: AuthFormProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  const handleSwitchMode = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    setErrorMsg(null);
    setSuccessMsg(null);
    onModeChange?.(newMode);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (mode === 'signup') {
        if (!fullName.trim()) {
          setErrorMsg('Por favor ingresa tu nombre completo.');
          setLoading(false);
          return;
        }

        if (password.length < 6) {
          setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
            emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
          },
        });

        if (error) {
          setErrorMsg(error.message);
          return;
        }

        // If user is immediately confirmed or requires email verification
        if (data.session) {
          setSuccessMsg('¡Registro exitoso! Iniciando sesión...');
          setTimeout(() => {
            onSuccess?.();
          }, 800);
        } else {
          setSuccessMsg('¡Cuenta creada! Revisa tu correo electrónico para confirmar tu registro.');
        }
      } else {
        // Login mode
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.toLowerCase().includes('invalid login credentials')) {
            setErrorMsg('Correo o contraseña incorrectos.');
          } else {
            setErrorMsg(error.message);
          }
          return;
        }

        setSuccessMsg('¡Bienvenido de vuelta!');
        setTimeout(() => {
          onSuccess?.();
        }, 500);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Mode switcher tabs */}
      <div className="flex bg-field-bg/80 p-1 rounded-xl border border-field-border mb-6">
        <button
          type="button"
          onClick={() => handleSwitchMode('login')}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
            mode === 'login'
              ? 'bg-field-card text-ball-white shadow-sm border border-field-border font-heading tracking-wide'
              : 'text-text-secondary hover:text-ball-white font-heading tracking-wide'
          }`}
        >
          Iniciar Sesión
        </button>
        <button
          type="button"
          onClick={() => handleSwitchMode('signup')}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
            mode === 'signup'
              ? 'bg-field-card text-ball-white shadow-sm border border-field-border font-heading tracking-wide'
              : 'text-text-secondary hover:text-ball-white font-heading tracking-wide'
          }`}
        >
          Crear Cuenta
        </button>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 flex items-start gap-3 text-red-200 text-sm">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-5 p-3.5 rounded-xl bg-pitch-dark/30 border border-pitch-hover/30 flex items-start gap-3 text-pitch-hover text-sm">
          <CheckCircle2 className="w-5 h-5 text-pitch shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleEmailAuth} className="space-y-4">
        {mode === 'signup' && (
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">
              Nombre Completo
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/60" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej. Martín Palermo"
                className="w-full bg-field-bg border border-field-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-ball-white placeholder:text-text-secondary/40 focus:outline-none focus:border-pitch focus:ring-1 focus:ring-pitch transition-colors"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">
            Correo Electrónico
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/60" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full bg-field-bg border border-field-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-ball-white placeholder:text-text-secondary/40 focus:outline-none focus:border-pitch focus:ring-1 focus:ring-pitch transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">
            Contraseña
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/60" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-field-bg border border-field-border rounded-xl pl-10 pr-11 py-2.5 text-sm text-ball-white placeholder:text-text-secondary/40 focus:outline-none focus:border-pitch focus:ring-1 focus:ring-pitch transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary/60 hover:text-ball-white transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {mode === 'signup' && (
            <p className="text-[11px] text-text-secondary/60 mt-1">
              Mínimo 6 caracteres.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3 px-4 rounded-xl bg-pitch hover:bg-pitch-hover text-field-bg font-extrabold text-sm tracking-wide transition-all shadow-[0_0_20px_-3px_rgba(34,197,94,0.4)] hover:shadow-[0_0_25px_-2px_rgba(74,222,128,0.5)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer uppercase font-heading"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-field-bg" />
              <span>Procesando...</span>
            </>
          ) : mode === 'login' ? (
            'Entrar a la Cancha'
          ) : (
            'Registrarse en TourneyPass'
          )}
        </button>
      </form>

      {/* Mode bottom toggler */}
      <div className="mt-6 text-center text-xs text-text-secondary">
        {mode === 'login' ? (
          <p>
            ¿Aún no tienes cuenta?{' '}
            <button
              type="button"
              onClick={() => handleSwitchMode('signup')}
              className="text-pitch-hover font-semibold hover:underline cursor-pointer"
            >
              Crea tu cuenta aquí
            </button>
          </p>
        ) : (
          <p>
            ¿Ya tienes cuenta?{' '}
            <button
              type="button"
              onClick={() => handleSwitchMode('login')}
              className="text-pitch-hover font-semibold hover:underline cursor-pointer"
            >
              Inicia sesión aquí
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
