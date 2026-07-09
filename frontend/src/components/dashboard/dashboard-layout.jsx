import { useState, useEffect } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Building2, Briefcase, FileCheck, BookOpen,
  Settings, HelpCircle, ChevronDown, LogOut, User, Bell, Search,
  BarChart3, Clock, CheckCircle2, X, Menu, GraduationCap, Bookmark, Sparkles,
  FileText, PlusCircle, ChevronRight, Home, ShieldCheck, Flag, Star,
  Ticket, CreditCard, Database, Megaphone, ScrollText, BadgeCheck,
  AlertTriangle, MessageCircle, MessageSquare, FolderOpen, Calendar,
  Paperclip, Send, Phone, MoreVertical, Image, Eye
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Footer } from '@/components/site/footer'
import { api } from '@/lib/api'

const roleConfig = {
  student: {
    title: 'Student Dashboard',
sections: [
       { label: 'Home', icon: Home, to: '/' },
       { label: 'Overview', icon: LayoutDashboard, to: '/dashboard' },
       { label: 'Upcoming Interviews', icon: Clock, to: '/dashboard/interviews' },
       { label: 'My Applications', icon: FileCheck, to: '/dashboard/applications' },
       { label: 'Saved Roles', icon: Bookmark, to: '/saved' },
       { label: 'Recommended for You', icon: Star, to: '/dashboard/recommended' },
       { label: 'Saved Searches', icon: Search, to: '/saved-searches' },
       { label: 'Messages', icon: MessageSquare, to: '/dashboard/messages' },
       { label: 'Notification', icon: Bell, to: '/notifications' },
       { label: 'My Profile', icon: User, to: '/profile' },
       { label: 'Open to Work', icon: Sparkles, to: '/open-to-work/settings' },
       { label: 'Document', icon: FolderOpen, to: '/dashboard/documents' },
       { label: 'My Listings', icon: Briefcase, to: '/dashboard/listings' },
       { label: 'Community Hub', icon: MessageCircle, to: '/dashboard/community' },
       { label: 'Support Ticket', icon: Ticket, to: '/tickets' },
       { label: 'Setting', icon: Settings, to: '/dashboard/settings' },
     ],
    quickLinks: []
  },
company: {
    title: 'Company Dashboard',
    sections: [
      { label: 'Home', icon: Home, to: '/' },
      { label: 'Overview', icon: LayoutDashboard, to: '/company' },
      { label: 'Company Profile', icon: Building2, to: '/company/profile' },
      { label: 'Verification', icon: ShieldCheck, to: '/company/verification' },
      { label: 'Team Management', icon: Users, to: '/company/team' },
      { separator: true },
      { label: 'Post Job/Internship', icon: PlusCircle, to: '/company/listings/new' },
      { label: 'My Listings', icon: FileText, to: '/company/listings' },
      { label: 'Applicant Pipeline', icon: LayoutDashboard, to: '/company/pipeline' },
      { label: 'Interview Scheduling', icon: Calendar, to: '/company/interviews' },
      { separator: true },
      { label: 'Messages', icon: MessageSquare, to: '/company/messages' },
      { label: 'Notifications', icon: Bell, to: '/company/notifications' },
      { label: 'Analytics', icon: BarChart3, to: '/company/analytics' },
      { label: 'Reviews', icon: Star, to: '/company/reviews' },
      { separator: true },
      { label: 'Settings', icon: Settings, to: '/company/settings' },
      { label: 'Support', icon: HelpCircle, to: '/company/support' },
    ],
    quickLinks: [
      { label: 'View All Listings', icon: FileText, to: '/company/listings' },
      { label: 'Post New', icon: PlusCircle, to: '/company/listings/new' },
    ]
  },
  agency: {
    title: 'Agency Dashboard',
    sections: [
      { label: 'Home', icon: Home, to: '/' },
      { label: 'Overview', icon: LayoutDashboard, to: '/agency/dashboard' },
      { label: 'Post New Gig/Project', icon: PlusCircle, to: '/company/post' },
      { label: 'My Postings', icon: FileText, to: '/agency/postings' },
      { label: 'Applicant Pipeline', icon: LayoutDashboard, to: '/agency/pipeline' },
      { label: 'Team Management', icon: Users, to: '/agency/team' },
      { label: 'Agency Profile', icon: Building2, to: '/agency/profile' },
      { label: 'Verification', icon: ShieldCheck, to: '/agency/verification' },
      { label: 'Messages', icon: MessageSquare, to: '/agency/messages' },
      { label: 'Analytics', icon: BarChart3, to: '/agency/analytics' },
      { label: 'Reviews', icon: Star, to: '/agency/reviews' },
      { label: 'Settings', icon: Settings, to: '/agency/settings' },
      { label: 'Support', icon: HelpCircle, to: '/agency/support' },
    ],
    quickLinks: [
      { label: 'View All Postings', icon: FileText, to: '/agency/postings' },
    ]
  },
admin: {
    title: 'Admin Dashboard',
    sections: [
      { label: 'Home', icon: Home, to: '/' },
      { label: 'Overview', icon: LayoutDashboard, to: '/admin' },
      { label: 'Analytics', icon: BarChart3, to: '/admin/analytics' },
      { label: 'Verification Queue', icon: BadgeCheck, to: '/admin/verification-queue' },
      { label: 'Companies', icon: Building2, to: '/admin/companies' },
      { label: 'Agencies', icon: Building2, to: '/admin/agencies' },
      { label: 'Students', icon: GraduationCap, to: '/admin/students' },
      { label: 'Internships', icon: BookOpen, to: '/admin/internships' },
      { label: 'Jobs', icon: Briefcase, to: '/admin/jobs' },
      { label: 'Opportunities', icon: FileText, to: '/admin/opportunities' },
      { label: 'Reports', icon: Flag, to: '/admin/reports' },
      { label: 'Support Tickets', icon: Ticket, to: '/admin/tickets' },
      { label: 'Master Data', icon: Database, to: '/admin/master-data' },
      { label: 'Announcements', icon: Megaphone, to: '/admin/announcements' },
      { label: 'Audit Logs', icon: ScrollText, to: '/admin/audit-logs' },
    ],
    quickLinks: [
      { label: 'Pending Approvals', icon: Clock, to: '/admin/internships?status=pending' },
      { label: 'Open Reports', icon: AlertTriangle, to: '/admin/reports?status=open' },
    ]
  }
}

export function DashboardLayout({ children, sections: customSections }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const role = user?.role || 'student'

  useEffect(() => {
    const notifApi = role === 'company' ? '/api/company/notifications' : '/api/notifications'
    api.get(notifApi).then((data) => {
      if (data?.notifications) setNotifications(data.notifications)
    }).catch(() => {})
  }, [role])
  const config = roleConfig[role] || roleConfig.student
  const sections = customSections || config.sections

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const avatarLetter = (user?.name || user?.email || '?')[0].toUpperCase()
  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar - Desktop */}
      <aside className="hidden sticky top-0 self-start h-screen w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-2 border-b border-slate-100 px-5">
            <div className="grid size-8 place-items-center rounded-lg bg-primary text-sm font-extrabold text-white">
              B
            </div>
            <span className="text-lg font-extrabold tracking-tight text-primary">BRIDGE</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
<ul className="space-y-1">
                  {sections.map((item) =>
                    item.separator ? (
                      <li key={`sep-${Math.random()}`} className="my-2 border-t border-slate-100" />
                    ) : (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          end={item.to === `/company` || item.to === `/agency/dashboard`}
                          onClick={closeSidebar}
                          className={({ isActive }) =>
                            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                              isActive
                                ? 'bg-primary/10 text-primary font-semibold'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-foreground'
                            }`
                          }
                        >
                          <item.icon className="size-4 shrink-0" />
                          <span>{item.label}</span>
                        </NavLink>
                      </li>
                    )
                  )}
                </ul>

              </nav>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <aside
            className="h-full w-64 border-r border-slate-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-full flex-col">
              <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
                <div className="flex items-center gap-2">
                  <div className="grid size-8 place-items-center rounded-lg bg-primary text-sm font-extrabold text-white">
                    B
                  </div>
                  <span className="text-lg font-extrabold tracking-tight text-primary">BRIDGE</span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="rounded-lg p-1.5 hover:bg-slate-100">
                  <X className="size-5 text-slate-500" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto px-3 py-4">
<ul className="space-y-1">
                  {sections.map((item) =>
                    item.separator ? (
                      <li key={`sep-${Math.random()}`} className="my-2 border-t border-slate-100" />
                    ) : (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          end={item.to === `/company` || item.to === `/agency/dashboard`}
                          onClick={closeSidebar}
                          className={({ isActive }) =>
                            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                              isActive
                                ? 'bg-primary/10 text-primary font-semibold'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-foreground'
                            }`
                          }
                        >
                          <item.icon className="size-4 shrink-0" />
                          <span>{item.label}</span>
                        </NavLink>
                      </li>
                    )
                  )}
                </ul>
              </nav>
            </div>
          </aside>
        </div>
      )}
      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"
            >
              <Menu className="size-5 text-slate-600" />
            </button>
            <h2 className="text-lg font-bold text-foreground lg:text-xl">{config.title}</h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-foreground transition-colors"
              >
                <Bell className="size-5" />
                <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-rose-500 ring-2 ring-white" />
              </button>

              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-50 w-80 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
                    <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
                      <p className="text-sm font-semibold text-foreground">Notifications</p>
                      <Link
                        to={role === 'company' ? '/company/notifications' : '/notifications'}
                        className="text-xs font-medium text-primary hover:underline"
                        onClick={() => setNotifOpen(false)}
                      >
                        View All
                      </Link>
                    </div>
                    <div className="max-h-64 overflow-y-auto py-1">
                      {notifications.length === 0 ? (
                        <p className="px-3 py-6 text-center text-xs text-slate-400">No new notifications</p>
                      ) : (
                        notifications.slice(0, 5).map((n) => (
                          <Link
                            key={n._id}
                            to={n.link || (role === 'company' ? '/company/notifications' : '/notifications')}
                            onClick={() => setNotifOpen(false)}
                            className={`flex items-start gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-slate-50 ${
                              n.read ? 'text-slate-600' : 'font-semibold text-foreground bg-primary/5'
                            }`}
                          >
                            <div className={`mt-0.5 size-2 shrink-0 rounded-full ${n.read ? 'bg-transparent' : 'bg-primary'}`} />
                            <div className="flex-1 min-w-0">
                              <p className="truncate">{n.message || n.title}</p>
                              <p className="text-xs text-slate-400">{n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ''}</p>
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-100 transition-colors"
              >
                <div className="grid size-8 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {avatarLetter}
                </div>
                <span className="hidden text-sm font-semibold text-foreground md:block">
                  {user?.name || user?.email}
                </span>
                <ChevronDown className={`hidden size-4 text-slate-400 transition-transform md:block ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-50 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
                    <div className="border-b border-slate-100 px-3 py-2">
                      <p className="text-sm font-semibold text-foreground">{user?.name || 'User'}</p>
                      <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
                    </div>
                    <div className="pt-1">
                      {role === 'student' && (
                        <NavLink to="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
                          <User className="size-4" /> My Profile
                        </NavLink>
                      )}
                      {role === 'company' && (
                        <NavLink to="/company/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
                          <Building2 className="size-4" /> Company Profile
                        </NavLink>
                      )}
                      {role === 'agency' && (
                        <NavLink to="/agency/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
                          <Building2 className="size-4" /> Agency Profile
                        </NavLink>
                      )}
                      <NavLink to="/notifications" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
                        <Bell className="size-4" /> Notifications
                      </NavLink>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
                      >
                        <LogOut className="size-4" /> Log out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">
          {children}
        </main>

        <Footer />
      </div>
    </div>
  )
}


