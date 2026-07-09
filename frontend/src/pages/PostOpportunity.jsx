import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Plus, AlertTriangle, X, Check, ArrowLeft, Trash2
} from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

const OPPORTUNITY_TYPES = ['Project-based', 'Part-time', 'Full-time']
const EXPERIENCE_LEVELS = ['Fresher', 'Intermediate', 'Expert']
const PAYMENT_SCHEDULES = ['After completion', 'Weekly', 'Bi-weekly', 'Monthly', 'Milestone-based']
const DURATIONS = ['1 month', '4 months', '6 months', '1 year', 'Long-term']
const MODES = ['Remote', 'Hybrid', 'On-site']

export default function PostOpportunity() {
  const navigate = useNavigate()
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const editOpportunityId = searchParams.get('id')
  const { user } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [canPost, setCanPost] = useState(true)
  const [existingOpp, setExistingOpp] = useState(null)

  useEffect(() => {
    if (user && !user.isIdVerified) {
      setCanPost(false)
    }
    if (editOpportunityId) {
      api.get(`/api/opportunities/${editOpportunityId}`).then(res => {
        const opp = res.opportunity
        setExistingOpp(opp)
        setTitle(opp.title || '')
        setDescription(opp.description || '')
        setOpportunityType(opp.opportunityType || 'Project-based')
        setRole(opp.role || '')
        setPeopleNeeded(opp.peopleNeeded || 1)
        setLocationVal(opp.location || '')
        setMode(opp.mode || 'Remote')
        setBudget(opp.budget || '')
        setBudgetType(opp.budgetType || 'fixed')
        setDuration(opp.duration || '')
        setStartDate(opp.startDate ? opp.startDate.split('T')[0] : '')
        setDeadline(opp.deadline ? opp.deadline.split('T')[0] : '')
        setSkills(opp.skills || [])
        setTools(opp.tools || [])
        setGoodToHaveSkills(opp.goodToHaveSkills || [])
        setScope(opp.scope || [])
        setExperienceLevel(opp.experienceLevel || 'Fresher')
        setPortfolioRequired(opp.portfolioRequired || false)
        setWeeklyHours(opp.weeklyHours || '')
        setOwnEquipment(opp.ownEquipment || '')
        setLongTermPossible(opp.longTermPossible || false)
        setPaymentSchedule(opp.paymentSchedule || '')
        setScreeningProcess(opp.screeningProcess || '')
        setScreeningQuestions(opp.screeningQuestions || [{ question: '', required: true }])
        setRolesNeeded(opp.rolesNeeded || [])
      }).catch(() => {})
    }
  }, [user, editOpportunityId])

  // ── Form state ──
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [opportunityType, setOpportunityType] = useState('Project-based')
  const [role, setRole] = useState('')
  const [peopleNeeded, setPeopleNeeded] = useState(1)
  const [locationVal, setLocationVal] = useState('')
  const [mode, setMode] = useState('Remote')
  const [budget, setBudget] = useState('')
  const [budgetType, setBudgetType] = useState('fixed')
  const [duration, setDuration] = useState('')
  const [startDate, setStartDate] = useState('')
  const [deadline, setDeadline] = useState('')
  const [skills, setSkills] = useState([])
  const [newSkill, setNewSkill] = useState('')
  const [tools, setTools] = useState([])
  const [newTool, setNewTool] = useState('')
  const [goodToHaveSkills, setGoodToHaveSkills] = useState([])
  const [newGoodSkill, setNewGoodSkill] = useState('')
  const [scope, setScope] = useState([])
  const [newScope, setNewScope] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('Fresher')
  const [portfolioRequired, setPortfolioRequired] = useState(false)
  const [weeklyHours, setWeeklyHours] = useState('')
  const [ownEquipment, setOwnEquipment] = useState('')
  const [longTermPossible, setLongTermPossible] = useState(false)
  const [paymentSchedule, setPaymentSchedule] = useState('')
  const [screeningProcess, setScreeningProcess] = useState('')
  const [screeningQuestions, setScreeningQuestions] = useState([{ question: '', required: true }])
  const [rolesNeeded, setRolesNeeded] = useState([])
  const [newRoleTitle, setNewRoleTitle] = useState('')
  const [newRoleCount, setNewRoleCount] = useState(1)

  // ── Add/Remove helpers ──
  const addSkill = () => {
    const s = newSkill.trim()
    if (s && !skills.includes(s)) { setSkills(p => [...p, s]); setNewSkill('') }
  }
  const removeSkill = (s) => setSkills(p => p.filter(x => x !== s))

  const addTool = () => {
    const t = newTool.trim()
    if (t && !tools.includes(t)) { setTools(p => [...p, t]); setNewTool('') }
  }
  const removeTool = (t) => setTools(p => p.filter(x => x !== t))

  const addGoodSkill = () => {
    const s = newGoodSkill.trim()
    if (s && !goodToHaveSkills.includes(s)) { setGoodToHaveSkills(p => [...p, s]); setNewGoodSkill('') }
  }
  const removeGoodSkill = (s) => setGoodToHaveSkills(p => p.filter(x => x !== s))

  const addScopeItem = () => {
    const item = newScope.trim()
    if (item && !scope.includes(item)) { setScope(p => [...p, item]); setNewScope('') }
  }
  const removeScopeItem = (i) => setScope(p => p.filter(x => x !== i))

  const addRole = () => {
    const title = newRoleTitle.trim()
    if (title && newRoleCount > 0) {
      setRolesNeeded(p => [...p, { title, count: Number(newRoleCount) }])
      setNewRoleTitle('')
      setNewRoleCount(1)
    }
  }
  const removeRole = (idx) => setRolesNeeded(p => p.filter((_, i) => i !== idx))

  const addQuestion = () => setScreeningQuestions(p => [...p, { question: '', required: true }])
  const updateQuestion = (idx, val) => setScreeningQuestions(p => { const n = [...p]; n[idx].question = val; return n })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canPost) {
      toast.error('ID verification required to post opportunities')
      navigate('/profile?tab=verification')
      return
    }
    if (!title || !description) {
      return toast.error('Title and description are required')
    }

    setSubmitting(true)
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        opportunityType,
        role: role.trim(),
        peopleNeeded: Number(peopleNeeded) || 1,
        location: locationVal.trim(),
        mode,
        budget: budget ? Number(budget) : undefined,
        budgetType,
        duration,
        startDate: startDate || undefined,
        deadline: deadline || undefined,
        skills,
        tools,
        goodToHaveSkills,
        scope,
        experienceLevel,
        portfolioRequired,
        weeklyHours,
        ownEquipment,
        longTermPossible,
        paymentSchedule,
        screeningProcess,
        screeningQuestions: screeningQuestions.filter(q => q.question.trim()),
        rolesNeeded,
      }

      const res = await api.post('/api/opportunities', payload)
      toast.success('Opportunity posted successfully!')
      navigate(`/opportunity/${res.opportunity._id}`)
    } catch (err) {
      if (err.message?.includes('Complete at least 80%')) {
        const match = err.message.match(/currently (\d+)%/)
        toast.error(err.message || 'Complete at least 80% of your profile to post')
      } else if (err.message?.includes('ID verification')) {
        setCanPost(false)
        toast.error('ID verification required')
        navigate('/profile?tab=verification')
      } else {
        toast.error(err.message || 'Could not post opportunity')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const ChipInput = ({ items, onRemove, label, placeholder, value, onChange, onAdd, disabled }) => (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {items.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            {item}
            <button type="button" onClick={() => onRemove(item)} className="hover:text-rose-500"><X className="size-3" /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={value} onChange={onChange} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), onAdd())}
          placeholder={placeholder} disabled={disabled}
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary" />
        <Button type="button" onClick={onAdd} disabled={disabled} size="sm"><Plus className="size-4" /></Button>
      </div>
    </div>
  )

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-primary">
            <ArrowLeft className="size-4" /> Back
          </button>
          <h1 className="text-2xl font-extrabold">{editOpportunityId ? 'Edit Opportunity' : 'Post Opportunity'}</h1>
        </div>

        {!canPost && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="size-5 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-800">ID Verification Required</p>
                <p className="mt-1 text-xs text-amber-700">Verify your ID to post opportunities and build trust with applicants.</p>
                <Button onClick={() => navigate('/profile?tab=verification')} size="sm" className="mt-3">Verify Now</Button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ═══ Basic Info ═══ */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <h2 className="font-bold text-lg">Basic Information</h2>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Need video editor for YouTube channel"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" disabled={!canPost} />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Description *</label>
              <textarea rows={5} value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Describe what you're looking for, responsibilities, requirements..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" disabled={!canPost} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Opportunity Type</label>
                <select value={opportunityType} onChange={e => setOpportunityType(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary bg-white" disabled={!canPost}>
                  {OPPORTUNITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Work Mode</label>
                <select value={mode} onChange={e => setMode(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary bg-white" disabled={!canPost}>
                  {MODES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Role / Skills Needed</label>
              <input value={role} onChange={e => setRole(e.target.value)}
                placeholder="e.g. Video Editor, Content Writer, UI Designer"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" disabled={!canPost} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Location</label>
                <input value={locationVal} onChange={e => setLocationVal(e.target.value)}
                  placeholder="e.g. Remote, Mumbai, Bangalore"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" disabled={!canPost} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">People Needed</label>
                <input type="number" min={1} value={peopleNeeded} onChange={e => setPeopleNeeded(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" disabled={!canPost} />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Experience Level</label>
              <select value={experienceLevel} onChange={e => setExperienceLevel(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary bg-white" disabled={!canPost}>
                {EXPERIENCE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* ═══ Skills & Tools ═══ */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <h2 className="font-bold text-lg">Skills & Tools</h2>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Required Skills</label>
              <ChipInput items={skills} onRemove={removeSkill} value={newSkill}
                onChange={e => setNewSkill(e.target.value)} onAdd={addSkill}
                placeholder="Add a required skill and press Enter" disabled={!canPost} />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Required Tools & Software</label>
              <ChipInput items={tools} onRemove={removeTool} value={newTool}
                onChange={e => setNewTool(e.target.value)} onAdd={addTool}
                placeholder="e.g. Premiere Pro, Figma, Photoshop" disabled={!canPost} />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Good-to-have Skills</label>
              <ChipInput items={goodToHaveSkills} onRemove={removeGoodSkill} value={newGoodSkill}
                onChange={e => setNewGoodSkill(e.target.value)} onAdd={addGoodSkill}
                placeholder="e.g. Motion Design, TypeScript" disabled={!canPost} />
            </div>
          </div>

          {/* ═══ Scope / Deliverables ═══ */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <h2 className="font-bold text-lg">What You'll Be Doing</h2>
            <p className="text-xs text-slate-500">Add the key deliverables and responsibilities for this opportunity.</p>
            <ChipInput items={scope} onRemove={removeScopeItem} value={newScope}
              onChange={e => setNewScope(e.target.value)} onAdd={addScopeItem}
              placeholder="e.g. Edit 4 videos per week, Design social media posts" disabled={!canPost} />
          </div>

          {/* ═══ Multi-role Breakdown ═══ */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <h2 className="font-bold text-lg">Roles Needed</h2>
            <p className="text-xs text-slate-500">If you need multiple people with different roles, specify them here.</p>
            {rolesNeeded.length > 0 && (
              <div className="space-y-2">
                {rolesNeeded.map((r, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
                    <span className="font-semibold text-sm text-slate-700">{r.title}</span>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">{r.count} needed</span>
                      <button type="button" onClick={() => removeRole(i)} className="text-rose-500 hover:text-rose-700"><Trash2 className="size-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex-1 min-w-[180px]">
                <label className="mb-0.5 block text-[11px] font-semibold text-slate-500">Role Title</label>
                <input value={newRoleTitle} onChange={e => setNewRoleTitle(e.target.value)}
                  placeholder="e.g. React Native Developer"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary" disabled={!canPost} />
              </div>
              <div className="w-24">
                <label className="mb-0.5 block text-[11px] font-semibold text-slate-500">Count</label>
                <input type="number" min={1} value={newRoleCount} onChange={e => setNewRoleCount(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary" disabled={!canPost} />
              </div>
              <Button type="button" onClick={addRole} disabled={!canPost} size="sm" className="mb-0.5">
                <Plus className="size-4 mr-1" /> Add
              </Button>
            </div>
          </div>

          {/* ═══ Compensation & Timeline ═══ */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <h2 className="font-bold text-lg">Compensation & Timeline</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Budget (₹)</label>
                <input type="number" value={budget} onChange={e => setBudget(e.target.value)}
                  placeholder="e.g. 15000"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" disabled={!canPost} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Budget Type</label>
                <select value={budgetType} onChange={e => setBudgetType(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary bg-white" disabled={!canPost}>
                  <option value="fixed">Fixed Project</option>
                  <option value="hourly">Hourly Rate</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Duration</label>
                <select value={duration} onChange={e => setDuration(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary bg-white" disabled={!canPost}>
                  <option value="">Select...</option>
                  {DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Weekly Hours Commitment</label>
                <input value={weeklyHours} onChange={e => setWeeklyHours(e.target.value)}
                  placeholder="e.g. 15-20 hrs/week"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" disabled={!canPost} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Start Date</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" disabled={!canPost} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Deadline</label>
                <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" disabled={!canPost} />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Payment Schedule</label>
              <select value={paymentSchedule} onChange={e => setPaymentSchedule(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary bg-white" disabled={!canPost}>
                <option value="">Select...</option>
                {PAYMENT_SCHEDULES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4">
              <input type="checkbox" id="longTerm" checked={longTermPossible}
                onChange={e => setLongTermPossible(e.target.checked)} disabled={!canPost}
                className="size-4 rounded border-slate-300 text-primary focus:ring-primary" />
              <label htmlFor="longTerm" className="text-sm font-semibold text-emerald-800 cursor-pointer">
                Long-term collaboration possible
              </label>
            </div>
          </div>

          {/* ═══ Requirements ═══ */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <h2 className="font-bold text-lg">Requirements</h2>

            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
              <input type="checkbox" id="portfolioReq" checked={portfolioRequired}
                onChange={e => setPortfolioRequired(e.target.checked)} disabled={!canPost}
                className="size-4 rounded border-slate-300 text-primary focus:ring-primary" />
              <label htmlFor="portfolioReq" className="text-sm font-semibold text-slate-700 cursor-pointer">
                Portfolio / Work samples required
              </label>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Own Equipment / Software Required</label>
              <input value={ownEquipment} onChange={e => setOwnEquipment(e.target.value)}
                placeholder="e.g. Own laptop with Adobe Creative Suite, or 'Not required'"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" disabled={!canPost} />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Screening Process</label>
              <input value={screeningProcess} onChange={e => setScreeningProcess(e.target.value)}
                placeholder="e.g. Portfolio review → design test (create 1 social post)"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" disabled={!canPost} />
            </div>
          </div>

          {/* ═══ Screening Questions ═══ */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <h2 className="font-bold text-lg">Screening Questions</h2>
            <p className="text-xs text-slate-500">Ask applicants to answer these questions when applying.</p>
            {screeningQuestions.map((q, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <span className="text-xs font-bold text-slate-400 shrink-0">Q{idx + 1}</span>
                <input value={q.question} onChange={e => updateQuestion(idx, e.target.value)}
                  placeholder={`Question ${idx + 1}`}
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" disabled={!canPost} />
                {idx > 0 && (
                  <button type="button" onClick={() => setScreeningQuestions(p => p.filter((_, i) => i !== idx))}
                    className="text-rose-400 hover:text-rose-600"><X className="size-4" /></button>
                )}
              </div>
            ))}
            <button type="button" onClick={addQuestion} disabled={!canPost}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline disabled:opacity-50">
              <Plus className="size-3" /> Add Question
            </button>
          </div>

          {/* ═══ Submit ═══ */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate('/dashboard/listings')} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canPost || submitting}
              className="rounded-xl bg-primary px-8 py-3 font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
              {submitting ? 'Posting...' : editOpportunityId ? 'Update Opportunity' : 'Post Opportunity'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}