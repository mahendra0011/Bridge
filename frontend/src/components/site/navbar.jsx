import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Bell, ChevronDown, LogOut, Menu, User as UserIcon, X, Moon, Sun, Sparkles, Users, Info, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { GlobalSearch } from '@/components/site/global-search'
import { useDarkMode } from '@/hooks/useDarkMode'

const navLinkClass = ({ isActive }) =>
  `whitespace-nowrap rounded-lg px-2 xl:px-2.5 py-1 text-xs xl:text-sm font-medium transition-colors ${
    isActive
      ? 'bg-primary/10 text-primary font-semibold'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
  }`

const mobileNavLinkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
    isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
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
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef(null)

  useEffect(() => {
    setMobileOpen(false)
    setMenuOpen(false)
    setMoreOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        setMobileOpen(false)
        setMenuOpen(false)
        setMoreOpen(false)
      }
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    document.addEventListener('mousedown', handler)
    return () => {
      window.removeEventListener('keydown', handler)
      document.removeEventListener('mousedown', handler)
    }
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
      <nav className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-100 bg-white/95 px-3 md:px-5 backdrop-blur-md md:h-16 dark:border-slate-800 dark:bg-slate-900/95">
        <div className="flex items-center gap-2 lg:gap-3 xl:gap-5 min-w-0">
          <Link to="/" className="text-xl font-extrabold tracking-tight text-primary md:text-2xl shrink-0">
            BRIDGE
          </Link>
          <div className="hidden items-center gap-1 xl:gap-1.5 text-xs xl:text-sm font-medium lg:flex min-w-0">
            <NavLink to="/internships" className={navLinkClass}>Internships</NavLink>
            <NavLink to="/jobs" className={navLinkClass}>Jobs</NavLink>
            <NavLink to="/opportunities" className={navLinkClass}>Opportunities</NavLink>
            <NavLink to="/agency-listings" className={navLinkClass}>
              <span className="hidden xl:inline">Agency Listings</span>
              <span className="xl:hidden">Agencies</span>
            </NavLink>
            <NavLink to="/resume-templates" className={navLinkClass}>Templates</NavLink>
            <NavLink to="/resume-builder" className={navLinkClass}>
              Resume Builder
            </NavLink>
            <NavLink to="/open-to-work" className={navLinkClass}>
              Open to Work
            </NavLink>

            {/* Direct links on wide screens (2xl: 1536px+) */}
            <div className="hidden 2xl:flex items-center gap-1 xl:gap-1.5">
              <NavLink to="/community" className={navLinkClass}>Community</NavLink>
              <NavLink to="/about" className={navLinkClass}>About</NavLink>
              <NavLink to="/contact" className={navLinkClass}>Contact</NavLink>
            </div>

            {/* Compact More dropdown on lg and xl screens */}
            <div className="relative 2xl:hidden" ref={moreRef}>
              <button
                type="button"
                onClick={() => setMoreOpen((prev) => !prev)}
                className={`flex items-center gap-1 whitespace-nowrap rounded-lg px-2 xl:px-2.5 py-1 text-xs xl:text-sm font-medium transition-colors ${
                  moreOpen || ['/community', '/about', '/contact'].includes(location.pathname)
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}
                aria-expanded={moreOpen}
              >
                <span>More</span>
                <ChevronDown className={`size-3.5 transition-transform duration-150 ${moreOpen ? 'rotate-180' : ''}`} />
              </button>

              {moreOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)} />
                  <div className="absolute left-0 mt-2 w-44 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <Link
                      to="/community"
                      onClick={() => setMoreOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs xl:text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-primary dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Users className="size-4 text-slate-400" />
                      <span>Community</span>
                    </Link>
                    <Link
                      to="/about"
                      onClick={() => setMoreOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs xl:text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-primary dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Info className="size-4 text-slate-400" />
                      <span>About Us</span>
                    </Link>
                    <Link
                      to="/contact"
                      onClick={() => setMoreOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs xl:text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-primary dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Mail className="size-4 text-slate-400" />
                      <span>Contact</span>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          <GlobalSearch />

          <button
            onClick={toggleDark}
            className="grid size-9 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors shrink-0"
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>

          {user?.role === 'company' && (
            <Link
              to="/company/candidates"
              className="hidden lg:inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-2.5 xl:px-3 py-1.5 text-xs xl:text-sm font-bold text-primary hover:bg-primary/20 transition-colors shrink-0 whitespace-nowrap"
            >
              <Users className="size-3.5" /> Find Candidates
            </Link>
          )}

          {user && (
            <Link
              to={roleHome(user.role)}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-2.5 xl:px-3 py-1.5 text-xs xl:text-sm font-bold text-primary hover:bg-primary/20 transition-colors shrink-0 whitespace-nowrap"
            >
              Dashboard
            </Link>
          )}

          {user ? (
            <>
              {user.role === 'student' && (
                <Link
                  to="/notifications"
                  className="grid size-9 place-items-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-foreground dark:text-slate-400 dark:hover:bg-slate-800 shrink-0"
                  aria-label="Notifications"
                >
                  <Bell className="size-4" />
                </Link>
              )}

              <div className="relative shrink-0">
                <button
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 rounded-xl px-1.5 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <span className="grid size-7 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {avatarLetter}
                  </span>
                  <ChevronDown className="size-3.5 text-slate-400" />
                </button>

                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                      <Link
                        to={user.role === 'student' ? '/profile' : user.role === 'company' ? '/company/profile' : roleHome(user.role)}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <UserIcon className="size-3.5" />
                        {user.role === 'admin' ? 'Dashboard' : 'My Profile'}
                      </Link>
                      <Link
                        to="/community/hub"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        Community Hub
                      </Link>
                      <hr className="my-1 border-slate-100 dark:border-slate-800" />
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      >
                        <LogOut className="size-3.5" /> Log out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="hidden items-center gap-2 lg:flex shrink-0">
              <Link to="/login" className="whitespace-nowrap px-2.5 py-1 text-xs xl:text-sm font-semibold text-foreground hover:text-primary transition-colors">
                Log in
              </Link>
              <Link to="/signup">
                <Button className="whitespace-nowrap rounded-full bg-brand px-4 py-1.5 text-xs xl:text-sm text-brand-foreground hover:bg-brand/90">
                  Get started
                </Button>
              </Link>
            </div>
          )}

          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            className="grid size-9 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden shrink-0"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="flex-1 bg-black/30 backdrop-blur-xs" onClick={() => setMobileOpen(false)} />

          <div className="flex w-72 flex-col bg-white shadow-xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4 py-4">
              <span className="text-lg font-extrabold text-primary">BRIDGE</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="grid size-8 place-items-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X className="size-5" />
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
              <NavLink to="/resume-templates" className={mobileNavLinkClass} onClick={closeMobile}>
                Resume Templates
              </NavLink>
              <NavLink to="/resume-builder" className={mobileNavLinkClass} onClick={closeMobile}>
                Resume Builder
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

            <div className="border-t border-slate-100 dark:border-slate-800 px-3 py-3">
              {user ? (
                <div className="space-y-1">
                  <Link
                    to={user.role === 'student' ? '/profile' : user.role === 'company' ? '/company/profile' : roleHome(user.role)}
                    onClick={closeMobile}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <UserIcon className="size-4 shrink-0" />
                    {user.role === 'admin' ? 'Dashboard' : 'My Profile'}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  >
                    <LogOut className="size-4 shrink-0" /> Log out
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    to="/login"
                    onClick={closeMobile}
                    className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-center text-sm font-semibold text-foreground hover:bg-slate-50 dark:hover:bg-slate-800"
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