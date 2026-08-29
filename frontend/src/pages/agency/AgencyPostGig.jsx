import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Plus, X, FileText, Rocket, Target, DollarSign, MapPin, Award,
  MessageCircle, ChevronDown, ChevronUp, AlertTriangle, Check, Clock
} from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

const GIG_TYPES = ['Project-based', 'Part-time', 'Full-time', 'Contract']
const WORK_MODES = ['Remote', 'Hybrid', 'On-site']
const EXPERIENCE_LEVELS = ['Fresher', 'Intermediate', 'Expert']
const DURATIONS = ['1-2 weeks', '1 month', '2-3 months', '3-6 months', '6+ months', 'Long-term']
const PAYMENT_OPTIONS = ['After completion', 'Weekly', 'Bi-weekly', 'Monthly', 'Milestone-based']

const sections = [
  { key: 'basic', icon: FileText, label: 'Basic Information', desc: 'Title, description & work type', color: 'indigo' },
  { key: 'details', icon: Target, label: 'Project Details', desc: 'Duration, experience & timeline', color: 'violet' },
  { key: 'budget', icon: DollarSign, label: 'Budget & Payment', desc: 'Budget, type & schedule', color: 'emerald' },
  { key: 'requirements', icon: Award, label: 'Skills & Requirements', desc: 'Skills, tools & qualifications', color: 'amber' },
  { key: 'screening', icon: MessageCircle, label: 'Screening Questions', desc: 'Custom questions for applicants', color: 'cyan' },
]

export default function AgencyPostGig() {
  const navigate = useNavigate()
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const editGigId = searchParams.get('id')
  const { user, agency } = useAuth()
  
  const [submitting, setSubmitting] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    basic: true, details: true, budget: true, requirements: true, screening: true
  })
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [gigType, setGigType] = useState('Project-based')
  const [workMode, setWorkMode] = useState('Remote')
  const [locationVal, setLocationVal] = useState('')
  const [duration, setDuration] = useState('')
  const [budget, setBudget] = useState('')
  const [budgetType, setBudgetType] = useState('fixed')
  const [paymentSchedule, setPaymentSchedule] = useState('')
  const [skills, setSkills] = useState([])
  const [newSkill, setNewSkill] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('Fresher')
  const [startDate, setStartDate] = useState('')
  const [deadline, setDeadline] = useState('')
  const [portfolioRequired, setPortfolioRequired] = useState(false)
  const [ownEquipment, setOwnEquipment] = useState('')
  const [longTermPossible, setLongTermPossible] = useState(false)
  const [screeningQuestions, setScreeningQuestions] = useState([{ question: '', required: true }])
  
  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  useEffect(() => {
    if (editGigId) {
      api.get(`/api/opportunities/${editGigId}`).then(res => {
        const opportunity = res.opportunity || res.gig
        setTitle(opportunity.title || '')
        setDescription(opportunity.description || '')
        setGigType(opportunity.opportunityType || 'Project-based')
        setWorkMode(opportunity.mode || 'Remote')
        setLocationVal(opportunity.location || '')
        setDuration(opportunity.duration || '')
        setBudget(opportunity.budget || '')
        setBudgetType(opportunity.budgetType || 'fixed')
        setPaymentSchedule(opportunity.paymentSchedule || '')
        setSkills(opportunity.skills || [])
        setExperienceLevel(opportunity.experienceLevel || 'Fresher')
        setStartDate(opportunity.startDate ? opportunity.startDate.split('T')[0] : '')
        setDeadline(opportunity.deadline ? opportunity.deadline.split('T')[0] : '')
        setPortfolioRequired(opportunity.portfolioRequired || false)
        setOwnEquipment(opportunity.ownEquipment || '')
        setLongTermPossible(opportunity.longTermPossible || false)
        setScreeningQuestions(opportunity.screeningQuestions || [{ question: '', required: true }])
      }).catch(() => toast.error('Failed to load gig'))
    }
  }, [editGigId])

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()])
      setNewSkill('')
    }
  }

  const removeSkill = (skill) => {
    setSkills(skills.filter(s => s !== skill))
  }

  const addQuestion = () => {
    setScreeningQuestions([...screeningQuestions, { question: '', required: true }])
  }

  const updateQuestion = (idx, value) => {
    setScreeningQuestions(screeningQuestions.map((q, i) => 
      i === idx ? { ...q, question: value } : q
    ))
  }

  const removeQuestion = (idx) => {
    if (screeningQuestions.length > 1) {
      setScreeningQuestions(screeningQuestions.filter((_, i) => i !== idx))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!agency?.isProfileComplete) {
      toast.error('Please complete your agency profile first')
      navigate('/agency/profile')
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        gigType, workMode, location: locationVal.trim(),
        duration, budget: budget ? Number(budget) : undefined,
        budgetType, paymentSchedule, skills, experienceLevel,
        startDate: startDate || undefined, deadline: deadline || undefined,
        portfolioRequired, ownEquipment, longTermPossible,
        screeningQuestions: screeningQuestions.filter(q => q.question.trim()),
      }
      if (editGigId) {
        await api.put(`/api/opportunities/${editGigId}`, payload)
        toast.success('Gig updated successfully!')
      } else {
        await api.post('/api/opportunities', payload)
        toast.success('Gig posted successfully!')
      }
      navigate('/agency/postings')
    } catch (err) {
      toast.error(err.message || 'Could not post gig')
    } finally {
      setSubmitting(false)
    }
  }

  const canPost = agency?.isProfileComplete
  const activeSection = sections.find(s => expandedSections[s.key])
  const progressWidth = ((sections.findIndex(s => s.key === activeSection?.key) + 1) / sections.length) * 100

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-6">

        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 sm:p-8 shadow-sm">
          <div className="absolute top-0 right-0 size-48 rounded-full bg-primary/[0.03] blur-3xl" />
          <div className="relative flex items-center gap-4">
            <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-primary/10">
              <Rocket className="size-7 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-extrabold sm:text-3xl text-slate-900">
                {editGigId ? 'Edit Gig / Project' : 'Post New Gig / Project'}
              </h1>
              <p className="mt-1 text-sm text-slate-500 max-w-xl">
                {editGigId
                  ? 'Update your gig details to attract the right talent'
                  : 'Create a compelling gig to find the perfect freelancer or contractor'}
              </p>
            </div>
          </div>
        </div>

        {!canPost && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 flex items-center gap-3">
            <AlertTriangle className="size-5 text-amber-600 shrink-0" />
            <span className="text-sm font-semibold text-amber-800">Complete your agency profile to post gigs</span>
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              {sections.map((s, idx) => {
                const isExpanded = expandedSections[s.key]
                const isPast = sections.findIndex(x => expandedSections[x.key]) > idx
                return (
                  <button key={s.key} onClick={() => toggleSection(s.key)}
                    className={'grid size-7 place-items-center rounded-lg text-xs font-bold transition-all ' +
                      (isExpanded ? 'bg-primary text-white shadow-sm' 
                        : isPast ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200')
                    }>
                    {isPast ? <Check className="size-3.5" /> : idx + 1}
                  </button>
                )
              })}
            </div>
            <span className="text-xs font-medium text-slate-500">{sections.findIndex(s => expandedSections[s.key]) + 1} of {sections.length}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-100">
            <div className="h-1.5 rounded-full bg-primary transition-all duration-300" style={{ width: `${progressWidth}%` }} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {sections.map((s) => {
            const expanded = expandedSections[s.key]
            return (
              <div key={s.key} className={'rounded-2xl border bg-white overflow-hidden shadow-sm transition-all hover:shadow-md ' + (expanded ? 'border-slate-200' : 'border-slate-200/60')}>
                <button type="button" onClick={() => toggleSection(s.key)}
                  className={'w-full flex items-center justify-between p-5 transition-colors ' + (expanded ? 'border-b border-slate-100' : 'hover:bg-slate-50')}>
                  <div className="flex items-center gap-3">
                    <div className={'grid size-10 place-items-center rounded-xl ' + (
                      s.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' 
                        : s.color === 'violet' ? 'bg-violet-50 text-violet-600'
                        : s.color === 'emerald' ? 'bg-emerald-50 text-emerald-600'
                        : s.color === 'amber' ? 'bg-amber-50 text-amber-600'
                        : 'bg-cyan-50 text-cyan-600'
                    )}>
                      <s.icon className="size-5" />
                    </div>
                    <div className="text-left">
                      <h2 className="text-sm font-bold text-slate-800">{s.label}</h2>
                      <p className="text-xs text-slate-500">{s.desc}</p>
                    </div>
                  </div>
                  <div className={'grid size-7 place-items-center rounded-lg text-xs transition-all ' + (expanded ? 'bg-slate-100 text-slate-600' : 'bg-transparent text-slate-300')}>
                    {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  </div>
                </button>
                
                {expanded && (
                  <div className="p-6 space-y-5">
                    {s.key === 'basic' && (
                      <>
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-600">Project Title <span className="text-rose-500">*</span></label>
                          <input value={title} onChange={e => setTitle(e.target.value)}
                            placeholder="e.g. Build e-commerce website for client ABC"
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:shadow-sm"
                            disabled={!canPost} />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-600">Description <span className="text-rose-500">*</span></label>
                          <textarea rows={5} value={description} onChange={e => setDescription(e.target.value)}
                            placeholder="Describe the project scope, deliverables, timeline..."
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:shadow-sm resize-none"
                            disabled={!canPost} />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <select value={gigType} onChange={e => setGigType(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20" disabled={!canPost}>
                            {GIG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <select value={workMode} onChange={e => setWorkMode(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20" disabled={!canPost}>
                            {WORK_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-600">Location</label>
                          <div className="relative">
                            <MapPin className="absolute left-3.5 top-3.5 size-4 text-slate-400" />
                            <input value={locationVal} onChange={e => setLocationVal(e.target.value)}
                              placeholder="e.g. Mumbai, Remote, or Client Location"
                              className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:shadow-sm"
                              disabled={!canPost} />
                          </div>
                        </div>
                      </>
                    )}

                    {s.key === 'details' && (
                      <>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Duration</label>
                            <select value={duration} onChange={e => setDuration(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20" disabled={!canPost}>
                              <option value="">Select duration</option>
                              {DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Experience Level</label>
                            <select value={experienceLevel} onChange={e => setExperienceLevel(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20" disabled={!canPost}>
                              {EXPERIENCE_LEVELS.map(e => <option key={e} value={e}>{e}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Start Date</label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20" disabled={!canPost} />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Application Deadline</label>
                            <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20" disabled={!canPost} />
                          </div>
                        </div>
                        <label className="relative flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 cursor-pointer transition-all hover:border-slate-200 hover:bg-slate-100/50">
                          <input type="checkbox" checked={longTermPossible} onChange={e => setLongTermPossible(e.target.checked)} disabled={!canPost}
                            className="size-4 rounded border-slate-300 text-primary focus:ring-primary/30" />
                          <div>
                            <span className="text-sm font-semibold text-slate-700">Long-term collaboration possible</span>
                            <p className="text-xs text-slate-400">Indicate if this could lead to ongoing work</p>
                          </div>
                        </label>
                      </>
                    )}

                    {s.key === 'budget' && (
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-600">Budget Amount</label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-3 text-sm text-slate-400 font-medium">₹</span>
                            <input type="number" value={budget} onChange={e => setBudget(e.target.value)}
                              placeholder="0" className="w-full rounded-xl border border-slate-200 pl-8 pr-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:shadow-sm" disabled={!canPost} />
                          </div>
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-600">Budget Type</label>
                          <select value={budgetType} onChange={e => setBudgetType(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20" disabled={!canPost}>
                            <option value="fixed">Fixed Price</option>
                            <option value="hourly">Hourly Rate</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-600">Payment Schedule</label>
                          <select value={paymentSchedule} onChange={e => setPaymentSchedule(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20" disabled={!canPost}>
                            <option value="">Select schedule</option>
                            {PAYMENT_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                      </div>
                    )}

                    {s.key === 'requirements' && (
                      <>
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-600">Required Skills</label>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {skills.map((skill, i) => (
                              <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 shadow-sm transition-all hover:shadow-md">
                                {skill}
                                <button type="button" onClick={() => removeSkill(skill)} className="grid size-4 place-items-center rounded-full bg-slate-200/50 text-slate-500 hover:bg-rose-200 hover:text-rose-600 transition-colors"><X className="size-2.5" /></button>
                              </span>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <input value={newSkill} onChange={e => setNewSkill(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                              placeholder="Type a skill and press Enter"
                              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:shadow-sm"
                              disabled={!canPost} />
                            <Button type="button" onClick={addSkill} disabled={!canPost} size="sm" className="rounded-xl bg-primary text-white shadow-sm hover:bg-primary/90 hover:shadow-md">
                              <Plus className="size-4" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-600">Equipment / Software Required</label>
                          <input value={ownEquipment} onChange={e => setOwnEquipment(e.target.value)}
                            placeholder="e.g. Adobe Premiere Pro, DSLR Camera, Figma"
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:shadow-sm"
                            disabled={!canPost} />
                        </div>
                        <label className="relative flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 cursor-pointer transition-all hover:border-slate-200 hover:bg-slate-100/50">
                          <input type="checkbox" checked={portfolioRequired} onChange={e => setPortfolioRequired(e.target.checked)} disabled={!canPost}
                            className="size-4 rounded border-slate-300 text-primary focus:ring-primary/30" />
                          <div>
                            <span className="text-sm font-semibold text-slate-700">Portfolio / Work samples required</span>
                            <p className="text-xs text-slate-400">Applicants must submit a portfolio with their application</p>
                          </div>
                        </label>
                      </>
                    )}

                    {s.key === 'screening' && (
                      <div className="space-y-3">
                        {screeningQuestions.map((q, idx) => (
                          <div key={idx} className="flex gap-3 items-center">
                            <div className={'grid size-7 shrink-0 place-items-center rounded-lg text-xs font-bold ' + (idx === 0 ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500')}>
                              {idx + 1}
                            </div>
                            <input value={q.question} onChange={e => updateQuestion(idx, e.target.value)}
                              placeholder={`Enter question ${idx + 1}`}
                              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:shadow-sm"
                              disabled={!canPost} />
                            {screeningQuestions.length > 1 && (
                              <button type="button" onClick={() => removeQuestion(idx)} 
                                className="grid size-7 place-items-center rounded-lg text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-500 transition-all">
                                <X className="size-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button type="button" onClick={addQuestion} disabled={!canPost}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/5 px-4 py-2 rounded-xl hover:bg-primary/10 transition-all">
                          <Plus className="size-3" /> Add Question
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Rocket className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Ready to publish?</p>
                  <p className="text-xs text-slate-500">Review your details before posting</p>
                </div>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <Button type="button" variant="outline" onClick={() => navigate('/agency/dashboard')} disabled={submitting} 
                  className="flex-1 sm:flex-initial rounded-xl border-slate-200 hover:border-slate-300 hover:bg-slate-50">
                  Cancel
                </Button>
                <Button type="submit" disabled={!canPost || submitting}
                  className="flex-1 sm:flex-initial rounded-xl bg-primary px-8 font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow transition-all">
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      Posting...
                    </span>
                  ) : editGigId ? 'Update Gig' : (
                    <span className="flex items-center gap-2">
                      <Rocket className="size-4" /> Post Gig
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
