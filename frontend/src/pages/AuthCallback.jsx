import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { SiteLayout } from '@/components/site/site-layout'

function roleHome(role) {
  if (role === 'company') return '/company/dashboard'
  if (role === 'agency') return '/agency/dashboard'
  if (role === 'admin') return '/admin'
  return '/dashboard'
}

export default function AuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { loginWithToken } = useAuth()
  const [error, setError] = useState('')

  useEffect(() => {
    const encoded = searchParams.get('data')
    if (!encoded) {
      setError('No authentication data received.')
      return
    }

    try {
      const { user } = JSON.parse(atob(encoded))
      loginWithToken(user)
      // Check for ?redirect= query param (e.g., from message button)
      // URLSearchParams.get() already decodes once, so no need to decode again here
      const redirectTo = searchParams.get('redirect')
      if (redirectTo) {
        navigate(redirectTo, { replace: true })
      } else {
        navigate(roleHome(user.role), { replace: true })
      }
    } catch {
      setError('Invalid authentication data.')
    }
  }, [searchParams, loginWithToken, navigate])

  if (error) {
    return (
      <SiteLayout>
        <main className="mx-auto grid min-h-[50vh] max-w-md place-items-center px-6 py-16">
          <div className="w-full rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center">
            <p className="text-sm font-semibold text-rose-600">{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="mt-4 text-sm font-bold text-primary hover:underline"
            >
              Back to login
            </button>
          </div>
        </main>
      </SiteLayout>
    )
  }

  return (
    <SiteLayout>
      <main className="mx-auto grid min-h-[50vh] max-w-md place-items-center px-6 py-16">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-sm text-slate-500">Completing sign in…</p>
        </div>
      </main>
    </SiteLayout>
  )
}
