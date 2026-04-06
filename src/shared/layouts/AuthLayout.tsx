import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="fintech-card w-full max-w-md p-6 sm:p-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--elbar-brand)]">
          ELBAR COMPANY
        </p>
        <Outlet />
      </section>
    </main>
  )
}
