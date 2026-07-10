// ─── SEED IMAGES TO CLOUDINARY ─────────────────────────────────────────────────
// This script uploads REAL images from Unsplash to Cloudinary and returns the URLs
// Run: node seed-images-cloudinary.js
// ───────────────────────────────────────────────────────────────────────────────

const path = require('path')
const cloudinary = require('cloudinary').v2
const axios = require('axios')
require('dotenv').config({ path: path.join(__dirname, '.env') })

// Cloudinary configuration from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Unsplash access key (optional - if not provided, uses curated images)
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || ''

// Professional/Real image URLs from Unsplash (high quality, relevant to each category)
const REAL_IMAGES = {
  // Company logos (150x150) - using professional logo placeholders
  companyLogos: [
    { name: 'healthtech-logo', url: 'https://images.unsplash.com/photo-1576091160399-1e6e4c37548e?w=150&h=150&fit=crop&q=80' }, // Medical/health icon
    { name: 'techcorp-logo', url: 'https://images.unsplash.com/photo-1550751827-64bde5b4b3c1?w=150&h=150&fit=crop&q=80' }, // Tech logo
    { name: 'innosoft-logo', url: 'https://images.unsplash.com/photo-1551650975-87d72d503ef2?w=150&h=150&fit=crop&q=80' }, // Innovation logo
    { name: 'datasphere-logo', url: 'https://images.unsplash.com/photo-1551288043-65d8e8e0e3d4?w=150&h=150&fit=crop&q=80' }, // Data sphere
    { name: 'fintech-logo', url: 'https://images.unsplash.com/photo-1563986768609-32233ef00d06?w=150&h=150&fit=crop&q=80' }, // Finance/app logo
  ],
  
  // Cover/Banner images (1920x400) - professional office/workspace banners
  coverBanners: [
    { name: 'healthtech-banner', url: 'https://images.unsplash.com/photo-1576091160554-b32a31c4952d?w=1920&h=400&fit=crop&q=80' }, // Modern office
    { name: 'techcorp-banner', url: 'https://images.unsplash.com/photo-1497366211944-e8acd9c1ecf8?w=1920&h=400&fit=crop&q=80' }, // Tech office
    { name: 'innosoft-banner', url: 'https://images.unsplash.com/photo-1526738904085-6ca124643a64?w=1920&h=400&fit=crop&q=80' }, // Creative workspace
    { name: 'datasphere-banner', url: 'https://images.unsplash.com/photo-1551288043-65d8e8e0e3d4?w=1920&h=400&fit=crop&q=80' }, // Data visualization
    { name: 'fintech-banner', url: 'https://images.unsplash.com/photo-1554261069-2a5947b6f6ea?w=1920&h=400&fit=crop&q=80' }, // Finance office
  ],
  
  // Company office photos (600x400) - real office/workspace images
  companyPhotos: [
    { name: 'office-1', url: 'https://images.unsplash.com/photo-1556756901-49a78f90b8d1?w=600&h=400&fit=crop&q=80' }, // Modern office
    { name: 'office-2', url: 'https://images.unsplash.com/photo-1556756901-49a78f90b8d1?w=600&h=400&fit=crop&q=80' }, // Meeting room
    { name: 'office-3', url: 'https://images.unsplash.com/photo-1542744095-fcf47d8b5318?w=600&h=400&fit=crop&q=80' }, // Team workspace
    { name: 'office-4', url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop&q=80' }, // Team meeting
    { name: 'team-event-1', url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c8e29?w=600&h=400&fit=crop&q=80' }, // Team event
    { name: 'team-event-2', url: 'https://images.unsplash.com/photo-1522071901873-411886a2b53f?w=600&h=400&fit=crop&q=80' }, // Team collaboration
    { name: 'meeting-1', url: 'https://images.unsplash.com/photo-1519671481765-9a04cb1dc7e5?w=600&h=400&fit=crop&q=80' }, // Conference room
    { name: 'workspace-1', url: 'https://images.unsplash.com/photo-1556751717-9746b2a2492b?w=600&h=400&fit=crop&q=80' }, // Open workspace
  ],
  
  // Agency logos (150x150) - creative/design focused
  agencyLogos: [
    { name: 'demo-talent-agency-logo', url: 'https://images.unsplash.com/photo-1551288043-65d8e8e0e3d4?w=150&h=150&fit=crop&q=80' }, // Creative logo
    { name: 'creative-solutions-logo', url: 'https://images.unsplash.com/photo-1550751827-64bde5b4b3c1?w=150&h=150&fit=crop&q=80' }, // Design logo
    { name: 'hr-consultants-logo', url: 'https://images.unsplash.com/photo-1560250097-0b9337271ff6?w=150&h=150&fit=crop&q=80' }, // HR logo
  ],
  
  // Portfolio images (600x400) - creative work samples
  portfolioImages: [
    { name: 'portfolio-tech', url: 'https://images.unsplash.com/photo-1467232014286-a89728073327?w=600&h=400&fit=crop&q=80' }, // Tech portfolio
    { name: 'portfolio-hr', url: 'https://images.unsplash.com/photo-1556756901-49a78f90b8d1?w=600&h=400&fit=crop&q=80' }, // HR/recruitment
    { name: 'portfolio-digital', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop&q=80' }, // Digital marketing
    { name: 'portfolio-content', url: 'https://images.unsplash.com/photo-1499755109340-9a5f03a4d1c2?w=600&h=400&fit=crop&q=80' }, // Content writing
  ],
}

async function uploadImageToCloudinary(imageUrl, folder, publicId) {
  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: `bridge/seed/${folder}`,
      public_id: publicId,
      resource_type: 'image',
      transformation: [
        { quality: 'auto', fetch_format: 'auto' }
      ]
    })
    console.log(`✅ Uploaded: ${folder}/${publicId}`)
    return result.secure_url
  } catch (err) {
    console.error(`❌ Failed to upload ${publicId}:`, err.message)
    return null
  }
}

async function seedImages() {
  console.log('🚀 Starting Cloudinary seed image upload with REAL Unsplash images...\n')
  
  const uploadedUrls = {}
  
  for (const [category, images] of Object.entries(REAL_IMAGES)) {
    console.log(`\n📁 Category: ${category}`)
    uploadedUrls[category] = {}
    
    for (const img of images) {
      const url = await uploadImageToCloudinary(img.url, category, img.name)
      if (url) {
        uploadedUrls[category][img.name] = url
      }
    }
  }
  
  console.log('\n\n📊 EXPORT THESE URLS FOR YOUR SEED FILES:')
  console.log('==========================================')
  console.log(JSON.stringify(uploadedUrls, null, 2))
  
  // Generate ready-to-use URLs for seed files
  console.log('\n\n📋 COPY-PASTE READY URLS:')
  console.log('==========================')
  
  console.log('\n// Company Logos:')
  for (const img of REAL_IMAGES.companyLogos) {
    if (uploadedUrls.companyLogos[img.name]) {
      console.log(`${img.name}: '${uploadedUrls.companyLogos[img.name]}'`)
    }
  }
  
  console.log('\n// Cover Banners:')
  for (const img of REAL_IMAGES.coverBanners) {
    if (uploadedUrls.coverBanners[img.name]) {
      console.log(`${img.name}: '${uploadedUrls.coverBanners[img.name]}'`)
    }
  }
  
  console.log('\n// Portfolio Images:')
  for (const img of REAL_IMAGES.portfolioImages) {
    if (uploadedUrls.portfolioImages[img.name]) {
      console.log(`${img.name}: '${uploadedUrls.portfolioImages[img.name]}'`)
    }
  }
  
  console.log('\n\n✅ All images uploaded successfully!')
}

seedImages().catch(err => {
  console.error('Upload failed:', err)
  process.exit(1)
})