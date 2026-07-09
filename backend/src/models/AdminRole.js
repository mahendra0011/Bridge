const mongoose = require('mongoose')

// Permission constants for sub-admins and moderators
const PERMISSIONS = {
  // Dashboard & Analytics
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_ANALYTICS: 'view_analytics',
  EXPORT_REPORTS: 'export_reports',

  // Trust & Verification
  VIEW_VERIFICATION_QUEUE: 'view_verification_queue',
  APPROVE_COMPANY: 'approve_company',
  APPROVE_AGENCY: 'approve_agency',
  REJECT_VERIFICATION: 'reject_verification',
  VIEW_REPORTS_CENTER: 'view_reports_center',
  RESOLVE_REPORTS: 'resolve_reports',
  VIEW_COMMUNITY_QUEUE: 'view_community_queue',
  MODERATE_POSTS: 'moderate_posts',
  PIN_POSTS: 'pin_posts',
  WARN_USERS: 'warn_users',
  BAN_USERS: 'ban_users',

  // Entity Management
  VIEW_USERS: 'view_users',
  SUSPEND_USERS: 'suspend_users',
  MANAGE_COMPANIES: 'manage_companies',
  MANAGE_AGENCIES: 'manage_agencies',

  // Content & Listings
  VIEW_LISTINGS: 'view_listings',
  REMOVE_LISTINGS: 'remove_listings',
  VIEW_MASTER_DATA: 'view_master_data',
  EDIT_MASTER_DATA: 'edit_master_data',

  // Operations
  VIEW_TICKETS: 'view_tickets',
  RESPOND_TICKETS: 'respond_tickets',
  MANAGE_ANNOUNCEMENTS: 'manage_announcements',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  MANAGE_SETTINGS: 'manage_settings',
}

const adminRoleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  permissions: [{
    type: String,
    enum: Object.values(PERMISSIONS),
  }],
  isDefault: {
    type: Boolean,
    default: false,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true })

// Predefined role templates
adminRoleSchema.statics = {
  // Full admin (existing super-admin)
  FULL_ADMIN: null, // Super admin has all permissions implicitly

  // Moderator - only community and reports
  MODERATOR: {
    name: 'Moderator',
    description: 'Can moderate community posts and handle reports only',
    permissions: [
      PERMISSIONS.VIEW_DASHBOARD,
      PERMISSIONS.VIEW_COMMUNITY_QUEUE,
      PERMISSIONS.MODERATE_POSTS,
      PERMISSIONS.PIN_POSTS,
      PERMISSIONS.VIEW_REPORTS_CENTER,
      PERMISSIONS.RESOLVE_REPORTS,
      PERMISSIONS.WARN_USERS,
    ],
  },

  // Verifier - only verification queue
  VERIFIER: {
    name: 'Verifier',
    description: 'Can verify companies and agencies only',
    permissions: [
      PERMISSIONS.VIEW_VERIFICATION_QUEUE,
      PERMISSIONS.APPROVE_COMPANY,
      PERMISSIONS.APPROVE_AGENCY,
      PERMISSIONS.REJECT_VERIFICATION,
    ],
  },

  // Support - tickets only
  SUPPORT: {
    name: 'Support Agent',
    description: 'Can manage support tickets only',
    permissions: [
      PERMISSIONS.VIEW_TICKETS,
      PERMISSIONS.RESPOND_TICKETS,
    ],
  },

  // Analyst - analytics only
  ANALYST: {
    name: 'Analyst',
    description: 'Can view analytics and export reports',
    permissions: [
      PERMISSIONS.VIEW_DASHBOARD,
      PERMISSIONS.VIEW_ANALYTICS,
      PERMISSIONS.EXPORT_REPORTS,
    ],
  },
}

module.exports = {
  model: mongoose.model('AdminRole', adminRoleSchema),
  PERMISSIONS,
}