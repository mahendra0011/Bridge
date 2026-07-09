// Change 154 - Fixing type import
// Change 145 - Adding health metrics
// Change 136 - Improving response format
// Change 127 - Adding audit logging
// Change 118 - Fixing cache strategy
// Change 109 - Adding lazy loading
// Change 100 - Improving caching strategy
// Change 91 - Adding transition animations
// Change 82 - Fixing form submission
// Change 73 - Adding proper redirects
// Change 64 - Updating Tailwind configuration
// Change 55 - Adding loading states to UI
// Change 46 - Added request validation rules
// Change 37 - Solved null pointer in profile
// Change 28 - Added email verification flow
// Change 19 - Refactored middleware configuration
// Change 10 - Added better logging throughout backend
// Change 1 - Refactored authentication module structure
// Change 157
// Change 145
// Change 133
// Change 121
// Change 109
// Change 97
// Change 85
// Change 73
// Change 61
// Change 49
// Change 37
// Change 25
// Change 13
// Change 1
// Update 169
// Update 157
// Update 145
// Update 133
// Update 121
// Update 109
// Update 97
// Update 85
// Update 73
// Update 61
// Update 49
// Update 37
// Update 25
// Update 13
// Update 1
# Bridge Backend - Node/Express/MongoDB/Socket.io

## Setup

```bash
cd bridge-backend
npm install
cp .env.example .env
# Fill in .env values
npm run dev
```

## What's complete (Backend)
- Auth: Signup, Login, JWT, Email verification, Forgot/Reset password
- Student: Profile CRUD, Resume upload, Applications list, Notifications
- Company: Profile CRUD, Logo upload, Dashboard stats, Applicant management, Status update, Interview scheduling, Resume download
- Internships: List with filters, Detail, Post, Edit, Delete, Apply with resume+cover letter
- Jobs: List with filters, Detail, Post, Edit, Delete, Apply with resume+cover+portfolio+linkedin
- Admin: Dashboard stats, Manage students, Manage companies, Block/Unblock, Approve/Delete postings
- Socket.io: Real-time notifications on apply, status change, interview scheduled
- Email alerts: Verification, Reset password, Status update emails

## API Base URL
`http://localhost:5000/api`

## Routes Summary
| Method | Route | Auth | Role |
|--------|-------|------|------|
| POST | /auth/signup | No | - |
| POST | /auth/login | No | - |
| GET | /auth/me | Yes | any |
| GET | /auth/verify-email/:token | No | - |
| POST | /auth/forgot-password | No | - |
| POST | /auth/reset-password/:token | No | - |
| GET | /student/profile | Yes | student |
| PUT | /student/profile | Yes | student |
| POST | /student/resume | Yes | student |
| GET | /student/applications | Yes | student |
| GET | /student/notifications | Yes | student |
| GET | /internships | No | - |
| GET | /internships/:id | No | - |
| POST | /internships | Yes | company |
| PUT | /internships/:id | Yes | company |
| DELETE | /internships/:id | Yes | company/admin |
| POST | /internships/:id/apply | Yes | student |
| GET | /jobs | No | - |
| GET | /jobs/:id | No | - |
| POST | /jobs | Yes | company |
| PUT | /jobs/:id | Yes | company |
| DELETE | /jobs/:id | Yes | company/admin |
| POST | /jobs/:id/apply | Yes | student |
| GET | /company/profile | Yes | company |
| PUT | /company/profile | Yes | company |
| POST | /company/logo | Yes | company |
| GET | /company/dashboard | Yes | company |
| GET | /company/applicants/:id | Yes | company |
| PATCH | /company/applications/:id/status | Yes | company |
| POST | /company/applications/:id/interview | Yes | company |
| GET | /company/applications/:id/resume | Yes | company |
| GET | /admin/dashboard | Yes | admin |
| GET | /admin/students | Yes | admin |
| GET | /admin/companies | Yes | admin |
| PATCH | /admin/users/:id/block | Yes | admin |
| PATCH | /admin/users/:id/unblock | Yes | admin |
| GET | /admin/internships | Yes | admin |
| GET | /admin/jobs | Yes | admin |
| PATCH | /admin/postings/:id/approve | Yes | admin |
| DELETE | /admin/postings/:id | Yes | admin |















































