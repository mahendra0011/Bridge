require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Resume = require('./src/models/Resume');

async function seedAndCompile() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://mongo:27017/bridge';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email: 'student@demo.com' });
    if (!user) {
      console.error('student@demo.com not found!');
      process.exit(1);
    }

    const sections = [
      {
        id: 'sec-personal',
        type: 'personal',
        order: 0,
        name: 'Mahendra Prajapati',
        professionalTitle: 'Founder of Bridge | Full Stack Engineer',
        email: 'mahendrapra0077@gmail.com',
        phone: '+91 77248 22660',
        location: 'Jabalpur, M.P.',
        linkedin: 'https://linkedin.com/in/mahendra0011',
        github: 'https://github.com/mahendra0011',
        portfolio: 'https://mahendra.dev'
      },
      {
        id: 'sec-summary',
        type: 'summary',
        order: 1,
        summary: 'Motivated and detail-oriented Electronics and Communication Engineering undergraduate with a strong foundation in full-stack architecture, React, Node.js, Express, MongoDB, Docker, and LaTeX compilation pipelines. Passionate about building scalable, high-converting platforms.'
      },
      {
        id: 'sec-edu-1',
        type: 'education',
        order: 2,
        institution: 'Shri Ram Institute of Technology',
        degree: 'Bachelor of Technology',
        course: 'Electronics and Communication Engineering',
        specialization: '',
        startYear: '2023',
        endYear: '2027',
        gpa: '8.2/10',
        eduLocation: 'Jabalpur (M.P.)'
      },
      {
        id: 'sec-exp-1',
        type: 'experience',
        order: 3,
        company: 'Bridge Tech Platforms',
        role: 'Founder & Full Stack Architect',
        employmentType: 'Full-time',
        expLocation: 'Jabalpur / Remote',
        startDate: 'Jan 2024',
        endDate: '',
        current: true,
        description: 'Architected and developed an end-to-end recruitment platform uniting students, companies, and agencies with verified profiles.\nEngineered an Overleaf-compatible LaTeX compilation engine using Dockerized TeX Live for ATS-optimized vector resumes.\nBuilt high-performance REST APIs with Node.js, Express, and MongoDB with sub-50ms query response times.'
      },
      {
        id: 'sec-proj-1',
        type: 'projects',
        order: 4,
        projectName: 'MediCore',
        projectRole: 'Lead Full Stack Developer',
        projectTechnologies: 'React, Node.js, Express, MongoDB, JWT',
        projectDuration: 'April 2024',
        projectGithubLink: 'https://github.com/mahendra0011/MediCore',
        projectDescription: 'Developed a comprehensive hospital management system with Admin, Doctor, and Patient access control.\nImplemented appointment booking, live doctor scheduling, and automated billing generation.'
      },
      {
        id: 'sec-proj-2',
        type: 'projects',
        order: 5,
        projectName: 'EventO',
        projectRole: 'Creator & Architect',
        projectTechnologies: 'React, TailwindCSS, Express, MongoDB, Stripe',
        projectDuration: 'May 2024',
        projectGithubLink: 'https://github.com/mahendra0011/EventO',
        projectDescription: 'Designed an interactive event discovery and ticketing platform featuring QR-code ticket validation.\nIntegrated host analytics dashboards, automated email confirmations, and interactive seat booking.'
      },
      {
        id: 'sec-skills-1',
        type: 'skills',
        order: 6,
        technical: 'C++, JavaScript, TypeScript, Python, HTML5, CSS3, SQL',
        frameworks: 'React, Node.js, Express.js, MongoDB, TailwindCSS, Redux Toolkit',
        tools: 'Docker, Git, Linux, Postman, TeX Live, Vite, GitHub Actions',
        soft: 'Leadership, System Design, Product Strategy, Problem Solving'
      },
      {
        id: 'sec-cert-1',
        type: 'certifications',
        order: 7,
        certName: 'HTML & CSS: Basic to Beautiful',
        certIssuer: 'Udemy',
        certDate: '2023',
        description: 'Complete Modern Web Design, Responsive Layouts, and CSS Grid Masterclass'
      },
      {
        id: 'sec-cert-2',
        type: 'certifications',
        order: 8,
        certName: 'Web Development Fundamentals',
        certIssuer: 'IBM',
        certDate: '2024',
        description: 'Full stack fundamentals covering client-server architecture, RESTful APIs, and cloud services'
      },
      {
        id: 'sec-ach-1',
        type: 'achievements',
        order: 9,
        achievementTitle: 'Team Leader — Smart India Hackathon',
        description: 'Led a 6-member team solving national public infrastructure automation challenge.\n400+ GitHub contributions with continuous open-source maintenance.\nSolved 150+ Data Structures & Algorithms problems in C++.'
      }
    ];

    const visibleSections = ['personal', 'summary', 'education', 'experience', 'projects', 'skills', 'certifications', 'achievements'];
    const sectionOrder = ['education', 'experience', 'projects', 'skills', 'certifications', 'achievements'];
    const settings = {
      templateId: 'mahendra-founder',
      fontFamily: 'serif',
      fontSize: '11pt',
      paperSize: 'letterpaper',
      primaryColor: '0E5484',
      spacing: 'normal',
      showProfilePhoto: false,
      sectionSpacing: 'normal'
    };

    // Upsert demo resume
    const existing = await Resume.findOne({ user: user._id, title: "Mahendra Prajapati - Founder's Resume (Demo)" });
    let resumeRecord;
    if (existing) {
      existing.sections = sections;
      existing.visibleSections = visibleSections;
      existing.sectionOrder = sectionOrder;
      existing.settings = settings;
      resumeRecord = await existing.save();
      console.log('Updated existing demo resume ID:', resumeRecord._id);
    } else {
      resumeRecord = await Resume.create({
        user: user._id,
        title: "Mahendra Prajapati - Founder's Resume (Demo)",
        sections,
        visibleSections,
        sectionOrder,
        settings
      });
      console.log('Created new demo resume ID:', resumeRecord._id);
    }

    console.log('DONE SEEDING RESUME!');
    process.exit(0);
  } catch (err) {
    console.error('Error in seedAndCompile:', err);
    process.exit(1);
  }
}

seedAndCompile();
