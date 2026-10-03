import {
  User, FileText, Briefcase, GraduationCap, Code, FolderOpen,
  BadgeCheck, BookOpen, Award, Microscope, Globe, Heart, Users,
  Wrench, Shield, Zap, DollarSign, Clock, PlusCircle, Github
} from 'lucide-react'

export const ALL_SECTIONS = {
  personal: {
    label: 'Personal Information / Heading',
    required: false,
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
    required: false,
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

export const createSection = (type) => {
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

export const SECTION_CATEGORIES = [
  {
    name: 'Experience & Projects',
    types: ['experience', 'internships', 'projects', 'portfolio', 'openSource', 'hackathons', 'competitiveProgramming', 'volunteer', 'leadership']
  },
  {
    name: 'Academics & Research',
    types: ['education', 'research', 'publications', 'patents', 'conferences', 'workshops', 'scholarships', 'training']
  },
  {
    name: 'Certificates & Honors',
    types: ['certifications', 'licenses', 'awards', 'achievements', 'memberships']
  },
  {
    name: 'Skills & Languages',
    types: ['skills', 'languages', 'strengths', 'softSkills', 'techCompetencies']
  },
  {
    name: 'Career & Additional',
    types: ['personal', 'summary', 'social', 'careerHighlights', 'careerTimeline', 'interests', 'military', 'availability', 'salary', 'references', 'declaration', 'custom']
  }
]

