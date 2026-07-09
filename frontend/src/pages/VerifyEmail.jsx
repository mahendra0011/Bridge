import { useParams, Link } from 'react-router-dom'
import { SiteLayout } from '@/components/site/site-layout'
import { CheckCircle, XCircle, Loader } from 'lucide-react'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

export default function VerifyEmail() {
  const { token } = useParams()
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let cancelled = false
    api
      .get(`/api/auth/verify-email/${token}`)
      .then(() => { if (!cancelled) setStatus('success') })
      .catch(() => { if (!cancelled) setStatus('error') })
    return () => { cancelled = true }
  }, [token])

  return (
    <SiteLayout>
      <main className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-6 py-16">
        <div className="w-full rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-xl shadow-slate-200/50">
          {status === 'loading' && (
            <>
              <Loader className="mx-auto mb-4 size-12 animate-spin text-primary" />
              <h2 className="text-xl font-extrabold">Verifying your email…</h2>
              <p className="mt-2 text-sm text-slate-500">Please wait a moment.</p>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle className="size-8" />
              </div>
              <h2 className="text-2xl font-extrabold">Email verified!</h2>
              <p className="mt-2 text-sm text-slate-500">Your account is now active. You can log in.</p>
              <Link to="/login" className="mt-6 inline-block rounded-xl bg-primary px-8 py-3 font-bold text-primary-foreground hover:bg-primary/90">
                Go to login
              </Link>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-rose-100 text-rose-600">
                <XCircle className="size-8" />
              </div>
              <h2 className="text-2xl font-extrabold">Link expired</h2>
              <p className="mt-2 text-sm text-slate-500">This verification link is invalid or has expired.</p>
              <Link to="/signup" className="mt-6 inline-block rounded-xl bg-primary px-8 py-3 font-bold text-primary-foreground hover:bg-primary/90">
                Sign up again
              </Link>
            </>
          )}
        </div>
      </main>
    </SiteLayout>
  )
}
