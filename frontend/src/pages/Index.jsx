import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView, useAnimation, AnimatePresence } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import {
  Search, ArrowRight, Sparkles, Building2, GraduationCap,
  Code2, Palette, Megaphone, BarChart3, Briefcase as BriefIcon, Layers,
  ChevronDown, Star, TrendingUp, Users, Globe, Handshake, MessageCircle,
} from 'lucide-react'
import { SiteLayout } from '@/components/site/site-layout'
import { JobCard } from '@/components/site/job-card'
import { InternshipCard } from '@/components/site/internship-card'
import { Button } from '@/components/ui/button'

gsap.registerPlugin(ScrollTrigger)

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
}

const fadeInScale = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
}

const cardStagger = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  }
}

const categoryCards = [
  { name: 'Engineering', icon: Code2, count: 1240, color: 'from-blue-500 to-indigo-600' },
  { name: 'Design', icon: Palette, count: 384, color: 'from-rose-500 to-orange-500' },
  { name: 'Marketing', icon: Megaphone, count: 512, color: 'from-violet-500 to-fuchsia-600' },
  { name: 'Data', icon: BarChart3, count: 298, color: 'from-emerald-500 to-teal-600' },
  { name: 'Product', icon: Layers, count: 176, color: 'from-amber-500 to-orange-600' },
  { name: 'Sales', icon: BriefIcon, count: 421, color: 'from-cyan-500 to-blue-600' },
]

const spotlightCompanies = [
  { name: 'Aether Dynamics', desc: 'Building tools for the next generation of researchers.', roles: 12, color: 'from-blue-500 to-indigo-600' },
  { name: 'Nebula Cloud', desc: 'Infrastructure that scales with ambition.', roles: 8, color: 'from-violet-500 to-fuchsia-600' },
  { name: 'Velocity Labs', desc: 'AI-native developer experience.', roles: 15, color: 'from-emerald-500 to-teal-600' },
]

const faqs = [
  { q: 'Is Bridge free for students?', a: 'Yes. Browsing, applying, and tracking applications is always free for students. No hidden charges, ever.' },
  { q: 'How does the application process work?', a: 'Build your profile, browse roles that match your skills, and apply with one click. Track every application status in real-time from your dashboard.' },
  { q: 'Can I save roles and apply later?', a: 'Absolutely. Tap the bookmark icon on any job or internship card to save it. Access your saved list anytime from the dashboard.' },
  { q: 'How are companies verified?', a: 'Every employer goes through a manual review process including business verification and domain email check before they can post roles.' },
  { q: 'Do I need a polished resume?', a: 'Not at all. Our profile builder turns your projects, skills, and education into an attractive applicant profile in under five minutes.' },
]

function FAQItem({ q, a, defaultOpen }) {
  const [open, setOpen] = useState(!!defaultOpen)
  return (
    <div className={`transition-all duration-200 ${open ? 'bg-indigo-50/50' : ''}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left font-bold transition-colors hover:text-primary"
      >
        <span className="text-sm sm:text-base">{q}</span>
        <div className={`grid size-7 shrink-0 place-items-center rounded-lg transition-all duration-200 ${
          open ? 'bg-primary text-white rotate-180' : 'bg-slate-100 text-slate-400'
        }`}>
          <ChevronDown className="size-4" />
        </div>
      </button>
      {open && (
        <div className="px-6 pb-6 text-sm leading-relaxed text-slate-500 animate-in fade-in slide-in-from-top-1 duration-200">
          {a}
        </div>
      )}
    </div>
  )
}

function SplitCard({ icon, title, body, bullets, cta, to, dark }) {
  return (
    <Link
      to={to}
      className={`group relative flex flex-col overflow-hidden rounded-3xl border-2 p-8 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl ${
        dark
          ? 'border-indigo-100 bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800 text-white shadow-indigo-200/50'
          : 'border-slate-200 bg-gradient-to-br from-white to-slate-50 hover:border-indigo-200 hover:shadow-indigo-100/50'
      }`}
    >
      {dark && (
        <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-indigo-500/20 blur-3xl" />
      )}
      <div className={`mb-5 grid size-14 place-items-center rounded-2xl shadow-lg ${
        dark ? 'bg-white/15 text-white ring-1 ring-white/20' : 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100'
      }`}>
        {icon}
      </div>
      <h3 className="mb-2 text-2xl font-extrabold tracking-tight">{title}</h3>
      <p className={`mb-6 leading-relaxed ${dark ? 'text-indigo-200' : 'text-slate-500'}`}>{body}</p>
      <ul className="mb-8 space-y-3 text-sm">
        {bullets.map((b) => (
          <li key={b} className="flex items-center gap-3">
            <span className={`grid size-5 shrink-0 place-items-center rounded-full ${
              dark ? 'bg-emerald-400/20 text-emerald-300' : 'bg-emerald-50 text-emerald-600'
            }`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="size-3">
                <path d="M5 12l5 5L20 7" />
              </svg>
            </span>
            <span className={dark ? 'text-indigo-100' : 'text-slate-600'}>{b}</span>
          </li>
        ))}
      </ul>
      <span className={`mt-auto inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-200 group-hover:gap-3 ${
        dark
          ? 'bg-white text-indigo-700 shadow-lg hover:bg-indigo-50'
          : 'bg-indigo-600 text-white shadow-lg shadow-indigo-200/50 hover:bg-indigo-700'
      }`}>
        {cta} <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
      </span>
    </Link>
  )
}

const featuredJobs = [
  {
    id: '1',
    _id: '1',
    kind: 'job',
    title: 'Senior Frontend Engineer',
    company: 'Stripe',
    companyId: 'c1',
    companyLogoUrl: null,
    companyVerified: true,
    agency: null,
    agencyId: null,
    location: 'San Francisco, CA',
    mode: 'Remote',
    category: 'Engineering',
    pay: '$150K – $220K',
    payValue: 150000,
    type: 'Full-time',
    experience: 'Senior',
    posted: '2d ago',
    deadline: { text: '10 days left', urgent: false, closed: false },
    deadlineDate: null,
    description: '',
    skills: ['React', 'TypeScript', 'GraphQL', 'Tailwind CSS'],
    goodToHaveSkills: [],
    benefits: [],
    roles: [],
    qualifications: [],
    minimumEducation: '',
    certificationsRequired: [],
    noticePeriod: '',
    shiftTiming: '',
    interviewProcess: '',
    joiningTimeline: '',
    screeningQuestions: [],
    vacancies: 2,
    status: 'approved',
    applicantsCount: 24,
    isBoosted: true,
    logoBg: 'from-blue-500 to-indigo-600',
    duration: null,
    stipend: 0,
    startDate: null,
    hasPPO: false,
    employmentType: 'Full-time',
    applied: false,
    applicationStatus: null,
    raw: null,
  },
  {
    id: '2',
    _id: '2',
    kind: 'job',
    title: 'Product Designer',
    company: 'Figma',
    companyId: 'c2',
    companyLogoUrl: null,
    companyVerified: true,
    agency: null,
    agencyId: null,
    location: 'New York, NY',
    mode: 'Hybrid',
    category: 'Design',
    pay: '$130K – $180K',
    payValue: 130000,
    type: 'Full-time',
    experience: 'Mid-Level',
    posted: '3d ago',
    deadline: { text: '5 days left', urgent: true, closed: false },
    deadlineDate: null,
    description: '',
    skills: ['Figma', 'Design Systems', 'Prototyping', 'User Research'],
    goodToHaveSkills: [],
    benefits: [],
    roles: [],
    qualifications: [],
    minimumEducation: '',
    certificationsRequired: [],
    noticePeriod: '',
    shiftTiming: '',
    interviewProcess: '',
    joiningTimeline: '',
    screeningQuestions: [],
    vacancies: 1,
    status: 'approved',
    applicantsCount: 56,
    isBoosted: false,
    logoBg: 'from-rose-500 to-orange-500',
    duration: null,
    stipend: 0,
    startDate: null,
    hasPPO: false,
    employmentType: 'Full-time',
    applied: false,
    applicationStatus: null,
    raw: null,
  },
  {
    id: '3',
    _id: '3',
    kind: 'job',
    title: 'Backend Engineer – Payments',
    company: 'Linear',
    companyId: 'c3',
    companyLogoUrl: null,
    companyVerified: true,
    agency: null,
    agencyId: null,
    location: 'Remote',
    mode: 'Remote',
    category: 'Engineering',
    pay: '$160K – $240K',
    payValue: 160000,
    type: 'Full-time',
    experience: 'Senior',
    posted: '1d ago',
    deadline: { text: '14 days left', urgent: false, closed: false },
    deadlineDate: null,
    description: '',
    skills: ['Go', 'PostgreSQL', 'Kubernetes', 'gRPC'],
    goodToHaveSkills: [],
    benefits: [],
    roles: [],
    qualifications: [],
    minimumEducation: '',
    certificationsRequired: [],
    noticePeriod: '',
    shiftTiming: '',
    interviewProcess: '',
    joiningTimeline: '',
    screeningQuestions: [],
    vacancies: 3,
    status: 'approved',
    applicantsCount: 18,
    isBoosted: true,
    logoBg: 'from-emerald-500 to-teal-600',
    duration: null,
    stipend: 0,
    startDate: null,
    hasPPO: false,
    employmentType: 'Full-time',
    applied: false,
    applicationStatus: null,
    raw: null,
  },
  {
    id: '4',
    _id: '4',
    kind: 'job',
    title: 'Data Scientist – Growth',
    company: 'Notion',
    companyId: 'c4',
    companyLogoUrl: null,
    companyVerified: true,
    agency: null,
    agencyId: null,
    location: 'San Francisco, CA',
    mode: 'On-site',
    category: 'Data',
    pay: '$140K – $190K',
    payValue: 140000,
    type: 'Full-time',
    experience: 'Mid-Level',
    posted: '4d ago',
    deadline: { text: '7 days left', urgent: false, closed: false },
    deadlineDate: null,
    description: '',
    skills: ['Python', 'SQL', 'Machine Learning', 'A/B Testing'],
    goodToHaveSkills: [],
    benefits: [],
    roles: [],
    qualifications: [],
    minimumEducation: '',
    certificationsRequired: [],
    noticePeriod: '',
    shiftTiming: '',
    interviewProcess: '',
    joiningTimeline: '',
    screeningQuestions: [],
    vacancies: 2,
    status: 'approved',
    applicantsCount: 42,
    isBoosted: false,
    logoBg: 'from-violet-500 to-fuchsia-600',
    duration: null,
    stipend: 0,
    startDate: null,
    hasPPO: false,
    employmentType: 'Full-time',
    applied: false,
    applicationStatus: null,
    raw: null,
  },
]

const featuredInternships = [
  {
    id: 'i1',
    _id: 'i1',
    kind: 'internship',
    title: 'Frontend Engineering Intern',
    company: 'Vercel',
    companyId: 'c5',
    companyLogoUrl: null,
    companyVerified: true,
    agency: null,
    agencyId: null,
    location: 'Remote',
    mode: 'Remote',
    category: 'Engineering',
    pay: '$3,000/mo',
    payValue: 3000,
    type: 'Internship',
    experience: 'Student / Fresher',
    posted: '1d ago',
    deadline: { text: '15 days left', urgent: false, closed: false },
    deadlineDate: null,
    description: '',
    skills: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'],
    goodToHaveSkills: [],
    benefits: [],
    roles: [],
    qualifications: [],
    minimumEducation: '',
    certificationsRequired: [],
    noticePeriod: '',
    shiftTiming: '',
    interviewProcess: '',
    joiningTimeline: '',
    screeningQuestions: [],
    vacancies: 5,
    status: 'approved',
    applicantsCount: 89,
    isBoosted: true,
    logoBg: 'from-blue-500 to-indigo-600',
    duration: '3 months',
    stipend: 3000,
    startDate: { label: 'Starts immediately', raw: null },
    hasPPO: true,
    employmentType: 'Internship',
    applied: false,
    applicationStatus: null,
    raw: null,
  },
  {
    id: 'i2',
    _id: 'i2',
    kind: 'internship',
    title: 'Product Design Intern',
    company: 'Linear',
    companyId: 'c6',
    companyLogoUrl: null,
    companyVerified: true,
    agency: null,
    agencyId: null,
    location: 'San Francisco, CA',
    mode: 'Hybrid',
    category: 'Design',
    pay: '$2,500/mo',
    payValue: 2500,
    type: 'Internship',
    experience: 'Student / Fresher',
    posted: '2d ago',
    deadline: { text: '10 days left', urgent: false, closed: false },
    deadlineDate: null,
    description: '',
    skills: ['Figma', 'UI Design', 'Prototyping', 'Design Systems'],
    goodToHaveSkills: [],
    benefits: [],
    roles: [],
    qualifications: [],
    minimumEducation: '',
    certificationsRequired: [],
    noticePeriod: '',
    shiftTiming: '',
    interviewProcess: '',
    joiningTimeline: '',
    screeningQuestions: [],
    vacancies: 3,
    status: 'approved',
    applicantsCount: 45,
    isBoosted: false,
    logoBg: 'from-rose-500 to-orange-500',
    duration: '6 months',
    stipend: 2500,
    startDate: { label: 'Starts in 2 weeks', raw: null },
    hasPPO: true,
    employmentType: 'Internship',
    applied: false,
    applicationStatus: null,
    raw: null,
  },
  {
    id: 'i3',
    _id: 'i3',
    kind: 'internship',
    title: 'Data Science Intern',
    company: 'OpenAI',
    companyId: 'c7',
    companyLogoUrl: null,
    companyVerified: true,
    agency: null,
    agencyId: null,
    location: 'Remote',
    mode: 'Remote',
    category: 'Data',
    pay: '$4,000/mo',
    payValue: 4000,
    type: 'Internship',
    experience: 'Student / Fresher',
    posted: '3d ago',
    deadline: { text: '8 days left', urgent: false, closed: false },
    deadlineDate: null,
    description: '',
    skills: ['Python', 'Machine Learning', 'SQL', 'PyTorch'],
    goodToHaveSkills: [],
    benefits: [],
    roles: [],
    qualifications: [],
    minimumEducation: '',
    certificationsRequired: [],
    noticePeriod: '',
    shiftTiming: '',
    interviewProcess: '',
    joiningTimeline: '',
    screeningQuestions: [],
    vacancies: 4,
    status: 'approved',
    applicantsCount: 120,
    isBoosted: true,
    logoBg: 'from-emerald-500 to-teal-600',
    duration: '6 months',
    stipend: 4000,
    startDate: { label: 'Starts in 1 month', raw: null },
    hasPPO: true,
    employmentType: 'Internship',
    applied: false,
    applicationStatus: null,
    raw: null,
  },
  {
    id: 'i4',
    _id: 'i4',
    kind: 'internship',
    title: 'Marketing Intern – Growth',
    company: 'Notion',
    companyId: 'c8',
    companyLogoUrl: null,
    companyVerified: true,
    agency: null,
    agencyId: null,
    location: 'New York, NY',
    mode: 'On-site',
    category: 'Marketing',
    pay: '$2,000/mo',
    payValue: 2000,
    type: 'Internship',
    experience: 'Student / Fresher',
    posted: '4d ago',
    deadline: { text: '12 days left', urgent: false, closed: false },
    deadlineDate: null,
    description: '',
    skills: ['Content Strategy', 'Social Media', 'Analytics', 'SEO'],
    goodToHaveSkills: [],
    benefits: [],
    roles: [],
    qualifications: [],
    minimumEducation: '',
    certificationsRequired: [],
    noticePeriod: '',
    shiftTiming: '',
    interviewProcess: '',
    joiningTimeline: '',
    screeningQuestions: [],
    vacancies: 2,
    status: 'approved',
    applicantsCount: 67,
    isBoosted: false,
    logoBg: 'from-violet-500 to-fuchsia-600',
    duration: '3 months',
    stipend: 2000,
    startDate: { label: 'Starts immediately', raw: null },
    hasPPO: false,
    employmentType: 'Internship',
    applied: false,
    applicationStatus: null,
    raw: null,
  },
]

function Counter({ value, suffix = '' }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        const duration = 2000
        const steps = 60
        const increment = Math.ceil(value / steps)
        let current = 0
        const timer = setInterval(() => {
          current += increment
          if (current >= value) {
            setCount(value)
            clearInterval(timer)
          } else {
            setCount(current)
          }
        }, duration / steps)
        observer.disconnect()
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [value])

  return (
    <span ref={ref} className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">
      {count.toLocaleString()}{suffix}
    </span>
  )
}

export default function Index() {
  const featured = featuredJobs
  const featuredLoading = false
  const lenisRef = useRef(null)
  
  // Refs for scroll animations
  const heroRef = useRef(null)
  const exploreRef = useRef(null)
  const categoriesRef = useRef(null)
  const internshipsRef = useRef(null)
  const jobsRef = useRef(null)
  const ctaRef = useRef(null)
  const communityRef = useRef(null)
  const howItWorksRef = useRef(null)
  const companiesRef = useRef(null)
  const statsRef = useRef(null)
  const testimonialsRef = useRef(null)
  const faqRef = useRef(null)
  const finalCtaRef = useRef(null)

  // useInView controls for scroll-triggered animations
  const heroInView = useInView(heroRef, { once: true, amount: 0.3 })
  const exploreInView = useInView(exploreRef, { once: true, amount: 0.3 })
  const categoriesInView = useInView(categoriesRef, { once: true, amount: 0.3 })
  const internshipsInView = useInView(internshipsRef, { once: true, amount: 0.3 })
  const jobsInView = useInView(jobsRef, { once: true, amount: 0.3 })
  const ctaInView = useInView(ctaRef, { once: true, amount: 0.3 })
  const communityInView = useInView(communityRef, { once: true, amount: 0.3 })
  const howItWorksInView = useInView(howItWorksRef, { once: true, amount: 0.3 })
  const companiesInView = useInView(companiesRef, { once: true, amount: 0.3 })
  const statsInView = useInView(statsRef, { once: true, amount: 0.3 })
  const testimonialsInView = useInView(testimonialsRef, { once: true, amount: 0.3 })
  const faqInView = useInView(faqRef, { once: true, amount: 0.3 })
  const finalCtaInView = useInView(finalCtaRef, { once: true, amount: 0.3 })

  useEffect(() => {
    // Lenis smooth scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
    })
    lenisRef.current = lenis

    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)

    // GSAP ScrollTrigger integration with Lenis
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.lagSmoothing(0)

    // GSAP Parallax for background elements
    const ctx = gsap.context(() => {
      gsap.utils.toArray('.parallax-bg').forEach((el) => {
        gsap.to(el, {
          y: -50,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'bottom bottom',
            end: 'top top',
            scrub: true
          }
        })
      })
    })

    return () => {
      lenis.destroy()
      ctx.revert()
    }
  }, [])

  return (
    <SiteLayout>
      {/* Hero */}
      <header className="relative overflow-hidden bg-white px-6 pt-20 pb-20">
        <div className="pointer-events-none absolute inset-0 -z-0">
          <div className="absolute -top-32 left-1/2 size-[700px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
        </div>

        <div className="relative mx-auto max-w-5xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-600 shadow-sm"
          >
            <Sparkles className="size-3.5 text-primary" />
            New roles added every day · 12,000+ companies hiring
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 text-5xl font-extrabold tracking-tight md:text-7xl"
          >
            Your first real leap{' '}
            <span className="relative inline-block">
              <span className="relative z-10">starts here.</span>
              <span className="absolute inset-x-0 bottom-1 -z-0 h-3 bg-primary/20 md:h-4" />
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mx-auto mb-10 max-w-2xl text-lg text-slate-600"
          >
            Connecting the next generation of talent with the world's most ambitious companies.
            Internships, full-time roles, and everything in between.
          </motion.p>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 text-left shadow-2xl shadow-slate-300/40 md:flex-row"
          >
            <div className="w-full flex-1 border-b border-slate-100 px-4 py-3 md:border-b-0 md:border-r">
              <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">What role?</div>
              <input
                type="text"
                placeholder="Product Design, Backend..."
                className="w-full text-sm font-medium outline-none placeholder:text-slate-300"
              />
            </div>
            <div className="w-full flex-1 border-b border-slate-100 px-4 py-3 md:border-b-0 md:border-r">
              <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Where?</div>
              <input
                type="text"
                placeholder="Remote, NYC, London..."
                className="w-full text-sm font-medium outline-none placeholder:text-slate-300"
              />
            </div>
            <div className="w-full flex-1 px-4 py-3">
              <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Job Type</div>
              <select className="w-full bg-transparent text-sm font-medium outline-none">
                <option>Any</option>
                <option>Internship</option>
                <option>Full-time</option>
                <option>Contract</option>
              </select>
            </div>
            <Link to="/jobs" className="w-full md:w-auto">
              <Button size="lg" className="w-full rounded-xl bg-primary px-8 py-6 font-bold text-primary-foreground hover:bg-primary/90 md:w-auto">
                <Search className="size-4" /> Find Roles
              </Button>
            </Link>
          </motion.div>

          {/* Quick chips */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="font-semibold text-slate-500">Popular:</span>
            {['Frontend Intern', 'Product Design', 'Data Science', 'Marketing', 'Remote'].map((c) => (
              <Link
                key={c}
                to="/jobs"
                className="rounded-full border border-slate-200 bg-white px-4 py-1.5 font-semibold text-slate-600 transition-colors hover:border-primary hover:text-primary"
              >
                {c}
              </Link>
            ))}
          </div>

          {/* Stats strip */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 md:grid-cols-4"
          >
            {[
              { n: '200K+', l: 'Active students', icon: Users },
              { n: '12K+', l: 'Hiring companies', icon: Building2 },
              { n: '48K', l: 'Placements made', icon: TrendingUp },
              { n: '92%', l: 'Avg response rate', icon: Star },
            ].map((s) => (
              <div key={s.l} className="flex items-center gap-3 bg-white px-5 py-5 text-left">
                <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <s.icon className="size-5" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold tracking-tight">{s.n}</div>
                  <div className="text-xs font-medium text-slate-500">{s.l}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </header>

      {/* Logo strip */}
      <div className="border-y border-slate-100 py-10">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-6 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Trusted by industry leaders
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 text-2xl font-extrabold tracking-tight text-slate-300">
            <span>Linear</span>
            <span className="font-serif italic">Vercel</span>
            <span>STRIPE</span>
            <span>Framer</span>
            <span>OpenAI</span>
            <span>Notion</span>
            <span className="font-serif">Figma</span>
          </div>
        </div>
      </div>

      {/* Explore quick links */}
      <motion.section 
        ref={exploreRef}
        initial="hidden"
        animate={exploreInView ? "visible" : "hidden"}
        variants={staggerContainer}
        className="bg-white px-6 py-16"
      >
        <div className="mx-auto max-w-7xl">
          <motion.div variants={fadeInUp} className="mb-10 text-center">
            <h2 className="text-4xl font-extrabold tracking-tight md:text-5xl">Explore more on Bridge</h2>
            <p className="mx-auto mt-3 max-w-lg text-slate-500">Discover everything the platform has to offer.</p>
          </motion.div>
          <motion.div variants={staggerContainer} className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {[
              { label: 'Explore Internships', to: '/internships', icon: GraduationCap },
              { label: 'Explore Jobs', to: '/jobs', icon: BriefIcon },
              { label: 'Agency Listings', to: '/agency-listings', icon: Handshake },
              { label: 'Opportunities', to: '/opportunities', icon: TrendingUp },
              { label: 'Open to Work', to: '/profile', icon: Users },
              { label: 'Community', to: '/community', icon: MessageCircle },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.label}
                  variants={cardStagger}
                  custom={i}
                >
                  <Link
                    to={item.to}
                    className="group relative flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-lg hover:shadow-blue-100/50"
                  >
                    <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100 transition-all duration-300 group-hover:bg-blue-100 group-hover:text-blue-700 group-hover:ring-blue-200 group-hover:shadow-md">
                      <Icon className="size-5" />
                    </div>
                    <span className="text-sm font-bold text-slate-600 transition-colors group-hover:text-blue-700">{item.label}</span>
                  </Link>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </motion.section>

      {/* Category grid */}
      <motion.section 
        ref={categoriesRef}
        initial="hidden"
        animate={categoriesInView ? "visible" : "hidden"}
        variants={staggerContainer}
        className="bg-white px-6 py-24"
      >
        <div className="mx-auto max-w-7xl">
          <motion.div variants={fadeInUp} className="mb-14 text-center">
            <span className="inline-block rounded-full bg-blue-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-600 ring-1 ring-blue-100">Categories</span>
            <h2 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">Browse by category</h2>
            <p className="mx-auto mt-3 max-w-lg text-slate-500">Find opportunities that match your interests.</p>
          </motion.div>
          <motion.div variants={staggerContainer} className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-6">
            {categoryCards.map((c, i) => (
              <motion.div
                key={c.name}
                variants={cardStagger}
                custom={i}
              >
                <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
                  <Link
                    to="/jobs"
                    className="group relative block rounded-2xl border border-slate-100 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-lg hover:shadow-blue-100/50"
                  >
                    <div className="mb-5 grid size-12 place-items-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100 transition-all duration-300 group-hover:bg-blue-100 group-hover:text-blue-700 group-hover:ring-blue-200 group-hover:shadow-md">
                      <c.icon className="size-6" />
                    </div>
                    <div className="font-bold text-slate-700 transition-colors group-hover:text-blue-700">{c.name}</div>
                    <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                      {c.count.toLocaleString()} open roles
                    </div>
                  </Link>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Featured Internships */}
      <motion.section 
        ref={internshipsRef}
        initial="hidden"
        animate={internshipsInView ? "visible" : "hidden"}
        variants={staggerContainer}
        className="mx-auto max-w-7xl px-6 pb-12"
      >
        <motion.div variants={fadeInUp} className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold">Featured internships</h2>
            <p className="mt-1 text-sm text-slate-500">Top internship opportunities for students.</p>
          </div>
          <Link to="/internships" className="hidden items-center gap-1 text-sm font-bold text-primary hover:underline md:inline-flex">
            View all <ArrowRight className="size-4" />
          </Link>
        </motion.div>
        <motion.div variants={staggerContainer} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {featuredInternships.slice(0, 4).map((o, i) => (
            <motion.div key={o.id} variants={cardStagger}>
              <InternshipCard item={o} index={i} />
            </motion.div>
          ))}
        </motion.div>
        <motion.div variants={fadeInUp} className="mt-12 border-t border-slate-100" />
      </motion.section>

      {/* Featured Jobs */}
      <motion.section 
        ref={jobsRef}
        initial="hidden"
        animate={jobsInView ? "visible" : "hidden"}
        variants={staggerContainer}
        className="mx-auto max-w-7xl px-6 pb-12"
      >
        <motion.div variants={fadeInUp} className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold">Featured jobs</h2>
            <p className="mt-1 text-sm text-slate-500">Hand-picked roles from the past week.</p>
          </div>
          <Link to="/jobs" className="hidden items-center gap-1 text-sm font-bold text-primary hover:underline md:inline-flex">
            View all <ArrowRight className="size-4" />
          </Link>
        </motion.div>
        {featuredLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="size-9 rounded-xl bg-slate-200 sm:size-10" />
                    <div className="h-4 w-28 rounded bg-slate-200" />
                  </div>
                  <div className="size-7 rounded-lg bg-slate-200 sm:size-8" />
                </div>
                <div className="mt-3 space-y-2">
                  <div className="h-5 w-3/4 rounded bg-slate-200" />
                  <div className="h-4 w-1/2 rounded bg-slate-200" />
                </div>
                <div className="mt-2 flex gap-2">
                  <div className="h-4 w-16 rounded bg-slate-200" />
                  <div className="h-4 w-20 rounded bg-slate-200" />
                  <div className="h-4 w-24 rounded bg-slate-200" />
                </div>
                <div className="mt-2 flex gap-1">
                  <div className="h-5 w-14 rounded-md bg-slate-200" />
                  <div className="h-5 w-20 rounded-md bg-slate-200" />
                  <div className="h-5 w-16 rounded-md bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <motion.div variants={staggerContainer} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featured.slice(0, 4).map((o, i) => (
              <motion.div key={o.id} variants={cardStagger}>
                <JobCard item={o} index={i} />
              </motion.div>
            ))}
          </motion.div>
        )}
        <motion.div variants={fadeInUp} className="mt-12 border-t border-slate-100" />
      </motion.section>

      {/* Split CTA */}
      <motion.section 
        ref={ctaRef}
        initial="hidden"
        animate={ctaInView ? "visible" : "hidden"}
        variants={staggerContainer}
        className="mx-auto max-w-7xl px-6 pb-20"
      >
        <motion.div variants={staggerContainer} className="grid gap-6 md:grid-cols-3">
          <motion.div variants={cardStagger}><SplitCard
            icon={<GraduationCap className="size-6" />}
            title="For Students"
            body="Build your profile, apply in one click, and track every application from one place."
            bullets={['Free forever', 'Resume builder & upload', 'Application tracker', 'AI-powered recommendations', 'Real-time messaging']}
            cta="Create profile"
            to="/signup"
          /></motion.div>
          <motion.div variants={cardStagger}><SplitCard
            icon={<Building2 className="size-6" />}
            title="For Companies"
            body="Post roles, manage applicants, and hire the next generation of builders."
            bullets={['Verified candidate pool', 'Applicant tracking system', 'Interview scheduling', 'Kanban pipeline', 'Analytics dashboard']}
            cta="Post a role"
            to="/signup"
            dark
          /></motion.div>
          <motion.div variants={cardStagger}><SplitCard
            icon={<Handshake className="size-6" />}
            title="For Agencies"
            body="Post jobs for clients, manage applicants, and scale your recruitment agency."
            bullets={['Team member management', 'Bulk job & internship posting', 'Kanban applicant pipeline', 'Analytics & performance insights', 'Verification & trust badges']}
            cta="Get started"
            to="/signup"
          /></motion.div>
        </motion.div>
      </motion.section>

      {/* Community */}
      <motion.section 
        ref={communityRef}
        initial="hidden"
        animate={communityInView ? "visible" : "hidden"}
        variants={staggerContainer}
        className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white px-6 py-24"
      >
        <div className="pointer-events-none absolute inset-0 parallax-bg">
          <div className="absolute -left-40 top-1/3 size-80 rounded-full bg-indigo-50 blur-3xl parallax-bg" />
          <div className="absolute -right-40 bottom-1/4 size-60 rounded-full bg-amber-50 blur-3xl parallax-bg" />
        </div>
        <div className="relative mx-auto max-w-6xl">
          <motion.div variants={fadeInUp} className="mb-14 text-center">
            <span className="inline-block rounded-full bg-indigo-100 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-indigo-700 ring-1 ring-indigo-200">Community</span>
            <h2 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">Explore the Bridge community</h2>
            <p className="mx-auto mt-3 max-w-lg text-slate-500">Connect, share, and grow with fellow students and professionals.</p>
          </motion.div>
          <motion.div variants={staggerContainer} className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: MessageCircle,
                title: 'Community Forum',
                desc: 'Engage in discussions, share knowledge, and get advice from peers and industry experts in topic-based channels.',
                color: 'from-blue-500 to-indigo-600',
              },
              {
                icon: Users,
                title: 'Peer Connections',
                desc: 'Network with like-minded students, form study groups, collaborate on projects, and build lasting professional relationships.',
                color: 'from-emerald-500 to-teal-600',
              },
              {
                icon: Star,
                title: 'Opportunities & Events',
                desc: 'Discover student-run initiatives, hackathons, webinars, and exclusive events posted by the community.',
                color: 'from-amber-500 to-orange-600',
              },
            ].map((card, i) => {
              const Icon = card.icon
              return (
                <motion.div
                  key={card.title}
                  variants={cardStagger}
                >
                  <div className="group relative overflow-hidden rounded-3xl border-2 border-slate-100 bg-white p-8 transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5">
                    <div className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className={`mb-5 grid size-14 place-items-center rounded-2xl bg-gradient-to-br ${card.color} text-white shadow-lg shadow-black/5 ring-1 ring-white/20 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3`}>
                      <Icon className="size-6" />
                    </div>
                    <h3 className="mb-3 text-xl font-extrabold tracking-tight text-slate-900">{card.title}</h3>
                    <p className="text-sm leading-relaxed text-slate-500">{card.desc}</p>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
          <motion.div variants={fadeInUp} className="mt-12 text-center">
            <Link
              to="/community"
              className="group inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-200/50 transition-all duration-200 hover:scale-105 hover:bg-indigo-700 hover:shadow-xl active:scale-[0.98]"
            >
              Explore the community
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* How it works */}
      <motion.section 
        ref={howItWorksRef}
        initial="hidden"
        animate={howItWorksInView ? "visible" : "hidden"}
        variants={staggerContainer}
        className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 px-6 py-24 text-white"
      >
        <div className="pointer-events-none absolute inset-0 parallax-bg">
          <div className="absolute -left-32 top-0 size-96 rounded-full bg-indigo-500/10 blur-3xl parallax-bg" />
          <div className="absolute -right-32 bottom-0 size-96 rounded-full bg-violet-500/10 blur-3xl parallax-bg" />
        </div>
        <motion.div variants={fadeInUp} className="relative mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <span className="inline-block rounded-full bg-indigo-500/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-indigo-300 ring-1 ring-indigo-400/30">How it works</span>
            <h2 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">Three steps to your future</h2>
            <p className="mx-auto mt-3 max-w-xl text-indigo-200/70">From profile to offer letter — we make the journey seamless.</p>
          </div>
          <div className="relative grid gap-8 md:grid-cols-3">
            {/* Connector line */}
            <motion.div 
              variants={fadeInUp}
              className="absolute left-1/2 top-16 hidden h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent md:block" 
            />
            {[
              { n: '01', t: 'Build Your Profile', d: 'Import your projects, stack, and goals in seconds. No tedious resume builders.', icon: 'User' },
              { n: '02', t: 'Apply with Intent', d: 'Our algorithm matches your skills to high-impact roles at top-tier companies.', icon: 'Send' },
              { n: '03', t: 'Get Hired', d: 'Manage interviews and offers through one centralized dashboard.', icon: 'Award' },
            ].map((s, i) => {
              const icons = { User: Search, Send: ArrowRight, Award: Star }
              const Icon = icons[s.icon]
              return (
                <motion.div
                  key={s.n}
                  variants={cardStagger}
                >
                  <div className="relative z-10 flex flex-col items-center rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-400/30 hover:bg-white/[0.07] hover:shadow-2xl hover:shadow-indigo-500/10">
                    <div className="mb-6 grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-2xl font-bold shadow-lg shadow-indigo-500/20 ring-1 ring-white/10 group-hover:scale-110 group-hover:shadow-indigo-500/40 transition-all duration-300">
                      <Icon className="size-6" />
                    </div>
                    <span className="mb-2 text-[11px] font-bold uppercase tracking-widest text-indigo-400/70">Step {s.n}</span>
                    <h3 className="mb-3 text-xl font-bold text-white">{s.t}</h3>
                    <p className="text-sm leading-relaxed text-indigo-200/60">{s.d}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </motion.section>

      {/* Company spotlight */}
      <motion.section 
        ref={companiesRef}
        initial="hidden"
        animate={companiesInView ? "visible" : "hidden"}
        variants={staggerContainer}
        className="bg-gradient-to-b from-slate-50/50 to-white px-6 py-24"
      >
        <div className="mx-auto max-w-7xl">
          <motion.div variants={fadeInUp} className="mb-14 flex flex-col items-center justify-between gap-4 md:flex-row">
            <div>
              <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary ring-1 ring-primary/20">Featured employers</span>
              <h2 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">Companies hiring right now</h2>
            </div>
            <Link to="/jobs" className="group inline-flex items-center gap-2 rounded-xl border-2 border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 transition-all hover:border-primary hover:text-primary hover:shadow-lg">
              See all companies <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
          <motion.div variants={staggerContainer} className="grid gap-8 md:grid-cols-3">
            {spotlightCompanies.map((c, i) => (
              <motion.div
                key={c.name}
                variants={cardStagger}
              >
                <div className="group relative overflow-hidden rounded-3xl border-2 border-slate-100 bg-white p-8 transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5">
                  <div className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="flex items-start justify-between">
                    <div className={`grid size-16 place-items-center rounded-2xl bg-gradient-to-br ${c.color} text-xl font-bold text-white shadow-lg shadow-black/10 ring-1 ring-white/20`}>
                      {c.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200/50">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      HIRING
                    </span>
                  </div>
                  <h3 className="mt-6 text-xl font-extrabold tracking-tight text-slate-900">{c.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{c.desc}</p>
                  <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5">
                    <span className="text-sm font-semibold text-slate-500">
                      <span className="text-2xl font-extrabold text-primary">{c.roles}</span> open roles
                    </span>
                    <Link to="/jobs" className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-primary hover:shadow-lg">
                      View <ArrowRight className="size-3" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Success Counter */}
      <motion.section 
        ref={statsRef}
        initial="hidden"
        animate={statsInView ? "visible" : "hidden"}
        variants={staggerContainer}
        className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-indigo-800 to-primary px-6 py-20"
      >
        <div className="pointer-events-none absolute inset-0 parallax-bg">
          <div className="absolute -left-20 top-1/2 size-80 -translate-y-1/2 rounded-full bg-white/5 blur-3xl parallax-bg" />
          <div className="absolute -right-20 top-0 size-60 rounded-full bg-indigo-400/10 blur-3xl parallax-bg" />
        </div>
        <div className="relative mx-auto max-w-5xl">
          <motion.div variants={fadeInUp} className="mb-14 text-center">
            <span className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-indigo-200 ring-1 ring-white/20">Our impact</span>
            <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-white md:text-5xl">Success stories in numbers</h2>
            <p className="mx-auto mt-3 max-w-lg text-indigo-200/70">Real results from real connections made on Bridge.</p>
          </motion.div>
          <motion.div variants={staggerContainer} className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {[
              { value: 48000, label: 'Placements Made', suffix: '+', icon: TrendingUp },
              { value: 200000, label: 'Active Students', suffix: '+', icon: Users },
              { value: 12000, label: 'Partner Companies', suffix: '+', icon: Building2 },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                variants={cardStagger}
              >
                <div className="group relative flex flex-col items-center rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.07] hover:shadow-2xl hover:shadow-indigo-500/10">
                  <div className="mb-5 grid size-14 place-items-center rounded-2xl bg-white/10 text-white ring-1 ring-white/20 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                    <s.icon className="size-6" />
                  </div>
                  <Counter value={s.value} suffix={s.suffix} />
                  <p className="mt-2 text-sm font-medium text-indigo-200/70">{s.label}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Testimonials */}
      <motion.section 
        ref={testimonialsRef}
        initial="hidden"
        animate={testimonialsInView ? "visible" : "hidden"}
        variants={staggerContainer}
        className="relative overflow-hidden bg-gradient-to-b from-white via-indigo-50/30 to-white px-6 py-24"
      >
        <div className="pointer-events-none absolute inset-0 parallax-bg">
          <div className="absolute left-1/2 top-0 size-96 -translate-x-1/2 rounded-full bg-indigo-100/50 blur-3xl parallax-bg" />
          <div className="absolute -bottom-32 right-0 size-80 rounded-full bg-amber-100/30 blur-3xl parallax-bg" />
        </div>
        <div className="relative mx-auto max-w-6xl">
          <motion.div variants={fadeInUp} className="mb-16 text-center">
            <span className="inline-block rounded-full bg-amber-100 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-700 ring-1 ring-amber-200">Wall of love</span>
            <h2 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">Loved by students worldwide</h2>
            <p className="mx-auto mt-3 max-w-lg text-slate-500">Hear from the community that grew their careers through Bridge.</p>
          </motion.div>
          <motion.div variants={staggerContainer} className="grid gap-8 md:grid-cols-3">
            {[
              { n: 'Sarah Jenkins', r: 'Design Intern at CloudScale', q: 'Bridge helped me land my dream internship in less than two weeks. The interface is miles ahead of any other platform.', c: 'from-rose-400 to-orange-400' },
              { n: 'Marcus Lee', r: 'SWE at Nebula Cloud', q: 'Applied to twelve roles in a single afternoon. Got three interviews the same week. Genuinely game-changing.', c: 'from-blue-400 to-indigo-500' },
              { n: 'Priya Shah', r: 'Data Intern at Aether', q: 'The skill-matching is unreal. Every role they surfaced actually fit. No more spray-and-pray.', c: 'from-emerald-400 to-teal-500' },
            ].map((t, i) => (
              <motion.figure
                key={t.n}
                variants={cardStagger}
              >
                {/* Decorative quote mark */}
                <div className="absolute -top-3 left-6 text-5xl font-serif leading-none text-indigo-100 group-hover:text-indigo-200 transition-colors">"</div>
                <div className="mb-4 flex gap-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, k) => (
                    <Star key={k} className="size-4 fill-current" />
                  ))}
                </div>
                <blockquote className="relative text-sm leading-relaxed text-slate-600 group-hover:text-slate-700 transition-colors">"{t.q}"</blockquote>
                <figcaption className="mt-8 flex items-center gap-4 border-t border-slate-100 pt-5">
                  <div className={`grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${t.c} text-base font-bold text-white shadow-md ring-1 ring-white/20`}>
                    {t.n.split(' ').map((w) => w[0]).join('')}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-slate-900">{t.n}</div>
                    <div className="mt-0.5 text-xs text-slate-400">{t.r}</div>
                  </div>
                </figcaption>
              </motion.figure>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* FAQ */}
      <motion.section 
        ref={faqRef}
        initial="hidden"
        animate={faqInView ? "visible" : "hidden"}
        variants={staggerContainer}
        className="mx-auto max-w-3xl px-6 py-24"
      >
        <motion.div variants={fadeInUp} className="mb-12 text-center">
          <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary ring-1 ring-primary/20">FAQ</span>
          <h2 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">Frequently asked questions</h2>
          <p className="mx-auto mt-3 max-w-lg text-slate-500">Everything you need to know about Bridge.</p>
        </motion.div>
        <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border-2 border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-md">
          {faqs.map((f, i) => (
            <FAQItem key={f.q} q={f.q} a={f.a} defaultOpen={i === 0} />
          ))}
        </div>
      </motion.section>

      {/* Final CTA */}
      <motion.section 
        ref={finalCtaRef}
        initial="hidden"
        animate={finalCtaInView ? "visible" : "hidden"}
        variants={staggerContainer}
        className="relative px-6 pb-24"
      >
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center parallax-bg">
          <div className="size-[600px] rounded-full bg-primary/5 blur-3xl parallax-bg" />
        </div>
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-primary to-blue-700 px-8 py-20 text-center text-white shadow-2xl shadow-primary/30 ring-1 ring-white/10">
          <motion.div variants={fadeInScale} className="pointer-events-none absolute -left-20 -top-20 size-60 rounded-full bg-white/10 blur-3xl parallax-bg" />
          <motion.div variants={fadeInScale} className="pointer-events-none absolute -bottom-10 -right-10 size-40 rounded-full bg-indigo-300/20 blur-3xl parallax-bg" />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
          <div className="relative">
            <motion.div variants={fadeInScale} className="mx-auto mb-6 grid size-16 place-items-center rounded-2xl bg-white/15 text-white ring-1 ring-white/20 backdrop-blur-sm">
              <Globe className="size-7" />
            </motion.div>
            <motion.h2 variants={fadeInUp} className="text-4xl font-extrabold tracking-tight md:text-5xl">Ready for your next leap?</motion.h2>
            <motion.p variants={fadeInUp} className="mx-auto mt-4 max-w-xl text-lg text-white/70">
              Join 200,000+ students using Bridge to launch their career.
            </motion.p>
            <motion.div variants={staggerContainer} className="mt-10 flex flex-wrap justify-center gap-4">
              <Link to="/signup">
                <motion.div variants={fadeInScale}>
                  <Button size="lg" className="rounded-xl bg-white px-10 py-7 text-base font-bold text-primary shadow-xl transition-all duration-200 hover:scale-105 hover:bg-white hover:shadow-2xl active:scale-[0.98]">
                    Create free account
                  </Button>
                </motion.div>
              </Link>
              <Link to="/jobs">
                <motion.div variants={fadeInScale}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-xl border-2 border-white/30 bg-white/5 px-10 py-7 text-base font-bold text-white shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-white/10 hover:border-white/50 active:scale-[0.98]"
                  >
                    Browse roles
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
            <motion.div variants={fadeInUp} className="mt-12 flex items-center justify-center gap-8 text-xs text-white/40">
              <span>No credit card required</span>
              <span className="h-3 w-px bg-white/20" />
              <span>Free forever for students</span>
              <span className="h-3 w-px bg-white/20" />
              <span>2-minute signup</span>
            </motion.div>
          </div>
        </div>
      </motion.section>
    </SiteLayout>
  )
}
