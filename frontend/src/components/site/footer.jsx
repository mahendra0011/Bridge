import { Link } from 'react-router-dom'
import { GraduationCap, Building2, Scale, ArrowUpRight } from 'lucide-react'

const colIcons = {
  'For Students': GraduationCap,
  'For Companies': Building2,
  'Legal & Support': Scale,
}

function FooterCol({ title, links }) {
  const Icon = colIcons[title]
  return (
    <div>
      <h5 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
        {Icon && <Icon className="size-3.5" />}
        {title}
      </h5>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              to={l.to}
              className="group inline-flex items-center gap-1.5 text-sm text-slate-500 transition-all duration-200 hover:text-primary"
            >
              <span>{l.label}</span>
              <ArrowUpRight className="size-3 opacity-0 -translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Footer() {
  return (
    <footer className="relative border-t border-slate-100 bg-gradient-to-b from-slate-50 to-white px-4 py-12 sm:px-6 sm:py-20">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 bottom-0 size-64 rounded-full bg-primary/[0.02] blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4 sm:gap-12">
          <div className="col-span-2 space-y-4 sm:col-span-1">
            <div className="inline-flex items-center gap-2 rounded-2xl bg-primary/10 px-4 py-2">
              <div className="grid size-7 place-items-center rounded-lg bg-primary text-xs font-extrabold text-white">B</div>
              <span className="text-lg font-extrabold tracking-tight text-primary">BRIDGE</span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-slate-500">
              Empowering students through meaningful work experiences.
            </p>
            <div className="flex gap-3 pt-2">
              {['TW', 'LI', 'GH', 'YT'].map((s) => (
                <span key={s} className="grid size-8 place-items-center rounded-lg border border-slate-200 text-[10px] font-bold text-slate-400 transition-all hover:border-primary hover:text-primary hover:shadow-sm cursor-default">
                  {s}
                </span>
              ))}
            </div>
          </div>
          <FooterCol
            title="For Students"
            links={[
              { label: 'Browse Internships', to: '/internships' },
              { label: 'Browse Jobs', to: '/jobs' },
              { label: 'My Dashboard', to: '/dashboard' },
              { label: 'My Profile', to: '/profile' },
            ]}
          />
          <FooterCol
            title="For Companies"
            links={[
              { label: 'Company Dashboard', to: '/company/dashboard' },
              { label: 'Post an Internship', to: '/company/post-internship' },
              { label: 'Post a Job', to: '/company/post-job' },
              { label: 'Company Profile', to: '/company/profile' },
            ]}
          />
          <FooterCol
            title="Legal & Support"
            links={[
              { label: 'Privacy Policy', to: '/privacy' },
              { label: 'Terms & Conditions', to: '/terms' },
              { label: 'Contact Us', to: '/contact' },
              { label: 'About', to: '/about' },
            ]}
          />
        </div>
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-8 sm:flex-row sm:pt-10">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} Bridge Marketplace Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-xs text-slate-400">
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
            <Link to="/contact" className="hover:text-primary transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
