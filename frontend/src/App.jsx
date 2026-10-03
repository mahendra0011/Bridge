import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Provider } from 'react-redux'
import { FileText } from 'lucide-react'
import ResumeBuilder from '@/pages/dashboard/ResumeBuilder'
import ResumeTemplates from '@/pages/ResumeTemplates'
import ResumeTemplateCreateChoice from '@/pages/dashboard/ResumeTemplateCreateChoice'
import VisualTemplateBuilder from '@/pages/dashboard/VisualTemplateBuilder'
import LatexResumeStudio from '@/pages/dashboard/LatexResumeStudio'
import { store } from '@/store'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/context/AuthContext'
import { ProtectedRoute } from '@/components/site/protected-route'
import { SavedSync } from '@/components/site/saved-sync'

// Existing pages
import Index from '@/pages/Index'
import Jobs from '@/pages/Jobs'

import Internships from '@/pages/Internships'
import About from '@/pages/About'
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'
import Dashboard from '@/pages/Dashboard'
// New student pages
import Profile from '@/pages/Profile'
import SavedJobs from '@/pages/SavedJobs'
import Notifications from '@/pages/Notifications'
import ForgotPassword from '@/pages/ForgotPassword'
import ResetPassword from '@/pages/ResetPassword'
import VerifyEmail from '@/pages/VerifyEmail'
import InterviewDetails from '@/pages/InterviewDetails'

// Auth callback page (Google OAuth)
import AuthCallback from '@/pages/AuthCallback'

// Dashboard sub-pages
import StudentApplications from '@/pages/dashboard/Applications'
import StudentInterviews from '@/pages/dashboard/Interviews'
import StudentMessages from '@/pages/dashboard/Messages'
import StudentDocuments from '@/pages/dashboard/Documents'
import StudentSettings from '@/pages/dashboard/Settings'
import StudentRecommended from '@/pages/dashboard/Recommended'
import CompanyPostings from '@/pages/company/Postings'
import PersonMyListings from '@/pages/dashboard/PersonMyListings'
import DashboardCommunity from '@/pages/dashboard/Community'
import AdminAnalytics from '@/pages/admin/Analytics'
import InterviewFeedback from '@/pages/company/InterviewFeedback'
import CompanyReviews from '@/pages/student/CompanyReviews'
import CompanyDetail from '@/pages/CompanyDetail'
import InternshipDetail from '@/pages/InternshipDetail'
import JobDetail from '@/pages/JobDetail'
import Agencies from '@/pages/Agencies'
import AgencyListings from '@/pages/AgencyListings'
import AgencyDetail from '@/pages/AgencyDetail'
import AgencyReviews from '@/pages/AgencyReviews'
import AgencyListingDetail from '@/pages/AgencyListingDetail'
import InterviewBooking from '@/pages/student/InterviewBooking'
import SavedSearchAlerts from '@/pages/student/SavedSearchAlerts'
import Contact from '@/pages/Contact'
import PrivacyPolicy from '@/pages/PrivacyPolicy'
import Terms from '@/pages/Terms'
import OpenToWorkSettings from '@/pages/OpenToWorkSettings'
import OpenToWorkBrowse from '@/pages/OpenToWorkBrowse'
import Opportunities from '@/pages/Opportunities'
import OpportunityDetail from '@/pages/OpportunityDetail'
import Candidates from '@/pages/company/Candidates'
import CandidateDetail from '@/pages/company/CandidateDetail'
import InviteToApply from '@/pages/company/InviteToApply'
import PersonDetail from '@/pages/PersonDetail'
import PostOpportunity from '@/pages/PostOpportunity'
import CommunityFeed from '@/pages/CommunityFeed'
import CommunityPostDetail from '@/pages/CommunityPostDetail'
import CommunityHub from '@/pages/CommunityHub'
import TagHub from '@/pages/TagHub'

// Company pages
import CompanyDashboard from '@/pages/company/CompanyDashboard'
import CompanyProfile from '@/pages/company/CompanyProfile'
import CompanySignup from '@/pages/company/CompanySignup'
import AgencySignup from '@/pages/AgencySignup'
import PostInternship from '@/pages/company/PostInternship'
import PostJob from '@/pages/company/PostJob'
import EditPosting from '@/pages/company/EditPosting'
import Applicants from '@/pages/company/Applicants'
import Post from '@/pages/company/Post'
import CompanyNotifications from '@/pages/company/Notifications'
import CompanyAnalytics from '@/pages/company/Analytics'
import CompanyMessages from '@/pages/company/Messages'
import Scheduling from '@/pages/company/Scheduling'
import Pipeline from '@/pages/company/Pipeline'
import TeamMembers from '@/pages/company/TeamMembers'
import CompanyVerification from '@/pages/company/CompanyVerification'
import CompanySettings from '@/pages/company/CompanySettings'
import CompanySupport from '@/pages/company/CompanySupport'
import CompanyDashboardReviews from '@/pages/company/CompanyReviews'
import CompanyBilling from '@/pages/company/CompanyBilling'

import Tickets from '@/pages/Tickets'
import AgencyDashboard from '@/pages/agency/AgencyDashboard'
import AgencyTeamMembers from '@/pages/agency/AgencyTeamMembers'
import AgencyPostings from '@/pages/agency/AgencyPostings'
import AgencyPost from '@/pages/agency/AgencyPost'
import AgencyPostGig from '@/pages/agency/AgencyPostGig'
import AgencyPipeline from '@/pages/agency/AgencyPipeline'
import AgencyProfile from '@/pages/agency/AgencyProfile'
import AgencyVerification from '@/pages/agency/AgencyVerification'
import AgencyMessages from '@/pages/agency/AgencyMessages'
import AgencyAnalytics from '@/pages/agency/AgencyAnalytics'
import AgencyDashboardReviews from '@/pages/agency/AgencyReviews'
import AgencySettings from '@/pages/agency/AgencySettings'
import AgencySupport from '@/pages/agency/AgencySupport'

// Admin pages
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminStudents from '@/pages/admin/AdminStudents'
import AdminCompanies from '@/pages/admin/AdminCompanies'
import AdminAgencies from '@/pages/admin/AdminAgencies'
import AdminPostings from '@/pages/admin/AdminPostings'
import AdminVerificationQueue from '@/pages/admin/AdminVerificationQueue'
import AdminReports from '@/pages/admin/AdminReports'
import AdminTickets from '@/pages/admin/AdminTickets'
import AdminMasterData from '@/pages/admin/AdminMasterData'
import AdminAnnouncements from '@/pages/admin/AdminAnnouncements'
import AdminAuditLogs from '@/pages/admin/AdminAuditLogs'
import AdminFlaggedMessages from '@/pages/admin/AdminFlaggedMessages'
import AdminCommunityQueue from '@/pages/admin/AdminCommunityQueue'
import AdminReviews from '@/pages/admin/AdminReviews'
import AdminBilling from '@/pages/admin/AdminBilling'

export default function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <SavedSync />
        <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Toaster richColors position="bottom-right" closeButton duration={4000} />
          <Routes>
            {/* Public */}
            <Route path="/" element={<Index />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/internships" element={<Internships />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/internship/:id" element={<InternshipDetail />} />
            <Route path="/job/:id" element={<JobDetail />} />
            <Route path="/agencies" element={<Agencies />} />
            <Route path="/agency-listings" element={<AgencyListings />} />
            <Route path="/agency/:id" element={<AgencyDetail />} />
            <Route path="/agency/:id/reviews" element={<AgencyReviews />} />
            <Route path="/agency/listing/:id" element={<AgencyListingDetail />} />
            <Route path="/company/:companyId/reviews" element={<CompanyReviews />} />
            <Route path="/company/:companyId" element={<CompanyDetail />} />
            <Route path="/opportunities" element={<Opportunities />} />
            <Route path="/opportunity/:id" element={<OpportunityDetail />} />
            <Route path="/person/:id" element={<PersonDetail />} />
            <Route path="/post-opportunity" element={
              <ProtectedRoute roles={['student']}>
                <PostOpportunity />
              </ProtectedRoute>
            } />
            <Route path="/community" element={<CommunityFeed />} />
            <Route path="/community/post/:id" element={<CommunityPostDetail />} />
            <Route path="/community/tag/:tag" element={<TagHub />} />
            <Route path="/community/company/:companyId" element={<TagHub />} />
            <Route path="/community/hub" element={<ProtectedRoute><CommunityHub /></ProtectedRoute>} />
            <Route path="/resume-templates" element={<ResumeTemplates />} />
            <Route path="/resume-templates/create" element={<ResumeTemplateCreateChoice />} />
            <Route path="/resume-templates/builder" element={<VisualTemplateBuilder />} />
            <Route path="/resume-templates/latex" element={<LatexResumeStudio />} />
            <Route path="/resume-builder" element={<ResumeBuilder />} />

            {/* Auth */}
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/company/signup" element={<CompanySignup />} />
            <Route path="/agency/signup" element={<AgencySignup />} />
            <Route path="/agency/dashboard" element={
              <ProtectedRoute>
                <AgencyDashboard />
              </ProtectedRoute>
            } />
            <Route path="/agency/team" element={
              <ProtectedRoute>
                <AgencyTeamMembers />
              </ProtectedRoute>
            } />
            <Route path="/agency/post" element={<Navigate to="/agency/post-gig" replace />} />
            <Route path="/agency/post-listing" element={<Navigate to="/agency/post-gig" replace />} />
            <Route path="/agency/postings" element={
              <ProtectedRoute>
                <AgencyPostings />
              </ProtectedRoute>
            } />
            <Route path="/agency/post-gig" element={
              <ProtectedRoute>
                <AgencyPostGig />
              </ProtectedRoute>
            } />
            <Route path="/agency/posting/edit/:id" element={
              <ProtectedRoute>
                <AgencyPostGig />
              </ProtectedRoute>
            } />
            <Route path="/agency/pipeline" element={
              <ProtectedRoute>
                <AgencyPipeline />
              </ProtectedRoute>
            } />
            <Route path="/agency/profile" element={
              <ProtectedRoute>
                <AgencyProfile />
              </ProtectedRoute>
            } />
            <Route path="/agency/verification" element={
              <ProtectedRoute>
                <AgencyVerification />
              </ProtectedRoute>
            } />
            <Route path="/agency/messages" element={
              <ProtectedRoute>
                <AgencyMessages />
              </ProtectedRoute>
            } />
            <Route path="/agency/messages/:convId" element={
              <ProtectedRoute>
                <AgencyMessages />
              </ProtectedRoute>
            } />
            <Route path="/agency/analytics" element={
              <ProtectedRoute>
                <AgencyAnalytics />
              </ProtectedRoute>
            } />
            <Route path="/agency/reviews" element={
              <ProtectedRoute>
                <AgencyDashboardReviews />
              </ProtectedRoute>
            } />
            <Route path="/agency/settings" element={
              <ProtectedRoute>
                <AgencySettings />
              </ProtectedRoute>
            } />
            <Route path="/agency/support" element={
              <ProtectedRoute>
                <AgencySupport />
              </ProtectedRoute>
            } />
            <Route path="/agency/post-gig" element={
              <ProtectedRoute>
                <AgencyPostGig />
              </ProtectedRoute>
            } />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/verify-email/:token" element={<VerifyEmail />} />
            <Route
              path="/interview/:id"
              element={
                <ProtectedRoute roles={['student']}>
                  <InterviewDetails />
                </ProtectedRoute>
              }
            />

            {/* Student */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute roles={['student']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute roles={['student']}>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/saved"
              element={
                <ProtectedRoute roles={['student']}>
                  <SavedJobs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              }
            />

            {/* Student Dashboard Sections */}
            <Route
              path="/dashboard/applications"
              element={
                <ProtectedRoute roles={['student']}>
                  <StudentApplications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/interviews"
              element={
                <ProtectedRoute roles={['student']}>
                  <StudentInterviews />
                </ProtectedRoute>
              }
            />
            <Route
              path="/saved-searches"
              element={
                <ProtectedRoute roles={['student']}>
                  <SavedSearchAlerts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/interview-booking/:postingId"
              element={
                <ProtectedRoute roles={['student']}>
                  <InterviewBooking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/messages"
              element={
                <ProtectedRoute roles={['student']}>
                  <StudentMessages />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/messages/:convId"
              element={
                <ProtectedRoute roles={['student']}>
                  <StudentMessages />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/documents"
              element={
                <ProtectedRoute roles={['student']}>
                  <StudentDocuments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/settings"
              element={
                <ProtectedRoute roles={['student']}>
                  <StudentSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/recommended"
              element={
                <ProtectedRoute roles={['student']}>
                  <StudentRecommended />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/listings"
              element={
                <ProtectedRoute roles={['student']}>
                  <PersonMyListings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/community"
              element={
                <ProtectedRoute roles={['student', 'company']}>
                  <DashboardCommunity />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/resume-builder"
              element={
                <ProtectedRoute roles={['student']}>
                  <ResumeBuilder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/resume-templates"
              element={
                <ProtectedRoute roles={['student']}>
                  <ResumeTemplates />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/resume-templates/create"
              element={
                <ProtectedRoute roles={['student']}>
                  <ResumeTemplateCreateChoice />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/resume-templates/builder"
              element={
                <ProtectedRoute roles={['student']}>
                  <VisualTemplateBuilder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/resume-templates/latex"
              element={
                <ProtectedRoute roles={['student']}>
                  <LatexResumeStudio />
                </ProtectedRoute>
              }
            />

            {/* Company */}
            <Route
              path="/company"
              element={
                <ProtectedRoute>
                  <CompanyDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/company/profile" element={
              <ProtectedRoute>
                <CompanyProfile />
              </ProtectedRoute>
            } />
            <Route
              path="/company/post-internship"
              element={
                <ProtectedRoute>
                  <PostInternship />
                </ProtectedRoute>
              }
            />
            <Route
              path="/company/post-job"
              element={
                <ProtectedRoute>
                  <PostJob />
                </ProtectedRoute>
              }
            />
            <Route
              path="/company/edit-posting/:kind/:id"
              element={
                <ProtectedRoute>
                  <EditPosting />
                </ProtectedRoute>
              }
            />
            <Route path="/company/applicants/:kind/:id" element={
              <ProtectedRoute>
                <Applicants />
              </ProtectedRoute>
            } />

            <Route path="/tickets" element={
              <ProtectedRoute>
                <Tickets />
              </ProtectedRoute>
            } />
            <Route path="/company/tickets" element={
              <ProtectedRoute>
                <Tickets />
              </ProtectedRoute>
            } />

            {/* Open to Work — Browse candidates (public) */}
            <Route path="/open-to-work" element={<OpenToWorkBrowse />} />
            <Route path="/open-to-work/:userId" element={<CandidateDetail />} />
            <Route path="/open-to-work/settings" element={<ProtectedRoute roles={['student']}><OpenToWorkSettings /></ProtectedRoute>} />

            {/* Company — Find Candidates (legacy path) */}
            <Route
              path="/company/candidates"
              element={
                <ProtectedRoute>
                  <Candidates />
                </ProtectedRoute>
              }
            />
            <Route
              path="/company/candidates/:userId"
              element={
                <ProtectedRoute>
                  <CandidateDetail />
                </ProtectedRoute>
              }
            />
            <Route path="/company/candidates/invite/:userId" element={
              <ProtectedRoute>
                <InviteToApply />
              </ProtectedRoute>
            } />

            {/* Company Dashboard Sections */}
            <Route path="/company/postings" element={
              <ProtectedRoute>
                <CompanyPostings />
              </ProtectedRoute>
            } />
            <Route path="/company/feedback/:appId" element={
              <ProtectedRoute>
                <InterviewFeedback />
              </ProtectedRoute>
            } />
            <Route path="/company/listings" element={
              <ProtectedRoute>
                <CompanyPostings />
              </ProtectedRoute>
            } />
            <Route
              path="/company/post"
              element={
                <ProtectedRoute>
                  <Post />
                </ProtectedRoute>
              }
            />
            <Route path="/company/listings/new" element={
              <ProtectedRoute>
                <Post />
              </ProtectedRoute>
            } />
            <Route path="/company/pipeline" element={
              <ProtectedRoute>
                <Pipeline />
              </ProtectedRoute>
            } />
            <Route path="/company/pipeline/:kind/:id" element={
              <ProtectedRoute>
                <Pipeline />
              </ProtectedRoute>
            } />
            <Route path="/company/scheduling" element={
              <ProtectedRoute>
                <Scheduling />
              </ProtectedRoute>
            } />
            <Route path="/company/team" element={
              <ProtectedRoute>
                <TeamMembers />
              </ProtectedRoute>
            } />
            <Route path="/company/messages" element={
              <ProtectedRoute>
                <CompanyMessages />
              </ProtectedRoute>
            } />
            <Route path="/company/messages/:convId" element={
              <ProtectedRoute>
                <CompanyMessages />
              </ProtectedRoute>
            } />
            <Route path="/company/chat" element={
              <ProtectedRoute>
                <CompanyMessages />
              </ProtectedRoute>
            } />
            <Route path="/company/analytics" element={
              <ProtectedRoute>
                <CompanyAnalytics />
              </ProtectedRoute>
            } />
            <Route path="/company/notifications" element={
              <ProtectedRoute>
                <CompanyNotifications />
              </ProtectedRoute>
            } />
            <Route path="/company/verification" element={
              <ProtectedRoute>
                <CompanyVerification />
              </ProtectedRoute>
            } />
            <Route path="/company/interviews" element={
              <ProtectedRoute>
                <Scheduling />
              </ProtectedRoute>
            } />
            <Route path="/company/reviews" element={
              <ProtectedRoute>
                <CompanyDashboardReviews />
              </ProtectedRoute>
            } />
            <Route path="/company/settings" element={
              <ProtectedRoute>
                <CompanySettings />
              </ProtectedRoute>
            } />
            <Route path="/company/settings/billing" element={
              <ProtectedRoute>
                <CompanyBilling />
              </ProtectedRoute>
            } />
            <Route path="/company/support" element={
              <ProtectedRoute>
                <CompanySupport />
              </ProtectedRoute>
            } />

            {/* Admin */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/students"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminStudents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/companies"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminCompanies />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/internships"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminPostings kind="internship" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/jobs"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminPostings kind="job" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/opportunities"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminPostings kind="opportunity" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/agencies"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminAgencies />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminAnalytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/verification-queue"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminVerificationQueue />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminReports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/tickets"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminTickets />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/master-data"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminMasterData />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/announcements"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminAnnouncements />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminAuditLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/flagged-messages"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminFlaggedMessages />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/community-queue"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminCommunityQueue />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reviews"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminReviews />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/billing"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminBilling />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </Provider>
  )
}

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center">
      <h1 className="text-7xl font-black tracking-tight text-slate-200">404</h1>
      <p className="mt-2 text-lg font-bold text-slate-800">Page not found</p>
      <p className="mt-1 text-sm text-slate-500">This page doesn't exist or has been moved.</p>
      <a href="/#/" className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary/90 transition-colors">Go home</a>
    </div>
  )
}
