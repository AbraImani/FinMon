export type UserRole = 'admin' | 'agent'
export type AccountStatus = 'active' | 'disabled'
export type TransactionType = 'depot' | 'retrait' | 'transfert'
export type Currency = 'USD' | 'CDF'
export type ExpenseStatus = 'pending' | 'approved' | 'rejected'
export type DailyClosureStatus = 'submitted' | 'reviewed' | 'locked'
export type AuditModule = 'transactions' | 'expenses' | 'closures' | 'rates'
export type InvitationStatus = 'pending' | 'accepted' | 'expired'

export interface AuditLogRecord {
  actorId: string
  actorName: string
  module: AuditModule
  action: string
  targetCollection: string
  targetId: string
  before: unknown
  after: unknown
  metadata: Record<string, unknown>
  createdAt?: unknown
}

export interface UserProfile {
  fullName: string
  email: string
  role: UserRole
  status: AccountStatus
  extensionIds: string[]
  profileStage?: 'invited' | 'completed'
  createdAt?: unknown
  updatedAt?: unknown
}

export interface AppUserContext {
  uid: string
  email: string | null
  fullName: string
  role: UserRole | null
  status: AccountStatus | null
  extensionIds: string[]
}

export interface TransactionRecord {
  operationRef?: string
  serviceId: string
  serviceName: string
  dateKey?: string
  operationType: TransactionType
  currency: Currency
  amount: number
  commission: number
  note: string
  createdAt?: unknown
  createdById: string
  createdByName: string
  status: 'posted'
}

export interface ExchangeRateRecord {
  usdToCdf: number
  updatedAt?: unknown
  updatedById?: string
  updatedByName?: string
}

export interface ExtensionRecord {
  name: string
  code: string
  city: string
  status: 'active' | 'inactive'
  managerName: string
  createdAt?: unknown
  updatedAt?: unknown
}

export interface InvitationRecord {
  email: string
  fullName: string
  role: UserRole
  extensionIds: string[]
  status: InvitationStatus
  inviteCode: string
  invitationLink: string
  createdAt?: unknown
  createdById: string
  createdByName: string
  acceptedAt?: unknown
}

export interface ExpenseRecord {
  dateKey?: string
  category: string
  amount: number
  currency: Currency
  reason: string
  status: ExpenseStatus
  submittedAt?: unknown
  reviewedAt?: unknown
  reviewNote: string
  createdById: string
  createdByName: string
  reviewedById?: string
  reviewedByName?: string
}

export interface DailyClosureRecord {
  dateKey: string
  declaredCashUsd: number
  declaredCashCdf: number
  expectedCashUsd: number
  expectedCashCdf: number
  gapUsd: number
  gapCdf: number
  riskFlag: 'normal' | 'watch' | 'suspect'
  status: DailyClosureStatus
  submittedAt?: unknown
  reviewedAt?: unknown
  reviewNote: string
  createdById: string
  createdByName: string
  reviewedById?: string
  reviewedByName?: string
}
