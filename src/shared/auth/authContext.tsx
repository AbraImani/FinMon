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
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import { firebaseAuth, firestoreDb } from '../config/firebase'
import type { AppUserContext, UserProfile } from '../types/domain'

interface AuthContextValue {
  user: User | null
  profile: AppUserContext | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<UserProfile | null>
  signOutUser: () => Promise<void>
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

    const unsubscribeAuth = onAuthStateChanged(firebaseAuth, (currentUser) => {
      unsubscribeProfile?.()
      setUser(currentUser)

      if (!currentUser) {
        setProfile(null)
        setLoading(false)
        return
      }

      const profileRef = doc(firestoreDb, 'users', currentUser.uid)
      unsubscribeProfile = onSnapshot(profileRef, (snapshot) => {
        const data = snapshot.exists() ? (snapshot.data() as UserProfile) : null
        setProfile(mapProfile(currentUser, data))
        setLoading(false)
      })
    })

    return () => {
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
          await signOut(firebaseAuth)
          return null
        }

        return profileSnapshot.data() as UserProfile
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
