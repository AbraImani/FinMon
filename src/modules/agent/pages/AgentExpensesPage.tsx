import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore'
import { firestoreDb } from '../../../shared/config/firebase'
import { useAuth } from '../../../shared/auth/authContext'
import type { Currency, ExpenseRecord, ExpenseStatus } from '../../../shared/types/domain'

const categories = ['Transport', 'Electricite', 'Internet', 'Frais operationnels', 'Autre']
const currencies: Currency[] = ['USD', 'CDF']

function getDateKey() {
  return new Date().toISOString().slice(0, 10)
}

function formatDate(value: unknown) {
  const date =
    value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function'
      ? value.toDate()
      : null

  return date instanceof Date ? date.toLocaleString('fr-FR') : 'Date indisponible'
}

function statusBadgeClass(status: ExpenseStatus) {
  if (status === 'approved') {
    return 'bg-emerald-100 text-emerald-700'
  }

  if (status === 'rejected') {
    return 'bg-rose-100 text-rose-700'
  }

  return 'bg-amber-100 text-amber-700'
}

function statusLabel(status: ExpenseStatus) {
  if (status === 'approved') {
    return 'Validee'
  }

  if (status === 'rejected') {
    return 'Rejetee'
  }

  return 'En attente'
}

export function AgentExpensesPage() {
  const { profile } = useAuth()
  const [expenses, setExpenses] = useState<Array<ExpenseRecord & { id: string }>>([])
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const defaultCurrency = useMemo(() => currencies[0], [])

  useEffect(() => {
    if (!profile) {
      return
    }

    const expensesQuery = query(collection(firestoreDb, 'expenses'), orderBy('submittedAt', 'desc'))
    const unsubscribe = onSnapshot(expensesQuery, (snapshot) => {
      setExpenses(
        snapshot.docs
          .map((document) => ({ id: document.id, ...(document.data() as ExpenseRecord) }))
          .filter((expense) => expense.createdById === profile.uid),
      )
    })

    return () => unsubscribe()
  }, [profile])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage(null)
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const category = String(formData.get('category') ?? '')
    const amount = Number(formData.get('amount') ?? 0)
    const currency = String(formData.get('currency') ?? defaultCurrency) as Currency
    const reason = String(formData.get('reason') ?? '')

    try {
      if (!profile) {
        throw new Error('Session invalide. Veuillez vous reconnecter.')
      }

      if (!category) {
        throw new Error('Veuillez choisir une categorie.')
      }

      if (!amount || amount <= 0) {
        throw new Error('Le montant doit etre superieur a zero.')
      }

      if (!reason.trim()) {
        throw new Error('Veuillez saisir le motif de la depense.')
      }

      await addDoc(collection(firestoreDb, 'expenses'), {
        dateKey: getDateKey(),
        category,
        amount,
        currency,
        reason,
        status: 'pending',
        submittedAt: serverTimestamp(),
        reviewedAt: null,
        reviewNote: '',
        createdById: profile.uid,
        createdByName: profile.fullName,
      })

      event.currentTarget.reset()
      setMessage('Depense soumise avec succes.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erreur pendant la soumission de la depense.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="space-y-4">
      <article className="fintech-card p-4">
        <h2 className="text-lg font-bold text-slate-900">Nouvelle depense</h2>
        <p className="mt-1 text-sm text-[var(--elbar-muted)]">
          Soumettez une depense en attente de validation administrateur.
        </p>

        <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-sm font-semibold text-slate-700">
              Categorie
              <select
                name="category"
                defaultValue={categories[0]}
                className="w-full rounded-xl border border-[var(--elbar-border)] bg-white px-3 py-2.5 text-sm"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-sm font-semibold text-slate-700">
              Devise
              <select
                name="currency"
                defaultValue={defaultCurrency}
                className="w-full rounded-xl border border-[var(--elbar-border)] bg-white px-3 py-2.5 text-sm"
              >
                {currencies.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="space-y-1 text-sm font-semibold text-slate-700">
            Montant
            <input
              name="amount"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              placeholder="0"
              className="w-full rounded-xl border border-[var(--elbar-border)] bg-white px-3 py-2.5 text-sm"
            />
          </label>

          <label className="space-y-1 text-sm font-semibold text-slate-700">
            Motif
            <textarea
              name="reason"
              rows={3}
              placeholder="Ex: Recharge caisse, transport urgent"
              className="w-full rounded-xl border border-[var(--elbar-border)] bg-white px-3 py-2.5 text-sm"
            />
          </label>

          {message ? (
            <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">{message}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-[var(--elbar-brand)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--elbar-brand-strong)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Soumission...' : 'Soumettre la depense'}
          </button>
        </form>
      </article>

      <article className="fintech-card p-4">
        <h3 className="text-base font-bold text-slate-900">Mes depenses recentes</h3>
        <div className="mt-3 space-y-2">
          {expenses.length === 0 ? (
            <p className="text-sm text-[var(--elbar-muted)]">Aucune depense soumise pour le moment.</p>
          ) : (
            expenses.map((expense) => (
              <div key={expense.id} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{expense.category}</p>
                    <p className="text-xs text-slate-500">{formatDate(expense.submittedAt)}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${statusBadgeClass(expense.status)}`}
                  >
                    {statusLabel(expense.status)}
                  </span>
                </div>
                <p className="kpi-value mt-2 text-sm font-bold text-slate-900">
                  {expense.amount} {expense.currency}
                </p>
                <p className="mt-1 text-xs text-[var(--elbar-muted)]">{expense.reason}</p>
                {expense.status === 'rejected' && expense.reviewNote ? (
                  <p className="mt-2 text-xs font-semibold text-rose-700">
                    Motif du rejet: {expense.reviewNote}
                  </p>
                ) : null}
              </div>
            ))
          )}
        </div>
      </article>
    </section>
  )
}
