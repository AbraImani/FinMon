import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <main className="relative min-h-screen overflow-hidden px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-6">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#eef7f6_0%,#f5f8fb_18%,#eef3f7_100%)]" />
      <div className="absolute inset-y-0 left-0 w-2 bg-[linear-gradient(180deg,#d6f0ec_0%,#0b6e4f_100%)] opacity-80" />

      <div className="relative mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-7xl items-stretch gap-0 overflow-hidden rounded-[2rem] border border-white/60 bg-white shadow-[0_28px_80px_-48px_rgba(15,23,42,0.45)] lg:grid-cols-[1.08fr_0.92fr]">
        <aside className="relative flex min-h-[260px] flex-col justify-between overflow-hidden bg-[linear-gradient(180deg,#0f4c73_0%,#0a6f66_100%)] p-6 text-white sm:p-8 lg:min-h-full lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.12),transparent_28%)]" />
          <div className="relative flex h-full flex-col justify-center">
            <div className="inline-flex items-center gap-3 self-start rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white/90 backdrop-blur">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[0.7rem] font-black text-slate-900">E</span>
              ELBAR COMPANY
            </div>

            <div className="mt-10 max-w-md">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">Connexion sécurisée</p>
              <h1 className="mt-4 text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
                Un accès propre, clair et professionnel.
              </h1>
              <p className="mt-5 max-w-sm text-sm leading-6 text-white/82 sm:text-base">
                Une interface simple pour l&apos;administration et les agents, adaptée au téléphone, à la tablette et à l&apos;ordinateur.
              </p>
            </div>
          </div>
        </aside>

        <section className="flex min-h-[520px] flex-col justify-center bg-white px-5 py-8 sm:px-8 lg:px-12">
          <Outlet />
        </section>
      </div>
    </main>
  )
}
