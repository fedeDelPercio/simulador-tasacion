"use client";

// Cartel de "página no disponible". Se muestra cuando PAGE_BLOCKED = true en la
// página principal, para dirigir a la gente a la plataforma de Team Scaglia.
export function BlockedScreen() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-brand-800 px-6">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="mx-auto w-14 h-14 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center mb-8">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            className="w-7 h-7"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>

        <p className="text-xs font-semibold uppercase tracking-widest text-brand-400 mb-3">
          Team Scaglia
        </p>

        <h1
          className="text-3xl font-bold text-white mb-4"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Página no disponible
        </h1>

        <p className="text-base text-white/70 leading-relaxed">
          Hacé tu ACM desde la plataforma de{" "}
          <span className="font-semibold text-white">Team Scaglia</span>.
        </p>
      </div>
    </main>
  );
}
