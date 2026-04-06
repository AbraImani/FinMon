import { useEffect, useMemo, useState } from 'react'
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore'
import { firestoreDb } from '../../../shared/config/firebase'
import type { AuditLogRecord, AuditModule } from '../../../shared/types/domain'

function formatDate(value: unknown) {
  const date =
    value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function'
      ? value.toDate()
      : null

  return date instanceof Date ? date.toLocaleString('fr-FR') : 'Date indisponible'
}

const modules: AuditModule[] = ['transactions', 'expenses', 'closures', 'rates']

function csvEscape(value: string) {
  return `"${value.replaceAll('"', '""')}"`
}

export function AdminAuditPage() {
  const [logs, setLogs] = useState<Array<AuditLogRecord & { id: string }>>([])
  const [moduleFilter, setModuleFilter] = useState<'all' | AuditModule>('all')
  const [actorFilter, setActorFilter] = useState('')

  useEffect(() => {
    const logsQuery = query(collection(firestoreDb, 'auditLogs'), orderBy('createdAt', 'desc'), limit(120))

    const unsubscribe = onSnapshot(logsQuery, (snapshot) => {
      setLogs(snapshot.docs.map((document) => ({ id: document.id, ...(document.data() as AuditLogRecord) })))
    })

    return () => unsubscribe()
  }, [])

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const moduleMatch = moduleFilter === 'all' || log.module === moduleFilter
      const actorMatch = !actorFilter || log.actorName.toLowerCase().includes(actorFilter.trim().toLowerCase())
      return moduleMatch && actorMatch
    })
  }, [actorFilter, logs, moduleFilter])

  const exportCsv = () => {
    const header = [
      'date',
      'acteur',
      'module',
      'action',
      'target_collection',
      'target_id',
      'before_json',
      'after_json',
      'metadata_json',
    ]

    const rows = filteredLogs.map((log) => {
      return [
        formatDate(log.createdAt),
        log.actorName,
        log.module,
        log.action,
        log.targetCollection,
        log.targetId,
        JSON.stringify(log.before ?? null),
        JSON.stringify(log.after ?? null),
        JSON.stringify(log.metadata ?? {}),
      ]
    })

    const csvContent = [header, ...rows]
      .map((row) => row.map((cell) => csvEscape(String(cell ?? ''))).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-2xl font-bold text-slate-900">Journal d'audit</h2>
        <p className="mt-1 text-sm text-[var(--elbar-muted)]">
          Historique des actions administratives critiques et des changements sensibles.
        </p>
      </header>

      <div className="fintech-card grid gap-3 p-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm font-semibold text-slate-700">
          Filtrer par module
          <select
            value={moduleFilter}
            onChange={(event) => setModuleFilter(event.target.value as 'all' | AuditModule)}
            className="w-full rounded-xl border border-[var(--elbar-border)] bg-white px-3 py-2 text-sm"
          >
            <option value="all">Tous</option>
            {modules.map((module) => (
              <option key={module} value={module}>
                {module}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm font-semibold text-slate-700">
          Filtrer par acteur
          <input
            value={actorFilter}
            onChange={(event) => setActorFilter(event.target.value)}
            type="text"
            placeholder="Nom administrateur"
            className="w-full rounded-xl border border-[var(--elbar-border)] bg-white px-3 py-2 text-sm"
          />
        </label>

        <div className="sm:col-span-2">
          <button
            type="button"
            onClick={exportCsv}
            disabled={filteredLogs.length === 0}
            className="rounded-xl bg-[var(--elbar-brand)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--elbar-brand-strong)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Export CSV (filtres appliques)
          </button>
        </div>
      </div>

      <article className="fintech-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Acteur</th>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Cible</th>
                <th className="px-4 py-3">Avant</th>
                <th className="px-4 py-3">Apres</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={7}>
                    Aucun log d'audit disponible.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="border-t border-slate-100 align-top">
                    <td className="px-4 py-3 text-slate-600">{formatDate(log.createdAt)}</td>
                    <td className="px-4 py-3">{log.actorName}</td>
                    <td className="px-4 py-3">{log.module}</td>
                    <td className="px-4 py-3">{log.action}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {log.targetCollection} / {log.targetId}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <pre className="max-w-[280px] overflow-auto whitespace-pre-wrap">{JSON.stringify(log.before)}</pre>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <pre className="max-w-[280px] overflow-auto whitespace-pre-wrap">{JSON.stringify(log.after)}</pre>
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
