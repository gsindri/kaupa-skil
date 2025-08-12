
import React, { useState } from 'react'
import { Building2 } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { Link } from 'react-router-dom'
import { toast } from '@/hooks/use-toast'

export default function PasswordReset() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      })

      if (error) throw error

      setIsSuccess(true)
      toast({
        title: "Reset email sent",
        description: "Check your email for password reset instructions.",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-2xl bg-blue-50 px-3 py-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <Building2 className="h-4 w-4" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-gray-900">Iceland B2B Wholesale</p>
              <p className="text-xs text-gray-600">Reset your password</p>
            </div>
          </div>
        </div>

        {isSuccess ? (
          <div className="rounded-md bg-green-50 p-4">
            <div className="text-sm text-green-700">
              We've sent a password reset link to your email address.
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="relative block w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                placeholder="Enter your email address"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative flex w-full justify-center rounded-xl bg-gray-900 py-2.5 px-4 text-sm font-semibold text-white hover:bg-black focus:outline-none focus:ring-4 focus:ring-black/20 disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Send reset email'}
              </button>
            </div>
          </form>
        )}

        <div className="text-center">
          <Link
            to="/login"
            className="text-sm text-blue-600 hover:underline"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
