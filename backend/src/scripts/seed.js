require('dotenv').config()
const dns = require('dns')
dns.setServers(['1.1.1.1', '8.8.8.8'])
const mongoose = require('mongoose')
const User = require('../models/User')
const StudentProfile = require('../models/StudentProfile')
const Company = require('../models/Company')
const Agency = require('../models/Agency')
const Internship = require('../models/Internship')
const Job = require('../models/Job')

// ─── Demo account credentials ────────────────────────────────────────────────
const DEMO_STUDENT = {
  name: 'Demo Student',
  email: 'student@demo.com',
  password: 'student@123',
  role: 'student',
}

const DEMO_COMPANY = {
  name: 'Demo Company',
  email: 'company@demo.com',
  password: 'company@123',
  role: 'company',
  companyName: 'Acme Corp',
}

const DEMO_ADMIN = {
  name: 'Demo Admin',
  email: 'admin@demo.com',
  password: 'admin@123',
  role: 'admin',
}

const DEMO_AGENCY = {
  name: 'Creative Cuts Studio',
  email: 'agency@demo.com',
  password: 'agency@123',
  role: 'agency',
  agencyName: 'Creative Cuts Studio',
}

// ─── Generator helpers ───────────────────────────────────────────────────────

const COMPANIES = [
  { name: 'Acme Corp', industry: 'Technology', size: '50-200', location: 'San Francisco, CA' },
  { name: 'TechNova', industry: 'Technology', size: '200-500', location: 'Bangalore, India' },
  { name: 'DataPulse', industry: 'Data Science', size: '10-50', location: 'Remote' },
  { name: 'DesignStudio', industry: 'Design', size: '10-50', location: 'New York, NY' },
  { name: 'CloudBase', industry: 'Cloud Computing', size: '100-300', location: 'Seattle, WA' },
  { name: 'FinLeap', industry: 'Fintech', size: '50-200', location: 'Mumbai, India' },
  { name: 'HealthTech Inc', industry: 'Healthcare', size: '200-500', location: 'Boston, MA' },
  { name: 'GreenEnergy Labs', industry: 'Clean Energy', size: '50-200', location: 'Austin, TX' },
  { name: 'EduSpark', industry: 'EdTech', size: '10-50', location: 'Remote' },
  { name: 'CyberShield', industry: 'Cybersecurity', size: '100-300', location: 'Washington, DC' },
  { name: 'AILabs', industry: 'Artificial Intelligence', size: '50-200', location: 'Toronto, Canada' },
  { name: 'GameForge', industry: 'Gaming', size: '100-300', location: 'Los Angeles, CA' },
  { name: 'RetailNext', industry: 'E-commerce', size: '500-1000', location: 'Chicago, IL' },
  { name: 'BioGenix', industry: 'Biotechnology', size: '50-200', location: 'San Diego, CA' },
  { name: 'SpaceWorks', industry: 'Aerospace', size: '200-500', location: 'Denver, CO' },
]

const AGENCIES = [
  { name: 'Creative Cuts Studio', services: ['Video Editing', 'Photo Editing/Photography', 'Animation/VFX'], teamSize: '6-10', city: 'Mumbai, India' },
  { name: 'PixelPerfect Designs', services: ['Graphic Design', 'Web Development', 'Social Media Management'], teamSize: '1-5', city: 'Remote' },
  { name: 'ContentVibe Agency', services: ['Content Writing', 'Digital Marketing', 'SEO'], teamSize: '6-10', city: 'Bangalore, India' },
  { name: 'MotionForge Studio', services: ['Animation/VFX', 'Video Editing', 'Graphic Design'], teamSize: '11-25', city: 'Delhi, India' },
  { name: 'SocialSpark Media', services: ['Social Media Management', 'Digital Marketing', 'Content Writing'], teamSize: '1-5', city: 'Remote' },
  { name: 'WebCraft Agency', services: ['Web Development', 'Graphic Design', 'SEO'], teamSize: '6-10', city: 'Hyderabad, India' },
]

const AGENCY_POSTING_TITLES = {
  'Video Editing': [
    'YouTube Video Editor Needed', 'Short-form Reel Editor', 'Talking Head Video Editor',
    'Podcast Editor & Producer', 'Event Highlight Reel Editor', 'Motion Graphics Designer',
    'Color Grading Specialist', 'Wedding Video Editor', 'Product Video Editor',
    'Educational Content Editor',
  ],
  'Photo Editing/Photography': [
    'Product Photo Retoucher', 'Portrait Editor', 'E-commerce Image Editor',
    'Wedding Photo Editor', 'Real Estate Photo Editor', 'Fashion Retoucher',
    'Batch Photo Processor', 'Event Photographer Editor',
  ],
  'Graphic Design': [
    'Social Media Graphic Designer', 'Brand Identity Designer', 'Thumbnail Designer',
    'Presentation Designer', 'Print Layout Designer', 'Packaging Designer',
    'Infographic Designer', 'Banner & Ad Creative Designer',
  ],
  'Digital Marketing': [
    'Social Media Manager', 'Paid Ads Specialist', 'Email Marketing Specialist',
    'Influencer Marketing Coordinator', 'Growth Hacker', 'Marketing Analyst',
    'Campaign Manager', 'Performance Marketer',
  ],
  'Content Writing': [
    'Blog Writer', 'Copywriter', 'SEO Content Writer', 'Technical Writer',
    'Script Writer (Video)', 'Website Copywriter', 'Product Description Writer',
    'Newsletter Writer',
  ],
  'Web Development': [
    'Freelance React Developer', 'WordPress Developer', 'Landing Page Designer',
    'Full Stack Freelancer', 'Shopify Developer', 'Frontend Developer (Project)',
    'Webflow Developer', 'API Integration Specialist',
  ],
  'Social Media Management': [
    'Instagram Community Manager', 'Content Calendar Planner', 'Social Media Analyst',
    'UGC Content Curator', 'Community Engagement Specialist', 'Social Media Strategist',
  ],
  'Animation/VFX': [
    '2D Animator', '3D Motion Designer', 'Explainer Video Animator', 'VFX Artist',
    'Character Animator', 'Whiteboard Animator', 'Lottie Animator',
  ],
  'SEO': [
    'On-Page SEO Specialist', 'Technical SEO Auditor', 'Link Building Specialist',
    'SEO Content Strategist', 'Local SEO Expert', 'SEO Analyst',
  ],
  'Voice Over': [
    'Voice Over Artist', 'Hindi Voice Actor', 'English Narration Artist',
    'Commercial VO Artist', 'Corporate VO Narrator',
  ],
}

const AGENCY_TOOLS_POOL = {
  'Video Editing': ['Premiere Pro', 'After Effects', 'DaVinci Resolve', 'Final Cut Pro', 'CapCut', 'Audition'],
  'Photo Editing/Photography': ['Photoshop', 'Lightroom', 'Capture One', 'Luminar', 'Canva'],
  'Graphic Design': ['Photoshop', 'Illustrator', 'InDesign', 'Figma', 'Canva', 'CorelDRAW'],
  'Digital Marketing': ['Meta Ads Manager', 'Google Ads', 'HubSpot', 'Mailchimp', 'SEMrush', 'Google Analytics'],
  'Content Writing': ['Grammarly', 'Hemmingway Editor', 'Surfer SEO', 'WordPress', 'Notion'],
  'Web Development': ['VS Code', 'React', 'Node.js', 'Figma', 'Git', 'WordPress', 'Shopify'],
  'Social Media Management': ['Meta Business Suite', 'Hootsuite', 'Buffer', 'Canva', 'Later', 'Sprout Social'],
  'Animation/VFX': ['Blender', 'Maya', 'Cinema 4D', 'After Effects', 'Houdini', 'Unreal Engine'],
  'SEO': ['SEMrush', 'Ahrefs', 'Google Search Console', 'Screaming Frog', 'Moz'],
  'Voice Over': ['Audacity', 'Adobe Audition', 'Pro Tools', 'Logic Pro'],
}

const AGENCY_PERKS_POOL = [
  'Flexible hours', 'Remote work', 'Certificate of Completion', 'Letter of Recommendation',
  'Long-term collaboration potential', 'Portfolio credit / Feature', 'Free revisions',
  'Project-based payment', 'Creative freedom', 'Own schedule', 'Direct client communication',
  'Portfolio building opportunity', 'Revenue share potential',
]

const INTERNSHIP_TITLES = [
  'Frontend Developer Intern', 'Backend Developer Intern', 'Full Stack Intern',
  'Data Science Intern', 'Machine Learning Intern', 'AI Research Intern',
  'UI/UX Design Intern', 'Graphic Design Intern', 'Product Design Intern',
  'Marketing Intern', 'Content Writing Intern', 'Social Media Intern',
  'Business Development Intern', 'Sales Intern', 'Operations Intern',
  'HR Intern', 'Recruitment Intern', 'Finance Intern',
  'DevOps Intern', 'Cloud Engineering Intern', 'Cybersecurity Intern',
  'Mobile App Developer Intern', 'iOS Developer Intern', 'Android Developer Intern',
  'QA / Testing Intern', 'Technical Writing Intern', 'SEO Intern',
  'Data Analytics Intern', 'Business Analyst Intern', 'Product Management Intern',
  'Blockchain Developer Intern', 'AR/VR Developer Intern', 'Game Development Intern',
  'Embedded Systems Intern', 'IoT Intern', 'Robotics Intern',
  'Biotech Research Intern', 'Environmental Science Intern', 'Renewable Energy Intern',
  'Supply Chain Intern', 'Logistics Intern', 'Customer Success Intern',
  'Community Management Intern', 'Video Editing Intern', 'Motion Graphics Intern',
  'Photography Intern', 'Event Management Intern', 'Public Relations Intern',
  'Legal Intern', 'Accounting Intern', 'Investment Banking Intern',
]

const JOB_TITLES = [
  'Software Engineer', 'Senior Software Engineer', 'Staff Engineer',
  'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'Data Scientist', 'Machine Learning Engineer', 'AI Engineer',
  'Product Manager', 'Senior Product Manager', 'Technical Product Manager',
  'UX Designer', 'UI Designer', 'Product Designer',
  'DevOps Engineer', 'Site Reliability Engineer', 'Cloud Architect',
  'Marketing Manager', 'Content Strategist', 'Growth Hacker',
  'Sales Representative', 'Account Executive', 'Business Development Manager',
  'HR Manager', 'Talent Acquisition Specialist', 'People Operations',
  'Financial Analyst', 'Investment Analyst', 'Accountant',
  'Cybersecurity Analyst', 'Security Engineer', 'Penetration Tester',
  'Data Engineer', 'Analytics Engineer', 'Business Intelligence Analyst',
  'Technical Writer', 'Solutions Architect', 'Consultant',
  'Mobile Developer', 'iOS Engineer', 'Android Engineer',
  'Game Developer', 'Unity Developer', 'Unreal Engine Developer',
  'Research Scientist', 'Lab Technician', 'Clinical Data Manager',
  'Supply Chain Analyst', 'Operations Manager', 'Logistics Coordinator',
  'Customer Success Manager', 'Support Engineer', 'Account Manager',
]

const SKILLS_POOL = [
  'JavaScript', 'TypeScript', 'React', 'Vue.js', 'Angular', 'Next.js', 'Node.js',
  'Python', 'Django', 'Flask', 'FastAPI', 'Java', 'Spring Boot', 'C#', '.NET',
  'Go', 'Rust', 'C++', 'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD',
  'Git', 'Linux', 'REST APIs', 'GraphQL', 'gRPC', 'WebSockets',
  'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy', 'Tableau',
  'Figma', 'Adobe XD', 'Photoshop', 'Illustrator', 'After Effects',
  'SEO', 'SEM', 'Google Analytics', 'Content Writing', 'Social Media',
  'Agile', 'Scrum', 'JIRA', 'Project Management', 'Data Analysis',
  'Communication', 'Leadership', 'Problem Solving', 'Teamwork',
]

const BENEFITS_POOL = [
  'Health insurance', 'Stock options', 'Remote work', 'Flexible hours',
  'Learning budget', 'Paid time off', 'Free lunch', 'Gym membership',
  'Mentorship', 'Certificate', 'PPO opportunity', 'Networking events',
  'On-call pay', 'Creative freedom', 'Portfolio building', 'Travel allowance',
]

const LOCATIONS = ['Remote', 'Hybrid', 'On-site']
const CITIES = [
  'San Francisco, CA', 'New York, NY', 'Austin, TX', 'Seattle, WA',
  'Boston, MA', 'Chicago, IL', 'Denver, CO', 'Los Angeles, CA',
  'Bangalore, India', 'Mumbai, India', 'Delhi, India', 'Hyderabad, India',
  'Toronto, Canada', 'London, UK', 'Berlin, Germany', 'Singapore',
]

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickN(arr, min, max) {
  const count = min + Math.floor(Math.random() * (max - min + 1))
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, arr.length))
}

function randomStipend() {
  const levels = [5000, 8000, 10000, 12000, 15000, 18000, 20000, 25000, 30000, 35000, 40000, 50000]
  return pick(levels)
}

function randomSalary() {
  const min = pick([300000, 400000, 500000, 600000, 800000, 1000000, 1200000, 1500000])
  const max = min + pick([200000, 300000, 400000, 500000, 600000, 800000])
  return { min, max }
}

function randomDeadline() {
  return new Date(Date.now() + (15 + Math.floor(Math.random() * 75)) * 24 * 60 * 60 * 1000)
}

function generateDescription(title, companyName) {
  const templates = [
    `Join ${companyName} as a ${title} and work on cutting-edge projects that impact millions of users. You'll collaborate with a talented team in a fast-paced environment.`,
    `${companyName} is looking for a passionate ${title} to help build and scale our platform. This is a great opportunity to grow your skills and make an impact.`,
    `We are seeking a ${title} to join ${companyName}. You will be responsible for designing, building, and maintaining key features of our products.`,
    `${companyName} is hiring a ${title} to drive innovation in our engineering team. Work with modern technologies and solve challenging problems at scale.`,
    `As a ${title} at ${companyName}, you'll play a critical role in shaping the future of our products. We value creativity, collaboration, and continuous learning.`,
  ]
  return pick(templates)
}

// ─── Upsert user helper ──────────────────────────────────────────────────────

async function upsertUser(demo) {
  let user = await User.findOne({ email: demo.email }).select('+password')
  if (user) {
    user.name = demo.name
    user.role = demo.role
    user.isEmailVerified = true
    user.isBlocked = false
    user.password = demo.password
    user.otpCode = undefined
    user.otpExpires = undefined
    user.otpAttempts = 0
    await user.save()
    console.log(`✅ Updated ${demo.role}: ${demo.email}`)
  } else {
    user = await User.create({
      name: demo.name,
      email: demo.email,
      password: demo.password,
      role: demo.role,
      isEmailVerified: true,
    })
    console.log(`✅ Created ${demo.role}: ${demo.email}`)
  }
  return user
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function run() {
  let mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/bridge'
  const match = mongoUri.match(/MONGODB_URI="?([^"]+)"?/)
  if (match) mongoUri = match[1]

  await mongoose.connect(mongoUri)
  console.log('Connected to MongoDB.\n')

  // ── Seed Users ──────────────────────────────────────────────────────────
  const admin = await upsertUser(DEMO_ADMIN)
  const student = await upsertUser(DEMO_STUDENT)

  let studentProfile = await StudentProfile.findOne({ user: student._id })
  if (!studentProfile) {
    studentProfile = await StudentProfile.create({
      user: student._id,
      firstName: 'Demo',
      lastName: 'Student',
      headline: 'Frontend Developer | React, Node.js',
      currentLocation: 'Bangalore, India',
      openTo: 'both',
      relocate: true,
      noticePeriod: '30 days',
      expectedCTC: { min: 600000, max: 900000 },
      openToWork: true,
      hideFromCurrentEmployer: false,
      lastActive: new Date(),
      college: 'University of Technology',
      degree: 'B.Tech Computer Science',
      year: '3rd Year',
      skills: ['JavaScript', 'React', 'Node.js', 'Python', 'TypeScript', 'Tailwind CSS'],
      resumeUrl: '/uploads/resumes/demo-resume.pdf',
      bio: 'Passionate frontend developer with experience building modern web applications. Looking for opportunities in full-stack development.',
      experience: [{ company: 'TechNova', role: 'Frontend Intern', duration: '6 months', current: true }],
      education: [{ degree: 'B.Tech Computer Science', institution: 'University of Technology', year: '2026' }],
      projects: [{ title: 'E-Commerce Platform', description: 'Built a full-stack e-commerce platform using React and Node.js', techStack: ['React', 'Node.js', 'MongoDB'], link: 'https://github.com/demo/ecommerce' }],
      certifications: [{ name: 'AWS Cloud Practitioner', issuer: 'Amazon', date: '2024-01' }],
      achievements: [{ title: 'Hackathon Winner', description: 'Won first place at TechHack 2024' }],
      languages: [{ name: 'English', proficiency: 'Fluent' }, { name: 'Hindi', proficiency: 'Native' }],
      jobPreferences: { preferredLocations: ['Bangalore', 'Remote'], preferredRoles: ['Frontend Developer', 'Full Stack Developer'], preferredCompanyType: 'Startup' },
      github: 'https://github.com/demo',
      linkedin: 'https://linkedin.com/in/demo',
      portfolio: 'https://demo.dev',
      isPhoneVerified: true,
      isIdVerified: true,
      contactRevealedTo: [],
      blockedCompanies: [],
    })
    console.log('   Created student profile')
  } else {
    await StudentProfile.findByIdAndUpdate(studentProfile._id, { openToWork: true, lastActive: new Date() })
  }

  const company = await upsertUser(DEMO_COMPANY)
  let companyProfile = await Company.findOne({ user: company._id })
  if (!companyProfile) {
    companyProfile = await Company.create({
      user: company._id,
      name: DEMO_COMPANY.companyName,
      email: DEMO_COMPANY.email,
      industry: 'Technology',
      size: '50-200',
      location: 'San Francisco, CA',
      description: 'A leading technology company building innovative solutions.',
      isVerified: true,
    })
    console.log('   Created company profile')
  }

  // ── Create additional companies for variety ─────────────────────────────
  const extraCompanies = []
  for (const c of COMPANIES) {
    if (c.name === 'Acme Corp') continue // already created
    let comp = await Company.findOne({ name: c.name })
    if (!comp) {
      const user = await User.create({
        name: c.name,
        email: `${c.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@demo.com`,
        password: 'company@123',
        role: 'company',
        isEmailVerified: true,
      })
      comp = await Company.create({
        user: user._id,
        name: c.name,
        email: `${c.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@demo.com`,
        industry: c.industry,
        size: c.size,
        location: c.location,
        description: `${c.name} is a leading ${c.industry.toLowerCase()} company.`,
        isVerified: true,
      })
      console.log(`   Created company: ${c.name}`)
    }
    extraCompanies.push(comp)
  }

  const allCompanies = [companyProfile, ...extraCompanies]

  // ── Seed Demo Agency ─────────────────────────────────────────────────
  const agencyUser = await upsertUser(DEMO_AGENCY)
  let agencyProfile = await Agency.findOne({ user: agencyUser._id })
  if (!agencyProfile) {
    agencyProfile = await Agency.create({
      user: agencyUser._id,
      agencyName: DEMO_AGENCY.agencyName,
      description: 'Creative Cuts Studio is a Mumbai-based video editing & animation agency. We produce high-quality content for YouTube creators, brands, and media houses.',
      website: 'https://creativecutsstudio.com',
      city: 'Mumbai, India',
      services: ['Video Editing', 'Photo Editing/Photography', 'Animation/VFX'],
      teamSize: '6-10',
      portfolioUrl: 'https://creativecutsstudio.com/portfolio',
      instagram: 'https://instagram.com/creativecutsstudio',
      linkedin: 'https://linkedin.com/company/creativecutsstudio',
      foundedYear: 2021,
      isRegistered: true,
      isProfileComplete: true,
      signupStep: 2,
      isVerified: true,
    })
    console.log('   Created agency profile: Creative Cuts Studio')
  }

  // ── Create additional agencies ─────────────────────────────────────────
  const extraAgencies = []
  for (const a of AGENCIES) {
    if (a.name === 'Creative Cuts Studio') continue
    let ag = await Agency.findOne({ agencyName: a.name })
    if (!ag) {
      const u = await User.create({
        name: a.name,
        email: `${a.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@demo.com`,
        password: 'agency@123',
        role: 'agency',
        isEmailVerified: true,
      })
      ag = await Agency.create({
        user: u._id,
        agencyName: a.name,
        description: `${a.name} is a ${a.services.slice(0, 2).join(' & ')} agency serving clients worldwide.`,
        city: a.city,
        services: a.services,
        teamSize: a.teamSize,
        portfolioUrl: `https://${a.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com/portfolio`,
        isRegistered: true,
        isProfileComplete: true,
        signupStep: 2,
      })
      console.log(`   Created agency: ${a.name}`)
    }
    extraAgencies.push(ag)
  }

  const allAgencies = [agencyProfile, ...extraAgencies]

  // ── Generate agency listings (jobs+internships posted by agencies) ──────
  console.log('\n── Generating Agency Listings ──────────────────────────')
  let agencyJobCount = 0
  let agencyInternCount = 0

  for (const ag of allAgencies) {
    const services = ag.services || []
    const postingsPerAgency = 2 + Math.floor(Math.random() * 5)

    for (let i = 0; i < postingsPerAgency; i++) {
      const svc = pick(services)
      const titles = AGENCY_POSTING_TITLES[svc] || ['Freelance Project']
      const title = pick(titles)
      const tools = pickN(AGENCY_TOOLS_POOL[svc] || [], 1, 4)
      const skills = pickN(SKILLS_POOL, 2, 4)
      const location = pick(LOCATIONS)
      const deadline = randomDeadline()
      const isInternship = Math.random() < 0.35
      const experienceLevel = pick(['fresher', 'fresher', 'intermediate', 'intermediate', 'expert'])

      const common = {
        title,
        description: `We are looking for a ${title} to join our team at ${ag.agencyName}. ${svc ? `You will work on ${svc.toLowerCase()} projects for our clients.` : ''}\n\nScope of Work:\n• Create high-quality ${svc ? svc.toLowerCase() : 'creative'} content as per client briefs\n• Collaborate with our creative team to deliver projects on time\n• Maintain brand consistency across all deliverables\n• Incorporate feedback and revisions as needed\n\nDeliverables:\n• Final output in required format(s)\n• Source files where applicable\n• Adherence to project timeline and milestones`,
        skills,
        tools,
        experienceLevel,
        portfolioRequired: Math.random() < 0.7,
        portfolioType: Math.random() < 0.5 ? 'Similar work samples (2-3 projects)' : 'Portfolio link or PDF',
        equipmentRequired: Math.random() < 0.5 ? 'Own laptop/PC required. Software license not provided.' : 'No special equipment needed',
        longTermCollaboration: Math.random() < 0.4,
        revisionPolicy: pick(['2 revisions included', '3 revisions included', 'Unlimited revisions within scope', '1 revision round included', 'Revisions billed extra after 2 rounds']),
        paymentSchedule: pick(['Milestone-based (50% upfront + 50% on completion)', 'Weekly payout', 'On completion', '50% before start + 25% at midpoint + 25% on delivery', 'Monthly retainer']),
        location: location === 'On-site' ? pick(CITIES) : 'Remote',
        mode: 'Remote',
        category: svc,
        vacancies: 1 + Math.floor(Math.random() * 2),
        deadline,
        status: pick(['approved', 'approved', 'approved', 'approved', 'closed', 'draft']),
        screeningProcess: pick(['Portfolio review + Quick call', 'Sample task review + Interview', 'Portfolio review only', 'Resume + Portfolio review + Test task']),
        screeningQuestions: Math.random() < 0.5 ? [
          { question: `What ${svc ? svc.toLowerCase() : 'creative'} software/tools are you proficient in?`, required: true },
          { question: 'Share links to 2-3 relevant work samples', required: true },
          { question: 'What is your availability (hours per week)?', required: false },
        ] : undefined,
        testTask: Math.random() < 0.3 ? {
          title: `${svc ? svc : 'Creative'} Sample Task`,
          description: `Create a short ${svc ? svc.toLowerCase() : 'sample'} piece demonstrating your skills. This helps us evaluate your style and quality before hiring.`,
          paidAmount: Math.random() < 0.5 ? pick([500, 1000, 2000, 3000, 5000]) : undefined,
        } : undefined,
        agency: ag._id,
        postedBy: ag.user,
      }

      if (isInternship) {
        const exists = await Internship.findOne({ title, agency: ag._id })
        if (exists) continue
        await Internship.create({
          ...common,
          stipend: randomStipend(),
          duration: pick(['1 month', '2 months', '3 months', '6 months']),
          startDate: new Date(Date.now() + pick([0, 7, 14, 30]) * 86400000),
          hasPPO: Math.random() < 0.3,
          perks: pickN(AGENCY_PERKS_POOL, 2, 4),
          laptopRequired: Math.random() < 0.5 ? 'Own laptop required' : undefined,
          portfolioCredit: Math.random() < 0.5,
          milestoneBreakdown: Math.random() < 0.4 ? [
            { milestone: 'Project kickoff & initial concept', percentage: 30, description: 'Research, moodboard, and initial drafts' },
            { milestone: 'Client review & revisions', percentage: 30, description: 'First round of revisions based on client feedback' },
            { milestone: 'Final delivery', percentage: 40, description: 'Final polished output with source files' },
          ] : undefined,
          usageRights: pick([
            'Full ownership transferred upon final payment. Agency retains right to showcase in portfolio.',
            'Client owns final deliverables. Agency retains right to use in portfolio and social media.',
            'Shared ownership — both parties can use the work for self-promotion. Client gets exclusive commercial rights.',
          ]),
        })
        agencyInternCount++
      } else {
        const exists = await Job.findOne({ title, agency: ag._id })
        if (exists) continue
        const salary = randomSalary()
        await Job.create({
          ...common,
          salaryMin: salary.min,
          salaryMax: salary.max,
          employmentType: pick(['Full-time', 'Part-time', 'Contract', 'Contract', 'Contract']),
          experience: pick(['Fresher', '1-3 years', '3-5 years', '5+ years', '10+ years']),
          goodToHaveSkills: pickN(SKILLS_POOL, 1, 3),
          benefits: pickN(AGENCY_PERKS_POOL, 1, 3),
          perks: pickN(AGENCY_PERKS_POOL, 1, 3),
          roles: [
            'Deliver high-quality creative work within deadlines',
            'Communicate with clients for feedback and revisions',
            'Maintain organized project files and assets',
            'Collaborate with the creative team on project planning',
          ],
          duration: pick(['1 month project', '3 months', '6 months', 'Ongoing collaboration']),
          portfolioCredit: Math.random() < 0.5,
          milestoneBreakdown: Math.random() < 0.4 ? [
            { milestone: 'Project kickoff & initial concept', percentage: 30, description: 'Research, moodboard, and initial drafts' },
            { milestone: 'Client review & revisions', percentage: 30, description: 'First round of revisions based on client feedback' },
            { milestone: 'Final delivery', percentage: 40, description: 'Final polished output with source files' },
          ] : undefined,
          usageRights: pick([
            'Full ownership transferred upon final payment. Agency retains right to showcase in portfolio.',
            'Client owns final deliverables. Agency retains right to use in portfolio and social media.',
            'Shared ownership — both parties can use the work for self-promotion. Client gets exclusive commercial rights.',
          ]),
        })
        agencyJobCount++
      }
    }
  }
  console.log(`   Created ${agencyInternCount} agency internships`)
  console.log(`   Created ${agencyJobCount} agency jobs`)

  // ── Generate 100+ Internships ───────────────────────────────────────────
  console.log('\n── Generating Internships ───────────────────────────')
  let internCount = 0
  for (let i = 0; i < 120; i++) {
    const title = pick(INTERNSHIP_TITLES)
    const comp = pick(allCompanies)
    const exists = await Internship.findOne({ title, company: comp._id })
    if (exists) continue

    const location = pick(LOCATIONS)
    await Internship.create({
      title,
      description: generateDescription(title, comp.name),
      skills: pickN(SKILLS_POOL, 2, 5),
      duration: pick(['2 months', '3 months', '6 months', '12 months']),
      stipend: randomStipend(),
      location: location === 'On-site' ? pick(CITIES) : location,
      mode: location,
      category: pick(['Engineering', 'Design', 'Marketing', 'Data Science', 'Product', 'Finance', 'HR', 'Operations']),
      vacancies: 1 + Math.floor(Math.random() * 5),
      deadline: randomDeadline(),
      benefits: pickN(BENEFITS_POOL, 1, 4),
      status: pick(['approved', 'approved', 'approved', 'approved', 'closed']),
      startDate: new Date(Date.now() + pick([0, 3, 7, 14, 30, 60]) * 86400000),
      internshipType: pick(['Full-time', 'Full-time', 'Full-time', 'Part-time']),
      hasPPO: Math.random() < 0.3,
      roles: pickN([
        'Write clean, maintainable code',
        'Collaborate with cross-functional teams',
        'Participate in code reviews',
        'Write technical documentation',
        'Conduct research and analysis',
        'Design and implement new features',
        'Debug and fix production issues',
        'Create wireframes and prototypes',
        'Analyze data to derive insights',
        'Assist in campaign planning and execution',
        'Prepare reports and presentations',
        'Attend team standups and sprint planning',
      ], 2, 5),
      learningOutcomes: pickN([
        'Hands-on experience with modern tools and frameworks',
        'Understanding of industry-standard workflows',
        'Mentorship from senior engineers and managers',
        'Real-world project experience for your portfolio',
        'Exposure to agile development methodologies',
        'Networking opportunities with industry professionals',
        'Certificate of completion and LOR',
        'Improved problem-solving and analytical skills',
        'Experience with version control and CI/CD',
        'Understanding of production systems and deployments',
        'Client-facing and communication skills',
        'Data-driven decision making skills',
      ], 2, 4),
      goodToHaveSkills: pickN(SKILLS_POOL, 1, 3),
      perks: pickN([
        'Certificate of Completion',
        'Letter of Recommendation',
        'PPO / Full-time conversion possibility',
        'Flexible work hours',
        'Stipend/incentives',
        'Mentorship/1-on-1 guidance',
        'Training and certifications',
        'Health insurance',
      ], 2, 5),
      eligibility: {
        yearOfStudy: pick(['2nd year', '3rd year', '4th year', 'Final year', 'Graduate', 'Postgraduate', 'Any']),
        ageLimit: Math.random() < 0.3 ? pick(['18-25 years', '18-30 years']) : undefined,
      },
      degreeRequired: pick(['B.Tech/B.E. in CSE/IT', 'Any Graduate', 'B.Tech/M.Tech', 'BCA/MCA', 'B.Sc/M.Sc', 'Any degree']),
      laptopRequired: Math.random() < 0.4 ? 'Own laptop required' : 'Company-provided laptop',
      screeningProcess: pick(['Resume screening + Telephonic round', 'Assignment + Technical interview', '2-round interview process', 'Resume + Portfolio review', 'Online test + HR round']),
      cohortStartDate: Math.random() < 0.3 ? new Date(Date.now() + pick([15, 30, 45, 60]) * 86400000) : undefined,
      screeningQuestions: Math.random() < 0.4 ? [
        { question: 'Why do you want to work with us?', required: true },
        { question: 'What relevant experience do you have?', required: true },
        { question: 'How many hours can you commit per week?', required: false },
      ].slice(0, Math.random() < 0.5 ? 2 : 3) : undefined,
      company: comp._id,
      postedBy: comp.user,
    })
    internCount++
  }
  console.log(`   Created ${internCount} internships`)

  // ── Generate 100+ Jobs ──────────────────────────────────────────────────
  console.log('\n── Generating Jobs ───────────────────────────────────')
  let jobCount = 0
  for (let i = 0; i < 120; i++) {
    const title = pick(JOB_TITLES)
    const comp = pick(allCompanies)
    const exists = await Job.findOne({ title, company: comp._id })
    if (exists) continue

    const location = pick(LOCATIONS)
    const salary = randomSalary()
    await Job.create({
      title,
      description: generateDescription(title, comp.name),
      skills: pickN(SKILLS_POOL, 3, 6),
      experience: pick(['Fresher', '1-3 years', '3-5 years', '5+ years', '10+ years']),
      salaryMin: salary.min,
      salaryMax: salary.max,
      location: location === 'On-site' ? pick(CITIES) : location,
      mode: location,
      employmentType: pick(['Full-time', 'Full-time', 'Full-time', 'Part-time', 'Contract']),
      category: pick(['Engineering', 'Design', 'Marketing', 'Data Science', 'Product', 'Finance', 'HR', 'Operations', 'Sales']),
      vacancies: 1 + Math.floor(Math.random() * 4),
      deadline: randomDeadline(),
      benefits: pickN(BENEFITS_POOL, 2, 5),
      status: pick(['approved', 'approved', 'approved', 'approved', 'closed']),
      goodToHaveSkills: pickN(SKILLS_POOL, 1, 3),
      roles: pickN([
        'Lead development of new features',
        'Collaborate with cross-functional teams',
        'Mentor junior team members',
        'Design system architecture',
        'Write comprehensive tests',
        'Review code and ensure quality standards',
        'Manage project timelines and deliverables',
        'Interface with stakeholders and clients',
        'Optimize application performance',
        'Contribute to technical documentation',
      ], 2, 4),
      qualifications: pickN([
        "Bachelor's degree in Computer Science or related field",
        'Strong problem-solving and analytical skills',
        'Excellent communication and teamwork abilities',
        'Experience with agile development methodologies',
        'Proven track record of delivering projects on time',
        'Strong portfolio of relevant work',
        'Understanding of software design patterns',
        'Experience with cloud platforms (AWS/GCP/Azure)',
      ], 2, 4),
      minimumEducation: pick(["Bachelor's Degree", "Master's Degree", 'B.Tech/B.E.', 'BCA/MCA', 'Any Graduate', 'PhD']),
      certificationsRequired: Math.random() < 0.3 ? pickN(['AWS Certified', 'PMP', 'Google Cloud Certified', 'Azure Certified', 'SCJP', 'CISSP', 'CFA'], 1, 2) : [],
      noticePeriod: pick(['Immediate', '15 days', '30 days', '45 days', '60 days', '90 days']),
      shiftTiming: Math.random() < 0.2 ? pick(['Day shift', 'Night shift', 'Rotational shift']) : undefined,
      interviewProcess: pick(['2 technical rounds + 1 HR round', '1 coding round + 1 system design + 1 HR', '3 rounds: Technical, Managerial, HR', 'Take-home assignment + Technical discussion + HR', 'Online assessment + 2 technical interviews']),
      joiningTimeline: pick(['Immediate', 'Within 15 days', 'Within 30 days', 'Within 45 days', 'Within 60 days']),
      screeningQuestions: Math.random() < 0.4 ? [
        { question: 'What is your notice period?', required: true },
        { question: 'Why do you want to join us?', required: true },
        { question: 'What is your expected CTC?', required: false },
      ].slice(0, Math.random() < 0.5 ? 2 : 3) : undefined,
      company: comp._id,
      postedBy: comp.user,
    })
    jobCount++
  }
  console.log(`   Created ${jobCount} jobs`)

  // ── Seed Open-to-Work Student Profiles ──────────────────────────────
  console.log('\n── Generating Open-to-Work Student Profiles ────────────')
  const O2W_STUDENTS = [
    { firstName: 'Priya', lastName: 'Sharma', headline: 'Full Stack Developer | React, Node.js, Python', college: 'IIT Bombay', degree: 'B.Tech Computer Science', year: '2025', skills: ['React', 'Node.js', 'Python', 'MongoDB', 'Docker', 'AWS'], experience: [{ company: 'Google', role: 'SWE Intern', startDate: new Date('2024-06-01'), endDate: new Date('2024-09-01'), current: false }], education: [{ degree: 'B.Tech CSE', college: 'IIT Bombay', endYear: '2025' }], expectedCTC: '12-18 LPA', location: 'Mumbai, India', openTo: 'job', relocate: true, noticePeriod: '30 days', resumeUrl: '/uploads/resumes/priya-resume.pdf', bio: 'Full stack developer with experience building scalable web applications at Google.', github: 'https://github.com/priya', linkedin: 'https://linkedin.com/in/priya' },
    { firstName: 'Rahul', lastName: 'Verma', headline: 'Frontend Developer | React, TypeScript, Tailwind', college: 'Delhi College of Engineering', degree: 'B.Tech Information Technology', year: '2026', skills: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js', 'JavaScript', 'Git'], experience: [], education: [{ degree: 'B.Tech IT', college: 'Delhi College of Engineering', endYear: '2026' }], expectedCTC: '5-8 LPA', location: 'Delhi, India', openTo: 'internship', relocate: false, noticePeriod: 'Available Immediately', resumeUrl: '/uploads/resumes/rahul-resume.pdf', bio: 'Frontend enthusiast building beautiful web interfaces with React and TypeScript.', github: 'https://github.com/rahul', linkedin: 'https://linkedin.com/in/rahul' },
    { firstName: 'Ananya', lastName: 'Patel', headline: 'Data Scientist | Python, ML, TensorFlow', college: 'NIT Trichy', degree: 'M.Tech Data Science', year: '2025', skills: ['Python', 'TensorFlow', 'PyTorch', 'SQL', 'Tableau', 'Scikit-learn'], experience: [{ company: 'Microsoft', role: 'Data Science Intern', startDate: new Date('2024-12-01'), current: true }], education: [{ degree: 'M.Tech Data Science', college: 'NIT Trichy', endYear: '2025' }], expectedCTC: '15-22 LPA', location: 'Bangalore, India', openTo: 'job', relocate: true, noticePeriod: '45 days', resumeUrl: '/uploads/resumes/ananya-resume.pdf', bio: 'Data scientist passionate about using ML to solve real-world problems.', github: 'https://github.com/ananya', linkedin: 'https://linkedin.com/in/ananya' },
    { firstName: 'Arjun', lastName: 'Singh', headline: 'Backend Developer | Node.js, Go, PostgreSQL', college: 'BITS Pilani', degree: 'B.E. Computer Science', year: '2024', skills: ['Node.js', 'Go', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes', 'AWS'], experience: [{ company: 'Amazon', role: 'SDE', startDate: new Date('2023-07-01'), endDate: new Date('2024-07-01'), current: false }, { company: 'Stripe', role: 'Backend Engineer', startDate: new Date('2024-08-01'), current: true }], education: [{ degree: 'B.E. CSE', college: 'BITS Pilani', endYear: '2024' }], expectedCTC: '25-35 LPA', location: 'Bangalore, India', openTo: 'job', relocate: false, noticePeriod: '60 days', resumeUrl: '/uploads/resumes/arjun-resume.pdf', bio: 'Backend engineer with experience building distributed systems at scale.', github: 'https://github.com/arjun', linkedin: 'https://linkedin.com/in/arjun' },
    { firstName: 'Neha', lastName: 'Gupta', headline: 'UI/UX Designer | Figma, Adobe XD, Design Systems', college: 'NID Ahmedabad', degree: 'B.Des Communication Design', year: '2025', skills: ['Figma', 'Adobe XD', 'Photoshop', 'Illustrator', 'Design Systems', 'Prototyping'], experience: [{ company: 'Meta', role: 'Product Design Intern', startDate: new Date('2024-05-01'), endDate: new Date('2024-09-01'), current: false }], education: [{ degree: 'B.Des', college: 'NID Ahmedabad', endYear: '2025' }], expectedCTC: '8-12 LPA', location: 'Remote', openTo: 'both', relocate: true, noticePeriod: '30 days', resumeUrl: '/uploads/resumes/neha-resume.pdf', bio: 'Designer focused on creating intuitive and accessible user experiences.', portfolio: 'https://neha.design', linkedin: 'https://linkedin.com/in/neha' },
    { firstName: 'Vikram', lastName: 'Reddy', headline: 'DevOps Engineer | AWS, Kubernetes, Terraform', college: 'VIT Vellore', degree: 'B.Tech Computer Science', year: '2024', skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'Linux', 'Python'], experience: [{ company: 'Zomato', role: 'DevOps Engineer', startDate: new Date('2023-01-01'), current: true }], education: [{ degree: 'B.Tech CSE', college: 'VIT Vellore', endYear: '2024' }], expectedCTC: '18-25 LPA', location: 'Hyderabad, India', openTo: 'job', relocate: true, noticePeriod: '30 days', resumeUrl: '/uploads/resumes/vikram-resume.pdf', bio: 'DevOps engineer passionate about infrastructure automation and cloud-native technologies.', github: 'https://github.com/vikram', linkedin: 'https://linkedin.com/in/vikram' },
    { firstName: 'Sneha', lastName: 'Joshi', headline: 'Mobile Developer | React Native, Flutter, Swift', college: 'Pune University', degree: 'B.E. Computer Science', year: '2025', skills: ['React Native', 'Flutter', 'Swift', 'JavaScript', 'Firebase', 'REST APIs'], experience: [], education: [{ degree: 'B.E. CSE', college: 'Pune University', endYear: '2025' }], expectedCTC: '4-7 LPA', location: 'Pune, India', openTo: 'internship', relocate: true, noticePeriod: 'Available Immediately', resumeUrl: '/uploads/resumes/sneha-resume.pdf', bio: 'Mobile app developer eager to build cross-platform applications.', github: 'https://github.com/sneha', linkedin: 'https://linkedin.com/in/sneha' },
    { firstName: 'Amit', lastName: 'Kumar', headline: 'Product Manager | Strategy, Analytics, Growth', college: 'IIM Ahmedabad', degree: 'MBA', year: '2024', skills: ['Product Strategy', 'Data Analysis', 'A/B Testing', 'SQL', 'JIRA', 'Agile'], experience: [{ company: 'Flipkart', role: 'APM Intern', startDate: new Date('2023-06-01'), endDate: new Date('2023-09-01'), current: false }, { company: 'Swiggy', role: 'Associate Product Manager', startDate: new Date('2024-01-01'), current: true }], education: [{ degree: 'MBA', college: 'IIM Ahmedabad', endYear: '2024' }, { degree: 'B.Tech CSE', college: 'IIT Delhi', endYear: '2022' }], expectedCTC: '20-30 LPA', location: 'Bangalore, India', openTo: 'job', relocate: false, noticePeriod: '45 days', resumeUrl: '/uploads/resumes/amit-resume.pdf', bio: 'Product manager with a technical background, passionate about building products users love.', linkedin: 'https://linkedin.com/in/amit' },
  ]

  let o2wCount = 0
  for (const s of O2W_STUDENTS) {
    const email = `${s.firstName.toLowerCase()}.${s.lastName.toLowerCase()}@demo.com`
    let user = await User.findOne({ email })
    if (!user) {
      user = await User.create({
        name: `${s.firstName} ${s.lastName}`,
        email,
        password: 'student@123',
        role: 'student',
        isEmailVerified: true,
        isPhoneVerified: Math.random() > 0.3,
        isIdVerified: Math.random() > 0.6,
      })
    }
    let profile = await StudentProfile.findOne({ user: user._id })
    if (!profile) {
      await StudentProfile.create({
        user: user._id,
        firstName: s.firstName,
        lastName: s.lastName,
        headline: s.headline,
        college: s.college,
        degree: s.degree,
        year: s.year,
        currentLocation: s.location,
        openTo: s.openTo,
        relocate: s.relocate,
        noticePeriod: s.noticePeriod,
        expectedCTC: s.expectedCTC,
        openToWork: true,
        hideFromCurrentEmployer: false,
        lastActive: new Date(Date.now() - Math.random() * 7 * 86400000),
        skills: s.skills,
        resumeUrl: s.resumeUrl,
        bio: s.bio,
        experience: s.experience || [],
        education: s.education || [],
        projects: [{ title: `${s.firstName}'s Project`, description: 'A project built during college', techStack: s.skills.slice(0, 3), githubLink: s.github ? `${s.github}/project` : undefined }],
        certifications: [{ name: 'Professional Certification', issuingBody: 'Coursera', date: new Date('2024-06-15') }],
        languages: [{ language: 'English', proficiency: 'Professional' }, { language: 'Hindi', proficiency: 'Native' }],
        jobPreferences: { preferredLocations: [s.location, 'Remote'], preferredRoles: [s.headline.split('|')[0].trim()], preferredCompanyType: pick(['startup', 'mnc', 'both']) },
        github: s.github,
        linkedin: s.linkedin,
        portfolio: s.portfolio,
        contactRevealedTo: [],
        blockedCompanies: [],
      })
      console.log(`   Created O2W profile: ${s.firstName} ${s.lastName}`)
      o2wCount++
    } else {
      await StudentProfile.findByIdAndUpdate(profile._id, { openToWork: true, lastActive: new Date() })
    }
  }
  if (o2wCount === 0) console.log('   All O2W profiles already exist')

  // ── Summary ─────────────────────────────────────────────────────────────
  const totalInternships = await Internship.countDocuments()
  const totalJobs = await Job.countDocuments()
  const totalUsers = await User.countDocuments()
  const totalCompanies = await Company.countDocuments()
  const totalAgencies = await Agency.countDocuments()

  console.log('\n── Seed Summary ──────────────────────────────────────')
  console.log(`  Users:       ${totalUsers}`)
  console.log(`  Companies:   ${totalCompanies}`)
  console.log(`  Agencies:    ${totalAgencies}`)
  console.log(`  Internships: ${totalInternships}`)
  console.log(`  Jobs:        ${totalJobs}`)
  console.log('')
  console.log(`  Admin:   ${DEMO_ADMIN.email} / ${DEMO_ADMIN.password}`)
  console.log(`  Student: ${DEMO_STUDENT.email} / ${DEMO_STUDENT.password}`)
  console.log(`  Company: ${DEMO_COMPANY.email} / ${DEMO_COMPANY.password}`)
  console.log(`  Agency:  ${DEMO_AGENCY.email} / ${DEMO_AGENCY.password}`)
  console.log('──────────────────────────────────────────────────────\n')

  await mongoose.disconnect()
  console.log('Done.')
}

run().catch((err) => {
  console.error('Seed failed:', err.message)
  process.exit(1)
})