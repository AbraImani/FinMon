import * as admin from 'firebase-admin'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { FieldValue } from 'firebase-admin/firestore'

admin.initializeApp()

const db = admin.firestore()

function resolveRiskFlag(gapUsd: number, gapCdf: number): 'normal' | 'watch' | 'suspect' {
  const absUsd = Math.abs(gapUsd)
  const absCdf = Math.abs(gapCdf)

  if (absUsd > 25 || absCdf > 70000) {
    return 'suspect'
  }

  if (absUsd > 5 || absCdf > 15000) {
    return 'watch'
  }

  return 'normal'
}

async function getActiveUserProfile(uid: string) {
  const profileSnap = await db.collection('users').doc(uid).get()
  if (!profileSnap.exists) {
    throw new HttpsError('permission-denied', 'Profil utilisateur introuvable.')
  }

  const profile = profileSnap.data() as {
    role?: string
    status?: string
    fullName?: string
  }

  if (profile.status !== 'active') {
    throw new HttpsError('permission-denied', 'Compte inactif.')
  }

  return profile
}

export const submitDailyClosureSecure = onCall({ region: 'us-central1' }, async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Authentification requise.')
  }

  const uid = request.auth.uid
  const profile = await getActiveUserProfile(uid)

  if (profile.role !== 'agent') {
    throw new HttpsError('permission-denied', 'Acces reserve aux agents.')
  }

  const payload = request.data as {
    dateKey?: unknown
    declaredCashUsd?: unknown
    declaredCashCdf?: unknown
    expectedCashUsd?: unknown
    expectedCashCdf?: unknown
  }

  const dateKey = typeof payload.dateKey === 'string' ? payload.dateKey : ''
  const declaredCashUsd = typeof payload.declaredCashUsd === 'number' ? payload.declaredCashUsd : NaN
  const declaredCashCdf = typeof payload.declaredCashCdf === 'number' ? payload.declaredCashCdf : NaN
  const expectedCashUsd = typeof payload.expectedCashUsd === 'number' ? payload.expectedCashUsd : NaN
  const expectedCashCdf = typeof payload.expectedCashCdf === 'number' ? payload.expectedCashCdf : NaN

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    throw new HttpsError('invalid-argument', 'dateKey invalide.')
  }

  const numericFields = [declaredCashUsd, declaredCashCdf, expectedCashUsd, expectedCashCdf]
  if (numericFields.some((value) => Number.isNaN(value) || !Number.isFinite(value) || value < 0)) {
    throw new HttpsError('invalid-argument', 'Les montants doivent etre des nombres positifs.')
  }

  const closureId = `${uid}_${dateKey}`
  const closureRef = db.collection('dailyClosures').doc(closureId)

  await db.runTransaction(async (tx) => {
    const existing = await tx.get(closureRef)
    if (existing.exists) {
      throw new HttpsError('already-exists', 'Une cloture existe deja pour cette date.')
    }

    const gapUsd = declaredCashUsd - expectedCashUsd
    const gapCdf = declaredCashCdf - expectedCashCdf
    const riskFlag = resolveRiskFlag(gapUsd, gapCdf)

    tx.set(closureRef, {
      dateKey,
      declaredCashUsd,
      declaredCashCdf,
      expectedCashUsd,
      expectedCashCdf,
      gapUsd,
      gapCdf,
      riskFlag,
      status: 'submitted',
      submittedAt: FieldValue.serverTimestamp(),
      reviewedAt: null,
      reviewNote: '',
      createdById: uid,
      createdByName: profile.fullName ?? 'Agent',
    })
  })

  return {
    success: true,
    closureId,
  }
})

export const reviewDailyClosureSecure = onCall({ region: 'us-central1' }, async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Authentification requise.')
  }

  const uid = request.auth.uid
  const profile = await getActiveUserProfile(uid)

  if (profile.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Acces reserve aux administrateurs.')
  }

  const payload = request.data as {
    closureId?: unknown
    action?: unknown
    reviewNote?: unknown
  }

  const closureId = typeof payload.closureId === 'string' ? payload.closureId : ''
  const action = payload.action === 'reviewed' || payload.action === 'locked' ? payload.action : null
  const reviewNoteRaw = typeof payload.reviewNote === 'string' ? payload.reviewNote.trim() : ''
  const reviewNote = reviewNoteRaw.slice(0, 500)

  if (!closureId) {
    throw new HttpsError('invalid-argument', 'Identifiant de cloture manquant.')
  }

  if (!action) {
    throw new HttpsError('invalid-argument', 'Action invalide.')
  }

  const closureRef = db.collection('dailyClosures').doc(closureId)

  await db.runTransaction(async (tx) => {
    const snapshot = await tx.get(closureRef)
    if (!snapshot.exists) {
      throw new HttpsError('not-found', 'Cloture introuvable.')
    }

    const closure = snapshot.data() as {
      status?: string
      gapUsd?: number
      gapCdf?: number
      riskFlag?: string
    }

    const currentStatus = closure.status
    if (action === 'reviewed' && currentStatus !== 'submitted') {
      throw new HttpsError('failed-precondition', 'Transition de statut invalide vers reviewed.')
    }

    if (action === 'locked' && currentStatus !== 'submitted' && currentStatus !== 'reviewed') {
      throw new HttpsError('failed-precondition', 'Transition de statut invalide vers locked.')
    }

    const gapUsd = typeof closure.gapUsd === 'number' ? closure.gapUsd : 0
    const gapCdf = typeof closure.gapCdf === 'number' ? closure.gapCdf : 0
    const normalizedRisk = resolveRiskFlag(gapUsd, gapCdf)

    tx.update(closureRef, {
      status: action,
      riskFlag: normalizedRisk,
      reviewedAt: FieldValue.serverTimestamp(),
      reviewedById: uid,
      reviewedByName: profile.fullName ?? 'Administrateur',
      reviewNote,
    })

    const auditRef = db.collection('auditLogs').doc()
    tx.set(auditRef, {
      actorId: uid,
      actorName: profile.fullName ?? 'Administrateur',
      module: 'closures',
      action: action === 'locked' ? 'lock-closure-secure' : 'review-closure-secure',
      targetCollection: 'dailyClosures',
      targetId: closureId,
      before: {
        status: currentStatus ?? null,
        riskFlag: closure.riskFlag ?? null,
      },
      after: {
        status: action,
        riskFlag: normalizedRisk,
        reviewNote,
      },
      metadata: {},
      createdAt: FieldValue.serverTimestamp(),
    })
  })

  return {
    success: true,
    closureId,
    status: action,
  }
})

export const reviewExpenseSecure = onCall({ region: 'us-central1' }, async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Authentification requise.')
  }

  const uid = request.auth.uid
  const profile = await getActiveUserProfile(uid)

  if (profile.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Acces reserve aux administrateurs.')
  }

  const payload = request.data as {
    expenseId?: unknown
    action?: unknown
    reviewNote?: unknown
  }

  const expenseId = typeof payload.expenseId === 'string' ? payload.expenseId : ''
  const action = payload.action === 'approved' || payload.action === 'rejected' ? payload.action : null
  const reviewNoteRaw = typeof payload.reviewNote === 'string' ? payload.reviewNote.trim() : ''
  const reviewNote = reviewNoteRaw.slice(0, 500)

  if (!expenseId) {
    throw new HttpsError('invalid-argument', 'Identifiant de depense manquant.')
  }

  if (!action) {
    throw new HttpsError('invalid-argument', 'Action invalide.')
  }

  if (action === 'rejected' && !reviewNote) {
    throw new HttpsError('invalid-argument', 'Le motif est obligatoire pour un rejet.')
  }

  const expenseRef = db.collection('expenses').doc(expenseId)

  await db.runTransaction(async (tx) => {
    const snapshot = await tx.get(expenseRef)
    if (!snapshot.exists) {
      throw new HttpsError('not-found', 'Depense introuvable.')
    }

    const expense = snapshot.data() as {
      status?: string
      reviewNote?: string
      createdById?: string
      createdByName?: string
      category?: string
      amount?: number
      currency?: string
      reason?: string
      dateKey?: string
      submittedAt?: unknown
    }

    if (expense.status !== 'pending') {
      throw new HttpsError('failed-precondition', 'La depense n\'est plus en attente.')
    }

    tx.update(expenseRef, {
      status: action,
      reviewNote: action === 'approved' ? '' : reviewNote,
      reviewedAt: FieldValue.serverTimestamp(),
      reviewedById: uid,
      reviewedByName: profile.fullName ?? 'Administrateur',
    })

    const auditRef = db.collection('auditLogs').doc()
    tx.set(auditRef, {
      actorId: uid,
      actorName: profile.fullName ?? 'Administrateur',
      module: 'expenses',
      action: action === 'approved' ? 'approve-expense-secure' : 'reject-expense-secure',
      targetCollection: 'expenses',
      targetId: expenseId,
      before: {
        status: expense.status ?? null,
        reviewNote: expense.reviewNote ?? null,
      },
      after: {
        status: action,
        reviewNote: action === 'approved' ? '' : reviewNote,
      },
      metadata: {
        category: expense.category ?? null,
        amount: expense.amount ?? null,
        currency: expense.currency ?? null,
        dateKey: expense.dateKey ?? null,
        createdById: expense.createdById ?? null,
        createdByName: expense.createdByName ?? null,
      },
      createdAt: FieldValue.serverTimestamp(),
    })
  })

  return {
    success: true,
    expenseId,
    status: action,
  }
})
