import { useEffect, useMemo, useState } from 'react'
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { firebaseFunctions, firestoreDb } from '../../../shared/config/firebase'
import { useAuth } from '../../../shared/auth/authContext'
import type { ExpenseRecord, ExpenseStatus } from '../../../shared/types/domain'

function formatDate(value: unknown) {
  const date =
    value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function'
      ? value.toDate()
      : null

  return date instanceof Date ? date.toLocaleString('fr-FR') : 'Date indisponible'
}

function getDateKeyFromTimestamp(value: unknown) {
  const date =
    value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function'
      ? value.toDate()
      : null

  if (!(date instanceof Date)) {
    return ''
  }

  return date.toISOString().slice(0, 10)
}

function badge(status: ExpenseStatus) {
  if (status === 'approved') {
    return 'bg-emerald-100 text-emerald-700'
  }

  if (status === 'rejected') {
    return 'bg-rose-100 text-rose-700'
  }

  return 'bg-amber-100 text-amber-700'
}

function label(status: ExpenseStatus) {
  if (status === 'approved') {
    return 'Validee'
  }

  if (status === 'rejected') {
    return 'Rejetee'
  }

  return 'En attente'
}

export function AdminExpensesPage() {
  const { profile } = useAuth()
  const [expenses, setExpenses] = useState<Array<ExpenseRecord & { id: string }>>([])
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [dateFilter, setDateFilter] = useState('')
  const [agentFilter, setAgentFilter] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    const expensesQuery = query(collection(firestoreDb, 'expenses'), orderBy('submittedAt', 'desc'))

    const unsubscribe = onSnapshot(expensesQuery, (snapshot) => {
      setExpenses(snapshot.docs.map((document) => ({ id: document.id, ...(document.data() as ExpenseRecord) })))
    })

    return () => unsubscribe()
  }, [])

  const updateExpense = async (expenseId: string, status: ExpenseStatus) => {
    if (!profile) {
      return
    }

    const note = (notes[expenseId] ?? '').trim()
    if (status === 'rejected' && !note) {
      return
    }

    setFeedback(null)
    setLoadingId(expenseId)
    try {
      const reviewExpenseSecure = httpsCallable(firebaseFunctions, 'reviewExpenseSecure')
      await reviewExpenseSecure({
        expenseId,
        action: status,
        reviewNote: note,
      })
      setFeedback(status === 'approved' ? 'Depense validee.' : 'Depense rejetee.')
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Erreur pendant la revue de la depense.')
    } finally {
      setLoadingId(null)
    }
  }

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const dateKey = expense.dateKey ?? getDateKeyFromTimestamp(expense.submittedAt)
      const matchDate = !dateFilter || dateKey === dateFilter
      const matchAgent =
        !agentFilter || expense.createdByName.toLowerCase().includes(agentFilter.trim().toLowerCase())

      return matchDate && matchAgent
    })
  }, [agentFilter, dateFilter, expenses])

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-2xl font-bold text-slate-900">Validation des depenses</h2>
        <p className="mt-1 text-sm text-[var(--elbar-muted)]">
          Validez ou rejetez les depenses soumises par les agents.
        </p>
      </header>

      <div className="fintech-card grid gap-3 p-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm font-semibold text-slate-700">
          Filtrer par date
          <input
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
            type="date"
            className="w-full rounded-xl border border-[var(--elbar-border)] bg-white px-3 py-2 text-sm"
          />
        </label>

        <label className="space-y-1 text-sm font-semibold text-slate-700">
          Filtrer par agent
          <input
            value={agentFilter}
            onChange={(event) => setAgentFilter(event.target.value)}
            type="text"
            placeholder="Nom de l'agent"
            className="w-full rounded-xl border border-[var(--elbar-border)] bg-white px-3 py-2 text-sm"
          />
        </label>
      </div>

      <article className="fintech-card overflow-hidden">
        {feedback ? <p className="border-b border-slate-200 px-4 py-3 text-sm text-slate-700">{feedback}</p> : null}
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Agent</th>
                <th className="px-4 py-3">Categorie</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">Motif</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={7}>
                    Aucune depense disponible.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="border-t border-slate-100 align-top">
                    <td className="px-4 py-3 text-slate-600">{formatDate(expense.submittedAt)}</td>
                    <td className="px-4 py-3">{expense.createdByName}</td>
                    <td className="px-4 py-3">{expense.category}</td>
                    <td className="px-4 py-3 font-semibold">
                      {expense.amount} {expense.currency}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{expense.reason}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${badge(expense.status)}`}>
                        {label(expense.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {expense.status === 'pending' ? (
                        <div className="grid gap-2">
                          <input
                            value={notes[expense.id] ?? ''}
                            onChange={(event) =>
                              setNotes((current) => ({ ...current, [expense.id]: event.target.value }))
                            }
                            className="w-56 rounded-lg border border-slate-300 px-2 py-1 text-xs"
                            placeholder="Motif (obligatoire si rejet)"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={loadingId === expense.id}
                              onClick={() => updateExpense(expense.id, 'approved')}
                              className="rounded-lg bg-emerald-600 px-2 py-1 text-xs font-semibold text-white disabled:opacity-60"
                            >
                              Valider
                            </button>
                            <button
                              type="button"
                              disabled={loadingId === expense.id || !(notes[expense.id] ?? '').trim()}
                              onClick={() => updateExpense(expense.id, 'rejected')}
                              className="rounded-lg bg-rose-600 px-2 py-1 text-xs font-semibold text-white disabled:opacity-60"
                            >
                              Rejeter
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">Traitee</p>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  )
}
