import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Plus, Check, ChevronDown, Award } from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api } from '@/lib/api'

const COMMON_SKILLS = [
  'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'Java', 'C++', 'Go',
  'SQL', 'MongoDB', 'AWS', 'Docker', 'Git', 'REST API', 'GraphQL', 'CSS',
  'HTML', 'Figma', 'UI/UX', 'Product Management', 'Data Analysis', 'Machine Learning',
  'Communication', 'Leadership', 'Project Management', 'Marketing', 'Sales',
]

export default function Post() {
  const navigate = useNavigate()
  const [kind, setKind] = useState('job')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [mode, setMode] = useState('')
  const [category, setCategory] = useState('')
  const [vacancies, setVacancies] = useState(1)
  const [deadline, setDeadline] = useState('')
  const [skills, setSkills] = useState([])
  const [newSkill, setNewSkill] = useState('')
  const [benefits, setBenefits] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Job-specific
  const [salaryMin, setSalaryMin] = useState(0)
  const [salaryMax, setSalaryMax] = useState(20)
  const [employmentType, setEmploymentType] = useState('')
  const [experience, setExperience] = useState('')
  const [qualifications, setQualifications] = useState([])
  const [minimumEducation, setMinimumEducation] = useState('')
  const [certificationsRequired, setCertificationsRequired] = useState([])
  const [noticePeriod, setNoticePeriod] = useState('')
  const [shiftTiming, setShiftTiming] = useState('')
  const [interviewProcess, setInterviewProcess] = useState('')
  const [joiningTimeline, setJoiningTimeline] = useState('')

  // Internship-specific
  const [stipend, setStipend] = useState(0)
  const [duration, setDuration] = useState('')
  const [internshipType, setInternshipType] = useState('')

  // Internship-specific extended fields
  const [startDate, setStartDate] = useState('')
  const [hasPPO, setHasPPO] = useState(false)
  const [goodToHaveSkills, setGoodToHaveSkills] = useState([])
  const [roles, setRoles] = useState([])
  const [learningOutcomes, setLearningOutcomes] = useState([])
  const [perks, setPerks] = useState([])
  const [yearOfStudy, setYearOfStudy] = useState('')
  const [ageLimit, setAgeLimit] = useState('')
  const [degreeRequired, setDegreeRequired] = useState('')
  const [laptopRequired, setLaptopRequired] = useState('')
  const [screeningProcess, setScreeningProcess] = useState('')
  const [cohortStartDate, setCohortStartDate] = useState('')
  const [minCGPA, setMinCGPA] = useState('')
  const [noBacklogs, setNoBacklogs] = useState(false)
  const [weeklyHours, setWeeklyHours] = useState('')
  const [applicationFee, setApplicationFee] = useState('none')

  const suggestRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (suggestRef.current && !suggestRef.current.contains(e.target)) setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const addSkill = (s) => {
    const trimmed = (s || newSkill).trim()
    if (trimmed && !skills.includes(trimmed)) {
      setSkills(p => [...p, trimmed])
      setNewSkill('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title || !description || !location || !mode || !category) {
      return toast.error('Please fill all required fields')
    }
    setSubmitting(true)
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        mode,
        category,
        vacancies: Number(vacancies) || 1,
        deadline: deadline || undefined,
        skills,
        benefits: benefits ? benefits.split(',').map(s => s.trim()).filter(Boolean) : [],
      }
      if (kind === 'job') {
        payload.salaryMin = salaryMin * 100000 || undefined
        payload.salaryMax = salaryMax * 100000 || undefined
        payload.employmentType = employmentType
        payload.experience = experience
        payload.goodToHaveSkills = goodToHaveSkills
        payload.roles = roles
        payload.qualifications = qualifications
        payload.minimumEducation = minimumEducation || undefined
        payload.certificationsRequired = certificationsRequired
        payload.noticePeriod = noticePeriod || undefined
        payload.shiftTiming = shiftTiming || undefined
        payload.interviewProcess = interviewProcess || undefined
        payload.joiningTimeline = joiningTimeline || undefined
      } else {
payload.stipend = Number(stipend) || undefined
         payload.duration = duration || undefined
         payload.internshipType = internshipType || undefined
         payload.startDate = startDate || undefined
         payload.hasPPO = hasPPO || false
        payload.goodToHaveSkills = goodToHaveSkills
        payload.roles = roles
        payload.learningOutcomes = learningOutcomes
        payload.perks = perks
        if (yearOfStudy || ageLimit || minCGPA || noBacklogs) {
          payload.eligibility = {
            yearOfStudy: yearOfStudy || undefined,
            ageLimit: ageLimit || undefined,
            minCGPA: minCGPA || undefined,
            noBacklogs: noBacklogs || undefined,
          }
        }
        payload.degreeRequired = degreeRequired || undefined
        payload.laptopRequired = laptopRequired || undefined
        payload.screeningProcess = screeningProcess || undefined
        payload.cohortStartDate = cohortStartDate || undefined
        payload.weeklyHours = Number(weeklyHours) || undefined
        payload.applicationFee = applicationFee || undefined
      }
      const endpoint = kind === 'job' ? '/api/jobs' : '/api/internships'
      await api.post(endpoint, payload)
      toast.success(`${kind === 'job' ? 'Job' : 'Internship'} posted successfully!`)
      navigate('/company/dashboard')
    } catch (err) {
      if (err.data?.needsProfileSetup) {
        toast.error('Please complete your company profile first')
        navigate('/company/signup?step=2', { replace: true })
      } else {
        toast.error(err.message || 'Could not save posting')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">Post New</h1>
          <p className="mt-1 text-slate-500">Create a job or internship listing to reach thousands of candidates.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <h2 className="font-bold text-lg">Type & Basic Info</h2>
            <div className="flex gap-2 rounded-xl bg-slate-100 p-1 w-fit">
              {['job', 'internship'].map(t => (
                <button key={t} type="button" onClick={() => setKind(t)}
                  className={`rounded-lg px-5 py-2 text-sm font-bold transition-colors ${kind === t ? 'bg-white text-foreground shadow-sm' : 'text-slate-500 hover:text-foreground'}`}
                >{t === 'job' ? '💼 Job' : '🎓 Internship'}</button>
              ))}
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder={kind === 'job' ? 'e.g. Senior Backend Engineer' : 'e.g. Frontend Intern'} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Description *</label>
              <textarea rows={5} value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the role, responsibilities, and requirements..." className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Location *</label>
                <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Bangalore, IN" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Work Mode *</label>
                <select value={mode} onChange={e => setMode(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary bg-white">
                  <option value="">Select...</option>
                  {['Remote', 'Hybrid', 'On-site'].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Category *</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary bg-white">
                  <option value="">Select...</option>
                  {['Engineering', 'Design', 'Marketing', 'Data', 'Sales', 'Product', 'Finance', 'HR'].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Number of Openings</label>
                <input type="number" min={1} value={vacancies} onChange={e => setVacancies(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <h2 className="font-bold text-lg">Compensation & Details</h2>
            {kind === 'job' ? (
              <>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Salary Range (LPA)</label>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-600 w-8">₹{salaryMin}L</span>
                    <input type="range" min={0} max={50} step={1} value={salaryMin} onChange={e => setSalaryMin(Number(e.target.value))} className="flex-1 accent-primary" />
                    <span className="text-xs text-slate-400">to</span>
                    <input type="range" min={1} max={100} step={1} value={salaryMax} onChange={e => setSalaryMax(Math.max(Number(e.target.value), salaryMin + 1))} className="flex-1 accent-primary" />
                    <span className="text-sm font-semibold text-slate-600 w-8">₹{salaryMax}L</span>
                  </div>
                  <div className="mt-1 text-center text-sm font-bold text-primary">
                    ₹{salaryMin} LPA – ₹{salaryMax} LPA
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Employment Type</label>
                    <select value={employmentType} onChange={e => setEmploymentType(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary bg-white">
                      <option value="">Select...</option>
                      {['Full-time', 'Part-time', 'Contract'].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Experience Required</label>
                    <select value={experience} onChange={e => setExperience(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary bg-white">
                      <option value="">Select...</option>
                      {['Fresher', '1-2 years', '3-5 years', '5+ years'].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Job Details</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Minimum Education</label>
                      <input value={minimumEducation} onChange={e => setMinimumEducation(e.target.value)} placeholder="e.g. B.Tech, BCA, Any Graduate" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Notice Period</label>
                      <select value={noticePeriod} onChange={e => setNoticePeriod(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary bg-white">
                        <option value="">Select...</option>
                        {['Immediate', '15 days', '30 days', '45 days', '60 days', '90 days'].map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Shift Timing</label>
                      <input value={shiftTiming} onChange={e => setShiftTiming(e.target.value)} placeholder="e.g. Day shift, Night shift, Rotational" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Joining Timeline</label>
                      <input value={joiningTimeline} onChange={e => setJoiningTimeline(e.target.value)} placeholder="e.g. Within 30 days, Immediate" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Interview Process</label>
                      <input value={interviewProcess} onChange={e => setInterviewProcess(e.target.value)} placeholder="e.g. 2 technical rounds + 1 HR round" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Good-to-have Skills (comma separated)</label>
                      <input value={goodToHaveSkills.join(', ')} onChange={e => setGoodToHaveSkills(e.target.value.split(',').map(s => s.trim()).filter(Boolean))} placeholder="e.g. AWS, Docker, Kubernetes" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Roles & Responsibilities (one per line)</label>
                      <textarea rows={3} value={roles.join('\n')} onChange={e => setRoles(e.target.value.split('\n').map(s => s.trim()).filter(Boolean))} placeholder="Lead development of new features&#10;Collaborate with cross-functional teams&#10;Code review and mentoring" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Qualifications / Requirements (one per line)</label>
                      <textarea rows={3} value={qualifications.join('\n')} onChange={e => setQualifications(e.target.value.split('\n').map(s => s.trim()).filter(Boolean))} placeholder="Bachelor's degree in Computer Science&#10;3+ years of experience in React&#10;Strong problem-solving skills" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Certifications Required (comma separated)</label>
                      <input value={certificationsRequired.join(', ')} onChange={e => setCertificationsRequired(e.target.value.split(',').map(s => s.trim()).filter(Boolean))} placeholder="e.g. AWS Certified, PMP, Google Cloud" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Monthly Stipend (₹)</label>
                  <input type="number" value={stipend} onChange={e => setStipend(e.target.value)} placeholder="e.g. 15000" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
                  <div className="mt-2">
                    <input type="range" min={0} max={100000} step={5000} value={stipend} onChange={e => setStipend(Number(e.target.value))} className="w-full accent-primary" />
                    <div className="text-center text-sm font-bold text-primary">₹{Number(stipend).toLocaleString()}/month</div>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Duration</label>
                  <input value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g. 3 months, 6 months" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
                </div>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Application Deadline</label>
                <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Benefits (comma separated)</label>
                <input value={benefits} onChange={e => setBenefits(e.target.value)} placeholder="e.g. Health insurance, Remote-first, Stock options" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
              </div>
            </div>
          </div>

          {/* Internship-specific extended fields */}
          {kind === 'internship' && (
            <>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
                <h2 className="font-bold text-lg">Internship Details</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Internship Type</label>
                    <select value={internshipType} onChange={e => setInternshipType(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary bg-white">
                      <option value="">Full-time (default)</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Start Date</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                      <input type="checkbox" checked={hasPPO} onChange={e => setHasPPO(e.target.checked)} className="size-4 rounded border-slate-300" />
                      <Award className="size-4 text-emerald-500" /> PPO Available
                    </label>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
                <h2 className="font-bold text-lg">Eligibility Criteria</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Year of Study</label>
                    <select value={yearOfStudy} onChange={e => setYearOfStudy(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary bg-white">
                      <option value="">Any year</option>
                      {['1st year', '2nd year', '3rd year', '4th year', 'Final year', 'Graduate', 'Postgraduate'].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Age Limit</label>
                    <input value={ageLimit} onChange={e => setAgeLimit(e.target.value)} placeholder="e.g. 20-25 years" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Degree / Stream Required</label>
                    <input value={degreeRequired} onChange={e => setDegreeRequired(e.target.value)} placeholder="e.g. B.Tech CSE, Any Graduate" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Min. CGPA</label>
                    <input value={minCGPA} onChange={e => setMinCGPA(e.target.value)} placeholder="e.g. 7.5" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                      <input type="checkbox" checked={noBacklogs} onChange={e => setNoBacklogs(e.target.checked)} className="size-4 rounded border-slate-300" />
                      No active backlogs allowed
                    </label>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
                <h2 className="font-bold text-lg">Additional Details</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Device Required (if remote)</label>
                    <input value={laptopRequired} onChange={e => setLaptopRequired(e.target.value)} placeholder="e.g. Own laptop required" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Screening Process</label>
                    <input value={screeningProcess} onChange={e => setScreeningProcess(e.target.value)} placeholder="e.g. Assignment + Interview" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Cohort Start Date (if batch-based)</label>
                    <input type="date" value={cohortStartDate} onChange={e => setCohortStartDate(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Weekly Hours Commitment</label>
                    <input value={weeklyHours} onChange={e => setWeeklyHours(e.target.value)} placeholder="e.g. 10 hrs/week" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Application Fee</label>
                    <select value={applicationFee} onChange={e => setApplicationFee(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary bg-white">
                      <option value="none">No fee (free to apply)</option>
                      <option value="paid">Has application fee</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <h2 className="font-bold text-lg">Required Skills</h2>
            <div className="flex flex-wrap gap-2">
              {skills.map(s => (
                <span key={s} className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  {s}
                  <button type="button" onClick={() => setSkills(p => p.filter(x => x !== s))}>
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="relative" ref={suggestRef}>
              <div className="flex gap-2">
                <input value={newSkill} onChange={e => { setNewSkill(e.target.value); setShowSuggestions(true) }}
                  onFocus={() => setShowSuggestions(true)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  placeholder="Type a skill and press Enter" className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary" />
                <button type="button" onClick={() => addSkill()} className="rounded-lg bg-primary px-3 text-primary-foreground hover:bg-primary/90">
                  <Plus className="size-4" />
                </button>
              </div>
              {showSuggestions && (
                <div className="absolute z-10 mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-lg max-h-48 overflow-y-auto">
                  <p className="px-2 py-1 text-xs font-bold text-slate-400 uppercase">Suggestions</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {COMMON_SKILLS.filter(s => !skills.includes(s) && s.toLowerCase().includes(newSkill.toLowerCase())).slice(0, 15).map(s => (
                      <button key={s} type="button" onClick={() => { addSkill(s); setShowSuggestions(false) }}
                        className="rounded-md px-2 py-1 text-xs font-semibold bg-slate-100 hover:bg-primary/10 hover:text-primary text-slate-600 transition-colors"
                      >{s}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => navigate('/company/dashboard')}
              className="rounded-xl border border-slate-200 bg-white px-6 py-3 font-bold text-slate-600 hover:border-primary hover:text-primary transition-colors"
            >Cancel</button>
            <button type="submit" disabled={submitting}
              className="rounded-xl bg-primary px-8 py-3 font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >{submitting ? 'Posting...' : `Post ${kind === 'job' ? 'Job' : 'Internship'}`}</button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
