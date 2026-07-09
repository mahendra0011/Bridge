/**
 * Index creation script for Company model
 * Ensures proper indexes exist for query performance
 * 
 * Usage: node src/scripts/createCompanyIndexes.js
 */

const mongoose = require('mongoose')
const Company = require('../models/Company')
require('dotenv').config()

async function createIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bridge-v5')
    console.log('✅ Connected to MongoDB')

    console.log('\n📇 Creating/verifying indexes on Company model...')
    
    // The following indexes are defined in the schema, but we ensure they exist:
    // - slug (unique, sparse, indexed)
    // - isActive (for filtering banned companies)
    // - regNumber (unique, sparse)
    
    const indexes = await Company.collection.getIndexes()
    console.log('Current indexes:', Object.keys(indexes))

    // Ensure compound index for slug lookups
    await Company.collection.createIndex(
      { slug: 1 }, 
      { unique: true, sparse: true, background: true }
    )
    console.log('✅ slug index ensured')

    // Ensure index for isActive queries (used in public route)
    await Company.collection.createIndex(
      { isActive: 1 },
      { background: true }
    )
    console.log('✅ isActive index ensured')

    // Ensure index for regNumber uniqueness
    await Company.collection.createIndex(
      { regNumber: 1 },
      { unique: true, sparse: true, background: true }
    )
    console.log('✅ regNumber index ensured')

    // Compound index for company + user lookups
    await Company.collection.createIndex(
      { user: 1 },
      { unique: true, background: true }
    )
    console.log('✅ user index ensured')

    console.log('\n✅ All indexes created/verified successfully!')

    await mongoose.disconnect()
    console.log('🔌 Disconnected from MongoDB')
    process.exit(0)
  } catch (err) {
    console.error('❌ Index creation failed:', err.message)
    process.exit(1)
  }
}

createIndexes()