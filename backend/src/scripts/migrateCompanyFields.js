/**
 * Migration script to add new fields to existing Company documents
 * Run this once after deploying schema changes
 * 
 * Usage: node src/scripts/migrateCompanyFields.js
 */

const mongoose = require('mongoose')
const Company = require('../models/Company')
require('dotenv').config()

async function migrate() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bridge-v5')
    console.log('✅ Connected to MongoDB')

    // Get all companies
    const companies = await Company.find({})
    console.log(`📊 Found ${companies.length} companies to migrate\n`)

    let updated = 0
    let skipped = 0

    for (const company of companies) {
      const updates = {}

      // Generate slug if missing
      if (!company.slug && company.name) {
        const slugify = require('../utils/slugify').slugify
        updates.slug = slugify(company.name)
      }

      // Initialize numeric fields if missing
      if (company.profileViews === undefined) updates.profileViews = 0
      if (company.totalHires === undefined) updates.totalHires = 0
      if (company.avgResponseTime === undefined) updates.avgResponseTime = 0
      if (company.feeComplaintCount === undefined) updates.feeComplaintCount = 0
      if (company.profileCompletionPercent === undefined) updates.profileCompletionPercent = 0

      // Initialize boolean fields if missing
      if (company.isActive === undefined) updates.isActive = true
      if (company.isClaimed === undefined) updates.isClaimed = false

      // Initialize arrays if missing
      if (!company.officeLocations) updates.officeLocations = []
      if (!company.photos) updates.photos = []

      // Initialize regStatus if missing
      if (!company.regStatus) updates.regStatus = 'pending'

      // Only update if there are changes
      if (Object.keys(updates).length > 0) {
        await Company.findByIdAndUpdate(company._id, { $set: updates })
        console.log(`✅ Updated: ${company.name} (${company._id})`)
        updated++
      } else {
        console.log(`⏭️  Skipped: ${company.name} (already has all fields)`)
        skipped++
      }
    }

    console.log(`\n✅ Migration complete!`)
    console.log(`   Updated: ${updated}`)
    console.log(`   Skipped: ${skipped}`)
    console.log(`   Total:   ${companies.length}`)

    await mongoose.disconnect()
    console.log('\n🔌 Disconnected from MongoDB')
    process.exit(0)
  } catch (err) {
    console.error('❌ Migration failed:', err.message)
    process.exit(1)
  }
}

migrate()