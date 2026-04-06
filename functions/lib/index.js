"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewExpenseSecure = exports.reviewDailyClosureSecure = exports.submitDailyClosureSecure = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
admin.initializeApp();
const db = admin.firestore();
function resolveRiskFlag(gapUsd, gapCdf) {
    const absUsd = Math.abs(gapUsd);
    const absCdf = Math.abs(gapCdf);
    if (absUsd > 25 || absCdf > 70000) {
        return 'suspect';
    }
    if (absUsd > 5 || absCdf > 15000) {
        return 'watch';
    }
    return 'normal';
}
async function getActiveUserProfile(uid) {
    const profileSnap = await db.collection('users').doc(uid).get();
    if (!profileSnap.exists) {
        throw new https_1.HttpsError('permission-denied', 'Profil utilisateur introuvable.');
    }
    const profile = profileSnap.data();
    if (profile.status !== 'active') {
        throw new https_1.HttpsError('permission-denied', 'Compte inactif.');
    }
    return profile;
}
exports.submitDailyClosureSecure = (0, https_1.onCall)({ region: 'us-central1' }, async (request) => {
    if (!request.auth?.uid) {
        throw new https_1.HttpsError('unauthenticated', 'Authentification requise.');
    }
    const uid = request.auth.uid;
    const profile = await getActiveUserProfile(uid);
    if (profile.role !== 'agent') {
        throw new https_1.HttpsError('permission-denied', 'Acces reserve aux agents.');
    }
    const payload = request.data;
    const dateKey = typeof payload.dateKey === 'string' ? payload.dateKey : '';
    const declaredCashUsd = typeof payload.declaredCashUsd === 'number' ? payload.declaredCashUsd : NaN;
    const declaredCashCdf = typeof payload.declaredCashCdf === 'number' ? payload.declaredCashCdf : NaN;
    const expectedCashUsd = typeof payload.expectedCashUsd === 'number' ? payload.expectedCashUsd : NaN;
    const expectedCashCdf = typeof payload.expectedCashCdf === 'number' ? payload.expectedCashCdf : NaN;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
        throw new https_1.HttpsError('invalid-argument', 'dateKey invalide.');
    }
    const numericFields = [declaredCashUsd, declaredCashCdf, expectedCashUsd, expectedCashCdf];
    if (numericFields.some((value) => Number.isNaN(value) || !Number.isFinite(value) || value < 0)) {
        throw new https_1.HttpsError('invalid-argument', 'Les montants doivent etre des nombres positifs.');
    }
    const closureId = `${uid}_${dateKey}`;
    const closureRef = db.collection('dailyClosures').doc(closureId);
    await db.runTransaction(async (tx) => {
        const existing = await tx.get(closureRef);
        if (existing.exists) {
            throw new https_1.HttpsError('already-exists', 'Une cloture existe deja pour cette date.');
        }
        const gapUsd = declaredCashUsd - expectedCashUsd;
        const gapCdf = declaredCashCdf - expectedCashCdf;
        const riskFlag = resolveRiskFlag(gapUsd, gapCdf);
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
            submittedAt: firestore_1.FieldValue.serverTimestamp(),
            reviewedAt: null,
            reviewNote: '',
            createdById: uid,
            createdByName: profile.fullName ?? 'Agent',
        });
    });
    return {
        success: true,
        closureId,
    };
});
exports.reviewDailyClosureSecure = (0, https_1.onCall)({ region: 'us-central1' }, async (request) => {
    if (!request.auth?.uid) {
        throw new https_1.HttpsError('unauthenticated', 'Authentification requise.');
    }
    const uid = request.auth.uid;
    const profile = await getActiveUserProfile(uid);
    if (profile.role !== 'admin') {
        throw new https_1.HttpsError('permission-denied', 'Acces reserve aux administrateurs.');
    }
    const payload = request.data;
    const closureId = typeof payload.closureId === 'string' ? payload.closureId : '';
    const action = payload.action === 'reviewed' || payload.action === 'locked' ? payload.action : null;
    const reviewNoteRaw = typeof payload.reviewNote === 'string' ? payload.reviewNote.trim() : '';
    const reviewNote = reviewNoteRaw.slice(0, 500);
    if (!closureId) {
        throw new https_1.HttpsError('invalid-argument', 'Identifiant de cloture manquant.');
    }
    if (!action) {
        throw new https_1.HttpsError('invalid-argument', 'Action invalide.');
    }
    const closureRef = db.collection('dailyClosures').doc(closureId);
    await db.runTransaction(async (tx) => {
        const snapshot = await tx.get(closureRef);
        if (!snapshot.exists) {
            throw new https_1.HttpsError('not-found', 'Cloture introuvable.');
        }
        const closure = snapshot.data();
        const currentStatus = closure.status;
        if (action === 'reviewed' && currentStatus !== 'submitted') {
            throw new https_1.HttpsError('failed-precondition', 'Transition de statut invalide vers reviewed.');
        }
        if (action === 'locked' && currentStatus !== 'submitted' && currentStatus !== 'reviewed') {
            throw new https_1.HttpsError('failed-precondition', 'Transition de statut invalide vers locked.');
        }
        const gapUsd = typeof closure.gapUsd === 'number' ? closure.gapUsd : 0;
        const gapCdf = typeof closure.gapCdf === 'number' ? closure.gapCdf : 0;
        const normalizedRisk = resolveRiskFlag(gapUsd, gapCdf);
        tx.update(closureRef, {
            status: action,
            riskFlag: normalizedRisk,
            reviewedAt: firestore_1.FieldValue.serverTimestamp(),
            reviewedById: uid,
            reviewedByName: profile.fullName ?? 'Administrateur',
            reviewNote,
        });
        const auditRef = db.collection('auditLogs').doc();
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
            createdAt: firestore_1.FieldValue.serverTimestamp(),
        });
    });
    return {
        success: true,
        closureId,
        status: action,
    };
});
exports.reviewExpenseSecure = (0, https_1.onCall)({ region: 'us-central1' }, async (request) => {
    if (!request.auth?.uid) {
        throw new https_1.HttpsError('unauthenticated', 'Authentification requise.');
    }
    const uid = request.auth.uid;
    const profile = await getActiveUserProfile(uid);
    if (profile.role !== 'admin') {
        throw new https_1.HttpsError('permission-denied', 'Acces reserve aux administrateurs.');
    }
    const payload = request.data;
    const expenseId = typeof payload.expenseId === 'string' ? payload.expenseId : '';
    const action = payload.action === 'approved' || payload.action === 'rejected' ? payload.action : null;
    const reviewNoteRaw = typeof payload.reviewNote === 'string' ? payload.reviewNote.trim() : '';
    const reviewNote = reviewNoteRaw.slice(0, 500);
    if (!expenseId) {
        throw new https_1.HttpsError('invalid-argument', 'Identifiant de depense manquant.');
    }
    if (!action) {
        throw new https_1.HttpsError('invalid-argument', 'Action invalide.');
    }
    if (action === 'rejected' && !reviewNote) {
        throw new https_1.HttpsError('invalid-argument', 'Le motif est obligatoire pour un rejet.');
    }
    const expenseRef = db.collection('expenses').doc(expenseId);
    await db.runTransaction(async (tx) => {
        const snapshot = await tx.get(expenseRef);
        if (!snapshot.exists) {
            throw new https_1.HttpsError('not-found', 'Depense introuvable.');
        }
        const expense = snapshot.data();
        if (expense.status !== 'pending') {
            throw new https_1.HttpsError('failed-precondition', 'La depense n\'est plus en attente.');
        }
        tx.update(expenseRef, {
            status: action,
            reviewNote: action === 'approved' ? '' : reviewNote,
            reviewedAt: firestore_1.FieldValue.serverTimestamp(),
            reviewedById: uid,
            reviewedByName: profile.fullName ?? 'Administrateur',
        });
        const auditRef = db.collection('auditLogs').doc();
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
            createdAt: firestore_1.FieldValue.serverTimestamp(),
        });
    });
    return {
        success: true,
        expenseId,
        status: action,
    };
});
