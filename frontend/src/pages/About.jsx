import { SiteLayout } from '@/components/site/site-layout'

export default function About() {
  return (
    <SiteLayout>
      <header className="bg-surface px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-5xl font-extrabold tracking-tight">
            We build the bridge from school to career.
          </h1>
          <p className="mt-6 text-lg text-slate-600">
            Bridge is a focused marketplace for students and early-career talent. We're building the
            tools we wish we'd had when we landed our first roles.
          </p>
        </div>
      </header>
      <main className="mx-auto grid max-w-5xl gap-12 px-6 py-16 md:grid-cols-3">
        {[
          { n: '200K+', l: 'Active students' },
          { n: '12K+', l: 'Hiring companies' },
          { n: '$48M', l: 'In paid internships' },
        ].map((s) => (
          <div key={s.l} className="rounded-3xl border border-slate-200 bg-white p-8 text-center">
            <div className="text-4xl font-extrabold text-primary">{s.n}</div>
            <div className="mt-2 text-sm font-semibold text-slate-500">{s.l}</div>
          </div>
        ))}
      </main>
    </SiteLayout>
  )
}
