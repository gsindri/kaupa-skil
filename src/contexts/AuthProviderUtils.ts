import { createContext } from 'react'
import type {
  User,
  Session,
  AuthTokenResponse,
  AuthResponse,
} from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'

export interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  profileLoading: boolean
  isInitialized: boolean
  error: string | null
  refetch: () => Promise<void>
  signIn: (
    email: string,
    password: string,
    remember?: boolean
  ) => Promise<AuthTokenResponse>
  signUp: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<AuthResponse>
  signOut: () => Promise<void>
  resendConfirmation: (email: string) => Promise<AuthResponse>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
