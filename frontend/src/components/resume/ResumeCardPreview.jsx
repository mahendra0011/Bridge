import React from 'react'
import { Star, ThumbsUp, Check, ExternalLink, Sparkles, User } from 'lucide-react'

export function ResumeCardPreview({ template, isFull = false }) {
  const { sampleUser, colorHex, accentBg, layoutStyle, id } = template

  // Specific renderer for Mahendra Prajapati (Bridge Founder) matching exact LaTeX template
  if (id === 'mahendra-founder') {
    return (
      <div className="relative w-full h-full bg-white flex flex-col text-[7.5px] font-serif leading-tight select-none pointer-events-none overflow-hidden rounded shadow-sm border border-slate-200 p-2.5 sm:p-3 text-slate-900">
        {/* LaTeX Centered Header */}
        <div className="text-center pb-1 mb-1.5">
          <h4 className="font-serif font-extrabold text-[12px] tracking-wide text-black uppercase">
            Mahendra Prajapati
          </h4>
          <p className="text-[7px] text-slate-700 mt-0.5 font-sans">
            Jabalpur, M.P.
          </p>
          <div className="flex justify-center items-center gap-1.5 text-[6.5px] text-slate-600 mt-0.5 font-sans">
            <span className="underline">+917724822660</span>
            <span>~</span>
            <span className="underline truncate max-w-[110px]">mahendrapra0077@gmail.com</span>
            <span>~</span>
            <span className="underline font-bold text-slate-800">GitHub</span>
          </div>
        </div>

        {/* Section: Profile Summary */}
        <div className="mb-1.5">
          <h5 className="font-serif font-bold text-[7.5px] uppercase tracking-wider text-black border-b border-black pb-0.5 mb-1">
            Profile Summary
          </h5>
          <p className="text-[6.5px] text-slate-800 line-clamp-2 leading-tight">
            Motivated and detail-oriented Electronics and Communication Engineering undergraduate with a strong foundation in HTML, CSS, JavaScript, NodeJS, ExpressJS, MongoDB and C++. Passionate about building efficient and scalable applications.
          </p>
        </div>

        {/* Section: Education */}
        <div className="mb-1.5">
          <h5 className="font-serif font-bold text-[7.5px] uppercase tracking-wider text-black border-b border-black pb-0.5 mb-1">
            Education
          </h5>
          <div className="text-[6.5px] space-y-0.5">
            <div className="flex justify-between items-baseline font-bold">
              <span className="truncate max-w-[130px]">Shri Ram Institute of Technology Jabalpur</span>
              <span className="text-[6px] text-slate-600 shrink-0">2023 -- 2027</span>
            </div>
            <div className="flex justify-between items-baseline text-slate-700">
              <span className="truncate">B.Tech – ECE (CGPA: 7.1/10)</span>
              <span className="text-[6px] text-slate-500">Jabalpur (M.P.)</span>
            </div>
          </div>
        </div>

        {/* Section: Technical Skills */}
        <div className="mb-1.5">
          <h5 className="font-serif font-bold text-[7.5px] uppercase tracking-wider text-black border-b border-black pb-0.5 mb-1">
            Technical Skills
          </h5>
          <div className="text-[6.5px] space-y-0.5 text-slate-800 leading-tight">
            <p className="truncate"><span className="font-bold">Languages:</span> C++, HTML5, CSS3, TailwindCSS, JavaScript, SQL</p>
            <p className="truncate"><span className="font-bold">Tools & Tech:</span> Git, Postman, VS Code, ReactJS, Redux, NodeJS, ExpressJS, MongoDB</p>
          </div>
        </div>

        {/* Section: Projects */}
        <div className="mb-1">
          <h5 className="font-serif font-bold text-[7.5px] uppercase tracking-wider text-black border-b border-black pb-0.5 mb-1">
            Projects
          </h5>
          <div className="space-y-1 text-[6.5px]">
            <div>
              <div className="flex justify-between items-baseline font-bold text-slate-900">
                <span className="underline">MediCore (Hospital Management System)</span>
                <span className="text-[6px] text-slate-500 font-normal">April 2026</span>
              </div>
              <p className="text-[6px] text-slate-600 line-clamp-1">
                • Full-stack hospital system with Admin, Doctor, Patient portals & JWT auth.
              </p>
            </div>
            <div>
              <div className="flex justify-between items-baseline font-bold text-slate-900">
                <span className="underline">EventO (Full-Stack Booking Platform)</span>
                <span className="text-[6px] text-slate-500 font-normal">May 2026</span>
              </div>
              <p className="text-[6px] text-slate-600 line-clamp-1">
                • Event booking with QR-based tickets, host dashboards & analytics.
              </p>
            </div>
          </div>
        </div>

        {/* Section: Achievements */}
        <div className="mt-auto">
          <h5 className="font-serif font-bold text-[7.5px] uppercase tracking-wider text-black border-b border-black pb-0.5 mb-0.5">
            Achievements
          </h5>
          <p className="text-[6px] text-slate-800 line-clamp-1">
            • Team Leader in Smart India Hackathon | 400+ GitHub contributions | 100+ C++ problems
          </p>
        </div>
      </div>
    )
  }

  // Specific renderers for each distinct template archetype
  if (layoutStyle === 'split-sidebar') {
    // Michael Johnson - Green Side Column
    return (
      <div className="relative w-full h-full bg-white flex text-[9px] font-sans leading-tight select-none pointer-events-none overflow-hidden rounded shadow-sm border border-slate-200">
        {/* Left Green Column */}
        <div className="w-[36%] bg-[#15803d] text-white p-2.5 flex flex-col justify-between shrink-0">
          <div>
            <div className="size-9 rounded-full bg-emerald-100/30 border border-white/40 mx-auto mb-2 flex items-center justify-center overflow-hidden">
              <span className="text-[12px] font-bold text-white tracking-wider">MJ</span>
            </div>
            <h4 className="font-extrabold text-[11px] text-center text-white leading-tight mb-1">{sampleUser.name}</h4>
            <p className="text-[8px] text-emerald-100 text-center font-medium mb-3">{sampleUser.role}</p>

            <div className="space-y-1 mb-3 text-[7.5px] text-emerald-100 border-t border-emerald-600/60 pt-2">
              <p className="truncate font-medium text-white">{sampleUser.email}</p>
              <p className="truncate">{sampleUser.phone}</p>
              <p className="truncate">{sampleUser.location}</p>
            </div>

            <div className="border-t border-emerald-600/60 pt-2">
              <h5 className="font-bold text-[8.5px] text-white uppercase tracking-wider mb-1.5">Skills</h5>
              <div className="flex flex-col gap-1">
                {sampleUser.skills.slice(0, 4).map((s, i) => (
                  <span key={i} className="bg-emerald-800/80 text-[7px] text-emerald-100 px-1.5 py-0.5 rounded truncate">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-emerald-600/60 pt-1.5 text-[7px] text-emerald-200">
            <span className="font-bold text-white">ATS Rate:</span> 98%
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 p-2.5 bg-white text-slate-700 flex flex-col justify-between overflow-hidden">
          <div>
            {/* Summary */}
            <div className="mb-2">
              <h5 className="font-bold text-[8.5px] uppercase tracking-wider text-[#15803d] border-b border-emerald-200 pb-0.5 mb-1">
                Executive Profile
              </h5>
              <p className="text-[7.5px] text-slate-600 line-clamp-2 leading-relaxed">
                {sampleUser.summary}
              </p>
            </div>

            {/* Experience */}
            <div className="mb-2">
              <h5 className="font-bold text-[8.5px] uppercase tracking-wider text-[#15803d] border-b border-emerald-200 pb-0.5 mb-1.5">
                Work History
              </h5>
              {sampleUser.experience.map((exp, i) => (
                <div key={i} className="mb-1.5">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-[8px] text-slate-800">{exp.role}</span>
                    <span className="text-[7px] text-slate-400">{exp.duration}</span>
                  </div>
                  <p className="text-[7px] font-medium text-emerald-700">{exp.company}</p>
                  <p className="text-[7px] text-slate-500 line-clamp-1 mt-0.5">• {exp.points[0]}</p>
                </div>
              ))}
            </div>

            {/* Education */}
            <div>
              <h5 className="font-bold text-[8.5px] uppercase tracking-wider text-[#15803d] border-b border-emerald-200 pb-0.5 mb-1">
                Education
              </h5>
              <p className="text-[7.5px] font-semibold text-slate-800">{sampleUser.education}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (layoutStyle === 'top-banner') {
    // Hank Jones - Golden Amber Top Banner
    return (
      <div className="relative w-full h-full bg-white flex flex-col text-[9px] font-sans leading-tight select-none pointer-events-none overflow-hidden rounded shadow-sm border border-slate-200">
        {/* Top Amber Banner */}
        <div className="bg-[#d97706] text-white p-2.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-white/20 border border-white/50 flex items-center justify-center font-bold text-[11px] text-white">
              HJ
            </div>
            <div>
              <h4 className="font-extrabold text-[12px] text-white leading-none">{sampleUser.name}</h4>
              <p className="text-[8px] text-amber-100 font-medium mt-0.5">{sampleUser.role}</p>
            </div>
          </div>
          <div className="text-right text-[7px] text-amber-100 space-y-0.5">
            <p>{sampleUser.email}</p>
            <p>{sampleUser.phone} • {sampleUser.location}</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-2.5 bg-white text-slate-700 flex flex-col justify-between">
          <div>
            {/* Summary */}
            <div className="mb-2">
              <p className="text-[7.5px] text-slate-600 line-clamp-2 leading-relaxed italic border-l-2 border-[#d97706] pl-2">
                "{sampleUser.summary}"
              </p>
            </div>

            {/* Experience */}
            <div className="mb-2">
              <h5 className="font-bold text-[8.5px] uppercase tracking-wider text-[#d97706] border-b border-amber-200 pb-0.5 mb-1.5 flex items-center gap-1">
                Professional Experience
              </h5>
              {sampleUser.experience.map((exp, i) => (
                <div key={i} className="mb-1.5">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-[8px] text-slate-900">{exp.role}</span>
                    <span className="text-[7px] text-amber-800 font-medium">{exp.duration}</span>
                  </div>
                  <p className="text-[7px] text-slate-500">{exp.company}</p>
                  <p className="text-[7px] text-slate-600 line-clamp-1 mt-0.5">• {exp.points[0]}</p>
                </div>
              ))}
            </div>

            {/* Visual Skill Meters */}
            <div className="mb-2">
              <h5 className="font-bold text-[8.5px] uppercase tracking-wider text-[#d97706] border-b border-amber-200 pb-0.5 mb-1.5">
                Core Competencies
              </h5>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                {sampleUser.skills.slice(0, 4).map((skill, i) => (
                  <div key={i} className="flex flex-col gap-0.5">
                    <span className="text-[7px] text-slate-700 truncate">{skill}</span>
                    <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#d97706] rounded-full" style={{ width: `${88 - i * 6}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Education */}
            <div>
              <h5 className="font-bold text-[8.5px] uppercase tracking-wider text-[#d97706] border-b border-amber-200 pb-0.5 mb-1">
                Education & Credentials
              </h5>
              <p className="text-[7px] font-semibold text-slate-800 truncate">{sampleUser.education}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (layoutStyle === 'header-rule') {
    // Min Lee - Ruby Red Clean Line
    return (
      <div className="relative w-full h-full bg-white flex flex-col text-[9px] font-sans leading-tight select-none pointer-events-none overflow-hidden rounded shadow-sm border border-slate-200 p-2.5">
        {/* Minimalist Red Top Header */}
        <div className="text-center pb-2 border-b-2 border-[#dc2626] mb-2">
          <h4 className="font-black text-[13px] tracking-wider text-[#dc2626] uppercase">{sampleUser.name}</h4>
          <p className="text-[8px] text-slate-600 font-semibold tracking-wide uppercase mt-0.5">{sampleUser.role}</p>
          <div className="flex justify-center items-center gap-2 text-[7px] text-slate-500 mt-1">
            <span>{sampleUser.email}</span>
            <span>•</span>
            <span>{sampleUser.phone}</span>
            <span>•</span>
            <span>{sampleUser.location}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="mb-2">
              <h5 className="font-extrabold text-[8px] text-[#dc2626] uppercase tracking-widest mb-1 flex items-center gap-1">
                <span>//</span> Resume Objective
              </h5>
              <p className="text-[7.5px] text-slate-600 line-clamp-2 leading-relaxed">
                {sampleUser.summary}
              </p>
            </div>

            {/* Work History */}
            <div className="mb-2">
              <h5 className="font-extrabold text-[8px] text-[#dc2626] uppercase tracking-widest mb-1 flex items-center gap-1">
                <span>//</span> Work History
              </h5>
              {sampleUser.experience.map((exp, i) => (
                <div key={i} className="mb-1.5 border-l border-red-200 pl-1.5">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-[8px] text-slate-900">{exp.role}</span>
                    <span className="text-[7px] text-slate-400">{exp.duration}</span>
                  </div>
                  <p className="text-[7px] font-medium text-red-600">{exp.company}</p>
                  <p className="text-[7px] text-slate-500 line-clamp-1 mt-0.5">• {exp.points[0]}</p>
                </div>
              ))}
            </div>

            {/* Skills with red dot rating */}
            <div className="mb-2">
              <h5 className="font-extrabold text-[8px] text-[#dc2626] uppercase tracking-widest mb-1 flex items-center gap-1">
                <span>//</span> Skills & Accreditations
              </h5>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                {sampleUser.skills.slice(0, 4).map((skill, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-[7px] text-slate-700 truncate">{skill}</span>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, dotIdx) => (
                        <span
                          key={dotIdx}
                          className={`size-1 rounded-full ${dotIdx < (5 - (i > 1 ? 1 : 0)) ? 'bg-[#dc2626]' : 'bg-slate-200'}`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Education */}
            <div>
              <h5 className="font-extrabold text-[8px] text-[#dc2626] uppercase tracking-widest mb-0.5 flex items-center gap-1">
                <span>//</span> Education
              </h5>
              <p className="text-[7px] text-slate-800 font-medium truncate">{sampleUser.education}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (layoutStyle === 'classic-centered') {
    const accent = colorHex || '#0E5484'
    return (
      <div className="relative w-full h-full bg-white flex flex-col text-[9px] font-sans leading-tight select-none pointer-events-none overflow-hidden rounded shadow-sm border border-slate-200 p-3">
        {/* Executive Centered Header */}
        <div className="text-center pb-2 border-b-2 mb-2" style={{ borderColor: accent }}>
          <h4 className="font-serif font-bold text-[13px] tracking-wide text-slate-900">{sampleUser.name}</h4>
          <p className="text-[8px] font-semibold tracking-widest uppercase mt-0.5" style={{ color: accent }}>{sampleUser.role}</p>
          <div className="flex justify-center items-center gap-1.5 text-[7px] text-slate-500 mt-1 font-sans">
            <span className="truncate max-w-[85px]">{sampleUser.email}</span>
            <span>|</span>
            <span>{sampleUser.phone}</span>
            <span>|</span>
            <span>{sampleUser.location}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="mb-2">
              <h5 className="font-bold text-[8px] uppercase tracking-widest border-b pb-0.5 mb-1" style={{ color: accent, borderColor: `${accent}40` }}>
                Professional Summary
              </h5>
              <p className="text-[7.5px] text-slate-600 line-clamp-2 leading-relaxed">
                {sampleUser.summary}
              </p>
            </div>

            <div className="mb-2">
              <h5 className="font-bold text-[8px] uppercase tracking-widest border-b pb-0.5 mb-1.5" style={{ color: accent, borderColor: `${accent}40` }}>
                Work History
              </h5>
              {sampleUser.experience.map((exp, i) => (
                <div key={i} className="mb-1.5">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-[8px] text-slate-900">{exp.role}</span>
                    <span className="text-[7px] text-slate-400">{exp.duration}</span>
                  </div>
                  <p className="text-[7px] font-semibold" style={{ color: accent }}>{exp.company}</p>
                  <p className="text-[7px] text-slate-600 line-clamp-1 mt-0.5">• {exp.points[0]}</p>
                </div>
              ))}
            </div>

            <div className="mb-2">
              <h5 className="font-bold text-[8px] uppercase tracking-widest border-b pb-0.5 mb-1" style={{ color: accent, borderColor: `${accent}40` }}>
                Key Skills & Expertise
              </h5>
              <div className="flex flex-wrap gap-1">
                {sampleUser.skills.slice(0, 4).map((skill, i) => (
                  <span key={i} className="text-[7px] bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h5 className="font-bold text-[8px] uppercase tracking-widest border-b pb-0.5 mb-0.5" style={{ color: accent, borderColor: `${accent}40` }}>
                Education
              </h5>
              <p className="text-[7px] text-slate-700 font-medium truncate">{sampleUser.education}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (layoutStyle === 'tech-badges') {
    // Hiro Patel - Software Engineer Cyan / Sky
    return (
      <div className="relative w-full h-full bg-white flex flex-col text-[9px] font-sans leading-tight select-none pointer-events-none overflow-hidden rounded shadow-sm border border-slate-200 p-2.5">
        {/* Tech Header */}
        <div className="flex justify-between items-start border-b border-sky-200 pb-2 mb-2">
          <div>
            <h4 className="font-extrabold text-[12px] text-slate-900 tracking-tight">{sampleUser.name}</h4>
            <p className="text-[8px] text-sky-600 font-semibold">{sampleUser.role}</p>
            <p className="text-[7px] text-slate-400 mt-0.5">{sampleUser.location}</p>
          </div>
          <div className="text-right text-[7px] text-slate-500 space-y-0.5">
            <span className="inline-block bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded font-mono font-medium">
              github.com/hiro-dev
            </span>
            <p className="text-slate-400">{sampleUser.email}</p>
          </div>
        </div>

        {/* Tech Stack Pills at Top */}
        <div className="mb-2">
          <div className="flex flex-wrap gap-1">
            {sampleUser.skills.slice(0, 5).map((skill, i) => (
              <span key={i} className="text-[7px] font-mono bg-sky-50 text-sky-700 border border-sky-200/80 px-1.5 py-0.5 rounded">
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Experience */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="mb-2">
              <h5 className="font-bold text-[8px] uppercase tracking-wider text-sky-700 border-b border-sky-100 pb-0.5 mb-1.5 flex items-center justify-between">
                <span>Engineering Experience</span>
                <span className="text-[6.5px] font-mono font-normal text-slate-400">ATS 98%</span>
              </h5>
              {sampleUser.experience.map((exp, i) => (
                <div key={i} className="mb-1.5">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-[8px] text-slate-800">{exp.role}</span>
                    <span className="text-[7px] font-mono text-sky-600">{exp.duration}</span>
                  </div>
                  <p className="text-[7px] font-medium text-slate-600">{exp.company}</p>
                  <p className="text-[7px] text-slate-500 line-clamp-1 mt-0.5 font-sans">• {exp.points[0]}</p>
                </div>
              ))}
            </div>

            <div>
              <h5 className="font-bold text-[8px] uppercase tracking-wider text-sky-700 border-b border-sky-100 pb-0.5 mb-1">
                Education
              </h5>
              <p className="text-[7px] font-medium text-slate-800 truncate">{sampleUser.education}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (layoutStyle === 'ivy-rule') {
    // Dr. Eleanor Vance - Stanford Academic Serif
    return (
      <div className="relative w-full h-full bg-white flex flex-col text-[9px] font-serif leading-tight select-none pointer-events-none overflow-hidden rounded shadow-sm border border-slate-200 p-3">
        {/* Ivy Academic Header */}
        <div className="text-center pb-2 border-b-2 border-slate-900 mb-2">
          <h4 className="font-bold text-[13px] tracking-wide text-slate-900 uppercase">{sampleUser.name}</h4>
          <p className="text-[7.5px] text-slate-700 italic mt-0.5">{sampleUser.role}</p>
          <div className="text-[7px] text-slate-600 mt-1 font-sans">
            {sampleUser.email} • {sampleUser.phone} • {sampleUser.location}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="mb-2">
              <h5 className="font-bold text-[8px] uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-0.5 mb-1">
                Education & Honors
              </h5>
              <p className="text-[7px] font-semibold text-slate-900">{sampleUser.education}</p>
              <p className="text-[6.5px] text-slate-500 italic mt-0.5">Summa Cum Laude, Dean's List, NSF Graduate Fellow</p>
            </div>

            <div className="mb-2">
              <h5 className="font-bold text-[8px] uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-0.5 mb-1">
                Academic & Research Appointments
              </h5>
              {sampleUser.experience.map((exp, i) => (
                <div key={i} className="mb-1.5">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-[7.5px] text-slate-900">{exp.role}</span>
                    <span className="text-[6.5px] text-slate-600 italic">{exp.duration}</span>
                  </div>
                  <p className="text-[7px] text-slate-700">{exp.company}</p>
                  <p className="text-[6.5px] text-slate-600 line-clamp-1 mt-0.5">• {exp.points[0]}</p>
                </div>
              ))}
            </div>

            <div>
              <h5 className="font-bold text-[8px] uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-0.5 mb-1">
                Selected Research Competencies
              </h5>
              <p className="text-[7px] text-slate-700 font-sans leading-relaxed">
                {sampleUser.skills.slice(0, 4).join(' • ')}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Fallback Modern Clean Card for other archetypes (Healthcare Teal, Nordic Green, Consulting Sapphire, Creative Violet)
  return (
    <div className="relative w-full h-full bg-white flex flex-col text-[9px] font-sans leading-tight select-none pointer-events-none overflow-hidden rounded shadow-sm border border-slate-200 p-2.5">
      {/* Dynamic Header */}
      <div className="border-b pb-2 mb-2" style={{ borderColor: `${colorHex}40` }}>
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-extrabold text-[12px] tracking-tight" style={{ color: colorHex }}>
              {sampleUser.name}
            </h4>
            <p className="text-[8px] text-slate-600 font-medium">{sampleUser.role}</p>
          </div>
          <span className="text-[7px] px-1.5 py-0.5 rounded font-semibold" style={{ backgroundColor: accentBg, color: colorHex }}>
            ATS {template.atsScore}%
          </span>
        </div>
        <div className="flex items-center gap-2 text-[7px] text-slate-400 mt-1">
          <span>{sampleUser.email}</span>
          <span>•</span>
          <span>{sampleUser.location}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="mb-2">
            <h5 className="font-bold text-[8px] uppercase tracking-wider mb-1" style={{ color: colorHex }}>
              Summary
            </h5>
            <p className="text-[7px] text-slate-600 line-clamp-2 leading-relaxed">
              {sampleUser.summary}
            </p>
          </div>

          <div className="mb-2">
            <h5 className="font-bold text-[8px] uppercase tracking-wider mb-1.5" style={{ color: colorHex }}>
              Experience
            </h5>
            {sampleUser.experience.map((exp, i) => (
              <div key={i} className="mb-1.5">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-[7.5px] text-slate-800">{exp.role}</span>
                  <span className="text-[6.5px] text-slate-400">{exp.duration}</span>
                </div>
                <p className="text-[7px] font-medium" style={{ color: colorHex }}>{exp.company}</p>
                <p className="text-[7px] text-slate-500 line-clamp-1 mt-0.5">• {exp.points[0]}</p>
              </div>
            ))}
          </div>

          <div className="mb-1">
            <h5 className="font-bold text-[8px] uppercase tracking-wider mb-1" style={{ color: colorHex }}>
              Skills & Expertise
            </h5>
            <div className="flex flex-wrap gap-1">
              {sampleUser.skills.slice(0, 4).map((s, i) => (
                <span
                  key={i}
                  className="text-[6.5px] px-1.5 py-0.5 rounded font-medium"
                  style={{ backgroundColor: accentBg, color: colorHex }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-1 border-t border-slate-100">
          <p className="text-[7px] text-slate-700 font-medium truncate">{sampleUser.education}</p>
        </div>
      </div>
    </div>
  )
}
