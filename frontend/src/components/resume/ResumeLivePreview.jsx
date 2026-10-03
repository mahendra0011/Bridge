import React, { useMemo } from 'react'
import { getTemplateById } from '@/data/resumeTemplates'
import { ALL_SECTIONS } from '@/data/allSections'
import { Mail, Phone, MapPin, Globe, Linkedin, Github, ExternalLink, Award, Briefcase, GraduationCap, Code } from 'lucide-react'

export function getSectionDisplay(sec) {
  const config = ALL_SECTIONS[sec.type] || {}
  const title =
    sec.customTitle || sec.customSectionTitle || sec.itemTitle ||
    sec.projectName || sec.certName || sec.internRole || sec.awardName ||
    sec.hackathonName || sec.researchTopic || sec.paperTitle || sec.volunteerRole ||
    sec.leadershipRole || sec.activityName || sec.membershipOrg || sec.licenseName ||
    sec.patentTitle || sec.refName || sec.ossProject || sec.portfolioTitle ||
    sec.scholarshipName || sec.trainingTopic || sec.achievementTitle || sec.confName ||
    sec.workshopTitle || sec.courseName || sec.language ||
    sec.platform || config.label || 'Entry'

  const subtitle =
    sec.customSubtitle || sec.organization || sec.company || sec.projectTechnologies ||
    sec.certIssuer || sec.internCompany || sec.awardOrganization ||
    sec.hackathonAward || sec.researchField || sec.journalName || sec.volunteerOrg ||
    sec.leadershipOrg || sec.activityRole || sec.membershipRole || sec.licenseIssuer ||
    sec.patentNumber || (sec.refDesignation ? `${sec.refDesignation}${sec.refCompany ? ' at ' + sec.refCompany : ''}` : '') ||
    sec.ossTechnologies || sec.portfolioUrl || sec.scholarshipIssuer || sec.trainingInstitute ||
    sec.confTopic || sec.workshopInstitute || sec.proficiency || sec.rating || ''

  const date =
    sec.customDate || sec.date || sec.projectDuration || sec.certDate || sec.internStartDate || sec.awardDate ||
    sec.hackathonDate || sec.researchDate || sec.paperDate || sec.volunteerStartDate ||
    sec.leadershipStartDate || sec.activityDate || sec.licenseDate || sec.patentDate ||
    sec.confDate || sec.workshopDate || sec.trainingDate || ''

  const desc =
    sec.customContent || sec.customSectionContent || sec.description || sec.desc ||
    sec.projectDescription || sec.certExpiry || sec.internDescription || sec.awardDescription ||
    sec.hackathonProject || sec.researchDescription || sec.paperSummary || sec.volunteerDescription ||
    sec.leadershipDescription || sec.activityDescription || sec.patentDescription ||
    sec.ossContribution || sec.portfolioDescription || sec.scholarshipAmount ||
    sec.achievementDescription || sec.interests ||
    sec.coreStrengths || sec.interpersonalSkills || sec.declarationText || ''

  const label = sec.customSectionHeading || (sec.type === 'custom' && sec.customSectionTitle) || config.label || sec.type

  return { title, subtitle, date, desc, label }
}

export function ResumeLivePreview({ sections = [], sectionOrder = [], settings = {}, className = '' }) {
  const templateId = settings.templateId || 'classic-professional'
  const template = getTemplateById(templateId)
  const rawColor = settings.primaryColor || ''
  const primaryColor = rawColor
    ? rawColor.startsWith('#') ? rawColor : `#${rawColor}`
    : template.colorHex

  // Existence flags for sections
  const hasPersonal = sections.some(s => s.type === 'personal')
  const personal = sections.find(s => s.type === 'personal') || {}

  const hasSummary = sections.some(s => s.type === 'summary')
  const summarySec = sections.find(s => s.type === 'summary') || {}
  const summaryText = summarySec.summary || ''

  const experiences = sections.filter(s => s.type === 'experience' && (s.role || s.company || s.description))
  const hasExperience = experiences.length > 0

  const educations = sections.filter(s => s.type === 'education' && (s.institution || s.degree))
  const hasEducation = educations.length > 0

  const hasSkills = sections.some(s => s.type === 'skills')
  const skillsSec = sections.find(s => s.type === 'skills') || {}

  // Parse skill tags
  const technicalSkills = (skillsSec.technical || '').split(',').map(s => s.trim()).filter(Boolean)
  const softSkills = (skillsSec.soft || '').split(',').map(s => s.trim()).filter(Boolean)
  const allSkills = [...technicalSkills, ...softSkills]
  const displaySkills = allSkills

  // Display values (clean without showing demo dummy text)
  const name = personal.name || (hasPersonal ? 'Your Name' : '')
  const role = personal.professionalTitle || ''
  const email = personal.email || ''
  const phone = personal.phone || ''
  const location = personal.location || ''

  // Compute effective section order based on sectionOrder prop and active sections
  const effectiveOrder = useMemo(() => {
    const presentTypes = Array.from(new Set(sections.map(s => s.type)))
    const activeOrder = (sectionOrder && sectionOrder.length > 0 ? sectionOrder : settings.sectionOrder || [])
    const ordered = activeOrder.filter(t => presentTypes.includes(t))
    presentTypes.forEach(t => {
      if (!ordered.includes(t)) ordered.push(t)
    })
    return ordered
  }, [sections, sectionOrder, settings.sectionOrder])

  // Sub-renderers
  const renderSummarySection = (title = 'Professional Summary') => {
    if (!hasSummary || !summaryText) return null
    return (
      <div key="summary">
        <h4
          className="font-extrabold text-[11px] uppercase tracking-wider border-b pb-1 mb-1.5"
          style={{ color: primaryColor, borderColor: `${primaryColor}30` }}
        >
          {title}
        </h4>
        <p className="text-[10px] text-slate-600 leading-normal">{summaryText}</p>
      </div>
    )
  }

  const renderExperienceSection = (title = 'Work Experience') => {
    if (!hasExperience) return null
    return (
      <div key="experience">
        <h4
          className="font-extrabold text-[11px] uppercase tracking-wider border-b pb-1 mb-2"
          style={{ color: primaryColor, borderColor: `${primaryColor}30` }}
        >
          {title}
        </h4>
        <div className="space-y-3">
          {experiences.map((exp, i) => (
            <div key={exp.id || i} className="text-[10px]">
              <div className="flex justify-between items-baseline font-bold text-slate-900">
                <span>{exp.role || 'Job Title'}</span>
                <span className="text-[9px] text-slate-400 font-normal">
                  {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                </span>
              </div>
              <p className="font-semibold text-[9.5px]" style={{ color: primaryColor }}>
                {exp.company || 'Company Name'}
              </p>
              {exp.description && (
                <p className="text-slate-600 mt-1 whitespace-pre-line leading-normal line-clamp-3">
                  {exp.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderEducationSection = (title = 'Education') => {
    if (!hasEducation) return null
    return (
      <div key="education">
        <h4
          className="font-extrabold text-[11px] uppercase tracking-wider border-b pb-1 mb-2"
          style={{ color: primaryColor, borderColor: `${primaryColor}30` }}
        >
          {title}
        </h4>
        <div className="space-y-2">
          {educations.map((edu, i) => (
            <div key={edu.id || i} className="text-[10px]">
              <div className="flex justify-between items-baseline font-bold text-slate-900">
                <span>{edu.degree || 'Degree'} {edu.course && `- ${edu.course}`}</span>
                <span className="text-[9px] text-slate-400 font-normal">
                  {edu.startYear} - {edu.endYear || 'Present'}
                </span>
              </div>
              <p className="text-slate-600">
                {edu.institution || 'University Name'} {edu.gpa && `• GPA: ${edu.gpa}`}
              </p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderSkillsSection = (title = 'Skills & Expertise') => {
    if (!hasSkills || displaySkills.length === 0) return null
    return (
      <div key="skills">
        <h4
          className="font-bold text-[11px] uppercase tracking-wider mb-1.5"
          style={{ color: primaryColor }}
        >
          {title}
        </h4>
        <div className="flex flex-wrap gap-1">
          {displaySkills.slice(0, 12).map((skill, i) => (
            <span
              key={i}
              className="bg-slate-100 text-slate-800 text-[9px] px-2 py-0.5 rounded font-medium border border-slate-200/80"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    )
  }

  const renderCustomSectionGroup = (type) => {
    const matching = sections.filter(s => s.type === type)
    if (matching.length === 0) return null
    const displayItems = matching.map(sec => ({ sec, ...getSectionDisplay(sec) }))
    const groupHeading = displayItems[0]?.label || type

    return (
      <div key={type} className="space-y-2">
        <h5
          className="font-extrabold text-[10.5px] uppercase tracking-wider border-b pb-1 mb-1.5"
          style={{ color: primaryColor, borderColor: `${primaryColor}30` }}
        >
          {groupHeading}
        </h5>
        <div className="space-y-2">
          {displayItems.map((item, idx) => (
            <div key={item.sec.id || idx} className="text-[10px]">
              <div className="flex justify-between items-baseline font-bold text-slate-900">
                <span>{item.title}</span>
                {item.date && (
                  <span className="text-[8.5px] text-slate-400 font-normal">{item.date}</span>
                )}
              </div>
              {item.subtitle && (
                <p className="font-medium text-[9px]" style={{ color: primaryColor }}>
                  {item.subtitle}
                </p>
              )}
              {item.desc && (
                <p className="text-slate-600 mt-0.5 line-clamp-2 leading-normal">
                  • {item.desc}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Section Dispatcher
  const renderSectionByType = (type, layout = 'split-sidebar') => {
    if (type === 'personal') return null
    if (type === 'summary') {
      return renderSummarySection(layout === 'top-banner' ? 'About Me' : layout === 'minimalist' ? 'Executive Summary' : 'Professional Summary')
    }
    if (type === 'experience') {
      return renderExperienceSection(layout === 'top-banner' ? 'Experience' : layout === 'minimalist' ? 'Professional Experience' : 'Work Experience')
    }
    if (type === 'education') {
      return renderEducationSection('Education')
    }
    if (type === 'skills') {
      if (layout === 'split-sidebar') return null // Placed in left sidebar for this layout
      return renderSkillsSection(layout === 'minimalist' ? 'Skills & Expertise' : 'Key Skills')
    }
    return renderCustomSectionGroup(type)
  }

  // --- Layout 1: Split Sidebar (Green / Sales Associate style) ---
  if (template.layoutStyle === 'split-sidebar') {
    return (
      <div className={`w-full bg-white text-slate-800 flex flex-col sm:flex-row shadow-lg rounded-xl overflow-hidden border border-slate-200 text-[11px] leading-relaxed min-h-[580px] font-sans ${className}`}>
        {/* Left Sidebar */}
        <div className="w-full sm:w-[35%] p-4 text-white flex flex-col justify-between shrink-0" style={{ backgroundColor: primaryColor }}>
          <div>
            {hasPersonal && name && (
              <>
                <div className="size-14 rounded-full bg-white/20 border-2 border-white/40 mx-auto mb-3 flex items-center justify-center font-bold text-lg text-white">
                  {name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'CV'}
                </div>
                <h3 className="font-extrabold text-sm text-center leading-tight">{name}</h3>
                <p className="text-[10px] text-white/80 text-center font-medium mt-0.5 mb-4">{role}</p>

                {/* Contact */}
                <div className="space-y-1.5 border-t border-white/20 pt-3 text-[10px] text-white/90">
                  {email && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="size-3 shrink-0 opacity-80" />
                      <span className="truncate">{email}</span>
                    </div>
                  )}
                  {phone && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Phone className="size-3 shrink-0 opacity-80" />
                      <span>{phone}</span>
                    </div>
                  )}
                  {location && (
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="size-3 shrink-0 opacity-80" />
                      <span>{location}</span>
                    </div>
                  )}
                  {personal.linkedin && (
                    <div className="flex items-center gap-1.5 truncate text-white">
                      <Linkedin className="size-3 shrink-0 opacity-80" />
                      <span className="truncate">{personal.linkedin.replace(/^https?:\/\//, '')}</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Key Skills in sidebar (only if skills section exists) */}
            {hasSkills && displaySkills.length > 0 && (
              <div className="border-t border-white/20 pt-3 mt-3">
                <h4 className="font-bold text-[10.5px] uppercase tracking-wider mb-2">Key Skills</h4>
                <div className="flex flex-wrap gap-1">
                  {displaySkills.slice(0, 8).map((skill, i) => (
                    <span key={i} className="bg-black/20 text-white text-[9px] px-1.5 py-0.5 rounded font-medium truncate max-w-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-white/20 pt-2 text-[9px] text-white/70 mt-4">
            ATS Score: <span className="text-white font-bold">{template.atsScore}%</span>
          </div>
        </div>

        {/* Right Main Content — Renders sections strictly in shifted dynamic order */}
        <div className="flex-1 p-5 space-y-4">
          {effectiveOrder
            .filter(t => t !== 'personal' && t !== 'skills')
            .map(t => renderSectionByType(t, 'split-sidebar'))}
        </div>
      </div>
    )
  }

  // --- Layout 2: Top Banner (Hank Jones / Golden Amber style) ---
  if (template.layoutStyle === 'top-banner') {
    return (
      <div className={`w-full bg-white text-slate-800 shadow-lg rounded-xl overflow-hidden border border-slate-200 text-[11px] leading-relaxed min-h-[580px] font-sans ${className}`}>
        {/* Banner Header */}
        {hasPersonal && (
          <div className="p-4 text-white flex justify-between items-center" style={{ backgroundColor: primaryColor }}>
            <div>
              <h3 className="font-extrabold text-base leading-tight tracking-wide">{name}</h3>
              <p className="text-[11px] text-white/90 font-medium">{role}</p>
            </div>
            <div className="text-right text-[9.5px] text-white/80 space-y-0.5">
              {email && <p>{email}</p>}
              {(phone || location) && <p>{phone} {phone && location && '•'} {location}</p>}
            </div>
          </div>
        )}

        {/* Main Content — Renders sections strictly in shifted dynamic order */}
        <div className="p-5 space-y-4">
          {effectiveOrder
            .filter(t => t !== 'personal')
            .map(t => renderSectionByType(t, 'top-banner'))}
        </div>
      </div>
    )
  }

  // --- Layout: Classic Centered (Original Corporate ATS / Ivy League Standard) ---
  if (template.layoutStyle === 'classic-centered' || template.layoutStyle === 'ivy-rule') {
    return (
      <div className={`w-full bg-white text-slate-800 shadow-lg rounded-xl overflow-hidden border border-slate-200 p-6 text-[11px] leading-relaxed min-h-[580px] font-serif ${className}`}>
        {/* Centered Professional Header */}
        {hasPersonal && (
          <div className="text-center pb-3 mb-4 border-b-2" style={{ borderColor: primaryColor }}>
            <h3 className="font-bold text-2xl text-slate-900 tracking-normal">{name}</h3>
            {role && (
              <p className="text-[11px] font-semibold tracking-widest uppercase mt-1 font-sans" style={{ color: primaryColor }}>
                {role}
              </p>
            )}
            <div className="flex flex-wrap justify-center items-center gap-x-2 gap-y-1 text-[9.5px] text-slate-600 mt-2 font-sans">
              {email && <span>{email}</span>}
              {email && (phone || location) && <span className="text-slate-300">|</span>}
              {phone && <span>{phone}</span>}
              {phone && location && <span className="text-slate-300">|</span>}
              {location && <span>{location}</span>}
              {personal.linkedin && (
                <>
                  <span className="text-slate-300">|</span>
                  <span className="font-medium text-slate-700">{personal.linkedin.replace(/^https?:\/\//, '')}</span>
                </>
              )}
              {personal.github && (
                <>
                  <span className="text-slate-300">|</span>
                  <span className="font-medium text-slate-700">{personal.github.replace(/^https?:\/\//, '')}</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Main Content — Renders sections strictly in shifted dynamic order */}
        <div className="space-y-4 font-sans">
          {effectiveOrder
            .filter(t => t !== 'personal')
            .map(t => renderSectionByType(t, 'classic-centered'))}
        </div>
      </div>
    )
  }

  // --- Layout 3: Minimalist / Header Rule (Min Lee / Red & Charcoal style) ---
  return (
    <div className={`w-full bg-white text-slate-800 shadow-lg rounded-xl overflow-hidden border border-slate-200 p-5 text-[11px] leading-relaxed min-h-[580px] font-sans ${className}`}>
      {/* Clean Header */}
      {hasPersonal && (
        <div className="border-b-2 pb-3 mb-4" style={{ borderColor: primaryColor }}>
          <h3 className="font-extrabold text-xl text-slate-900 tracking-tight">{name}</h3>
          <p className="text-[11px] font-semibold mt-0.5" style={{ color: primaryColor }}>{role}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[9.5px] text-slate-500 mt-2">
            {email && <span>{email}</span>}
            {email && phone && <span>•</span>}
            {phone && <span>{phone}</span>}
            {phone && location && <span>•</span>}
            {location && <span>{location}</span>}
            {personal.linkedin && (
              <>
                <span>•</span>
                <span className="font-medium text-slate-700">{personal.linkedin.replace(/^https?:\/\//, '')}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Content — Renders sections strictly in shifted dynamic order */}
      <div className="space-y-4">
        {effectiveOrder
          .filter(t => t !== 'personal')
          .map(t => renderSectionByType(t, 'minimalist'))}
      </div>
    </div>
  )
}
