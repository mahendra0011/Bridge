import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Bell, ChevronDown, LogOut, Menu, User as UserIcon, X, Moon, Sun, Sparkles, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { GlobalSearch } from '@/components/site/global-search'
import { useDarkMode } from '@/hooks/useDarkMode'

const navLinkClass = ({ isActive }) =>
  isActive ? 'text-foreground font-semibold' : 'text-slate-600 hover:text-foreground'

const mobileNavLinkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
    isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-700 hover:bg-slate-100'
  }`

function roleHome(role) {
  if (role === 'company') return '/company/dashboard'
  if (role === 'admin') return '/admin'
  if (role === 'agency') return '/agency/dashboard'
  return '/dashboard'
}

export function Navbar() {
  const { user, logout } = useAuth()
  const { dark, toggle: toggleDark } = useDarkMode()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') { setMobileOpen(false); setMenuOpen(false) } }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const closeMobile = () => setMobileOpen(false)

  const avatarLetter = (user?.name || user?.email || '?')[0].toUpperCase()

  return (
    <>
      <nav className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-100 bg-white/95 px-4 backdrop-blur-md md:h-16 md:px-6">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-xl font-extrabold tracking-tight text-primary md:text-2xl">
            BRIDGE
          </Link>
            <div className="hidden gap-5 text-sm font-medium md:flex">
              <NavLink to="/internships" className={navLinkClass}>Internships</NavLink>
              <NavLink to="/jobs" className={navLinkClass}>Jobs</NavLink>
              <NavLink to="/opportunities" className={navLinkClass}>Opportunities</NavLink>
              <NavLink to="/agency-listings" className={navLinkClass}>Agency Listings</NavLink>
              <NavLink to="/open-to-work" className={navLinkClass}>
                Open to Work
              </NavLink>
              <NavLink to="/community" className={navLinkClass}>Community</NavLink>
              <NavLink to="/about" className={navLinkClass}>About</NavLink>
              <NavLink to="/contact" className={navLinkClass}>Contact</NavLink>
            </div>
        </div>

        <div className="flex items-center gap-1.5">
          <GlobalSearch />

          <button
            onClick={toggleDark}
            className="grid size-9 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>

          {user?.role === 'company' && (
            <Link
              to="/company/candidates"
              className="hidden md:inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-1.5 text-sm font-bold text-primary hover:bg-primary/20 transition-colors"
            >
              <Users className="size-3.5" /> Find Candidates
            </Link>
          )}

          {user && (
            <Link
              to={roleHome(user.role)}
              className="hidden md:inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-1.5 text-sm font-bold text-primary hover:bg-primary/20 transition-colors"
            >
              Dashboard
            </Link>
          )}

          {user ? (
            <>
              {user.role === 'student' && (
                <Link
                  to="/notifications"
                  className="grid size-9 place-items-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-foreground"
                  aria-label="Notifications"
                >
                  <Bell className="size-4" />
                </Link>
              )}

              <div className="relative">
                <button
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 rounded-xl px-2 py-1.5 hover:bg-slate-100 transition-colors"
                >
                  <span className="grid size-7 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {avatarLetter}
                  </span>
                  <ChevronDown className="size-3.5 text-slate-400" />
                </button>

                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                      <Link
                        to={user.role === 'student' ? '/profile' : user.role === 'company' ? '/company/profile' : roleHome(user.role)}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <UserIcon className="size-3.5" />
                        {user.role === 'admin' ? 'Dashboard' : 'My Profile'}
                      </Link>
                      <Link
                        to="/community/hub"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Community Hub
                      </Link>
                      <hr className="my-1 border-slate-100" />
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-rose-600 hover:bg-rose-50"
                      >
                        <LogOut className="size-3.5" /> Log out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="hidden items-center gap-3 md:flex">
              <Link to="/login" className="text-sm font-semibold text-foreground hover:text-primary">
                Log in
              </Link>
              <Link to="/signup">
                <Button className="rounded-full bg-brand px-5 text-brand-foreground hover:bg-brand/90">
                  Get started
                </Button>
              </Link>
            </div>
          )}

          {!user && (
            <button
              onClick={() => setMobileOpen((prev) => !prev)}
              className="grid size-9 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 md:hidden"
              aria-label="Toggle menu"
            >
              <Menu className="size-5" />
            </button>
          )}
          {user && (
            <button
              onClick={() => setMobileOpen((prev) => !prev)}
              className="grid size-9 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 md:hidden"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          )}
        </div>
      </nav>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="flex-1 bg-black/30" onClick={() => setMobileOpen(false)} />

          <div className="flex w-72 flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
              <span className="text-lg font-extrabold text-primary">BRIDGE</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="grid size-8 place-items-center rounded-lg hover:bg-slate-100"
              >
                <X className="size-5 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-4">
              <p className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-slate-400">Navigation</p>
              <NavLink to="/internships" className={mobileNavLinkClass} onClick={closeMobile}>
                Internships
              </NavLink>
              <NavLink to="/jobs" className={mobileNavLinkClass} onClick={closeMobile}>
                Jobs
              </NavLink>
              <NavLink to="/opportunities" className={mobileNavLinkClass} onClick={closeMobile}>
                Opportunities
              </NavLink>
              <NavLink to="/agency-listings" className={mobileNavLinkClass} onClick={closeMobile}>
                Agency Listings
              </NavLink>
              <NavLink to="/open-to-work" className={mobileNavLinkClass} onClick={closeMobile}>
                <Sparkles className="size-4 text-emerald-500" />
                Open to Work
              </NavLink>
              <NavLink to="/community" className={mobileNavLinkClass} onClick={closeMobile}>
                Community
              </NavLink>
              {user && (
                <NavLink to={roleHome(user.role)} className={mobileNavLinkClass} onClick={closeMobile}>
                  Dashboard
                </NavLink>
              )}
              <NavLink to="/about" className={mobileNavLinkClass} onClick={closeMobile}>
                About
              </NavLink>
              <NavLink to="/contact" className={mobileNavLinkClass} onClick={closeMobile}>
                Contact
              </NavLink>
            </div>

            <div className="border-t border-slate-100 px-3 py-3">
              {user ? (
                <div className="space-y-1">
                  <Link
                    to={user.role === 'student' ? '/profile' : user.role === 'company' ? '/company/profile' : roleHome(user.role)}
                    onClick={closeMobile}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    <UserIcon className="size-4 shrink-0" />
                    {user.role === 'admin' ? 'Dashboard' : 'My Profile'}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut className="size-4 shrink-0" /> Log out
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    to="/login"
                    onClick={closeMobile}
                    className="block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-center text-sm font-semibold text-foreground hover:bg-slate-50"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    onClick={closeMobile}
                    className="block w-full rounded-xl bg-primary px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-primary/90"
                  >
                    Get started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}