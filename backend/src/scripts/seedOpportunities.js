require('dotenv').config()
const dns = require('dns')
dns.setServers(['1.1.1.1', '8.8.8.8'])
const mongoose = require('mongoose')
const User = require('../models/User')
const Opportunity = require('../models/Opportunity')
const { resolveMongoUri } = require('../utils/mongoConnection')

async function seed() {
  const uri = await resolveMongoUri(process.env.MONGO_URI || 'mongodb://localhost:27017/bridge')
  await mongoose.connect(uri)
  console.log('MongoDB connected')

  // ─── Create poster users if they don't exist ─────────────────────────────
  const posterData = [
    {
      name: 'Rahul Sharma',
      email: 'rahul@example.com',
      password: 'test@123',
      role: 'student',
      isEmailVerified: true,
      isPhoneVerified: true,
      isIdVerified: false,
      designation: 'Content Creator',
      tagline: 'Content Creator — runs 2 YouTube channels',
      bio: 'I create content on YouTube and need freelancers to help with video editing, scripting, and graphics.',
      location: 'Delhi, India',
      website: 'https://rahulsharma.com',
      linkedin: 'https://linkedin.com/in/rahulsharma',
      youtube: 'https://youtube.com/@rahulsharma',
    },
    {
      name: 'Priya Patel',
      email: 'priya@example.com',
      password: 'test@123',
      role: 'student',
      isEmailVerified: true,
      isPhoneVerified: true,
      isIdVerified: true,
      designation: 'Startup Founder',
      tagline: 'Startup founder building a fintech app',
      bio: 'Founder of a fintech startup in Bangalore. Looking for talented developers and designers to join our journey.',
      location: 'Bangalore, Karnataka, India',
      linkedin: 'https://linkedin.com/in/priyapatel',
    },
    {
      name: 'Ankit Verma',
      email: 'ankit@example.com',
      password: 'test@123',
      role: 'student',
      isEmailVerified: true,
      isPhoneVerified: false,
      isIdVerified: false,
      designation: 'Small Business Owner',
      tagline: 'Small business owner, e-commerce store',
      bio: 'Running an e-commerce business and occasionally need freelancers for product photography, content writing, and social media management.',
      location: 'Mumbai, Maharashtra, India',
      website: 'https://ankitstore.com',
      instagram: 'https://instagram.com/ankitverma',
    },
    {
      name: 'Sneha Kapoor',
      email: 'sneha@example.com',
      password: 'test@123',
      role: 'student',
      isEmailVerified: true,
      isPhoneVerified: true,
      isIdVerified: true,
      designation: 'Digital Marketing Consultant',
      tagline: 'Digital marketing consultant helping brands grow online',
      bio: "I'm a digital marketing consultant specializing in social media strategy and content creation. I help brands build their online presence and regularly hire creative freelancers for my client projects.",
      location: 'Mumbai, India',
      website: 'https://snehakapoor.design',
      linkedin: 'https://linkedin.com/in/snehakapoor',
    },
  ]

  const posters = []
  for (const data of posterData) {
    let user = await User.findOne({ email: data.email })
    if (!user) {
      user = await User.create(data)
      console.log(`  Created user: ${user.name} (${user._id})`)
    } else {
      // Update existing user with profile fields
      const updates = {}
      if (data.designation) updates.designation = data.designation
      if (data.tagline) updates.tagline = data.tagline
      if (data.bio) updates.bio = data.bio
      if (data.location) updates.location = data.location
      if (data.website) updates.website = data.website
      if (data.linkedin) updates.linkedin = data.linkedin
      if (data.youtube) updates.youtube = data.youtube
      if (data.instagram) updates.instagram = data.instagram
      await User.findByIdAndUpdate(user._id, { $set: updates })
      console.log(`  Updated user: ${user.name} with profile fields`)
    }
    posters.push(user)
  }

  // ─── Clear old opportunities ────────────────────────────────────────────
  await Opportunity.deleteMany({})
  console.log('Cleared existing opportunities')

  // ─── Create opportunities ───────────────────────────────────────────────
  const opportunities = [
    {
      poster: posters[0]._id,
      title: 'Need video editor for YouTube channel',
      description: `I run a YouTube channel with 50K subscribers and post 3 videos every week. I need a skilled video editor who can handle the entire post-production process — from cutting raw footage to final export with color grading and sound mixing.\n\nThis is a remote, project-based role. You'll work on 2-3 videos per week depending on the length and complexity.`,
      opportunityType: 'Project-based',
      role: 'Video Editor',
      peopleNeeded: 1,
      filledCount: 0,
      location: 'Remote',
      mode: 'Remote',
      budget: 15000,
      budgetType: 'fixed',
      duration: '1 month',
      deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      skills: ['Adobe Premiere Pro', 'Color Grading', 'Audio Mixing', 'Motion Graphics'],
      tools: ['Premiere Pro', 'After Effects', 'Audition'],
      goodToHaveSkills: ['DaVinci Resolve', 'Thumbnail Design'],
      scope: [
        'Edit raw footage into polished 10-15 min videos',
        'Add intro/outro, transitions, and lower thirds',
        'Color grade and mix audio for consistency',
        'Export in multiple formats for YouTube/Shorts/Reels',
        'Maintain a backlog of 2 edited videos at all times',
      ],
      experienceLevel: 'Intermediate',
      portfolioRequired: true,
      weeklyHours: '15-20 hrs/week',
      paymentSchedule: 'Per-video — milestone based (rough cut → final)',
      longTermPossible: true,
      laptopRequired: 'Yes — own laptop with Premiere Pro',
      screeningProcess: 'Submit a 2-min sample edit of provided footage',
      status: 'active',
      applicantsCount: 8,
      views: 142,
    },
    {
      poster: posters[1]._id,
      title: 'Need 3-4 developers for fintech startup project',
      description: `We're building a personal finance management app and need a small team of developers to help us ship the MVP in 3 months. This is a paid, project-based opportunity with potential for long-term collaboration.\n\nTech stack: React Native for mobile, Node.js + PostgreSQL for backend. We have designs ready on Figma.`,
      opportunityType: 'Full-time',
      role: 'Developer',
      peopleNeeded: 4,
      filledCount: 2,
      location: 'Bangalore',
      mode: 'Hybrid',
      budget: 8000,
      budgetType: 'monthly',
      duration: '4 months',
      startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      skills: ['React Native', 'Node.js', 'PostgreSQL', 'REST APIs'],
      tools: ['React Native CLI', 'Express.js', 'PostgreSQL', 'Git', 'Figma'],
      goodToHaveSkills: ['TypeScript', 'Redis', 'AWS'],
      scope: [
        'Build the core mobile app UI following Figma designs',
        'Develop REST API endpoints for user accounts, transactions, budgets',
        'Set up PostgreSQL schema and write migrations',
        'Integrate third-party APIs for bank account linking',
        'Write unit tests and participate in code reviews',
      ],
      experienceLevel: 'Intermediate',
      portfolioRequired: true,
      weeklyHours: '30-40 hrs/week',
      paymentSchedule: 'Monthly — reviewed every sprint',
      longTermPossible: true,
      laptopRequired: 'Yes — own laptop/desktop',
      screeningProcess: 'Portfolio review → 30-min technical call → small coding task',
      rolesNeeded: [
        { title: 'React Native Developer', count: 2 },
        { title: 'Backend Developer (Node.js)', count: 2 },
      ],
      status: 'active',
      applicantsCount: 22,
      views: 310,
    },
    {
      poster: posters[2]._id,
      title: 'Content writer for e-commerce blog posts',
      description: `I run an e-commerce store selling home decor products. I need a content writer who can write SEO-optimized blog posts and product descriptions regularly.\n\nTopics include interior design tips, product guides, and gift ideas. You'll get access to our product catalog and keyword research.`,
      opportunityType: 'Part-time',
      role: 'Content Writer',
      peopleNeeded: 1,
      filledCount: 0,
      location: 'Mumbai',
      mode: 'On-site',
      budget: 25000,
      budgetType: 'monthly',
      duration: 'Long-term',
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      skills: ['SEO Writing', 'Blog Writing', 'Product Descriptions', 'Research'],
      tools: ['Google Docs', 'WordPress', 'Ahrefs'],
      goodToHaveSkills: ['Canva', 'Basic HTML'],
      scope: [
        'Write 4-6 blog posts per month (1200-2000 words each)',
        'Optimize all content for SEO using provided keywords',
        'Write product descriptions for new inventory (20-30/month)',
        'Update existing blog posts with fresh content and keywords',
        'Collaborate with the design team on blog visuals',
      ],
      experienceLevel: 'Intermediate',
      portfolioRequired: true,
      weeklyHours: '15-20 hrs/week',
      ownEquipment: 'Own laptop required',
      paymentSchedule: 'Monthly — based on deliverables completed',
      longTermPossible: true,
      laptopRequired: 'Yes — own laptop',
      screeningProcess: 'Submit 2 writing samples + test article on a given topic',
      status: 'active',
      applicantsCount: 15,
      views: 98,
    },
    {
      poster: posters[3]._id,
      title: 'Graphic designer for social media creatives',
      description: `I'm a digital marketing consultant and need a graphic designer who can create social media posts, story templates, and ad creatives for multiple client accounts.\n\nYou'll work on Instagram, LinkedIn, and Facebook content. Brand guidelines will be provided for each client.`,
      opportunityType: 'Project-based',
      role: 'Graphic Designer',
      peopleNeeded: 2,
      filledCount: 0,
      location: 'Remote',
      mode: 'Remote',
      budget: 35000,
      budgetType: 'monthly',
      duration: '4 months',
      deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      skills: ['Graphic Design', 'Social Media Design', 'Typography', 'Brand Design'],
      tools: ['Figma', 'Adobe Illustrator', 'Canva', 'Photoshop'],
      goodToHaveSkills: ['Video Editing', 'Motion Design', 'Copywriting'],
      scope: [
        'Design 10-15 social media posts per week across client accounts',
        'Create Instagram story templates and highlight covers',
        'Design LinkedIn carousel posts and banner images',
        'Prepare ad creatives (static + simple animated) for campaigns',
        'Maintain brand consistency across all client deliverables',
      ],
      experienceLevel: 'Intermediate',
      portfolioRequired: true,
      weeklyHours: '20-25 hrs/week',
      paymentSchedule: 'Bi-weekly — based on deliverables approved',
      longTermPossible: true,
      laptopRequired: 'Yes — own laptop with design software',
      screeningProcess: 'Portfolio review → design test (create 1 social post)',
      rolesNeeded: [
        { title: 'Social Media Designer', count: 1 },
        { title: 'Brand Designer', count: 1 },
      ],
      status: 'active',
      applicantsCount: 5,
      views: 67,
    },
  ]

  const created = await Opportunity.insertMany(opportunities)
  console.log(`\nSeeded ${created.length} opportunities:`)
  for (const opp of created) {
    const poster = posters.find(p => String(p._id) === String(opp.poster))
    console.log(`  ${opp.title} — posted by ${poster?.name || '?'} (${opp._id})`)
  }

  await mongoose.disconnect()
  console.log('\nDone!')
}

seed().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
