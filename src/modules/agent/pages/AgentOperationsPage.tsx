import { useState, type FormEvent } from 'react'
import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { firestoreDb } from '../../../shared/config/firebase'
import { useAuth } from '../../../shared/auth/authContext'
import type { Currency, TransactionType } from '../../../shared/types/domain'

const services = [
  { id: 'airtel_money', label: 'Airtel Money' },
  { id: 'orange_money', label: 'Orange Money' },
  { id: 'vodacom_m_pesa', label: 'Vodacom / M-Pesa' },
  { id: 'afri_money', label: 'Afri Money' },
]

const operationTypes: Array<{ value: TransactionType; label: string }> = [
  { value: 'depot', label: 'Depot' },
  { value: 'retrait', label: 'Retrait' },
  { value: 'transfert', label: 'Transfert' },
]

const currencies: Currency[] = ['USD', 'CDF']

function getDateKey() {
  return new Date().toISOString().slice(0, 10)
}

function generateOperationRef(uid: string) {
  return `${uid}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`
}

export function AgentOperationsPage() {
  const { profile } = useAuth()
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setMessage(null)

    const formData = new FormData(event.currentTarget)
    const serviceId = String(formData.get('serviceId') ?? '')
    const serviceName = services.find((service) => service.id === serviceId)?.label ?? ''
    const operationType = String(formData.get('operationType') ?? 'depot') as TransactionType
    const currency = String(formData.get('currency') ?? 'USD') as Currency
    const amount = Number(formData.get('amount') ?? 0)
    const commission = Number(formData.get('commission') ?? 0)
    const note = String(formData.get('note') ?? '')

    try {
      if (!profile) {
        throw new Error('Session invalide. Veuillez vous reconnecter.')
      }

      if (!serviceId || !serviceName) {
        throw new Error('Veuillez choisir un service.')
      }

      if (!amount || amount <= 0) {
        throw new Error('Le montant doit etre superieur a zero.')
      }

      const operationRef = generateOperationRef(profile.uid)
      const transactionRef = doc(collection(firestoreDb, 'transactions'), operationRef)

      await setDoc(transactionRef, {
        operationRef,
        dateKey: getDateKey(),
        serviceId,
        serviceName,
        operationType,
        currency,
        amount,
        commission,
        note,
        createdAt: serverTimestamp(),
        createdById: profile.uid,
        createdByName: profile.fullName,
        status: 'posted',
      })

      event.currentTarget.reset()
      setMessage('Transaction enregistree avec succes.')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue.'
      setMessage(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="space-y-4">
      <div className="fintech-card p-4">
        <h2 className="text-lg font-bold text-slate-900">Nouvelle transaction</h2>
        <p className="mt-1 text-sm text-[var(--elbar-muted)]">
          Saisissez l&apos;operation en quelques secondes. Les champs obligatoires sont limites au strict minimum.
        </p>

        <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-sm font-semibold text-slate-700">
              Service
              <select
                name="serviceId"
                defaultValue={services[0]?.id}
                className="w-full rounded-xl border border-[var(--elbar-border)] bg-white px-3 py-2.5 text-sm"
              >
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-sm font-semibold text-slate-700">
              Type d&apos;operation
              <select name="operationType" className="w-full rounded-xl border border-[var(--elbar-border)] bg-white px-3 py-2.5 text-sm">
                {operationTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-sm font-semibold text-slate-700">
              Devise
              <select name="currency" className="w-full rounded-xl border border-[var(--elbar-border)] bg-white px-3 py-2.5 text-sm">
                {currencies.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-sm font-semibold text-slate-700">
              Montant
              <input
                name="amount"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                className="w-full rounded-xl border border-[var(--elbar-border)] bg-white px-3 py-2.5 text-sm"
                placeholder="0"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-sm font-semibold text-slate-700">
              Commission
              <input
                name="commission"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                className="w-full rounded-xl border border-[var(--elbar-border)] bg-white px-3 py-2.5 text-sm"
                placeholder="0"
              />
            </label>

            <label className="space-y-1 text-sm font-semibold text-slate-700">
              Date / heure
              <input
                name="dateTime"
                type="text"
                readOnly
                value={new Date().toLocaleString('fr-FR')}
                className="w-full rounded-xl border border-[var(--elbar-border)] bg-slate-50 px-3 py-2.5 text-sm text-slate-600"
              />
            </label>
          </div>

          <label className="space-y-1 text-sm font-semibold text-slate-700">
            Note
            <textarea
              name="note"
              rows={3}
              className="w-full rounded-xl border border-[var(--elbar-border)] bg-white px-3 py-2.5 text-sm"
              placeholder="Commentaire optionnel"
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
            {loading ? 'Enregistrement...' : 'Enregistrer la transaction'}
          </button>
        </form>
      </div>
    </section>
  )
}
