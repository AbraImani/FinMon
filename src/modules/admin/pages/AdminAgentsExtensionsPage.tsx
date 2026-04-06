import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { firestoreDb } from '../../../shared/config/firebase'
import { useAuth } from '../../../shared/auth/authContext'
import type { ExtensionRecord, InvitationRecord, UserProfile } from '../../../shared/types/domain'

function slugify(value: string) {
  const cleanValue = Array.from(value.trim().toLowerCase().normalize('NFD'))
    .filter((character) => {
      const codePoint = character.charCodeAt(0)
      return codePoint >= 32 && codePoint !== 127
    })
    .join('')

  return cleanValue.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function generateInviteCode() {
  return `INV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

function getInvitationLink(inviteCode: string) {
  return `${window.location.origin}/agent/connexion?invite=${encodeURIComponent(inviteCode)}`
}

function formatDate(value: unknown) {
  const date =
    value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function'
      ? value.toDate()
      : null

  return date instanceof Date ? date.toLocaleString('fr-FR') : 'Date indisponible'
}

export function AdminAgentsExtensionsPage() {
  const { profile } = useAuth()
  const [extensions, setExtensions] = useState<Array<ExtensionRecord & { id: string }>>([])
  const [invitations, setInvitations] = useState<Array<InvitationRecord & { id: string }>>([])
  const [agents, setAgents] = useState<Array<UserProfile & { id: string }>>([])
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const extensionsQuery = query(collection(firestoreDb, 'extensions'), orderBy('createdAt', 'desc'))
    const invitationsQuery = query(collection(firestoreDb, 'invitations'), orderBy('createdAt', 'desc'))
    const agentsQuery = query(collection(firestoreDb, 'users'), orderBy('createdAt', 'desc'))

    const unsubscribeExtensions = onSnapshot(extensionsQuery, (snapshot) => {
      setExtensions(snapshot.docs.map((document) => ({ id: document.id, ...(document.data() as ExtensionRecord) })))
    })

    const unsubscribeInvitations = onSnapshot(invitationsQuery, (snapshot) => {
      setInvitations(snapshot.docs.map((document) => ({ id: document.id, ...(document.data() as InvitationRecord) })))
    })

    const unsubscribeAgents = onSnapshot(agentsQuery, (snapshot) => {
      setAgents(
        snapshot.docs
          .map((document) => ({ id: document.id, ...(document.data() as UserProfile) }))
          .filter((user) => user.role === 'agent'),
      )
    })

    return () => {
      unsubscribeExtensions()
      unsubscribeInvitations()
      unsubscribeAgents()
    }
  }, [])

  const extensionOptions = useMemo(
    () => extensions.filter((extension) => extension.status === 'active'),
    [extensions],
  )

  const handleExtensionSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setMessage(null)

    const formData = new FormData(event.currentTarget)
    const name = String(formData.get('name') ?? '').trim()
    const city = String(formData.get('city') ?? '').trim()
    const managerName = String(formData.get('managerName') ?? '').trim()
    const code = String(formData.get('code') ?? '').trim() || slugify(name)

    try {
      if (!profile) {
        throw new Error('Session invalide. Veuillez vous reconnecter.')
      }

      if (!name || !city) {
        throw new Error('Veuillez remplir le nom et la ville de l\'extension.')
      }

      const extensionRef = doc(firestoreDb, 'extensions', code)
      await setDoc(extensionRef, {
        name,
        code,
        city,
        status: 'active',
        managerName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      event.currentTarget.reset()
      setMessage('Extension enregistree avec succes.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erreur lors de la creation de l\'extension.')
    } finally {
      setLoading(false)
    }
  }

  const handleInvitationSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setMessage(null)

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '').trim().toLowerCase()
    const fullName = String(formData.get('fullName') ?? '').trim()
    const selectedExtensions = Array.from(formData.getAll('extensionIds')).map(String).filter(Boolean)

    try {
      if (!profile) {
        throw new Error('Session invalide. Veuillez vous reconnecter.')
      }

      if (!email || !fullName) {
        throw new Error('Veuillez saisir le nom complet et l\'email.')
      }

      const inviteCode = generateInviteCode()
      const invitationLink = getInvitationLink(inviteCode)

      await addDoc(collection(firestoreDb, 'invitations'), {
        email,
        fullName,
        role: 'agent',
        extensionIds: selectedExtensions,
        status: 'pending',
        inviteCode,
        invitationLink,
        createdAt: serverTimestamp(),
        createdById: profile.uid,
        createdByName: profile.fullName,
      })

      event.currentTarget.reset()
      setMessage(`Invitation creee: ${invitationLink}`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erreur lors de la creation de l\'invitation.')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setMessage(null)

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('profileEmail') ?? '').trim().toLowerCase()
    const fullName = String(formData.get('profileFullName') ?? '').trim()
    const role = String(formData.get('profileRole') ?? 'agent') as 'agent' | 'admin'
    const extensionIds = Array.from(formData.getAll('profileExtensionIds')).map(String).filter(Boolean)

    try {
      if (!profile) {
        throw new Error('Session invalide. Veuillez vous reconnecter.')
      }

      if (!email || !fullName) {
        throw new Error('Veuillez renseigner le nom complet et l\'email du profil.')
      }

      const profileId = email.replace(/[^a-z0-9]/g, '_')
      await setDoc(doc(firestoreDb, 'users', profileId), {
        email,
        fullName,
        role,
        status: 'disabled',
        extensionIds,
        profileStage: 'invited',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      event.currentTarget.reset()
      setMessage('Profil initial cree. Activez ensuite le compte Auth correspondant.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erreur lors de la creation du profil initial.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-slate-900">Agents et extensions</h2>
        <p className="mt-1 text-sm text-[var(--elbar-muted)]">
          Creation d\'extensions, invitations agents et profils initiaux.
        </p>
      </header>

      {message ? <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">{message}</p> : null}

      <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <form className="fintech-card space-y-4 p-4" onSubmit={handleExtensionSubmit}>
          <h3 className="text-base font-bold text-slate-900">Nouvelle extension</h3>
          <label className="block space-y-1 text-sm font-semibold text-slate-700">
            Nom
            <input name="name" className="w-full rounded-xl border border-[var(--elbar-border)] bg-white px-3 py-2 text-sm" placeholder="Ex: Goma Centre" />
          </label>
          <label className="block space-y-1 text-sm font-semibold text-slate-700">
            Ville
            <input name="city" className="w-full rounded-xl border border-[var(--elbar-border)] bg-white px-3 py-2 text-sm" placeholder="Ex: Goma" />
          </label>
          <label className="block space-y-1 text-sm font-semibold text-slate-700">
            Code
            <input name="code" className="w-full rounded-xl border border-[var(--elbar-border)] bg-white px-3 py-2 text-sm" placeholder="goma-centre" />
          </label>
          <label className="block space-y-1 text-sm font-semibold text-slate-700">
            Responsable
            <input name="managerName" className="w-full rounded-xl border border-[var(--elbar-border)] bg-white px-3 py-2 text-sm" placeholder="Nom du responsable" />
          </label>
          <button type="submit" disabled={loading} className="rounded-xl bg-[var(--elbar-brand)] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? 'Enregistrement...' : 'Creer l\'extension'}
          </button>
        </form>

        <div className="space-y-4">
          <form className="fintech-card grid gap-4 p-4" onSubmit={handleInvitationSubmit}>
            <h3 className="text-base font-bold text-slate-900">Inviter un agent</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1 text-sm font-semibold text-slate-700">
                Nom complet
                <input name="fullName" className="w-full rounded-xl border border-[var(--elbar-border)] bg-white px-3 py-2 text-sm" placeholder="Nom de l'agent" />
              </label>
              <label className="block space-y-1 text-sm font-semibold text-slate-700">
                Email
                <input name="email" type="email" className="w-full rounded-xl border border-[var(--elbar-border)] bg-white px-3 py-2 text-sm" placeholder="agent@elbar.cd" />
              </label>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-700">Extensions associees</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {extensionOptions.length === 0 ? (
                  <p className="text-sm text-[var(--elbar-muted)]">Creer d'abord une extension active.</p>
                ) : (
                  extensionOptions.map((extension) => (
                    <label key={extension.id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      <input type="checkbox" name="extensionIds" value={extension.id} />
                      <span>{extension.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <button type="submit" disabled={loading} className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? 'Invitation...' : 'Generer invitation'}
            </button>
          </form>

          <form className="fintech-card grid gap-4 p-4" onSubmit={handleProfileSubmit}>
            <h3 className="text-base font-bold text-slate-900">Profil initial agent</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1 text-sm font-semibold text-slate-700">
                Nom complet
                <input name="profileFullName" className="w-full rounded-xl border border-[var(--elbar-border)] bg-white px-3 py-2 text-sm" placeholder="Nom complet" />
              </label>
              <label className="block space-y-1 text-sm font-semibold text-slate-700">
                Email
                <input name="profileEmail" type="email" className="w-full rounded-xl border border-[var(--elbar-border)] bg-white px-3 py-2 text-sm" placeholder="agent@elbar.cd" />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1 text-sm font-semibold text-slate-700">
                Role
                <select name="profileRole" defaultValue="agent" className="w-full rounded-xl border border-[var(--elbar-border)] bg-white px-3 py-2 text-sm">
                  <option value="agent">Agent</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <label className="block space-y-1 text-sm font-semibold text-slate-700">
                Statut initial
                <input value="disabled" readOnly className="w-full rounded-xl border border-[var(--elbar-border)] bg-slate-50 px-3 py-2 text-sm text-slate-600" />
              </label>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-700">Extensions</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {extensionOptions.length === 0 ? (
                  <p className="text-sm text-[var(--elbar-muted)]">Creer d'abord une extension active.</p>
                ) : (
                  extensionOptions.map((extension) => (
                    <label key={extension.id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      <input type="checkbox" name="profileExtensionIds" value={extension.id} />
                      <span>{extension.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <button type="submit" disabled={loading} className="rounded-xl bg-[var(--elbar-brand)] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? 'Creation...' : 'Creer le profil initial'}
            </button>
          </form>

          <article className="fintech-card overflow-hidden p-4">
            <h3 className="text-base font-bold text-slate-900">Extensions existantes</h3>
            <div className="mt-3 space-y-2">
              {extensions.length === 0 ? (
                <p className="text-sm text-[var(--elbar-muted)]">Aucune extension enregistree.</p>
              ) : (
                extensions.map((extension) => (
                  <div key={extension.id} className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{extension.name}</p>
                        <p className="text-xs text-slate-500">{extension.city} • {extension.code}</p>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                        {extension.status}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-[var(--elbar-muted)]">Responsable: {extension.managerName || 'Non defini'}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatDate(extension.createdAt)}</p>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="fintech-card overflow-hidden p-4">
            <h3 className="text-base font-bold text-slate-900">Invitations</h3>
            <div className="mt-3 space-y-2">
              {invitations.length === 0 ? (
                <p className="text-sm text-[var(--elbar-muted)]">Aucune invitation.</p>
              ) : (
                invitations.map((invitation) => (
                  <div key={invitation.id} className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{invitation.fullName}</p>
                        <p className="text-xs text-slate-500">{invitation.email}</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                        {invitation.status}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-600">Code: {invitation.inviteCode}</p>
                    <p className="mt-1 break-all text-xs text-[var(--elbar-brand)]">{invitation.invitationLink}</p>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="fintech-card overflow-hidden p-4">
            <h3 className="text-base font-bold text-slate-900">Profils agents</h3>
            <div className="mt-3 space-y-2">
              {agents.length === 0 ? (
                <p className="text-sm text-[var(--elbar-muted)]">Aucun profil agent.</p>
              ) : (
                agents.map((agent) => (
                  <div key={agent.id} className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{agent.fullName}</p>
                        <p className="text-xs text-slate-500">{agent.email}</p>
                      </div>
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                        {agent.status}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-[var(--elbar-muted)]">Extensions: {agent.extensionIds.join(', ') || 'Aucune'}</p>
                    <p className="mt-1 text-xs text-slate-500">Profil initial: {agent.profileStage ?? 'n/a'}</p>
                  </div>
                ))
              )}
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}