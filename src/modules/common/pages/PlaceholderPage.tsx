type PlaceholderPageProps = {
  title: string
  description: string
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <section className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-[var(--elbar-muted)]">{description}</p>
    </section>
  )
}
