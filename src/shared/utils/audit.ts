import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { firestoreDb } from '../config/firebase'

interface AdminAuditPayload {
  actorId: string
  actorName: string
  module: 'transactions' | 'expenses' | 'closures' | 'rates'
  action: string
  targetCollection: string
  targetId: string
  before?: unknown
  after?: unknown
  metadata?: Record<string, unknown>
}

export async function logAdminAction(payload: AdminAuditPayload) {
  await addDoc(collection(firestoreDb, 'auditLogs'), {
    actorId: payload.actorId,
    actorName: payload.actorName,
    module: payload.module,
    action: payload.action,
    targetCollection: payload.targetCollection,
    targetId: payload.targetId,
    before: payload.before ?? null,
    after: payload.after ?? null,
    metadata: payload.metadata ?? {},
    createdAt: serverTimestamp(),
  })
}
