import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { firebaseFunctions, firestoreDb } from '../../../shared/config/firebase'
import { useAuth } from '../../../shared/auth/authContext'
import type { DailyClosureRecord, ExpenseRecord, TransactionRecord } from '../../../shared/types/domain'

function getDateKey() {
  return new Date().toISOString().slice(0, 10)
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

function formatDate(value: unknown) {
  const date =
    value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function'
      ? value.toDate()
      : null

  return date instanceof Date ? date.toLocaleString('fr-FR') : 'Date indisponible'
}

export function AgentClosurePage() {
  const { profile } = useAuth()
  const [history, setHistory] = useState<Array<DailyClosureRecord & { id: string }>>([])
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [baseCashUsd, setBaseCashUsd] = useState(0)
  const [baseCashCdf, setBaseCashCdf] = useState(0)
  const [transactionDeltaUsd, setTransactionDeltaUsd] = useState(0)
  const [transactionDeltaCdf, setTransactionDeltaCdf] = useState(0)
  const [approvedExpensesUsd, setApprovedExpensesUsd] = useState(0)
  const [approvedExpensesCdf, setApprovedExpensesCdf] = useState(0)

  useEffect(() => {
    if (!profile) {
      return
    }

    const today = getDateKey()

    const balancesRef = doc(firestoreDb, 'agentBalances', profile.uid)
    const unsubscribeBalances = onSnapshot(balancesRef, (snapshot) => {
      const data = snapshot.data() as { cashUsd?: number; cashCdf?: number } | undefined
      setBaseCashUsd(data?.cashUsd ?? 0)
      setBaseCashCdf(data?.cashCdf ?? 0)
    })

    const transactionsQuery = query(collection(firestoreDb, 'transactions'), orderBy('createdAt', 'desc'), limit(200))
    const unsubscribeTransactions = onSnapshot(transactionsQuery, (snapshot) => {
      const todayTransactions = snapshot.docs
        .map((document) => document.data() as TransactionRecord)
        .filter((transaction) => {
          const txDate = transaction.dateKey ?? getDateKeyFromTimestamp(transaction.createdAt)
          return transaction.createdById === profile.uid && txDate === today
        })

      let usd = 0
      let cdf = 0

      todayTransactions.forEach((transaction) => {
        const direction =
          transaction.operationType === 'depot'
            ? 1
            : transaction.operationType === 'retrait'
              ? -1
              : 0

        if (transaction.currency === 'USD') {
          usd += direction * transaction.amount
        } else {
          cdf += direction * transaction.amount
        }
      })

      setTransactionDeltaUsd(usd)
      setTransactionDeltaCdf(cdf)
    })

    const expensesQuery = query(collection(firestoreDb, 'expenses'), orderBy('submittedAt', 'desc'), limit(200))
    const unsubscribeExpenses = onSnapshot(expensesQuery, (snapshot) => {
      const approved = snapshot.docs
        .map((document) => document.data() as ExpenseRecord)
        .filter((expense) => {
          const reviewDate = getDateKeyFromTimestamp(expense.reviewedAt)
          return expense.createdById === profile.uid && expense.status === 'approved' && reviewDate === today
        })

      const usd = approved
        .filter((expense) => expense.currency === 'USD')
        .reduce((total, expense) => total + expense.amount, 0)
      const cdf = approved
        .filter((expense) => expense.currency === 'CDF')
        .reduce((total, expense) => total + expense.amount, 0)

      setApprovedExpensesUsd(usd)
      setApprovedExpensesCdf(cdf)
    })

    const closureQuery = query(collection(firestoreDb, 'dailyClosures'), orderBy('submittedAt', 'desc'), limit(8))
    const unsubscribeClosures = onSnapshot(closureQuery, (snapshot) => {
      setHistory(
        snapshot.docs
          .map((document) => ({ id: document.id, ...(document.data() as DailyClosureRecord) }))
          .filter((closure) => closure.createdById === profile.uid),
      )
    })

    return () => {
      unsubscribeBalances()
      unsubscribeTransactions()
      unsubscribeExpenses()
      unsubscribeClosures()
    }
  }, [profile])

  const today = useMemo(() => getDateKey(), [])
  const expectedCashUsd = baseCashUsd + transactionDeltaUsd - approvedExpensesUsd
  const expectedCashCdf = baseCashCdf + transactionDeltaCdf - approvedExpensesCdf
  const alreadySubmittedToday = history.some((closure) => closure.dateKey === today)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage(null)
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const declaredCashUsd = Number(formData.get('declaredCashUsd') ?? 0)
    const declaredCashCdf = Number(formData.get('declaredCashCdf') ?? 0)

    try {
      if (!profile) {
        throw new Error('Session invalide. Veuillez vous reconnecter.')
      }

      if (alreadySubmittedToday) {
        throw new Error('Une cloture est deja enregistree pour cette journee.')
      }

      const submitDailyClosureSecure = httpsCallable(firebaseFunctions, 'submitDailyClosureSecure')
      await submitDailyClosureSecure({
        dateKey: today,
        declaredCashUsd,
        declaredCashCdf,
        expectedCashUsd,
        expectedCashCdf,
      })

      event.currentTarget.reset()
      setMessage('Cloture journaliere envoyee.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erreur pendant la cloture journaliere.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="space-y-4">
      <article className="fintech-card p-4">
        <h2 className="text-lg font-bold text-slate-900">Cloture journaliere</h2>
        <p className="mt-1 text-sm text-[var(--elbar-muted)]">
          Saisissez le cash reel de fin de journee. Le systeme calcule automatiquement les ecarts.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Cash attendu USD</p>
            <p className="kpi-value mt-2 text-lg font-bold text-slate-900">{expectedCashUsd} USD</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Cash attendu CDF</p>
            <p className="kpi-value mt-2 text-lg font-bold text-slate-900">{expectedCashCdf} CDF</p>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600">
          <p>Base caisse USD: {baseCashUsd} | Mouvements USD: {transactionDeltaUsd} | Depenses validees USD: -{approvedExpensesUsd}</p>
          <p className="mt-1">Base caisse CDF: {baseCashCdf} | Mouvements CDF: {transactionDeltaCdf} | Depenses validees CDF: -{approvedExpensesCdf}</p>
        </div>

        <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
          <label className="space-y-1 text-sm font-semibold text-slate-700">
            Date de cloture
            <input
              value={today}
              readOnly
              className="w-full rounded-xl border border-[var(--elbar-border)] bg-slate-50 px-3 py-2.5 text-sm text-slate-600"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-sm font-semibold text-slate-700">
              Cash reel USD
              <input
                name="declaredCashUsd"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder="0"
                className="w-full rounded-xl border border-[var(--elbar-border)] bg-white px-3 py-2.5 text-sm"
              />
            </label>

            <label className="space-y-1 text-sm font-semibold text-slate-700">
              Cash reel CDF
              <input
                name="declaredCashCdf"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder="0"
                className="w-full rounded-xl border border-[var(--elbar-border)] bg-white px-3 py-2.5 text-sm"
              />
            </label>
          </div>

          {message ? (
            <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">{message}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading || alreadySubmittedToday}
            className="rounded-xl bg-[var(--elbar-brand)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--elbar-brand-strong)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Envoi...' : alreadySubmittedToday ? 'Cloture deja soumise' : 'Envoyer la cloture'}
          </button>
        </form>
      </article>

      <article className="fintech-card p-4">
        <h3 className="text-base font-bold text-slate-900">Dernieres clotures</h3>
        <div className="mt-3 space-y-2">
          {history.length === 0 ? (
            <p className="text-sm text-[var(--elbar-muted)]">Aucune cloture enregistree.</p>
          ) : (
            history.map((closure) => (
              <div key={closure.id} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{closure.dateKey}</p>
                    <p className="text-xs text-slate-500">{formatDate(closure.submittedAt)}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                    {closure.status}
                  </span>
                </div>
                <p className="mt-2 text-xs text-[var(--elbar-muted)]">
                  Ecart USD: {closure.gapUsd} | Ecart CDF: {closure.gapCdf}
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-700">Risque: {closure.riskFlag ?? 'normal'}</p>
              </div>
            ))
          )}
        </div>
      </article>
    </section>
  )
}
