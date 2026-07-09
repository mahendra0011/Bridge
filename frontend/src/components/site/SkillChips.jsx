export function SkillChips({ skills, maxToShow = 4 }) {
  if (!skills?.length) return null

  const displayed = skills.slice(0, maxToShow)
  const overflow = skills.length > maxToShow ? skills.length - maxToShow : 0

  return (
    <div className="flex flex-wrap gap-1 sm:mt-2.5">
      {displayed.map((skill) => (
        <span
          key={skill}
          className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 sm:px-2 sm:text-[11px]"
        >
          {skill}
        </span>
      ))}
      {overflow > 0 && (
        <span className="rounded-md border border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 sm:px-2 sm:text-[11px]">
          +{overflow} more
        </span>
      )}
    </div>
  )
}