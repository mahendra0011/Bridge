// ─── FILE UPLOAD MIDDLEWARE ────────────────────────────────────────────────
// Supports two modes controlled by the CLOUDINARY_CLOUD_NAME env var:
//
//   CLOUDINARY_CLOUD_NAME set  → Upload to Cloudinary (production)
//   CLOUDINARY_CLOUD_NAME unset → Save to local disk  (local dev fallback)
//
// Cloudinary env vars needed in .env / Render dashboard:
//   CLOUDINARY_CLOUD_NAME=yourcloud
//   CLOUDINARY_API_KEY=xxxxx
//   CLOUDINARY_API_SECRET=xxxxx
// ──────────────────────────────────────────────────────────────────────────

const multer = require('multer')
const path   = require('path')
const fs     = require('fs')

const USE_CLOUDINARY = !!process.env.CLOUDINARY_CLOUD_NAME

let cloudinaryStorage, cloudinary

if (USE_CLOUDINARY) {
  cloudinary = require('cloudinary').v2
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
  const { CloudinaryStorage } = require('multer-storage-cloudinary')
  cloudinaryStorage = (folder, resourceType) => new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
      folder: `bridge/${folder}`,
      resource_type: resourceType,
      public_id: `${req.user._id}-${Date.now()}`,
      // For PDFs, no transformation
      ...(resourceType === 'raw' ? {} : { transformation: [{ quality: 'auto', fetch_format: 'auto' }] }),
    }),
  })
}

// ─── Local disk fallback ──────────────────────────────────────────────────
const UPLOADS_ROOT = path.join(__dirname, '..', '..', 'uploads')

const diskStorage = (folder) => multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(UPLOADS_ROOT, folder)
    fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${req.user._id}-${Date.now()}${ext}`)
  }
})

// ─── Exported upload middleware ───────────────────────────────────────────

exports.uploadResume = multer({
  storage: USE_CLOUDINARY
    ? cloudinaryStorage('resumes', 'raw')
    : diskStorage('resumes'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true)
    else cb(new Error('Only PDF allowed'))
  }
}).single('resume')

exports.uploadLogo = multer({
  storage: USE_CLOUDINARY
    ? cloudinaryStorage('logos', 'image')
    : diskStorage('logos'),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Only images allowed'))
  }
}).single('logo')

// Helper: get the public URL from an uploaded file
// Works for both Cloudinary (req.file.path) and local disk
exports.getFileUrl = (req, folder) => {
  if (!req.file) return null
  if (USE_CLOUDINARY) return req.file.path          // Cloudinary returns full URL in path
  return `/uploads/${folder}/${req.file.filename}`   // local disk
}

// ─── Apply files (resume + test task) ───────────────────────────────────
exports.uploadApplyFiles = multer({
  storage: USE_CLOUDINARY
    ? cloudinaryStorage('resumes', 'raw')
    : diskStorage('resumes'),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB for test task files
  fileFilter: (req, file, cb) => {
    // Accept PDF, images, video, zip, psd, ai for test tasks
    const allowedMimes = [
      'application/pdf', 'image/jpeg', 'image/png', 'image/webp',
      'video/mp4', 'video/quicktime', 'application/zip', 'application/x-zip-compressed',
      'application/x-rar-compressed',
    ]
    if (file.fieldname === 'resume' && file.mimetype !== 'application/pdf') {
      return cb(new Error('Resume must be a PDF'))
    }
    cb(null, true)
  }
}).fields([
  { name: 'resume', maxCount: 1 },
  { name: 'testTask', maxCount: 1 },
])

exports.uploadDocument = multer({
  storage: USE_CLOUDINARY
    ? cloudinaryStorage('documents', 'raw')
    : diskStorage('documents'),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (allowed.includes(file.mimetype)) cb(null, true)
    else cb(new Error('Only PDF, DOC, DOCX, JPG, PNG allowed'))
  }
}).single('document')

// ─── Community media upload (images, video, PDF) ──────────────────────
exports.uploadCommunityMedia = multer({
  storage: USE_CLOUDINARY
    ? cloudinaryStorage('community', 'raw')
    : diskStorage('community'),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB for video
  fileFilter: (req, file, cb) => {
    const allowed = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'video/mp4', 'video/quicktime', 'video/webm',
      'application/pdf',
    ]
    if (allowed.includes(file.mimetype)) cb(null, true)
    else cb(new Error('Only images, video (MP4/MOV/WEBM), and PDF allowed'))
  }
}).array('media', 10) // max 10 files

// ─── Portfolio media upload (images for portfolio items) ──────────────────────
exports.uploadPortfolioMedia = multer({
  storage: USE_CLOUDINARY
    ? cloudinaryStorage('portfolio', 'image')
    : diskStorage('portfolio'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB for portfolio images
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Only image files allowed'))
  }
}).single('image')

// Helper: delete an old Cloudinary asset by URL (no-op for local)
exports.deleteOldAsset = async (url) => {
  if (!USE_CLOUDINARY || !url) return
  try {
    // Extract public_id from the URL
    const parts = url.split('/')
    const filename = parts[parts.length - 1].split('.')[0]
    const folder = parts[parts.length - 2]
    await cloudinary.uploader.destroy(`${folder}/${filename}`)
  } catch (_) { /* best-effort, don't crash */ }
}
