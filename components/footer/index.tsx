export function Footer() {
  return (
    <footer className="border-t border-field-border bg-field-surface/60 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-secondary">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-pitch inline-block animate-pulse"></span>
          <span>TourneyPass — Creado para piques de FIFA entre amigos</span>
        </div>
      </div>
    </footer>
  )
}