import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { AuthForm } from '@/components/auth';

export const metadata: Metadata = {
  title: 'Iniciar Sesión | TourneyPass',
  description: 'Ingresa a tu cuenta de TourneyPass para gestionar tus torneos de FIFA y EA FC.',
};

interface LoginPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const resolvedParams = await searchParams;
  const redirectTarget = typeof resolvedParams.next === 'string' ? resolvedParams.next : '/';

  // If already logged in, redirect
  if (user) {
    redirect(redirectTarget);
  }

  const initialMode = resolvedParams.mode === 'signup' ? 'signup' : 'login';

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md stadium-card bg-field-surface border border-field-border p-6 sm:p-8 shadow-2xl rounded-2xl glow-pitch-sm">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center mb-6">
          <Link href="/" className="relative w-12 h-12 rounded-xl overflow-hidden border border-pitch-hover mb-3 shadow-[0_0_15px_-3px_rgba(34,197,94,0.3)] block hover:opacity-90 transition-opacity">
            <Image
              src="/logo.png"
              alt="TourneyPass"
              fill
              sizes="48px"
              className="object-cover"
              priority
            />
          </Link>
          <h1 className="text-2xl font-black font-brand uppercase tracking-wider text-ball-white">
            Tourney<span className="text-pitch">Pass</span>
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            El pase oficial para torneos entre amigos
          </p>
        </div>

        {/* Reusable Auth Form */}
        <AuthForm initialMode={initialMode} />
      </div>
    </div>
  );
}
