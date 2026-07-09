require('dotenv').config()
const dns = require('dns')
dns.setServers(['1.1.1.1', '8.8.8.8'])
const mongoose = require('mongoose')
const Internship = require('../models/Internship')
const Job = require('../models/Job')

async function trim() {
  const uri = 'mongodb://localhost:27017/bridge'
  await mongoose.connect(uri)
  console.log('Connected to MongoDB')

  // Keep only 21 internships
  const internships = await Internship.find({}).sort({ createdAt: -1 })
  if (internships.length > 21) {
    const toDelete = internships.slice(21).map(i => i._id)
    await Internship.deleteMany({ _id: { $in: toDelete } })
    console.log(`Deleted ${toDelete.length} internships, keeping 21`)
  } else {
    console.log(`Only ${internships.length} internships exist, no deletion needed`)
  }

  // Keep only 17 jobs
  const jobs = await Job.find({}).sort({ createdAt: -1 })
  if (jobs.length > 17) {
    const toDelete = jobs.slice(17).map(j => j._id)
    await Job.deleteMany({ _id: { $in: toDelete } })
    console.log(`Deleted ${toDelete.length} jobs, keeping 17`)
  } else {
    console.log(`Only ${jobs.length} jobs exist, no deletion needed`)
  }

  await mongoose.disconnect()
  console.log('Done')
}

trim().catch(err => { console.error(err); process.exit(1) })
