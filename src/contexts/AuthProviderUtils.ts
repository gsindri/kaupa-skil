import { createContext } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

export type Profile = Database['public']['Tables']['profiles']['Row']

export interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  profileLoading: boolean
  isInitialized: boolean
  error: string | null
  refetch: () => Promise<void>
  signIn: (email: string, password: string, remember?: boolean) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
