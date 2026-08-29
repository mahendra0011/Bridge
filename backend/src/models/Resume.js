const mongoose = require('mongoose')

const resumeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: 'My Resume' },
  sections: [{
    id: { type: String, required: true },
    type: { type: String, required: true },
    order: { type: Number, default: 0 },
    // Personal
    name: String,
    email: String,
    phone: String,
    location: String,
    linkedin: String,
    github: String,
    portfolio: String,
    website: String,
    profilePhoto: String,
    professionalTitle: String,
    // Summary
    summary: String,
    careerObjectives: String,
    yearsOfExperience: String,
    keySkills: String,
    careerGoals: String,
    // Experience
    company: String,
    role: String,
    employmentType: String,
    expLocation: String,
    startDate: String,
    endDate: String,
    current: { type: Boolean, default: false },
    description: String,
    achievements: String,
    technologiesUsed: String,
    // Education
    degree: String,
    course: String,
    specialization: String,
    institution: String,
    board: String,
    percentage: String,
    gpa: String,
    startYear: String,
    endYear: String,
    eduLocation: String,
    // Skills
    technical: String,
    soft: String,
    // Projects
    projectName: String,
    projectType: String,
    projectDescription: String,
    projectTechnologies: String,
    projectRole: String,
    projectDuration: String,
    projectLink: String,
    projectGithubLink: String,
    projectKeyFeatures: String,
    projectAchievements: String,
    // Certifications
    certName: String,
    certIssuer: String,
    certDate: String,
    certExpiry: String,
    certCredentialId: String,
    certUrl: String,
    // Internships
    internCompany: String,
    internRole: String,
    internLocation: String,
    internStartDate: String,
    internEndDate: String,
    internCurrent: { type: Boolean, default: false },
    internDescription: String,
    internTechnologies: String,
    internCertificate: String,
    // Training / Courses
    courseName: String,
    courseInstitute: String,
    courseDuration: String,
    courseSkills: String,
    courseCertificate: String,
    // Achievements
    achievementTitle: String,
    achievementDescription: String,
    achievementDate: String,
    achievementOrganization: String,
    // Awards
    awardName: String,
    awardOrganization: String,
    awardDate: String,
    awardDescription: String,
    // Publications
    pubTitle: String,
    pubJournal: String,
    pubPublisher: String,
    pubDate: String,
    pubDoi: String,
    pubUrl: String,
    // Research
    researchTitle: String,
    researchOrganization: String,
    researchSupervisor: String,
    researchDuration: String,
    researchDescription: String,
    // Conferences
    conferenceName: String,
    conferenceRole: String,
    conferenceDate: String,
    conferenceLocation: String,
    // Workshops
    workshopName: String,
    workshopOrganizer: String,
    workshopDate: String,
    workshopSkills: String,
    // Volunteer
    volunteerOrganization: String,
    volunteerRole: String,
    volunteerDuration: String,
    volunteerResponsibilities: String,
    // Leadership
    leadershipPosition: String,
    leadershipOrganization: String,
    leadershipDuration: String,
    leadershipResponsibilities: String,
    // Extracurricular
    extracurricularActivity: String,
    extracurricularOrganization: String,
    extracurricularDuration: String,
    extracurricularAchievements: String,
    // Languages
    language: String,
    proficiency: { type: String, default: 'Fluent' },
    // Interests
    interests: String,
    interestsDescription: String,
    // Professional Memberships
    membershipOrganization: String,
    membershipId: String,
    membershipDuration: String,
    // Licenses
    licenseName: String,
    licenseNumber: String,
    licenseAuthority: String,
    licenseExpiry: String,
    // Patents
    patentTitle: String,
    patentNumber: String,
    patentStatus: String,
    patentDate: String,
    // References
    refName: String,
    refDesignation: String,
    refCompany: String,
    refEmail: String,
    refPhone: String,
    refRelationship: String,
    // Social Profiles
    socialLinkedin: String,
    socialGithub: String,
    socialPortfolio: String,
    socialBehance: String,
    socialDribbble: String,
    socialKaggle: String,
    socialStackoverflow: String,
    socialMedium: String,
    socialYoutube: String,
    // Strengths
    strengthTitle: String,
    strengthDescription: String,
    // Soft Skills Rating
    softSkillName: String,
    softSkillLevel: { type: Number, min: 1, max: 5 },
    // Technical Competencies
    techCompCategory: String,
    techCompSkill: String,
    techCompExperience: String,
    techCompProficiency: String,
    // Key Achievements (Career Highlights)
    careerAchievement: String,
    careerImpact: String,
    careerDate: String,
    // Career Timeline
    timelineOrganization: String,
    timelineRole: String,
    timelineFrom: String,
    timelineTo: String,
    // Portfolio
    portfolioTitle: String,
    portfolioDescription: String,
    portfolioUrl: String,
    // Open Source
    ossProject: String,
    ossRepoUrl: String,
    ossContribution: String,
    ossTechnologies: String,
    // Competitive Programming
    cpPlatform: String,
    cpUsername: String,
    cpRating: String,
    cpRank: String,
    cpProfileUrl: String,
    // Hackathons
    hackathonEvent: String,
    hackathonPosition: String,
    hackathonDate: String,
    hackathonProject: String,
    // Scholarships
    scholarshipName: String,
    scholarshipOrganization: String,
    scholarshipYear: String,
    scholarshipDescription: String,
    // Military Service
    militaryBranch: String,
    militaryRank: String,
    militaryDuration: String,
    // Availability
    noticePeriod: String,
    preferredLocation: String,
    workAuthorization: String,
    relocation: { type: Boolean, default: false },
    remoteAvailable: { type: Boolean, default: false },
    // Salary
    currentCtc: String,
    expectedCtc: String,
    currency: String,
    // Declaration
    declarationText: String,
    declarationPlace: String,
    declarationDate: String,
    declarationSignature: String,
    // Custom Section
    customSectionTitle: String,
    customSectionContent: String,
    customSectionEntries: String,
    // Section content (generic for custom rendering)
    content: mongoose.Schema.Types.Mixed,
  }],
  visibleSections: [{ type: String }],
  sectionOrder: [{ type: String }],
  settings: {
    fontFamily: { type: String, default: 'sans-serif' },
    fontSize: { type: String, default: '11pt' },
    paperSize: { type: String, default: 'letterpaper' },
    primaryColor: { type: String, default: '0E5484' },
    spacing: { type: String, default: 'normal' },
    showProfilePhoto: { type: Boolean, default: false },
    sectionSpacing: { type: String, default: 'normal' },
  },
}, { timestamps: true })

resumeSchema.index({ user: 1, createdAt: -1 })

module.exports = mongoose.model('Resume', resumeSchema)