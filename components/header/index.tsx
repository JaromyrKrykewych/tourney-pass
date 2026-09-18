import Image from "next/image";
import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-field-border bg-field-bg/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-pitch-hover group-hover:border-pitch-hover transition-colors shadow-[0_0_15px_-3px_rgba(34,197,94,0.3)]">
            <Image
              src="/logo.png"
              alt="TourneyPass Logo"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-ball-white group-hover:text-pitch-hover transition-colors">
                Tourney<span className="text-pitch">Pass</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-pitch-dark/40 text-pitch-hover border border-pitch-hover">
                FIFA & FC
              </span>
            </div>
            <span className="text-[11px] text-text-secondary -mt-0.5">El pase oficial de tu grupo</span>
          </div>
        </Link>
      </div>
    </header>
  )
}