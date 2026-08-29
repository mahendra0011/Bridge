import { useState, useEffect, useCallback, useRef } from 'react'
import { FileText, Plus, Trash2, Eye, Download, Save, Loader2, ChevronDown, Code, Briefcase, GraduationCap, Award, BookOpen, User, FolderOpen, BadgeCheck, Microscope, Globe, Heart, Copy, Settings, X, Check, AlertCircle, FileDown, FileType, ArrowUp, ArrowDown, Users, Wrench, Zap, Shield, Github, PlusCircle, DollarSign, Clock } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api } from '@/lib/api'
import { toast } from 'sonner'

const ALL_SECTIONS = {
  personal: {
    label: 'Personal Information',
    required: true,
    icon: User,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    fields: [
      { key: 'name', label: 'Full Name', type: 'text', placeholder: 'John Doe' },
      { key: 'professionalTitle', label: 'Professional Title', type: 'text', placeholder: 'Full Stack Developer' },
      { key: 'email', label: 'Email', type: 'email', placeholder: 'john@example.com' },
      { key: 'phone', label: 'Phone', type: 'tel', placeholder: '+1 234 567 890' },
      { key: 'location', label: 'Location', type: 'text', placeholder: 'New York, USA' },
      { key: 'linkedin', label: 'LinkedIn URL', type: 'url', placeholder: 'https://linkedin.com/in/johndoe' },
      { key: 'github', label: 'GitHub URL', type: 'url', placeholder: 'https://github.com/johndoe' },
      { key: 'portfolio', label: 'Portfolio URL', type: 'url', placeholder: 'https://johndoe.com' },
      { key: 'website', label: 'Personal Website', type: 'url', placeholder: 'https://johndoe.com' },
    ]
  },
  summary: {
    label: 'Professional Summary',
    required: false,
    icon: FileText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    fields: [
      { key: 'summary', label: 'Summary / Objective', type: 'textarea', placeholder: 'Experienced software engineer with 5+ years...' },
      { key: 'yearsOfExperience', label: 'Years of Experience', type: 'text', placeholder: '5+ years' },
      { key: 'keySkills', label: 'Key Skills (comma separated)', type: 'text', placeholder: 'React, Node.js, Python' },
      { key: 'careerGoals', label: 'Career Goals', type: 'textarea', placeholder: 'Looking to leverage my skills in...' },
    ]
  },
  experience: {
    label: 'Work Experience',
    required: false,
    icon: Briefcase,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    repeatable: true,
    fields: [
      { key: 'company', label: 'Company', type: 'text', placeholder: 'Google' },
      { key: 'role', label: 'Job Title', type: 'text', placeholder: 'Software Engineer' },
      { key: 'employmentType', label: 'Employment Type', type: 'select', options: ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'] },
      { key: 'expLocation', label: 'Location', type: 'text', placeholder: 'Mountain View, CA' },
      { key: 'startDate', label: 'Start Date', type: 'text', placeholder: 'Jun 2020' },
      { key: 'endDate', label: 'End Date', type: 'text', placeholder: 'Present' },
      { key: 'current', label: 'Currently Working', type: 'checkbox' },
      { key: 'description', label: 'Description (one per line)', type: 'textarea', placeholder: 'Developed scalable microservices...' },
      { key: 'technologiesUsed', label: 'Technologies Used', type: 'text', placeholder: 'React, Node.js, AWS' },
      { key: 'certLink', label: 'Certificate / Verification Link (optional)', type: 'url', placeholder: 'https://drive.google.com/...' },
    ]
  },
  education: {
    label: 'Education',
    required: true,
    icon: GraduationCap,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    repeatable: true,
    fields: [
      { key: 'degree', label: 'Degree', type: 'text', placeholder: 'B.Tech Computer Science' },
      { key: 'course', label: 'Course', type: 'text', placeholder: 'Computer Science & Engineering' },
      { key: 'specialization', label: 'Specialization', type: 'text', placeholder: 'Artificial Intelligence' },
      { key: 'institution', label: 'Institution', type: 'text', placeholder: 'IIT Bombay' },
      { key: 'board', label: 'Board (School)', type: 'text', placeholder: 'CBSE' },
      { key: 'gpa', label: 'CGPA / Percentage', type: 'text', placeholder: '8.5 CGPA / 85%' },
      { key: 'startYear', label: 'Start Year', type: 'text', placeholder: '2019' },
      { key: 'endYear', label: 'End Year', type: 'text', placeholder: '2023' },
      { key: 'eduLocation', label: 'Location', type: 'text', placeholder: 'Mumbai, India' },
    ]
  },
  skills: {
    label: 'Skills',
    required: false,
    icon: Code,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    fields: [
      { key: 'technical', label: 'Technical Skills / Languages (comma separated)', type: 'textarea', placeholder: 'JavaScript, React, Node.js, Python, MongoDB, AWS' },
      { key: 'frameworks', label: 'Technologies / Frameworks / Tools (comma separated)', type: 'textarea', placeholder: 'React, Express, Docker, Git, Figma' },
      { key: 'soft', label: 'Soft Skills (comma separated)', type: 'textarea', placeholder: 'Leadership, Communication, Teamwork, Problem Solving' },
    ]
  },
  projects: {
    label: 'Projects',
    required: false,
    icon: FolderOpen,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    repeatable: true,
    fields: [
      { key: 'projectName', label: 'Project Name', type: 'text', placeholder: 'E-commerce Platform' },
      { key: 'projectType', label: 'Project Type', type: 'select', options: ['Academic', 'Personal', 'Professional', 'Open Source', 'Hackathon'] },
      { key: 'projectDescription', label: 'Description', type: 'textarea', placeholder: 'Built a full-stack e-commerce platform...' },
      { key: 'projectTechnologies', label: 'Technologies Used', type: 'text', placeholder: 'React, Node.js, MongoDB' },
      { key: 'projectRole', label: 'Your Role', type: 'text', placeholder: 'Full Stack Developer' },
      { key: 'projectDuration', label: 'Duration / Date', type: 'text', placeholder: 'Jan 2025 or 3 months' },
      { key: 'projectLink', label: 'Live Demo URL', type: 'url', placeholder: 'https://myproject.com' },
      { key: 'projectGithubLink', label: 'GitHub Link', type: 'url', placeholder: 'https://github.com/johndoe/project' },
      { key: 'projectKeyFeatures', label: 'Key Features', type: 'textarea', placeholder: 'User authentication, payment integration...' },
    ]
  },
  certifications: {
    label: 'Certifications',
    required: false,
    icon: BadgeCheck,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    repeatable: true,
    fields: [
      { key: 'certName', label: 'Certificate Name', type: 'text', placeholder: 'AWS Solutions Architect' },
      { key: 'certIssuer', label: 'Issuing Organization', type: 'text', placeholder: 'Amazon Web Services' },
      { key: 'certDate', label: 'Issue Date', type: 'text', placeholder: 'Jan 2024' },
      { key: 'certExpiry', label: 'Expiry Date', type: 'text', placeholder: 'Jan 2027' },
      { key: 'certCredentialId', label: 'Credential ID', type: 'text', placeholder: 'AWS-12345' },
      { key: 'certUrl', label: 'Verification URL', type: 'url', placeholder: 'https://aws.com/verify/123' },
    ]
  },
  internships: {
    label: 'Internships',
    required: false,
    icon: BookOpen,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    repeatable: true,
    fields: [
      { key: 'internCompany', label: 'Company', type: 'text', placeholder: 'Microsoft' },
      { key: 'internRole', label: 'Role', type: 'text', placeholder: 'Software Engineering Intern' },
      { key: 'internLocation', label: 'Location', type: 'text', placeholder: 'Hyderabad, India' },
      { key: 'internStartDate', label: 'Start Date', type: 'text', placeholder: 'May 2022' },
      { key: 'internEndDate', label: 'End Date', type: 'text', placeholder: 'Aug 2022' },
      { key: 'internCurrent', label: 'Currently Ongoing', type: 'checkbox' },
      { key: 'internDescription', label: 'Description', type: 'textarea', placeholder: 'Worked on Azure cloud services...' },
      { key: 'internTechnologies', label: 'Technologies Used', type: 'text', placeholder: 'Azure, C#, .NET' },
      { key: 'internCertLink', label: 'Certificate / Verification Link (optional)', type: 'url', placeholder: 'https://drive.google.com/...' },
    ]
  },
  awards: {
    label: 'Awards & Honors',
    required: false,
    icon: Award,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    repeatable: true,
    fields: [
      { key: 'awardName', label: 'Award Name', type: 'text', placeholder: 'Best Employee of the Year' },
      { key: 'awardOrganization', label: 'Organization', type: 'text', placeholder: 'Google' },
      { key: 'awardDate', label: 'Date', type: 'text', placeholder: 'Dec 2023' },
      { key: 'awardDescription', label: 'Description', type: 'textarea', placeholder: 'Recognized for outstanding contribution...' },
    ]
  },
  publications: {
    label: 'Publications',
    required: false,
    icon: FileText,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    repeatable: true,
    fields: [
      { key: 'pubTitle', label: 'Title', type: 'text', placeholder: 'Machine Learning in Healthcare' },
      { key: 'pubJournal', label: 'Journal / Conference', type: 'text', placeholder: 'IEEE Transactions' },
      { key: 'pubPublisher', label: 'Publisher', type: 'text', placeholder: 'IEEE' },
      { key: 'pubDate', label: 'Publication Date', type: 'text', placeholder: 'Mar 2023' },
      { key: 'pubDoi', label: 'DOI', type: 'text', placeholder: '10.1234/example' },
      { key: 'pubUrl', label: 'URL', type: 'url', placeholder: 'https://doi.org/10.1234/example' },
    ]
  },
  research: {
    label: 'Research Experience',
    required: false,
    icon: Microscope,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    repeatable: true,
    fields: [
      { key: 'researchTitle', label: 'Research Title', type: 'text', placeholder: 'Deep Learning for NLP' },
      { key: 'researchOrganization', label: 'Organization', type: 'text', placeholder: 'MIT Media Lab' },
      { key: 'researchSupervisor', label: 'Supervisor', type: 'text', placeholder: 'Dr. John Smith' },
      { key: 'researchDuration', label: 'Duration', type: 'text', placeholder: '6 months' },
      { key: 'researchDescription', label: 'Description', type: 'textarea', placeholder: 'Conducted research on transformer models...' },
    ]
  },
  languages: {
    label: 'Languages',
    required: false,
    icon: Globe,
    color: 'text-sky-600',
    bgColor: 'bg-sky-50',
    repeatable: true,
    fields: [
      { key: 'language', label: 'Language', type: 'text', placeholder: 'English' },
      { key: 'proficiency', label: 'Proficiency', type: 'select', options: ['Basic', 'Conversational', 'Professional', 'Fluent', 'Native'] },
    ]
  },
  interests: {
    label: 'Interests / Hobbies',
    required: false,
    icon: Heart,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    fields: [
      { key: 'interests', label: 'Interests (comma separated)', type: 'textarea', placeholder: 'Chess, Photography, Travel, Reading' },
    ]
  },
  training: {
    label: 'Training / Courses',
    required: false,
    icon: BookOpen,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    repeatable: true,
    fields: [
      { key: 'courseName', label: 'Course Name', type: 'text', placeholder: 'Advanced Machine Learning' },
      { key: 'courseInstitute', label: 'Institute', type: 'text', placeholder: 'Coursera' },
      { key: 'courseDuration', label: 'Duration', type: 'text', placeholder: '3 months' },
      { key: 'courseSkills', label: 'Skills Learned', type: 'text', placeholder: 'TensorFlow, PyTorch' },
    ]
  },
  achievements: {
    label: 'Achievements',
    required: false,
    icon: Award,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    repeatable: true,
    fields: [
      { key: 'achievementTitle', label: 'Achievement Title', type: 'text', placeholder: '1st Place Hackathon' },
      { key: 'achievementDescription', label: 'Description', type: 'textarea', placeholder: 'Won first place at university hackathon...' },
      { key: 'achievementDate', label: 'Date', type: 'text', placeholder: 'Oct 2023' },
      { key: 'achievementOrganization', label: 'Organization', type: 'text', placeholder: 'IIT Bombay' },
    ]
  },
  conferences: {
    label: 'Conferences & Seminars',
    required: false,
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    repeatable: true,
    fields: [
      { key: 'conferenceName', label: 'Event Name', type: 'text', placeholder: 'AWS re:Invent 2023' },
      { key: 'conferenceRole', label: 'Role', type: 'select', options: ['Speaker', 'Participant', 'Volunteer', 'Organizer'] },
      { key: 'conferenceDate', label: 'Date', type: 'text', placeholder: 'Nov 2023' },
      { key: 'conferenceLocation', label: 'Location', type: 'text', placeholder: 'Las Vegas, NV' },
    ]
  },
  workshops: {
    label: 'Workshops',
    required: false,
    icon: Wrench,
    color: 'text-stone-600',
    bgColor: 'bg-stone-50',
    repeatable: true,
    fields: [
      { key: 'workshopName', label: 'Workshop Name', type: 'text', placeholder: 'React Native Workshop' },
      { key: 'workshopOrganizer', label: 'Organizer', type: 'text', placeholder: 'Google Developer Groups' },
      { key: 'workshopDate', label: 'Date', type: 'text', placeholder: 'Feb 2024' },
      { key: 'workshopSkills', label: 'Skills Learned', type: 'text', placeholder: 'React Native, Expo' },
    ]
  },
  volunteer: {
    label: 'Volunteer Experience',
    required: false,
    icon: Heart,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    repeatable: true,
    fields: [
      { key: 'volunteerOrganization', label: 'Organization', type: 'text', placeholder: 'Red Cross' },
      { key: 'volunteerRole', label: 'Role', type: 'text', placeholder: 'Volunteer Coordinator' },
      { key: 'volunteerDuration', label: 'Duration', type: 'text', placeholder: '2021 - 2023' },
      { key: 'volunteerResponsibilities', label: 'Responsibilities', type: 'textarea', placeholder: 'Organized community events...' },
    ]
  },
  leadership: {
    label: 'Leadership Experience',
    required: false,
    icon: Shield,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    repeatable: true,
    fields: [
      { key: 'leadershipPosition', label: 'Position', type: 'text', placeholder: 'Team Lead' },
      { key: 'leadershipOrganization', label: 'Organization', type: 'text', placeholder: 'Google Developer Student Club' },
      { key: 'leadershipDuration', label: 'Duration', type: 'text', placeholder: '2022 - 2023' },
      { key: 'leadershipResponsibilities', label: 'Responsibilities', type: 'textarea', placeholder: 'Led a team of 10 developers...' },
    ]
  },
  extracurricular: {
    label: 'Extracurricular Activities',
    required: false,
    icon: Zap,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    repeatable: true,
    fields: [
      { key: 'extracurricularActivity', label: 'Activity', type: 'text', placeholder: 'Chess Club' },
      { key: 'extracurricularOrganization', label: 'Organization', type: 'text', placeholder: 'University Club' },
      { key: 'extracurricularDuration', label: 'Duration', type: 'text', placeholder: '2020 - 2023' },
      { key: 'extracurricularAchievements', label: 'Achievements', type: 'textarea', placeholder: 'Won inter-college chess tournament...' },
    ]
  },
  memberships: {
    label: 'Professional Memberships',
    required: false,
    icon: BadgeCheck,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    repeatable: true,
    fields: [
      { key: 'membershipOrganization', label: 'Organization', type: 'text', placeholder: 'IEEE' },
      { key: 'membershipId', label: 'Membership ID', type: 'text', placeholder: 'MEM-12345' },
      { key: 'membershipDuration', label: 'Duration', type: 'text', placeholder: '2022 - Present' },
    ]
  },
  licenses: {
    label: 'Licenses',
    required: false,
    icon: FileText,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    repeatable: true,
    fields: [
      { key: 'licenseName', label: 'License Name', type: 'text', placeholder: 'PMP Certification' },
      { key: 'licenseNumber', label: 'License Number', type: 'text', placeholder: 'LIC-12345' },
      { key: 'licenseAuthority', label: 'Authority', type: 'text', placeholder: 'PMI' },
      { key: 'licenseExpiry', label: 'Expiry Date', type: 'text', placeholder: 'Dec 2026' },
    ]
  },
  patents: {
    label: 'Patents',
    required: false,
    icon: FileText,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    repeatable: true,
    fields: [
      { key: 'patentTitle', label: 'Patent Title', type: 'text', placeholder: 'System and Method for...' },
      { key: 'patentNumber', label: 'Patent Number', type: 'text', placeholder: 'US12345678' },
      { key: 'patentStatus', label: 'Status', type: 'select', options: ['Filed', 'Pending', 'Granted', 'Published'] },
      { key: 'patentDate', label: 'Date', type: 'text', placeholder: 'Jan 2024' },
    ]
  },
  references: {
    label: 'References',
    required: false,
    icon: Users,
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    repeatable: true,
    fields: [
      { key: 'refName', label: 'Name', type: 'text', placeholder: 'Dr. Jane Smith' },
      { key: 'refDesignation', label: 'Designation', type: 'text', placeholder: 'Professor' },
      { key: 'refCompany', label: 'Company / Institution', type: 'text', placeholder: 'MIT' },
      { key: 'refEmail', label: 'Email', type: 'email', placeholder: 'jane@mit.edu' },
      { key: 'refPhone', label: 'Phone', type: 'tel', placeholder: '+1 234 567 890' },
      { key: 'refRelationship', label: 'Relationship', type: 'text', placeholder: 'Research Supervisor' },
    ]
  },
  social: {
    label: 'Social Profiles',
    required: false,
    icon: Globe,
    color: 'text-sky-600',
    bgColor: 'bg-sky-50',
    fields: [
      { key: 'socialLinkedin', label: 'LinkedIn', type: 'url', placeholder: 'https://linkedin.com/in/johndoe' },
      { key: 'socialGithub', label: 'GitHub', type: 'url', placeholder: 'https://github.com/johndoe' },
      { key: 'socialPortfolio', label: 'Portfolio', type: 'url', placeholder: 'https://johndoe.com' },
      { key: 'socialBehance', label: 'Behance', type: 'url', placeholder: 'https://behance.net/johndoe' },
      { key: 'socialDribbble', label: 'Dribbble', type: 'url', placeholder: 'https://dribbble.com/johndoe' },
      { key: 'socialKaggle', label: 'Kaggle', type: 'url', placeholder: 'https://kaggle.com/johndoe' },
      { key: 'socialStackoverflow', label: 'Stack Overflow', type: 'url', placeholder: 'https://stackoverflow.com/users/123' },
      { key: 'socialMedium', label: 'Medium', type: 'url', placeholder: 'https://medium.com/@johndoe' },
      { key: 'socialYoutube', label: 'YouTube', type: 'url', placeholder: 'https://youtube.com/@johndoe' },
    ]
  },
  strengths: {
    label: 'Strengths',
    required: false,
    icon: Zap,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    repeatable: true,
    fields: [
      { key: 'strengthTitle', label: 'Strength', type: 'text', placeholder: 'Problem Solving' },
      { key: 'strengthDescription', label: 'Description', type: 'textarea', placeholder: 'Ability to break down complex problems...' },
    ]
  },
  softSkills: {
    label: 'Soft Skills Rating',
    required: false,
    icon: Award,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    repeatable: true,
    fields: [
      { key: 'softSkillName', label: 'Skill', type: 'text', placeholder: 'Communication' },
      { key: 'softSkillLevel', label: 'Level (1-5)', type: 'number', placeholder: '4' },
    ]
  },
  techCompetencies: {
    label: 'Technical Competencies',
    required: false,
    icon: Code,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    repeatable: true,
    fields: [
      { key: 'techCompCategory', label: 'Category', type: 'text', placeholder: 'Frontend' },
      { key: 'techCompSkill', label: 'Skill', type: 'text', placeholder: 'React' },
      { key: 'techCompExperience', label: 'Experience (Years)', type: 'text', placeholder: '3' },
      { key: 'techCompProficiency', label: 'Proficiency', type: 'select', options: ['Beginner', 'Intermediate', 'Advanced', 'Expert'] },
    ]
  },
  careerHighlights: {
    label: 'Key Achievements (Career Highlights)',
    required: false,
    icon: Award,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    repeatable: true,
    fields: [
      { key: 'careerAchievement', label: 'Achievement', type: 'text', placeholder: 'Increased revenue by 30%' },
      { key: 'careerImpact', label: 'Impact', type: 'textarea', placeholder: 'Led a team to redesign the product...' },
      { key: 'careerDate', label: 'Date', type: 'text', placeholder: '2023' },
    ]
  },
  careerTimeline: {
    label: 'Career Timeline',
    required: false,
    icon: Clock,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    repeatable: true,
    fields: [
      { key: 'timelineOrganization', label: 'Organization', type: 'text', placeholder: 'Google' },
      { key: 'timelineRole', label: 'Role', type: 'text', placeholder: 'SDE II' },
      { key: 'timelineFrom', label: 'From', type: 'text', placeholder: '2021' },
      { key: 'timelineTo', label: 'To', type: 'text', placeholder: 'Present' },
    ]
  },
  portfolio: {
    label: 'Portfolio',
    required: false,
    icon: FolderOpen,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    repeatable: true,
    fields: [
      { key: 'portfolioTitle', label: 'Title', type: 'text', placeholder: 'My Portfolio' },
      { key: 'portfolioDescription', label: 'Description', type: 'textarea', placeholder: 'A collection of my best work...' },
      { key: 'portfolioUrl', label: 'URL', type: 'url', placeholder: 'https://myportfolio.com' },
    ]
  },
  openSource: {
    label: 'Open Source Contributions',
    required: false,
    icon: Github,
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    repeatable: true,
    fields: [
      { key: 'ossProject', label: 'Project', type: 'text', placeholder: 'React' },
      { key: 'ossRepoUrl', label: 'Repository URL', type: 'url', placeholder: 'https://github.com/facebook/react' },
      { key: 'ossContribution', label: 'Contribution', type: 'textarea', placeholder: 'Fixed bug in state management...' },
      { key: 'ossTechnologies', label: 'Technologies', type: 'text', placeholder: 'JavaScript, TypeScript' },
    ]
  },
  competitiveProgramming: {
    label: 'Competitive Programming',
    required: false,
    icon: Code,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    repeatable: true,
    fields: [
      { key: 'cpPlatform', label: 'Platform', type: 'text', placeholder: 'Codeforces' },
      { key: 'cpUsername', label: 'Username', type: 'text', placeholder: 'johndoe' },
      { key: 'cpRating', label: 'Rating', type: 'text', placeholder: '1800' },
      { key: 'cpRank', label: 'Rank', type: 'text', placeholder: 'Specialist' },
      { key: 'cpProfileUrl', label: 'Profile URL', type: 'url', placeholder: 'https://codeforces.com/profile/johndoe' },
    ]
  },
  hackathons: {
    label: 'Hackathons',
    required: false,
    icon: Zap,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    repeatable: true,
    fields: [
      { key: 'hackathonEvent', label: 'Event', type: 'text', placeholder: 'HackMIT 2023' },
      { key: 'hackathonPosition', label: 'Position', type: 'text', placeholder: '1st Place' },
      { key: 'hackathonDate', label: 'Date', type: 'text', placeholder: 'Sep 2023' },
      { key: 'hackathonProject', label: 'Project', type: 'text', placeholder: 'AI-powered chatbot' },
    ]
  },
  scholarships: {
    label: 'Scholarships',
    required: false,
    icon: Award,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    repeatable: true,
    fields: [
      { key: 'scholarshipName', label: 'Scholarship Name', type: 'text', placeholder: 'Merit Scholarship' },
      { key: 'scholarshipOrganization', label: 'Organization', type: 'text', placeholder: 'University' },
      { key: 'scholarshipYear', label: 'Year', type: 'text', placeholder: '2022' },
      { key: 'scholarshipDescription', label: 'Description', type: 'textarea', placeholder: 'Awarded for academic excellence...' },
    ]
  },
  military: {
    label: 'Military Service',
    required: false,
    icon: Shield,
    color: 'text-stone-600',
    bgColor: 'bg-stone-50',
    fields: [
      { key: 'militaryBranch', label: 'Branch', type: 'text', placeholder: 'Army' },
      { key: 'militaryRank', label: 'Rank', type: 'text', placeholder: 'Captain' },
      { key: 'militaryDuration', label: 'Duration', type: 'text', placeholder: '2018 - 2022' },
    ]
  },
  availability: {
    label: 'Availability',
    required: false,
    icon: Clock,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    fields: [
      { key: 'noticePeriod', label: 'Notice Period', type: 'text', placeholder: '30 days' },
      { key: 'preferredLocation', label: 'Preferred Location', type: 'text', placeholder: 'Bangalore, India' },
      { key: 'workAuthorization', label: 'Work Authorization', type: 'text', placeholder: 'US Citizen' },
      { key: 'relocation', label: 'Willing to Relocate', type: 'checkbox' },
      { key: 'remoteAvailable', label: 'Open to Remote', type: 'checkbox' },
    ]
  },
  salary: {
    label: 'Salary Preference',
    required: false,
    icon: DollarSign,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    fields: [
      { key: 'currentCtc', label: 'Current CTC', type: 'text', placeholder: '$100,000' },
      { key: 'expectedCtc', label: 'Expected CTC', type: 'text', placeholder: '$120,000' },
      { key: 'currency', label: 'Currency', type: 'text', placeholder: 'USD' },
    ]
  },
  declaration: {
    label: 'Declaration',
    required: false,
    icon: FileText,
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    fields: [
      { key: 'declarationText', label: 'Declaration Text', type: 'textarea', placeholder: 'I hereby declare that the above information is true to the best of my knowledge.' },
      { key: 'declarationPlace', label: 'Place', type: 'text', placeholder: 'New York' },
      { key: 'declarationDate', label: 'Date', type: 'text', placeholder: 'Jan 2024' },
    ]
  },
  custom: {
    label: 'Custom Section',
    required: false,
    icon: PlusCircle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    repeatable: true,
    fields: [
      { key: 'customSectionTitle', label: 'Section Title', type: 'text', placeholder: 'My Custom Section' },
      { key: 'customSectionContent', label: 'Content', type: 'textarea', placeholder: 'Enter your custom content here...' },
    ]
  },
}

const createSection = (type) => {
  const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  const defaults = { id, type }
  const config = ALL_SECTIONS[type]
  if (config?.fields) {
    config.fields.forEach(f => {
      if (f.type === 'checkbox') defaults[f.key] = false
      else if (f.type === 'select' && f.options?.length) defaults[f.key] = f.options[0]
      else defaults[f.key] = ''
    })
  }
  return defaults
}

const LATEX_SECTION_TITLES = {
  experience: 'EXPERIENCE',
  internships: 'INTERNSHIPS',
  extracurricular: 'EXTRACURRICULAR',
  careerTimeline: 'CAREER TIMELINE',
}

const FONT_PACKAGES = {
  default: '',
  sans: '\\renewcommand{\\familydefault}{\\sfdefault}',
  FiraSans: '\\usepackage[sfdefault]{FiraSans}',
  roboto: '\\usepackage[sfdefault]{roboto}',
  sourcesanspro: '\\usepackage[default]{sourcesanspro}',
  CormorantGaramond: '\\usepackage{CormorantGaramond}',
  charter: '\\usepackage{charter}',
}

const escapeLatex = (str) => {
  if (!str) return ''
  return String(str)
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}')
}

const sanitizeUrl = (str) => {
  if (!str) return ''
  return String(str).replace(/[{}\\%]/g, '')
}

const DATE_SUFFIXES = ['Date', 'Year', 'Duration', 'Expiry', 'From', 'To']
const URL_SUFFIXES = ['Url', 'Link']
const LOCATION_SUFFIXES = ['Location']

const findByHint = (item, suffixes) => {
  for (const [key, val] of Object.entries(item)) {
    if (!val || typeof val === 'boolean') continue
    if (suffixes.some(suf => key.endsWith(suf))) return val
  }
  return ''
}

const GENERIC_FALLBACK_TITLE = (s) =>
  s.certName || s.awardName || s.pubTitle || s.researchTitle || s.courseName || s.achievementTitle ||
  s.conferenceName || s.workshopName || s.volunteerRole || s.leadershipPosition || s.extracurricularActivity ||
  s.membershipOrganization || s.licenseName || s.patentTitle || s.refName || s.strengthTitle || s.softSkillName ||
  (s.techCompSkill ? `${s.techCompSkill}${s.techCompCategory ? ` (${s.techCompCategory})` : ''}` : '') ||
  s.careerAchievement || s.portfolioTitle || s.ossProject ||
  (s.cpPlatform ? `${s.cpPlatform}${s.cpUsername ? `: ${s.cpUsername}` : ''}` : '') ||
  s.hackathonEvent || s.scholarshipName || s.customSectionTitle || s.militaryBranch || 'Entry'

const GENERIC_FALLBACK_DESC = (s) =>
  s.certIssuer || s.awardOrganization || s.pubJournal || s.researchDescription || s.courseInstitute ||
  s.achievementDescription || s.conferenceRole || s.workshopOrganizer || s.volunteerResponsibilities ||
  s.leadershipResponsibilities || s.extracurricularAchievements || s.membershipId || s.licenseAuthority ||
  s.patentStatus || s.refDesignation || s.strengthDescription || (s.softSkillLevel ? `Level: ${s.softSkillLevel}` : '') ||
  s.techCompProficiency || s.careerImpact || s.portfolioDescription || s.ossContribution || s.cpRating ||
  s.hackathonPosition || s.scholarshipDescription || s.customSectionContent || s.militaryRank || ''

const resumeItemsBlock = (lines) => {
  if (!lines.length) return ''
  let out = '\\resumeItemListStart\n'
  lines.forEach(line => { out += `\\resumeItem{\\normalsize{${line}}}\n` })
  out += '\\resumeItemListEnd\n'
  return out
}

const generateLatex = (sections, visibleSections, settings) => {
  const personal = sections.find(s => s.type === 'personal') || {}
  const primaryColor = settings?.primaryColor || '0E5484'
  const fontKey = settings?.fontFamily || 'default'
  const fontPackage = FONT_PACKAGES[fontKey] ?? ''
  const fontSize = settings?.fontSize || '11pt'
  const paperSize = settings?.paperSize || 'letterpaper'

  let latex = `%-------------------------
% Resume in LaTeX
% Generated by Bridge Resume Builder
%------------------------

\\documentclass[${paperSize},${fontSize}]{article}

\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\usepackage{fontawesome}
\\usepackage{xcolor}
\\usepackage{multicol}
\\usepackage{graphicx}
\\setlength{\\multicolsep}{-3.0pt}
\\setlength{\\columnsep}{-1pt}
\\input{glyphtounicode}

\\definecolor{cvblue}{HTML}{${primaryColor}}
\\definecolor{black}{HTML}{130810}
\\definecolor{darkcolor}{HTML}{0F4539}
\\definecolor{cvgreen}{HTML}{3BD80D}
\\definecolor{taggreen}{HTML}{00E278}
\\definecolor{SlateGrey}{HTML}{2E2E2E}
\\definecolor{LightGrey}{HTML}{666666}
\\colorlet{name}{black}
\\colorlet{tagline}{darkcolor}
\\colorlet{heading}{darkcolor}
\\colorlet{headingrule}{cvblue}
\\colorlet{accent}{darkcolor}
\\colorlet{emphasis}{SlateGrey}
\\colorlet{body}{LightGrey}
${fontPackage ? '\n' + fontPackage + '\n' : ''}
\\addtolength{\\oddsidemargin}{-0.6in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1.19in}
\\addtolength{\\topmargin}{-.7in}
\\addtolength{\\textheight}{1.4in}

\\urlstyle{same}
\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large\\bfseries
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]

\\pdfgentounicode=1

\\newcommand{\\resumeItem}[1]{
  \\item\\small{
    {#1 \\vspace{-2pt}}
  }
}

\\newcommand{\\classesList}[4]{
    \\item\\small{
        {#1 #2 #3 #4 \\vspace{-2pt}}
  }
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{1.0\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{\\large#1} & \\textbf{\\small #2} \\\\
      \\textit{\\large#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubSubheading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\textit{\\small#1} & \\textit{\\small #2} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeProjectHeading}[2]{
    \\item
    \\begin{tabular*}{1.001\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\small#1 & \\textbf{\\small #2}\\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubItem}[1]{\\resumeItem{#1}\\vspace{-4pt}}

\\renewcommand\\labelitemi{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}
\\renewcommand\\labelitemii{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.0in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

\\newcommand\\sbullet[1][.5]{\\mathbin{\\vcenter{\\hbox{\\scalebox{#1}{$\\bullet$}}}}}

\\begin{document}

%----------HEADING----------
\\begin{center}
    {\\Huge \\scshape ${escapeLatex(personal.name || 'Your Name')}} \\\\ \\vspace{1pt}
    ${personal.professionalTitle ? `{\\large ${escapeLatex(personal.professionalTitle)}} \\\\ \\vspace{1pt}` : ''}
    ${personal.location ? `${escapeLatex(personal.location)} \\\\ \\vspace{1pt}` : ''}
    \\small `

  const contactParts = []
  if (personal.phone) contactParts.push(`\\href{tel:${sanitizeUrl(personal.phone)}}{\\raisebox{-0.1\\height}\\faPhone\\ \\underline{${escapeLatex(personal.phone)}}}`)
  if (personal.email) contactParts.push(`\\href{mailto:${sanitizeUrl(personal.email)}}{\\raisebox{-0.2\\height}\\faEnvelope\\ \\underline{${escapeLatex(personal.email)}}}`)
  if (personal.linkedin) contactParts.push(`\\href{${sanitizeUrl(personal.linkedin)}}{\\raisebox{-0.2\\height}\\faLinkedin\\ \\underline{LinkedIn}}`)
  if (personal.github) contactParts.push(`\\href{${sanitizeUrl(personal.github)}}{\\raisebox{-0.2\\height}\\faGithub\\ \\underline{GitHub}}`)
  if (personal.portfolio) contactParts.push(`\\href{${sanitizeUrl(personal.portfolio)}}{\\raisebox{-0.2\\height}\\faExternalLink\\ \\underline{Portfolio}}`)
  if (personal.website) contactParts.push(`\\href{${sanitizeUrl(personal.website)}}{\\raisebox{-0.2\\height}\\faGlobe\\ \\underline{Website}}`)
  sections.filter(s => s.type === 'competitiveProgramming').forEach(s => {
    if (s.cpPlatform && s.cpProfileUrl) {
      contactParts.push(`\\href{${sanitizeUrl(s.cpProfileUrl)}}{\\raisebox{-0.2\\height}\\faExternalLink\\ \\underline{${escapeLatex(s.cpPlatform)}}}`)
    }
  })

  latex += contactParts.join(' ~ ')
  latex += `\\end{center}\\vspace{0.5mm}\n\n`

  const visibleTypes = visibleSections.filter(t => t !== 'personal')

  visibleTypes.forEach(type => {
    const config = ALL_SECTIONS[type]
    if (!config) return
    const items = sections.filter(s => s.type === type)
    if (!items.length) return

    const sectionLabel = escapeLatex((LATEX_SECTION_TITLES[type] || config.label).toUpperCase())

    if (type === 'summary') {
      const s = items[0]
      if (!s.summary) return
      latex += `\\section{PROFESSIONAL SUMMARY}\n\\begin{itemize}\n\\item\\small{\\normalsize{${escapeLatex(s.summary)}}}\n\\end{itemize}\n\n`
      return
    }

    if (type === 'skills') {
      const s = items[0]
      if (!s.technical && !s.frameworks && !s.soft) return
      latex += `\\section{TECHNICAL SKILLS}\n\\begin{itemize}[leftmargin=0.15in, label={}]\n\\small{\\item{\n`
      if (s.technical) latex += `     \\textbf{\\normalsize{Languages:}}{  \\normalsize{${escapeLatex(s.technical)}}} \\\\\n`
      if (s.frameworks) latex += `     \\textbf{\\normalsize{Technologies/Frameworks:}}{  \\normalsize{${escapeLatex(s.frameworks)}}} \\\\\n`
      if (s.soft) latex += `     \\textbf{\\normalsize{Soft Skills:}}{  \\normalsize{${escapeLatex(s.soft)}}} \\\\\n`
      latex += `    }}\n\\end{itemize}\n\\vspace{-15pt}\n\n`
      return
    }

    if (type === 'interests') {
      const s = items[0]
      if (!s.interests) return
      latex += `\\section{${sectionLabel}}\n\\begin{itemize}\n\\item\\small{\\normalsize{${escapeLatex(s.interests)}}}\n\\end{itemize}\n\n`
      return
    }

    if (type === 'languages') {
      latex += `\\section{${sectionLabel}}\n\\resumeSubHeadingListStart\n`
      items.forEach(s => {
        if (s.language) latex += `\\resumeItem{\\normalsize{${escapeLatex(s.language)} --- ${escapeLatex(s.proficiency || 'Fluent')}}}\n`
      })
      latex += `\\resumeSubHeadingListEnd\n\\vspace{-11pt}\n\n`
      return
    }

    if (type === 'experience' || type === 'internships') {
      latex += `\\section{${sectionLabel}}\n\\resumeSubHeadingListStart\n`
      items.forEach(s => {
        const company = s.company || s.internCompany || ''
        const role = s.role || s.internRole || ''
        const loc = s.expLocation || s.internLocation || ''
        const start = s.startDate || s.internStartDate || ''
        const end = s.current || s.internCurrent ? 'Present' : (s.endDate || s.internEndDate || '')
        const desc = s.description || s.internDescription || ''
        const certLink = sanitizeUrl(s.certLink || s.internCertLink || '')
        let companyText = escapeLatex(company)
        if (certLink) companyText += ` \\href{${certLink}}{\\raisebox{-0.1\\height}\\faExternalLink}`
        latex += `\\resumeSubheading{${companyText}}{${escapeLatex(start)} -- ${escapeLatex(end)}}{${escapeLatex(role)}}{${escapeLatex(loc)}}\n`
        if (desc) {
          const lines = desc.split('\n').filter(l => l.trim()).map(l => escapeLatex(l.trim()))
          latex += resumeItemsBlock(lines)
        }
      })
      latex += `\\resumeSubHeadingListEnd\n\\vspace{-12pt}\n\n`
      return
    }

    if (type === 'education') {
      latex += `\\section{${sectionLabel}}\n\\resumeSubHeadingListStart\n`
      items.forEach(s => {
        const institution = s.institution || s.board || ''
        const degreeParts = [s.degree, s.course, s.specialization].filter(Boolean).map(escapeLatex)
        let degreeLine = degreeParts.join(' - ')
        if (s.gpa) degreeLine += `${degreeLine ? ' - ' : ''}\\textbf{CGPA} - \\textbf{${escapeLatex(s.gpa)}}`
        const dateRange = s.startYear && s.endYear ? `${escapeLatex(s.startYear)} -- ${escapeLatex(s.endYear)}` : escapeLatex(s.endYear || s.startYear || '')
        latex += `\\resumeSubheading{${escapeLatex(institution)}}{${dateRange}}{${degreeLine}}{${escapeLatex(s.eduLocation || '')}}\n`
      })
      latex += `\\resumeSubHeadingListEnd\n\n`
      return
    }

    if (type === 'projects') {
      latex += `\\section{${sectionLabel}}\n\\vspace{-5pt}\n\\resumeSubHeadingListStart\n`
      items.forEach(s => {
        const name = escapeLatex(s.projectName || '')
        const primaryLink = sanitizeUrl(s.projectLink || s.projectGithubLink || '')
        const iconLink = sanitizeUrl(s.projectGithubLink || s.projectLink || '')
        let titlePart = `\\textbf{\\large{\\underline{${name}}}}`
        if (primaryLink) titlePart = `\\href{${primaryLink}}{${titlePart}}`
        if (iconLink) titlePart += ` \\href{${iconLink}}{\\raisebox{-0.1\\height}\\faExternalLink}`
        if (s.projectTechnologies) titlePart += ` $|$ \\large{\\underline{${escapeLatex(s.projectTechnologies)}}}`
        latex += `\\resumeProjectHeading{${titlePart}}{${escapeLatex(s.projectDuration || '')}}\n`
        if (s.projectDescription) {
          const lines = s.projectDescription.split('\n').filter(l => l.trim()).map(l => escapeLatex(l.trim()))
          latex += resumeItemsBlock(lines)
        }
        latex += `\\vspace{-13pt}\n`
      })
      latex += `\\resumeSubHeadingListEnd\n\n`
      return
    }

    if (type === 'certifications') {
      const certLines = items.filter(s => s.certName).map(s => {
        const label = `${escapeLatex(s.certName)}${s.certIssuer ? ' - ' + escapeLatex(s.certIssuer) : ''}`
        const body = s.certUrl ? `\\href{${sanitizeUrl(s.certUrl)}}{${label}}` : label
        return `$\\sbullet[.75] \\hspace{0.1cm}$ {${body}}`
      })
      if (!certLines.length) return
      latex += `\\section{${sectionLabel}}\n\n${certLines.join(' \\\\\n')}\n\n`
      return
    }

    if (type === 'extracurricular') {
      latex += `\\section{${sectionLabel}}\n\\resumeSubHeadingListStart\n`
      items.forEach(s => {
        const activity = escapeLatex(s.extracurricularActivity || '')
        const org = escapeLatex(s.extracurricularOrganization || '')
        const duration = escapeLatex(s.extracurricularDuration || '')
        const achievements = escapeLatex(s.extracurricularAchievements || '')
        let line = activity
        if (org) line += ` (${org})`
        if (duration) line += `${line ? ' -- ' : ''}${duration}`
        if (achievements) line += `${line ? ': ' : ''}${achievements}`
        if (line) latex += `\\resumeItem{\\normalsize{${line}}}\n`
      })
      latex += `\\resumeSubHeadingListEnd\n\\vspace{-11pt}\n\n`
      return
    }

    if (type === 'careerTimeline') {
      latex += `\\section{${sectionLabel}}\n\\resumeSubHeadingListStart\n`
      items.forEach(s => {
        const org = escapeLatex(s.timelineOrganization || '')
        const role = escapeLatex(s.timelineRole || '')
        const range = [s.timelineFrom, s.timelineTo].filter(Boolean).map(escapeLatex).join(' -- ')
        latex += `\\resumeSubheading{${org}}{${range}}{${role}}{}\n`
      })
      latex += `\\resumeSubHeadingListEnd\n\\vspace{-11pt}\n\n`
      return
    }

    if (type === 'declaration') {
      const s = items[0]
      if (!s.declarationText) return
      latex += `\\section{${sectionLabel}}\n\\begin{itemize}\n\\item\\small{\\normalsize{${escapeLatex(s.declarationText)}}}\n\\end{itemize}\n`
      if (s.declarationPlace || s.declarationDate) {
        const place = escapeLatex(s.declarationPlace || '')
        const date = escapeLatex(s.declarationDate || '')
        latex += `\\begin{flushright}\\small ${place}${place && date ? ', ' : ''}${date}\\end{flushright}\n`
      }
      latex += `\n`
      return
    }

    if (type === 'availability') {
      const s = items[0]
      const rows = []
      if (s.noticePeriod) rows.push(`Notice Period: ${escapeLatex(s.noticePeriod)}`)
      if (s.preferredLocation) rows.push(`Preferred Location: ${escapeLatex(s.preferredLocation)}`)
      if (s.workAuthorization) rows.push(`Work Authorization: ${escapeLatex(s.workAuthorization)}`)
      if (s.relocation) rows.push(`Willing to Relocate: Yes`)
      if (s.remoteAvailable) rows.push(`Open to Remote: Yes`)
      if (!rows.length) return
      latex += `\\section{${sectionLabel}}\n\\begin{itemize}\n${rows.map(r => `\\item\\small{\\normalsize{${r}}}`).join('\n')}\n\\end{itemize}\n\n`
      return
    }

    if (type === 'salary') {
      const s = items[0]
      const rows = []
      if (s.currentCtc) rows.push(`Current CTC: ${escapeLatex(s.currentCtc)}`)
      if (s.expectedCtc) rows.push(`Expected CTC: ${escapeLatex(s.expectedCtc)}`)
      if (s.currency) rows.push(`Currency: ${escapeLatex(s.currency)}`)
      if (!rows.length) return
      latex += `\\section{${sectionLabel}}\n\\begin{itemize}\n${rows.map(r => `\\item\\small{\\normalsize{${r}}}`).join('\n')}\n\\end{itemize}\n\n`
      return
    }

    if (type === 'social') {
      const s = items[0]
      const platforms = [
        ['LinkedIn', s.socialLinkedin], ['GitHub', s.socialGithub], ['Portfolio', s.socialPortfolio],
        ['Behance', s.socialBehance], ['Dribbble', s.socialDribbble], ['Kaggle', s.socialKaggle],
        ['Stack Overflow', s.socialStackoverflow], ['Medium', s.socialMedium], ['YouTube', s.socialYoutube],
      ].filter(([, url]) => url)
      if (!platforms.length) return
      const socialLines = platforms.map(([label, url]) => `$\\sbullet[.75] \\hspace{0.1cm}$ {\\href{${sanitizeUrl(url)}}{${label}}}`)
      latex += `\\section{${sectionLabel}}\n\n${socialLines.join(' \\\\\n')}\n\n`
      return
    }

    const anyHasDate = items.some(s => findByHint(s, DATE_SUFFIXES))
    const anyHasUrl = items.some(s => findByHint(s, URL_SUFFIXES))

    latex += `\\section{${sectionLabel}}\n`
    if (anyHasDate) {
      latex += `\\resumeSubHeadingListStart\n`
      items.forEach(s => {
        const title = escapeLatex(GENERIC_FALLBACK_TITLE(s))
        const desc = escapeLatex(GENERIC_FALLBACK_DESC(s))
        const date = escapeLatex(findByHint(s, DATE_SUFFIXES))
        const loc = escapeLatex(findByHint(s, LOCATION_SUFFIXES))
        latex += `\\resumeSubheading{${title}}{${date}}{${desc}}{${loc}}\n`
      })
      latex += `\\resumeSubHeadingListEnd\n\\vspace{-11pt}\n\n`
    } else if (anyHasUrl) {
      const urlLines = items.map(s => {
        const title = escapeLatex(GENERIC_FALLBACK_TITLE(s))
        const desc = escapeLatex(GENERIC_FALLBACK_DESC(s))
        const url = sanitizeUrl(findByHint(s, URL_SUFFIXES))
        const label = `${title}${desc ? ' - ' + desc : ''}`
        const body = url ? `\\href{${url}}{${label}}` : label
        return `$\\sbullet[.75] \\hspace{0.1cm}$ {${body}}`
      })
      latex += `\n${urlLines.join(' \\\\\n')}\n\n`
    } else {
      latex += `\\resumeSubHeadingListStart\n`
      items.forEach(s => {
        const title = escapeLatex(GENERIC_FALLBACK_TITLE(s))
        const desc = escapeLatex(GENERIC_FALLBACK_DESC(s))
        const line = desc ? `\\textbf{${title}}: ${desc}` : title
        latex += `\\resumeItem{\\normalsize{${line}}}\n`
      })
      latex += `\\resumeSubHeadingListEnd\n\\vspace{-11pt}\n\n`
    }
  })

  latex += `\\end{document}`
  return latex
}

export default function ResumeBuilder() {
  const [resumes, setResumes] = useState([])
  const [activeResumeId, setActiveResumeId] = useState(null)
  const [sections, setSections] = useState([])
  const [visibleSections, setVisibleSections] = useState(['personal', 'summary', 'experience', 'education', 'skills', 'projects'])
  const [sectionOrder, setSectionOrder] = useState([])
  const [settings, setSettings] = useState({
    fontFamily: 'default',
    fontSize: '11pt',
    paperSize: 'letterpaper',
    primaryColor: '0E5484',
    spacing: 'normal',
    showProfilePhoto: false,
    sectionSpacing: 'normal',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [resumeTitle, setResumeTitle] = useState('My Resume')
  const [showSettings, setShowSettings] = useState(false)
  const [showVersionManager, setShowVersionManager] = useState(false)
  const [autoSaveTimer, setAutoSaveTimer] = useState(null)
  const [lastSaved, setLastSaved] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [pdfUrl, setPdfUrl] = useState(null)
  const [pdfBlob, setPdfBlob] = useState(null)
  const [compiling, setCompiling] = useState(false)
  const [compileError, setCompileError] = useState(null)

  useEffect(() => {
    loadResumes()
  }, [])

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl)
    }
  }, [pdfUrl])

  const loadResumes = async () => {
    try {
      const data = await api.get('/api/student/resume-builder')
      if (data?.resumes?.length) {
        setResumes(data.resumes)
        const latest = data.resumes[0]
        setActiveResumeId(latest._id)
        await loadResume(latest._id)
      } else {
        const defaultSections = [createSection('personal'), createSection('summary'), createSection('education')]
        setSections(defaultSections)
        setVisibleSections(['personal', 'summary', 'education'])
        setSectionOrder(['personal', 'summary', 'education'])
        setLoading(false)
      }
    } catch {
      const defaultSections = [createSection('personal'), createSection('summary'), createSection('education')]
      setSections(defaultSections)
      setVisibleSections(['personal', 'summary', 'education'])
      setSectionOrder(['personal', 'summary', 'education'])
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  const loadResume = async (id) => {
    try {
      const data = await api.get(`/api/student/resume-builder/${id}`)
      if (data?.resume) {
        setSections(data.resume.sections || [])
        setVisibleSections(data.resume.visibleSections || ['personal', 'summary', 'experience', 'education', 'skills', 'projects'])
        setSectionOrder(data.resume.sectionOrder || [])
        setResumeTitle(data.resume.title || 'My Resume')
        if (data.resume.settings) setSettings(prev => ({ ...prev, ...data.resume.settings }))
      }
    } catch (err) {
      toast.error('Failed to load resume')
    }
  }

  const handleSave = useCallback(async (showToast = true) => {
    setSaving(true)
    try {
      const payload = { resumeId: activeResumeId, title: resumeTitle, sections, visibleSections, sectionOrder, settings }
      const data = await api.post('/api/student/resume-builder', payload)
      if (data?.resume) {
        if (!activeResumeId) {
          setActiveResumeId(data.resume._id)
          setResumes(prev => {
            const exists = prev.find(r => r._id === data.resume._id)
            if (exists) return prev
            return [{ _id: data.resume._id, title: data.resume.title, updatedAt: data.resume.updatedAt }, ...prev]
          })
        } else {
          setResumes(prev => prev.map(r => r._id === data.resume._id ? { ...r, title: data.resume.title, updatedAt: data.resume.updatedAt } : r))
        }
        setLastSaved(new Date())
        if (showToast) toast.success('Resume saved!')
      }
    } catch (err) {
      if (showToast) toast.error(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }, [activeResumeId, resumeTitle, sections, visibleSections, sectionOrder, settings])

  useEffect(() => {
    if (autoSaveTimer) clearTimeout(autoSaveTimer)
    const timer = setTimeout(() => { if (activeResumeId) handleSave(false) }, 30000)
    setAutoSaveTimer(timer)
    return () => clearTimeout(timer)
  }, [sections, visibleSections, sectionOrder, settings, resumeTitle, activeResumeId, handleSave])

  const addSection = (type) => {
    const newSection = createSection(type)
    setSections(s => [...s, newSection])
    if (!visibleSections.includes(type)) setVisibleSections(v => [...v, type])
    if (!sectionOrder.includes(type)) setSectionOrder(o => [...o, type])
  }

  const removeSection = (id) => setSections(s => s.filter(sec => sec.id !== id))

  const toggleSection = (type) => setVisibleSections(v => v.includes(type) ? v.filter(t => t !== type) : [...v, type])

  const updateSection = (id, data) => setSections(s => s.map(sec => sec.id === id ? { ...sec, ...data } : sec))

  const duplicateSection = (id) => {
    const original = sections.find(s => s.id === id)
    if (!original) return
    const copy = { ...createSection(original.type), ...original, id: `${original.type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }
    setSections(s => [...s, copy])
  }

  const moveSection = (id, direction) => {
    const idx = sections.findIndex(s => s.id === id)
    if (idx === -1) return
    const newSections = [...sections]
    const newIdx = idx + direction
    if (newIdx < 0 || newIdx >= newSections.length) return
    ;[newSections[idx], newSections[newIdx]] = [newSections[newIdx], newSections[idx]]
    setSections(newSections)
  }

  const createNewResume = async () => {
    setSaving(true)
    try {
      const data = await api.post('/api/student/resume-builder', {
        title: 'New Resume',
        sections: [createSection('personal'), createSection('summary'), createSection('education')],
        visibleSections: ['personal', 'summary', 'education'],
        sectionOrder: ['personal', 'summary', 'education'],
        settings: {},
      })
      if (data?.resume) {
        setActiveResumeId(data.resume._id)
        setSections(data.resume.sections)
        setVisibleSections(data.resume.visibleSections)
        setSectionOrder(data.resume.sectionOrder)
        setResumeTitle('New Resume')
        setSettings(prev => ({ ...prev, ...data.resume.settings }))
        setResumes(prev => [{ _id: data.resume._id, title: 'New Resume', updatedAt: data.resume.updatedAt }, ...prev])
        toast.success('New resume created!')
      }
    } catch (err) { toast.error('Failed to create resume') } finally { setSaving(false) }
  }

  const duplicateResume = async () => {
    if (!activeResumeId) return
    try {
      const data = await api.post(`/api/student/resume-builder/${activeResumeId}/duplicate`)
      if (data?.resume) {
        setActiveResumeId(data.resume._id)
        setResumeTitle(data.resume.title)
        setResumes(prev => [{ _id: data.resume._id, title: data.resume.title, updatedAt: data.resume.updatedAt }, ...prev])
        toast.success('Resume duplicated!')
      }
    } catch (err) { toast.error('Failed to duplicate') }
  }

  const deleteResume = async (id) => {
    try {
      await api.delete(`/api/student/resume-builder/${id}`)
      setResumes(prev => prev.filter(r => r._id !== id))
      if (activeResumeId === id) {
        if (resumes.length > 1) {
          const next = resumes.find(r => r._id !== id)
          setActiveResumeId(next._id)
          await loadResume(next._id)
        } else {
          setActiveResumeId(null)
          setSections([createSection('personal'), createSection('summary'), createSection('education')])
          setVisibleSections(['personal', 'summary', 'education'])
          setSectionOrder(['personal', 'summary', 'education'])
          setResumeTitle('My Resume')
        }
      }
      toast.success('Resume deleted')
    } catch (err) { toast.error('Failed to delete') }
  }

  const switchResume = async (id) => { setActiveResumeId(id); await loadResume(id) }

  const handleDownloadLatex = () => {
    const latex = generateLatex(sections, visibleSections, settings)
    const blob = new Blob([latex], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${resumeTitle.replace(/\s+/g, '_').toLowerCase()}.tex`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('LaTeX file downloaded!')
  }

  const compileToPdf = async () => {
    setCompiling(true)
    setCompileError(null)
    try {
      const latex = generateLatex(sections, visibleSections, settings)
      const response = await fetch('/api/student/resume-builder/compile-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ latex }),
      })
      if (!response.ok) {
        const errBody = await response.json().catch(() => null)
        throw new Error(errBody?.message || errBody?.log || 'PDF compilation failed')
      }
      const blob = await response.blob()
      if (pdfUrl) URL.revokeObjectURL(pdfUrl)
      const url = URL.createObjectURL(blob)
      setPdfBlob(blob)
      setPdfUrl(url)
      return blob
    } catch (err) {
      setCompileError(err.message || 'Failed to render PDF preview')
      toast.error(err.message || 'Failed to render PDF preview')
      return null
    } finally {
      setCompiling(false)
    }
  }

  const handleTogglePreview = async () => {
    const next = !showPreview
    setShowPreview(next)
    if (next) await compileToPdf()
  }

  const handleDownloadPdf = async () => {
    setExporting(true)
    try {
      const blob = pdfBlob || await compileToPdf()
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${resumeTitle.replace(/\s+/g, '_').toLowerCase()}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('PDF downloaded!')
    } catch (err) { toast.error('Failed to export PDF') } finally { setExporting(false) }
  }

  const handleDownloadDocx = async () => {
    setExporting(true)
    try {
      const latex = generateLatex(sections, visibleSections, settings)
      const blob = new Blob([latex], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${resumeTitle.replace(/\s+/g, '_').toLowerCase()}.tex`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('LaTeX file downloaded! Use pandoc: pandoc resume.tex -o resume.docx')
    } catch (err) { toast.error('Failed to export') } finally { setExporting(false) }
  }

  const handleCopyLatex = () => {
    const latex = generateLatex(sections, visibleSections, settings)
    navigator.clipboard.writeText(latex)
    toast.success('LaTeX code copied to clipboard!')
  }

  const renderField = (sec, field) => {
    const value = sec[field.key] ?? ''
    if (field.type === 'textarea') {
      return <textarea value={value} onChange={e => updateSection(sec.id, { [field.key]: e.target.value })} placeholder={field.placeholder} rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-y" />
    }
    if (field.type === 'checkbox') {
      return (
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={!!value} onChange={e => updateSection(sec.id, { [field.key]: e.target.checked })} className="rounded border-slate-300 text-primary focus:ring-primary" />
          {field.placeholder || field.label}
        </label>
      )
    }
    if (field.type === 'select') {
      return (
        <select value={value} onChange={e => updateSection(sec.id, { [field.key]: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20">
          {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      )
    }
    if (field.type === 'number') {
      return <input type="number" value={value} onChange={e => updateSection(sec.id, { [field.key]: e.target.value })} placeholder={field.placeholder} min={field.min ?? 1} max={field.max ?? 5} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20" />
    }
    return <input type={field.type || 'text'} value={value} onChange={e => updateSection(sec.id, { [field.key]: e.target.value })} placeholder={field.placeholder} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20" />
  }

  if (loading) return (
    <DashboardLayout>
      <div className="flex h-64 items-center justify-center"><Loader2 className="size-8 animate-spin text-primary" /></div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-primary/10"><FileText className="size-5 text-primary" /></div>
            <div>
              <input value={resumeTitle} onChange={e => setResumeTitle(e.target.value)} className="text-xl font-bold bg-transparent border-none outline-none focus:ring-0 p-0" placeholder="Resume Title" />
              <p className="text-xs text-slate-500">{lastSaved ? `Last saved: ${lastSaved.toLocaleTimeString()}` : 'Not saved yet'}{saving && ' • Saving...'}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowVersionManager(!showVersionManager)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50"><Copy className="size-3.5" /> Versions ({resumes.length})</button>
            <button onClick={() => setShowSettings(!showSettings)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50"><Settings className="size-3.5" /> Settings</button>
            <button onClick={handleTogglePreview} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${showPreview ? 'bg-primary text-white border-primary' : 'border-slate-200 hover:bg-slate-50'}`}><Eye className="size-3.5" /> {showPreview ? 'Edit' : 'Preview'}</button>
            <div className="relative" style={{ zIndex: 100 }}>
              <button onClick={() => setShowExportMenu(!showExportMenu)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50"><Download className="size-3.5" /> Export <ChevronDown className="size-3" /></button>
              {showExportMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                  <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                    <button onClick={() => { handleDownloadPdf(); setShowExportMenu(false) }} disabled={exporting} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium hover:bg-slate-50 disabled:opacity-50"><FileDown className="size-3.5" /> {exporting ? 'Exporting...' : 'Download PDF'}</button>
                    <button onClick={() => { handleDownloadLatex(); setShowExportMenu(false) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium hover:bg-slate-50"><FileType className="size-3.5" /> Download .tex (LaTeX)</button>
                    <button onClick={() => { handleDownloadDocx(); setShowExportMenu(false) }} disabled={exporting} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium hover:bg-slate-50 disabled:opacity-50"><FileText className="size-3.5" /> Download DOCX</button>
                    <button onClick={() => { handleCopyLatex(); setShowExportMenu(false) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium hover:bg-slate-50"><Copy className="size-3.5" /> Copy LaTeX Code</button>
                  </div>
                </>
              )}
            </div>
            <button onClick={() => handleSave()} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-50">{saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />} Save</button>
          </div>
        </div>

        {showVersionManager && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-sm">Resume Versions</h3>
              <button onClick={createNewResume} className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20"><Plus className="size-3" /> New Resume</button>
            </div>
            <div className="space-y-1">
              {resumes.map(r => (
                <div key={r._id} className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm ${r._id === activeResumeId ? 'bg-primary/5 border border-primary/20' : 'hover:bg-slate-50'}`}>
                  <button onClick={() => switchResume(r._id)} className="flex items-center gap-2 text-left"><FileText className="size-4 text-slate-400" /><span className="font-medium">{r.title}</span><span className="text-xs text-slate-400">{new Date(r.updatedAt).toLocaleDateString()}</span></button>
                  <div className="flex items-center gap-1"><button onClick={() => switchResume(r._id)} className="rounded-lg p-1.5 text-xs text-primary hover:bg-primary/10">Open</button><button onClick={() => deleteResume(r._id)} className="rounded-lg p-1.5 text-xs text-rose-500 hover:bg-rose-50">Delete</button></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showSettings && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="mb-3 font-semibold text-sm">Resume Settings</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Font Family</label>
                <select value={settings.fontFamily} onChange={e => setSettings(s => ({ ...s, fontFamily: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary">
                  <option value="default">Default (matches template)</option>
                  <option value="sans">Generic Sans-serif</option>
                  <option value="FiraSans">Fira Sans</option>
                  <option value="roboto">Roboto</option>
                  <option value="sourcesanspro">Source Sans Pro</option>
                  <option value="CormorantGaramond">Cormorant Garamond</option>
                  <option value="charter">Charter (serif)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Font Size</label>
                <select value={settings.fontSize} onChange={e => setSettings(s => ({ ...s, fontSize: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary">
                  <option value="10pt">10pt</option>
                  <option value="11pt">11pt</option>
                  <option value="12pt">12pt</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Paper Size</label>
                <select value={settings.paperSize} onChange={e => setSettings(s => ({ ...s, paperSize: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary">
                  <option value="letterpaper">Letter</option>
                  <option value="a4paper">A4</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Primary Color (Hex)</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={`#${settings.primaryColor}`} onChange={e => setSettings(s => ({ ...s, primaryColor: e.target.value.replace('#', '') }))} className="size-8 rounded-lg border border-slate-200 cursor-pointer" />
                  <input value={settings.primaryColor} onChange={e => setSettings(s => ({ ...s, primaryColor: e.target.value }))} className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="0E5484" />
                </div>
              </div>
            </div>
          </div>
        )}

        {showPreview ? (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2">
              <span className="text-xs font-semibold text-slate-500">{compiling ? 'Compiling PDF…' : 'Resume Preview (compiled PDF)'}</span>
              <div className="flex items-center gap-2">
                <button onClick={compileToPdf} disabled={compiling} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-50">{compiling ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />} Refresh</button>
                <button onClick={handleDownloadPdf} disabled={compiling} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-50"><Download className="size-3" /> Download</button>
              </div>
            </div>
            <div className="bg-slate-100" style={{ minHeight: '1100px' }}>
              {compiling && !pdfUrl && (
                <div className="flex h-[1100px] items-center justify-center"><div className="flex flex-col items-center gap-2 text-slate-400"><Loader2 className="size-8 animate-spin" /><p className="text-xs">Compiling your resume to PDF…</p></div></div>
              )}
              {compileError && !compiling && (
                <div className="flex h-[1100px] items-center justify-center p-8">
                  <div className="max-w-md text-center">
                    <AlertCircle className="mx-auto mb-3 size-8 text-rose-500" />
                    <p className="mb-1 text-sm font-semibold text-slate-700">Couldn't render the PDF</p>
                    <p className="text-xs text-slate-500">{compileError}</p>
                    <button onClick={compileToPdf} className="mt-3 inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white">Try again</button>
                  </div>
                </div>
              )}
              {pdfUrl && !compileError && <iframe src={pdfUrl} title="Resume PDF preview" className="w-full border-0" style={{ height: '1100px' }} />}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {sections.map((sec, index) => {
              const config = ALL_SECTIONS[sec.type]
              if (!config) return null
              const Icon = config.icon
              const isVisible = visibleSections.includes(sec.type)

              return (
                <div key={sec.id} className={`rounded-2xl border bg-white transition-all ${isVisible ? 'border-slate-200' : 'border-dashed border-slate-300 opacity-60'}`}>
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`grid size-7 place-items-center rounded-lg ${config.bgColor}`}><Icon className={`size-3.5 ${config.color}`} /></div>
                      <h3 className="text-sm font-semibold">{config.label}{config.required && <span className="ml-1 text-rose-500">*</span>}</h3>
                      {!isVisible && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">Hidden</span>}
                    </div>
                    <div className="flex items-center gap-0.5">
                      <button onClick={() => moveSection(sec.id, -1)} disabled={index === 0} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30" title="Move up"><ArrowUp className="size-3.5" /></button>
                      <button onClick={() => moveSection(sec.id, 1)} disabled={index === sections.length - 1} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30" title="Move down"><ArrowDown className="size-3.5" /></button>
                      {config.repeatable && <button onClick={() => duplicateSection(sec.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" title="Duplicate"><Copy className="size-3.5" /></button>}
                      {!config.required && <button onClick={() => removeSection(sec.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500" title="Remove"><Trash2 className="size-3.5" /></button>}
                    </div>
                  </div>
                  <div className="p-4"><div className="grid gap-3 sm:grid-cols-2">{config.fields.map(field => (<div key={field.key} className={field.type === 'textarea' || field.type === 'checkbox' ? 'sm:col-span-2' : ''}><label className="mb-1 block text-xs font-medium text-slate-500">{field.label}</label>{renderField(sec, field)}</div>))}</div></div>
                </div>
              )
            })}
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
              <h3 className="mb-3 text-sm font-semibold text-slate-600">Add Section</h3>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(ALL_SECTIONS).filter(([t]) => t !== 'personal').map(([type, config]) => {
                  const alreadyAdded = sections.some(s => s.type === type)
                  return (
                    <button key={type} onClick={() => addSection(type)} disabled={alreadyAdded && !config.repeatable} className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${alreadyAdded && !config.repeatable ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed' : 'border-slate-200 bg-white hover:border-primary hover:bg-primary/5 text-slate-600'}`}>
                      <config.icon className="size-3" />
                      {config.label}
                      {alreadyAdded && !config.repeatable && <Check className="size-3 text-emerald-500" />}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}