import { useEffect, useState, type FormEvent } from 'react'
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { firestoreDb } from '../../../shared/config/firebase'
import { useAuth } from '../../../shared/auth/authContext'
import type { ExchangeRateRecord, TransactionRecord } from '../../../shared/types/domain'
import { logAdminAction } from '../../../shared/utils/audit'

export function AdminTransactionsPage() {
  const { profile } = useAuth()
  const [transactions, setTransactions] = useState<Array<TransactionRecord & { id: string }>>([])
  const [rate, setRate] = useState('')
  const [currentRate, setCurrentRate] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    const transactionsQuery = query(
      collection(firestoreDb, 'transactions'),
      orderBy('createdAt', 'desc'),
      limit(25),
    )

    const unsubscribeTransactions = onSnapshot(transactionsQuery, (snapshot) => {
      setTransactions(
        snapshot.docs.map((document) => ({
          id: document.id,
          ...(document.data() as TransactionRecord),
        })),
      )
    })

    const rateRef = doc(firestoreDb, 'exchangeRates', 'current')
    const unsubscribeRate = onSnapshot(rateRef, (snapshot) => {
      const data = snapshot.data() as ExchangeRateRecord | undefined
      setCurrentRate(data?.usdToCdf ?? null)
      setRate(data?.usdToCdf ? String(data.usdToCdf) : '')
    })

    return () => {
      unsubscribeTransactions()
      unsubscribeRate()
    }
  }, [])

  const handleRateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setStatus(null)

    try {
      if (!profile) {
        throw new Error('Session invalide. Veuillez vous reconnecter.')
      }

      const rateValue = Number(rate)
      if (!rateValue || rateValue <= 0) {
        throw new Error('Le taux doit etre superieur a zero.')
      }

      await setDoc(doc(firestoreDb, 'exchangeRates', 'current'), {
        usdToCdf: rateValue,
        updatedAt: serverTimestamp(),
        updatedById: profile.uid,
        updatedByName: profile.fullName,
      }, { merge: true })

      await logAdminAction({
        actorId: profile.uid,
        actorName: profile.fullName,
        module: 'rates',
        action: 'update-exchange-rate',
        targetCollection: 'exchangeRates',
        targetId: 'current',
        before: {
          usdToCdf: currentRate,
        },
        after: {
          usdToCdf: rateValue,
        },
      })

      setStatus('Taux du jour mis a jour.')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la mise a jour.'
      setStatus(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-slate-900">Transactions et taux du jour</h2>
        <p className="mt-1 text-sm text-[var(--elbar-muted)]">
          Vue simple des operations recentes et gestion du taux USD/CDF.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <form className="fintech-card p-4" onSubmit={handleRateSubmit}>
          <h3 className="text-base font-bold text-slate-900">Taux du jour</h3>
          <label className="mt-3 block space-y-1 text-sm font-semibold text-slate-700">
            USD vers CDF
            <input
              value={rate}
              onChange={(event) => setRate(event.target.value)}
              type="number"
              min="0"
              step="0.01"
              className="w-full rounded-xl border border-[var(--elbar-border)] bg-white px-3 py-2.5 text-sm"
              placeholder="Ex: 2800"
            />
          </label>

          {status ? <p className="mt-3 text-sm text-[var(--elbar-muted)]">{status}</p> : null}

          <button
            type="submit"
            disabled={saving}
            className="mt-4 rounded-xl bg-[var(--elbar-brand)] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Mise a jour...' : 'Enregistrer le taux'}
          </button>
        </form>

        <div className="fintech-card overflow-hidden">
          <div className="border-b border-slate-200 px-4 py-3">
            <h3 className="text-base font-bold text-slate-900">Transactions recentes</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Devise</th>
                  <th className="px-4 py-3">Montant</th>
                  <th className="px-4 py-3">Commission</th>
                  <th className="px-4 py-3">Auteur</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-slate-500" colSpan={6}>
                      Aucune transaction pour le moment.
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-t border-slate-100">
                      <td className="px-4 py-3">{transaction.serviceName}</td>
                      <td className="px-4 py-3">{transaction.operationType}</td>
                      <td className="px-4 py-3">{transaction.currency}</td>
                      <td className="px-4 py-3 font-semibold">{transaction.amount}</td>
                      <td className="px-4 py-3">{transaction.commission}</td>
                      <td className="px-4 py-3">{transaction.createdByName}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}
