/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { collection, doc, getDoc, getDocs, onSnapshot, limit, query, setDoc, where } from 'firebase/firestore'
import { firebaseAuth, firestoreDb } from '../config/firebase'
import type { AppUserContext, UserProfile } from '../types/domain'

interface AuthContextValue {
  user: User | null
  profile: AppUserContext | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<UserProfile | null>
  signInWithGoogleAdmin: () => Promise<UserProfile | null>
  signOutUser: () => Promise<void>
}

const adminAllowedEmails = new Set(['eliaraphael19@gmail.com', 'abrahamfaith325@gmail.com'])

function normalizeEmail(value: string) {
  const lowered = value.trim().toLowerCase()
  return lowered.endsWith('@gmail') ? `${lowered}.com` : lowered
}

async function findProfileByEmail(email: string) {
  const emailQuery = query(
    collection(firestoreDb, 'users'),
    where('email', '==', normalizeEmail(email)),
    limit(1),
  )

  try {
    const profileSnapshot = await getDocs(emailQuery)
    return profileSnapshot.empty ? null : ({ id: profileSnapshot.docs[0].id, ...profileSnapshot.docs[0].data() } as UserProfile & { id: string })
  } catch {
    return null
  }
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function mapProfile(user: User, profile: UserProfile | null): AppUserContext {
  return {
    uid: user.uid,
    email: user.email,
    fullName: profile?.fullName ?? user.displayName ?? user.email ?? 'Utilisateur',
    role: profile?.role ?? null,
    status: profile?.status ?? null,
    extensionIds: profile?.extensionIds ?? [],
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<AppUserContext | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined
    let cancelled = false

    const unsubscribeAuth = onAuthStateChanged(firebaseAuth, async (currentUser) => {
      unsubscribeProfile?.()
      setUser(currentUser)

      if (!currentUser) {
        setProfile(null)
        setLoading(false)
        return
      }

      const profileRef = doc(firestoreDb, 'users', currentUser.uid)

      const uidSnapshot = await getDoc(profileRef)
      if (cancelled) {
        return
      }

      if (uidSnapshot.exists()) {
        setProfile(mapProfile(currentUser, uidSnapshot.data() as UserProfile))
        unsubscribeProfile = onSnapshot(profileRef, (snapshot) => {
          const data = snapshot.exists() ? (snapshot.data() as UserProfile) : null
          setProfile(mapProfile(currentUser, data))
          setLoading(false)
        })
        return
      }

      if (currentUser.email) {
        const emailProfile = await findProfileByEmail(currentUser.email)
        if (cancelled) {
          return
        }

        if (emailProfile) {
          const emailProfileRef = doc(firestoreDb, 'users', emailProfile.id)
          setProfile(mapProfile(currentUser, emailProfile))
          unsubscribeProfile = onSnapshot(emailProfileRef, (snapshot) => {
            const data = snapshot.exists() ? (snapshot.data() as UserProfile) : null
            setProfile(mapProfile(currentUser, data))
            setLoading(false)
          })
          return
        }
      }

      setProfile(mapProfile(currentUser, null))
      setLoading(false)
    })

    return () => {
      cancelled = true
      unsubscribeProfile?.()
      unsubscribeAuth()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      signIn: async (email: string, password: string) => {
        const credential = await signInWithEmailAndPassword(firebaseAuth, email, password)
        const profileRef = doc(firestoreDb, 'users', credential.user.uid)
        const profileSnapshot = await getDoc(profileRef)
        if (!profileSnapshot.exists()) {
          const fallbackProfile = credential.user.email ? await findProfileByEmail(credential.user.email) : null

          if (!fallbackProfile) {
            await signOut(firebaseAuth)
            return null
          }

          return fallbackProfile as UserProfile
        }

        return profileSnapshot.data() as UserProfile
      },
      signInWithGoogleAdmin: async () => {
        const provider = new GoogleAuthProvider()
        provider.setCustomParameters({ prompt: 'select_account' })

        const credential = await signInWithPopup(firebaseAuth, provider)
        const email = credential.user.email ? normalizeEmail(credential.user.email) : ''

        if (!adminAllowedEmails.has(email)) {
          await signOut(firebaseAuth)
          throw new Error('Acces refuse. Compte Google non autorise pour l\'administration.')
        }

        const profileRef = doc(firestoreDb, 'users', credential.user.uid)
        const profileSnapshot = await getDoc(profileRef)
        const profileData = profileSnapshot.exists() ? (profileSnapshot.data() as UserProfile) : null

        const adminProfile: UserProfile = {
          fullName: credential.user.displayName?.trim() || credential.user.email || 'Administrateur',
          email: credential.user.email || email,
          role: 'admin',
          status: 'active',
          extensionIds: [],
          profileStage: 'completed',
        }

        if (!profileData) {
          await setDoc(profileRef, adminProfile, { merge: true })
          return adminProfile
        }

        if (profileData.role !== 'admin' || profileData.status !== 'active') {
          const normalizedProfile = {
            ...profileData,
            ...adminProfile,
          }

          await setDoc(profileRef, normalizedProfile, { merge: true })
          return normalizedProfile
        }

        return profileData
      },
      signOutUser: async () => {
        await signOut(firebaseAuth)
      },
    }),
    [loading, profile, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth doit etre utilise dans AuthProvider')
  }

  return context
}
