import { useEffect, useMemo, useState } from 'react'
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { firebaseFunctions, firestoreDb } from '../../../shared/config/firebase'
import { useAuth } from '../../../shared/auth/authContext'
import type { DailyClosureRecord, DailyClosureStatus } from '../../../shared/types/domain'

function formatDate(value: unknown) {
  const date =
    value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function'
      ? value.toDate()
      : null

  return date instanceof Date ? date.toLocaleString('fr-FR') : 'Date indisponible'
}

function statusClass(status: DailyClosureStatus) {
  if (status === 'locked') {
    return 'bg-slate-900 text-white'
  }

  if (status === 'reviewed') {
    return 'bg-emerald-100 text-emerald-700'
  }

  return 'bg-amber-100 text-amber-700'
}

function riskClass(riskFlag: 'normal' | 'watch' | 'suspect') {
  if (riskFlag === 'suspect') {
    return 'bg-rose-100 text-rose-700'
  }

  if (riskFlag === 'watch') {
    return 'bg-amber-100 text-amber-700'
  }

  return 'bg-emerald-100 text-emerald-700'
}

export function AdminClosuresPage() {
  const { profile } = useAuth()
  const [closures, setClosures] = useState<Array<DailyClosureRecord & { id: string }>>([])
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [dateFilter, setDateFilter] = useState('')
  const [agentFilter, setAgentFilter] = useState('')

  useEffect(() => {
    const closuresQuery = query(collection(firestoreDb, 'dailyClosures'), orderBy('submittedAt', 'desc'), limit(40))

    const unsubscribe = onSnapshot(closuresQuery, (snapshot) => {
      setClosures(snapshot.docs.map((document) => ({ id: document.id, ...(document.data() as DailyClosureRecord) })))
    })

    return () => unsubscribe()
  }, [])

  const updateStatus = async (closureId: string, status: DailyClosureStatus) => {
    if (!profile) {
      return
    }

    setLoadingId(closureId)
    try {
      const reviewDailyClosureSecure = httpsCallable(firebaseFunctions, 'reviewDailyClosureSecure')
      await reviewDailyClosureSecure({
        closureId,
        action: status,
        reviewNote: '',
      })
    } finally {
      setLoadingId(null)
    }
  }

  const filteredClosures = useMemo(() => {
    return closures.filter((closure) => {
      const matchDate = !dateFilter || closure.dateKey === dateFilter
      const matchAgent =
        !agentFilter || closure.createdByName.toLowerCase().includes(agentFilter.trim().toLowerCase())

      return matchDate && matchAgent
    })
  }, [agentFilter, closures, dateFilter])

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-2xl font-bold text-slate-900">Rapports journaliers</h2>
        <p className="mt-1 text-sm text-[var(--elbar-muted)]">
          Controle des clotures, ecarts et validation administrative.
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
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Agent</th>
                <th className="px-4 py-3">Attendu USD</th>
                <th className="px-4 py-3">Reel USD</th>
                <th className="px-4 py-3">Ecart USD</th>
                <th className="px-4 py-3">Ecart CDF</th>
                <th className="px-4 py-3">Risque</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredClosures.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={9}>
                    Aucune cloture disponible.
                  </td>
                </tr>
              ) : (
                filteredClosures.map((closure) => (
                  <tr key={closure.id} className="border-t border-slate-100 align-top">
                    <td className="px-4 py-3 text-slate-600">
                      <p>{closure.dateKey}</p>
                      <p className="text-xs">{formatDate(closure.submittedAt)}</p>
                    </td>
                    <td className="px-4 py-3">{closure.createdByName}</td>
                    <td className="px-4 py-3">{closure.expectedCashUsd}</td>
                    <td className="px-4 py-3">{closure.declaredCashUsd}</td>
                    <td className="px-4 py-3 font-semibold">{closure.gapUsd}</td>
                    <td className="px-4 py-3 font-semibold">{closure.gapCdf}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${riskClass(closure.riskFlag ?? 'normal')}`}
                      >
                        {closure.riskFlag ?? 'normal'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass(closure.status)}`}>
                        {closure.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {closure.status === 'submitted' ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={loadingId === closure.id}
                            onClick={() => updateStatus(closure.id, 'reviewed')}
                            className="rounded-lg bg-emerald-600 px-2 py-1 text-xs font-semibold text-white disabled:opacity-60"
                          >
                            Marquer revue
                          </button>
                          <button
                            type="button"
                            disabled={loadingId === closure.id}
                            onClick={() => updateStatus(closure.id, 'locked')}
                            className="rounded-lg bg-slate-800 px-2 py-1 text-xs font-semibold text-white disabled:opacity-60"
                          >
                            Verrouiller
                          </button>
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
