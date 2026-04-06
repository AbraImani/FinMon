import { useEffect, useState } from 'react'
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore'
import { firestoreDb } from '../../../shared/config/firebase'
import { useAuth } from '../../../shared/auth/authContext'
import type { ExchangeRateRecord, TransactionRecord } from '../../../shared/types/domain'

export function AgentDashboardPage() {
  const { profile } = useAuth()
  const [transactions, setTransactions] = useState<Array<TransactionRecord & { id: string }>>([])
  const [rate, setRate] = useState<string>('')
  const [balances, setBalances] = useState<{ cashUsd?: number; cashCdf?: number }>({})

  useEffect(() => {
    if (!profile) {
      return
    }

    const recentTransactionsQuery = query(
      collection(firestoreDb, 'transactions'),
      orderBy('createdAt', 'desc'),
      limit(10),
    )

    const unsubscribeTransactions = onSnapshot(recentTransactionsQuery, (snapshot) => {
      setTransactions(
        snapshot.docs
          .map((document) => ({ id: document.id, ...(document.data() as TransactionRecord) }))
          .filter((transaction) => transaction.createdById === profile.uid),
      )
    })

    const exchangeRateRef = doc(firestoreDb, 'exchangeRates', 'current')
    const unsubscribeRate = onSnapshot(exchangeRateRef, (snapshot) => {
      const data = snapshot.data() as ExchangeRateRecord | undefined
      setRate(data?.usdToCdf ? String(data.usdToCdf) : '')
    })

    const balancesRef = doc(firestoreDb, 'agentBalances', profile.uid)
    const unsubscribeBalances = onSnapshot(balancesRef, (snapshot) => {
      const data = snapshot.data() as { cashUsd?: number; cashCdf?: number } | undefined
      setBalances(data ?? {})
    })

    return () => {
      unsubscribeTransactions()
      unsubscribeRate()
      unsubscribeBalances()
    }
  }, [profile])

  const kpis = [
    { label: 'Transactions recentes', value: String(transactions.length) },
    { label: 'Taux du jour', value: rate ? `${rate} CDF` : 'Non defini' },
    { label: 'Cash USD', value: balances.cashUsd !== undefined ? `${balances.cashUsd} USD` : 'Non disponible' },
    { label: 'Cash CDF', value: balances.cashCdf !== undefined ? `${balances.cashCdf} CDF` : 'Non disponible' },
  ]

  return (
    <section className="space-y-4">
      <div className="fintech-card p-4">
        <h2 className="text-lg font-bold text-slate-900">Synthese du jour</h2>
        <p className="mt-1 text-sm text-[var(--elbar-muted)]">
          Vue rapide des operations, du cash physique et des donnees disponibles.
        </p>
        <div className="mt-4 grid gap-3">
          {kpis.map((kpi) => (
            <article key={kpi.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                {kpi.label}
              </p>
              <p className="kpi-value mt-2 text-xl font-bold text-slate-900">{kpi.value}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="fintech-card p-4">
        <h3 className="text-base font-bold text-slate-900">Actions rapides</h3>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <a
            className="rounded-lg border border-[var(--elbar-border)] bg-white px-3 py-2 text-center text-sm font-semibold text-slate-700"
            href="/agent/operations"
          >
            Nouvelle operation
          </a>
          <a
            className="rounded-lg border border-[var(--elbar-border)] bg-white px-3 py-2 text-center text-sm font-semibold text-slate-700"
            href="/agent/depenses"
          >
            Nouvelle depense
          </a>
          <button className="rounded-lg border border-[var(--elbar-border)] bg-white px-3 py-2 text-sm font-semibold text-slate-700">
            Saisir cash reel
          </button>
          <a
            className="rounded-lg border border-[var(--elbar-border)] bg-white px-3 py-2 text-center text-sm font-semibold text-slate-700"
            href="/agent/cloture"
          >
            Envoyer cloture
          </a>
        </div>
      </div>

      <div className="fintech-card p-4">
        <h3 className="text-base font-bold text-slate-900">Dernieres transactions</h3>
        <div className="mt-3 space-y-2">
          {transactions.length === 0 ? (
            <p className="text-sm text-[var(--elbar-muted)]">Aucune transaction enregistree pour le moment.</p>
          ) : (
            transactions.map((transaction) => (
              <article key={transaction.id} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{transaction.serviceName}</p>
                    <p className="text-xs text-slate-500">
                      {transaction.operationType} - {transaction.currency}
                    </p>
                  </div>
                  <p className="kpi-value text-sm font-bold text-slate-900">{transaction.amount}</p>
                </div>
                {transaction.commission ? (
                  <p className="mt-2 text-xs text-[var(--elbar-muted)]">
                    Commission: {transaction.commission}
                  </p>
                ) : null}
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
