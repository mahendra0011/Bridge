import { Check, X, Clock } from 'lucide-react'

// Maps the full backend status enum onto a 4-stage visual track.
// 'Selected' is a legacy synonym for Hired/Offered — kept for backward compat
// with any applications that may carry that status from before this enum settled.
const STAGES = [
  { key: 'Applied', label: 'Applied', match: ['Applied'] },
  { key: 'Under Review', label: 'Under Review', match: ['Under Review'] },
  { key: 'Shortlisted', label: 'Shortlisted', match: ['Shortlisted'] },
  { key: 'Interview Scheduled', label: 'Interview', match: ['Interview Scheduled'] },
  { key: 'Offered', label: 'Offer', match: ['Offered', 'Hired', 'Selected'] },
]

function stageIndexForStatus(status) {
  const idx = STAGES.findIndex((s) => s.match.includes(status))
  return idx === -1 ? 0 : idx
}

function formatDate(date) {
  if (!date) return null
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

// Builds { stageKey: date } from statusHistory, taking the earliest date a
// status (or any status that maps to the same stage) was ever recorded.
function buildStageDates(statusHistory = []) {
  const dates = {}
  for (const entry of statusHistory) {
    const idx = STAGES.findIndex((s) => s.match.includes(entry.status))
    if (idx === -1) continue
    const key = STAGES[idx].key
    if (!dates[key] || new Date(entry.date) < new Date(dates[key])) {
      dates[key] = entry.date
    }
  }
  return dates
}

/**
 * Visual step indicator for an application's progress.
 * Rejected is shown as a distinct terminal state on top of wherever the
 * application got to — it is never silently folded into the happy path,
 * since that would misrepresent what actually happened.
 */
export function StatusTimeline({ status, statusHistory = [], compact = false }) {
  const isRejected = status === 'Rejected'
  // For a rejected application, show progress up to the last *non-rejected*
  // stage reached, then mark that point as the rejection.
  const lastNonRejected = isRejected
    ? [...statusHistory].reverse().find((h) => h.status !== 'Rejected')?.status || 'Applied'
    : status
  const activeIndex = stageIndexForStatus(lastNonRejected)
  const stageDates = buildStageDates(statusHistory)

  return (
    <div className={compact ? 'py-1' : 'py-2'}>
      <div className="flex items-start">
        {STAGES.map((stage, i) => {
          const isDone = i < activeIndex || (i === activeIndex && !isRejected)
          const isCurrent = i === activeIndex
          const isRejectedHere = isRejected && isCurrent
          const isFuture = i > activeIndex

          return (
            <div key={stage.key} className="flex flex-1 flex-col items-center last:flex-none last:items-end">
              <div className="flex w-full items-center">
                {/* Connector before (skip for first) */}
                {i > 0 && (
                  <div
                    className={`h-0.5 flex-1 ${i <= activeIndex && !isFuture ? (isRejected && i === activeIndex ? 'bg-rose-300' : 'bg-emerald-400') : 'bg-slate-200'}`}
                  />
                )}
                {/* Node */}
                <div
                  className={`grid shrink-0 place-items-center rounded-full border-2 ${compact ? 'size-6' : 'size-8'} ${
                    isRejectedHere
                      ? 'border-rose-500 bg-rose-500 text-white'
                      : isDone
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : isCurrent
                          ? 'border-primary bg-white text-primary'
                          : 'border-slate-200 bg-white text-slate-300'
                  }`}
                >
                  {isRejectedHere ? (
                    <X className={compact ? 'size-3.5' : 'size-4'} />
                  ) : isDone ? (
                    <Check className={compact ? 'size-3.5' : 'size-4'} />
                  ) : isCurrent ? (
                    <Clock className={compact ? 'size-3' : 'size-3.5'} />
                  ) : (
                    <span className={`rounded-full bg-slate-300 ${compact ? 'size-1.5' : 'size-2'}`} />
                  )}
                </div>
              </div>

              {/* Label + date */}
              <div className={`mt-1.5 text-center ${i === STAGES.length - 1 ? 'text-right' : ''}`}>
                <div
                  className={`text-[10px] font-bold sm:text-xs ${
                    isRejectedHere ? 'text-rose-600' : isDone ? 'text-emerald-700' : isCurrent ? 'text-primary' : 'text-slate-400'
                  }`}
                >
                  {isRejectedHere ? 'Rejected' : stage.label}
                </div>
                {!compact && stageDates[stage.key] && !isFuture && (
                  <div className="text-[10px] text-slate-400">{formatDate(stageDates[stage.key])}</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
