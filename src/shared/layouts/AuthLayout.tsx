import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,164,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(11,110,79,0.12),transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eef4f7_100%)]" />
      <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-[rgba(11,110,79,0.12)] blur-3xl" />
      <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-[rgba(14,165,164,0.12)] blur-3xl" />

      <div className="relative mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl items-stretch gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <aside className="fintech-card relative overflow-hidden rounded-[2rem] border-0 bg-[linear-gradient(160deg,#0f172a_0%,#0b2d4a_38%,#0b6e4f_100%)] p-6 text-white shadow-[0_28px_80px_-40px_rgba(15,23,42,0.7)] sm:p-8 lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.1),transparent_24%)] opacity-80" />
          <div className="relative">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/90 backdrop-blur">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[0.7rem] font-black text-slate-900">E</span>
              ELBAR COMPANY
            </div>

            <div className="mt-10 max-w-md">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/65">Acces professionnel</p>
              <h1 className="mt-4 text-4xl font-black leading-tight text-white sm:text-5xl">
                Une connexion claire, elegante et sûre.
              </h1>
              <p className="mt-5 max-w-sm text-sm leading-6 text-white/75 sm:text-base">
                Un espace de connexion conçu pour l&apos;administration et les agents, avec une lecture simple sur mobile, tablette et ordinateur.
              </p>
            </div>
          </div>

          <div className="relative mt-10 grid gap-3 border-t border-white/12 pt-5 text-sm text-white/78 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/12 bg-white/8 px-4 py-3 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">Admin</p>
              <p className="mt-1 font-medium">Connexion Google autorisee</p>
            </div>
            <div className="rounded-2xl border border-white/12 bg-white/8 px-4 py-3 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">Agent</p>
              <p className="mt-1 font-medium">Acces avec identifiants fournis</p>
            </div>
          </div>
        </aside>

        <section className="fintech-card flex min-h-[520px] flex-col justify-center rounded-[2rem] border border-white/70 bg-white/95 px-5 py-8 shadow-[0_24px_70px_-38px_rgba(15,23,42,0.55)] backdrop-blur sm:px-8 lg:px-10">
          <Outlet />
        </section>
      </div>
    </main>
  )
}
