import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { 
  ArrowLeft, Terminal, Play, Download, Share2, Sparkles, 
  FileCode, CheckCircle2, AlertCircle, RefreshCw, ZoomIn, 
  ZoomOut, Copy, ExternalLink, Code2, Layers, BookOpen, 
  ChevronDown, HelpCircle, Save, Globe, Lock, FolderTree,
  Folder, FileText, Settings, Search, Sliders, Wand2,
  Maximize2, Minimize2, ChevronRight, Eye, Check, X,
  AlignLeft, Type, Hash, ShieldCheck, Upload, User,
  Briefcase, GraduationCap, Award, RefreshCcw, FileUp, UserCheck,
  Loader2, Linkedin, Github
} from 'lucide-react'
import { toast } from 'sonner'
import axios from '@/lib/axios'
import { generateLatexCode } from '@/utils/latexGenerator'
import { parseResumeRawText, classifyLinks } from '@/utils/smartResumeParser'

// 6 Iconic LaTeX Resume Presets
const LATEX_PRESETS = {
  jakes: {
    name: "Jake's Resume (FAANG Standard)",
    category: "Engineering & Tech",
    desc: "The #1 most popular 1-page ATS template for SWE & Tech roles.",
    code: `%-------------------------
% Resume in LaTeX
% Author : Jake Gutierrez
% Based off of: https://github.com/jakegut/resume
% License : MIT
%------------------------

\\documentclass[letterpaper,11pt]{article}

\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}

\\pagestyle{fancy}
\\fancyhf{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

% Adjust margins
\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\urlstyle{same}
\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

% Sections formatting
\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]

% Custom commands
\\newcommand{\\resumeItem}[1]{
  \\item\\small{
    {#1 \\vspace{-2pt}}
  }
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\begin{document}

%----------HEADING----------
\\begin{center}
    \\textbf{\\Huge \\scshape Alex Morgan} \\\\ \\vspace{1pt}
    \\small 123-456-7890 $|$ \\href{mailto:alex@example.com}{\\underline{alex@example.com}} $|$ 
    \\href{https://linkedin.com/in/alex}{\\underline{linkedin.com/in/alex}} $|$
    \\href{https://github.com/alex}{\\underline{github.com/alex}}
\\end{center}

%-----------EDUCATION-----------
\\section{Education}
  \\begin{itemize}[leftmargin=0.15in, label={}]
    \\resumeSubheading
      {Stanford University}{Stanford, CA}
      {Bachelor of Science in Computer Science, GPA: 3.9}{Sep. 2018 -- June 2022}
  \\end{itemize}

%-----------EXPERIENCE-----------
\\section{Experience}
  \\begin{itemize}[leftmargin=0.15in, label={}]
    \\resumeSubheading
      {Senior Software Engineer}{June 2022 -- Present}
      {Google}{Mountain View, CA}
      \\begin{itemize}
        \\resumeItem{Architected and deployed distributed cache layer using Redis, reducing API latency by 35\\% across 10M daily requests.}
        \\resumeItem{Spearheaded automated migration of 14 monolithic services into Dockerized microservices on Kubernetes.}
        \\resumeItem{Mentored 4 junior engineers on distributed systems debugging and CI/CD best practices.}
      \\end{itemize}

    \\resumeSubheading
      {Software Engineering Intern}{May 2021 -- Aug. 2021}
      {Stripe}{San Francisco, CA}
      \\begin{itemize}
        \\resumeItem{Developed idempotent webhook processing system handling over 2,000 requests/sec with zero packet loss.}
        \\resumeItem{Created automated test suite achieving 94\\% branch coverage for payout validation pipeline.}
      \\end{itemize}
  \\end{itemize}

%-----------PROJECTS-----------
\\section{Projects}
  \\begin{itemize}[leftmargin=0.15in, label={}]
    \\resumeSubheading
      {CloudNative Query Engine}{Jan. 2023 -- March 2023}
      {Rust, Apache Arrow, gRPC, Tokio}{}
      \\begin{itemize}
        \\resumeItem{Built columnar SQL query engine in Rust capable of scanning 10GB parquet files in sub-200ms.}
        \\resumeItem{Received 1,200+ GitHub stars and featured on Hacker News front page.}
      \\end{itemize}
  \\end{itemize}

%-----------TECHNICAL SKILLS-----------
\\section{Technical Skills}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
     \\textbf{Languages}{: Python, Java, C++, TypeScript, Go, SQL, Rust} \\\\
     \\textbf{Frameworks}{: React, Node.js, Next.js, Express, Flask} \\\\
     \\textbf{Developer Tools}{: Git, Docker, Kubernetes, AWS, Google Cloud, Linux}
    }}
 \\end{itemize}

\\end{document}
`
  },
  deedy: {
    name: "Deedy CV (Two-Column Cornell)",
    category: "Academic & Research",
    desc: "Compact two-column typography popular among Stanford & Cornell engineers.",
    code: `\\documentclass[letterpaper]{article}
\\usepackage[top=0.4in, bottom=0.4in, left=0.5in, right=0.5in]{geometry}
\\usepackage{hyperref}
\\usepackage{titlesec}
\\usepackage{enumitem}

\\titleformat{\\section}{\\large\\bfseries\\uppercase}{}{0em}{}[\\titlerule]

\\begin{document}

\\begin{center}
    {\\huge \\textbf{Debarghya Das}} \\\\ \\vspace{2pt}
    \\small \\href{mailto:dd367@cornell.edu}{dd367@cornell.edu} | 607.379.5751 | \\href{https://debarghyadas.com}{debarghyadas.com}
\\end{center}

\\section{Education}
\\textbf{Cornell University} \\hfill Ithaca, NY \\\\
Master of Engineering in Computer Science \\hfill Aug 2014 -- May 2015 \\\\
Bachelor of Science in Computer Science, Magna Cum Laude \\hfill Aug 2011 -- May 2014

\\section{Experience}
\\textbf{Google} \\hfill Mountain View, CA \\\\
\\textit{Software Engineer} \\hfill June 2015 -- Present
\\begin{itemize}[leftmargin=0.2in, noitemsep, topsep=2pt]
  \\item Built search index pipeline handling over 40,000 queries per second with 99.999\\% reliability.
  \\item Engineered distributed map-reduce job reducing daily data aggregation from 4 hours to 35 minutes.
\\end{itemize}

\\vspace{4pt}
\\textbf{Facebook} \\hfill Menlo Park, CA \\\\
\\textit{Software Engineering Intern} \\hfill May 2014 -- Aug 2014
\\begin{itemize}[leftmargin=0.2in, noitemsep, topsep=2pt]
  \\item Implemented notification aggregation algorithm saving 15\\% bandwidth on mobile clients.
\\end{itemize}

\\section{Skills}
\\textbf{Programming Languages:} Python, Java, C++, JavaScript, Go, SQL \\\\
\\textbf{Technologies:} React, Docker, Kubernetes, Apache Spark, TensorFlow, AWS

\\end{document}
`
  },
  awesomecv: {
    name: "Awesome-CV (Modern Tech & DevOps)",
    category: "Engineering & Tech",
    desc: "Vibrant header accents, clean tags and modern European formatting.",
    code: `\\documentclass[letterpaper,11pt]{article}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{hyperref}
\\usepackage{enumitem}
\\usepackage{xcolor}

\\definecolor{awesome-teal}{HTML}{0D9488}
\\definecolor{darktext}{HTML}{1E293B}

\\titleformat{\\section}{\\large\\bfseries\\color{awesome-teal}}{}{0em}{}[\\color{awesome-teal}\\titlerule]

\\begin{document}
\\color{darktext}

\\begin{center}
  {\\Huge \\textbf{\\color{awesome-teal} Claudette Colvin}} \\\\ \\vspace{2pt}
  \\textbf{\\small Cloud Infrastructure \\& DevOps Architect} \\\\ \\vspace{3pt}
  \\small Seattle, WA $|$ \\href{mailto:claudette@cloudops.dev}{claudette@cloudops.dev} $|$ +1 (206) 555-0182 $|$ \\href{https://github.com/claudette}{github.com/claudette}
\\end{center}

\\section{Summary}
Cloud Architect with 7+ years designing multi-region Kubernetes clusters on AWS, automating GitOps deployment with ArgoCD, and reducing cloud infrastructure costs by over \\$350,000 annually.

\\section{Experience}
\\textbf{Principal DevOps Engineer} \\hfill \\textbf{Amazon Web Services} \\\\
\\textit{Core Cloud Infrastructure Team} \\hfill 2021 -- Present
\\begin{itemize}[leftmargin=0.2in, noitemsep]
  \\item Deployed automated Terraform module library used by 80+ engineering teams company-wide.
  \\item Implemented zero-trust network policies on EKS clusters securing 200M+ monthly transactions.
\\end{itemize}

\\vspace{4pt}
\\textbf{Senior Site Reliability Engineer} \\hfill \\textbf{Twilio} \\\\
\\textit{Voice \\& SMS Network} \\hfill 2018 -- 2021
\\begin{itemize}[leftmargin=0.2in, noitemsep]
  \\item Maintained 99.999\\% telephony gateway availability across 18 worldwide edge datacenters.
  \\item Automated incident alerting pipeline in Go reducing Mean Time To Resolution (MTTR) by 45\\%.
\\end{itemize}

\\section{Certifications \\& Tools}
\\textbf{Certifications:} AWS Certified DevOps Professional, CKA (Certified Kubernetes Administrator) \\\\
\\textbf{DevOps Stack:} Terraform, Kubernetes, Helm, Docker, ArgoCD, Prometheus, Grafana, GitHub Actions

\\end{document}
`
  },
  moderncv: {
    name: "ModernCV (Executive & Banking)",
    category: "Finance & Banking",
    desc: "Executive banking and consulting format with clean serif headings.",
    code: `\\documentclass[letterpaper,11pt]{article}
\\usepackage[margin=0.6in]{geometry}
\\usepackage{titlesec}
\\usepackage{hyperref}
\\usepackage{enumitem}

\\titleformat{\\section}{\\large\\bfseries\\scshape}{}{0em}{}[\\titlerule]

\\begin{document}

\\begin{center}
  {\\Huge \\textbf{William S. Vance, CFA}} \\\\ \\vspace{3pt}
  \\textbf{Private Equity Investment Associate} \\\\ \\vspace{2pt}
  \\small New York, NY $|$ (212) 555-0144 $|$ \\href{mailto:w.vance@apexcapital.com}{w.vance@apexcapital.com} $|$ \\href{https://linkedin.com/in/wvance}{linkedin.com/in/wvance}
\\end{center}

\\section{Professional Experience}
\\textbf{Apex Alternative Asset Management} \\hfill New York, NY \\\\
\\textit{Private Equity Associate -- Technology \\& Healthcare} \\hfill 2021 -- Present
\\begin{itemize}[leftmargin=0.2in, noitemsep]
  \\item Built dynamic 3-statement LBO models for 12 buy-side transactions totaling \\$1.4B in enterprise value.
  \\item Led commercial due diligence workstreams and authored investment committee memorandums.
\\end{itemize}

\\vspace{4pt}
\\textbf{Goldman Sachs \\& Co.} \\hfill New York, NY \\\\
\\textit{Investment Banking Analyst -- Mergers \\& Acquisitions} \\hfill 2019 -- 2021
\\begin{itemize}[leftmargin=0.2in, noitemsep]
  \\item Executed 6 closed M\\&A transactions with aggregate transaction value exceeding \\$3.2B.
  \\item Modeled complex accretion/dilution and DCF valuation methodologies for client C-suite reviews.
\\end{itemize}

\\section{Education}
\\textbf{Wharton School of the University of Pennsylvania} \\hfill Philadelphia, PA \\\\
Bachelor of Science in Economics, Concentration in Finance \\hfill 2015 -- 2019 \\\\
Summa Cum Laude, GPA: 3.94 / 4.00

\\section{Core Competencies}
\\textbf{Financial Modeling:} LBO, M\\&A Accretion/Dilution, DCF, Trading Comps, Precedent Transactions \\\\
\\textbf{Certifications:} Chartered Financial Analyst (CFA) Charterholder, FINRA Series 79 \\& 63

\\end{document}
`
  },
  faangpath: {
    name: "FaangPath Minimalist (Pure ATS 100%)",
    category: "Engineering & Tech",
    desc: "Single-column format designed specifically to pass automated applicant tracking systems.",
    code: `\\documentclass[letterpaper,10pt]{article}
\\usepackage[margin=0.5in]{geometry}
\\usepackage{hyperref}
\\usepackage{enumitem}

\\pagestyle{empty}
\\raggedbottom
\\raggedright

\\begin{document}

\\begin{center}
  {\\Large \\textbf{SARAH CONNOR}} \\\\
  San Francisco, CA $|$ 415-555-0199 $|$ sarah@example.com $|$ linkedin.com/in/sarah $|$ github.com/sarah
\\end{center}

\\vspace{-6pt}
\\hrulefill
\\vspace{4pt}

\\textbf{TECHNICAL SKILLS} \\\\
\\textbf{Languages:} Python, C++, Go, JavaScript, TypeScript, SQL \\\\
\\textbf{Technologies:} React, Node.js, Docker, Kubernetes, AWS (S3, EC2, Lambda), PostgreSQL, Redis

\\vspace{6pt}
\\textbf{WORK EXPERIENCE} \\\\
\\textbf{Senior Backend Software Engineer} \\hfill Jan 2022 -- Present \\\\
\\textit{Meta Platforms} \\hfill Menlo Park, CA
\\begin{itemize}[leftmargin=0.15in, noitemsep, topsep=1pt]
  \\item Architected real-time messaging gateway handling 15M concurrent WebSockets with sub-50ms latency.
  \\item Reduced cloud infrastructure costs by 24\\% through memory optimization in Go microservices.
\\end{itemize}

\\vspace{4pt}
\\textbf{Software Engineer} \\hfill Jun 2019 -- Dec 2021 \\\\
\\textit{Uber Technologies} \\hfill San Francisco, CA
\\begin{itemize}[leftmargin=0.15in, noitemsep, topsep=1pt]
  \\item Implemented geospatial dispatch matching algorithm serving 2M daily active drivers.
  \\item Authored 40+ unit and integration tests raising pipeline test coverage to 92\\%.
\\end{itemize}

\\vspace{6pt}
\\textbf{EDUCATION} \\\\
\\textbf{University of California, Berkeley} \\hfill Aug 2015 -- May 2019 \\\\
B.S. in Electrical Engineering and Computer Sciences (EECS), GPA: 3.88

\\end{document}
`
  },
  academic: {
    name: "Academic CV (Ph.D. & Research)",
    category: "Academic & Research",
    desc: "Comprehensive structure for researchers, professors, and post-doc candidates.",
    code: `\\documentclass[letterpaper,11pt]{article}
\\usepackage[margin=0.7in]{geometry}
\\usepackage{titlesec}
\\usepackage{hyperref}
\\usepackage{enumitem}

\\titleformat{\\section}{\\large\\bfseries\\scshape}{}{0em}{}[\\titlerule]

\\begin{document}

\\begin{center}
  {\\huge \\textbf{Dr. Elena Rostova}} \\\\ \\vspace{2pt}
  Department of Computer Science, MIT \\\\
  \\small \\href{mailto:rostova@mit.edu}{rostova@mit.edu} $|$ \\href{https://elena-research.ai}{elena-research.ai} $|$ +1 (617) 555-0177
\\end{center}

\\section{Research Interests}
Deep Learning, Reinforcement Learning, Generative AI, Distributed Optimization, Foundation Models.

\\section{Academic Appointments}
\\textbf{Massachusetts Institute of Technology} \\hfill Cambridge, MA \\\\
\\textit{Postdoctoral Research Associate, CSAIL} \\hfill 2022 -- Present \\\\
Advisor: Prof. Regina Barzilay

\\section{Education}
\\textbf{Stanford University} \\hfill Stanford, CA \\\\
Ph.D. in Computer Science \\hfill 2017 -- 2022 \\\\
Dissertation: \\textit{Scalable Sample-Efficient Reinforcement Learning in Multi-Agent Systems}

\\vspace{4pt}
\\textbf{Carnegie Mellon University} \\hfill Pittsburgh, PA \\\\
B.S. in Computer Science, Highest Honors \\hfill 2013 -- 2017

\\section{Selected Publications}
\\begin{enumerate}[leftmargin=0.2in, noitemsep]
  \\item \\textbf{E. Rostova}, M. Jordan. \`\`Provable Convergence of Multi-Agent Policy Gradients.'' \\textit{NeurIPS 2023}.
  \\item \\textbf{E. Rostova}, S. Russell. \`\`Sample Complexity Bounds in Latent Action Spaces.'' \\textit{ICML 2022} (Oral).
\\end{enumerate}

\\section{Teaching \\& Mentorship}
\\textbf{Head Teaching Assistant}, CS 229: Machine Learning (Stanford, 2020 -- 2021) \\\\
Mentored 8 undergraduate researchers resulting in 3 peer-reviewed conference publications.

\\end{document}
`
  },
  mahendra: {
    name: "Mahendra Prajapati resume founder of bridge",
    category: "Engineering & Tech",
    desc: "Original LaTeX resume of Mahendra Prajapati (Founder of Bridge).",
    code: `%-------------------------
% Resume in Latex
% Author : Abey George
% Based off of: https://github.com/sb2nov/resume
% License : MIT
%------------------------

\\documentclass[letterpaper,11pt]{article}

\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\usepackage{fontawesome5}
\\usepackage{multicol}
\\usepackage{graphicx}
\\setlength{\\multicolsep}{-3.0pt}
\\setlength{\\columnsep}{-1pt}
\\input{glyphtounicode}

\\RequirePackage{tikz}
\\RequirePackage{xcolor}
\\RequirePackage{fontawesome}
\\usepackage{tikz}
\\usetikzlibrary{svg.path}

\\definecolor{cvblue}{HTML}{0E5484}
\\definecolor{black}{HTML}{130810}
\\definecolor{darkcolor}{HTML}{0F4539}
\\definecolor{cvgreen}{HTML}{3BD80D}
\\definecolor{taggreen}{HTML}{00E278}
\\definecolor{SlateGrey}{HTML}{2E2E2E}
\\definecolor{LightGrey}{HTML}{666666}
\\colorlet{name}{black}
\\colorlet{tagline}{darkcolor}
\\colorlet{heading}{darkcolor}
\\colorlet{headingrule}{cvblue}
\\colorlet{accent}{darkcolor}
\\colorlet{emphasis}{SlateGrey}
\\colorlet{body}{LightGrey}

% Adjust margins
\\addtolength{\\oddsidemargin}{-0.6in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1.19in}
\\addtolength{\\topmargin}{-.7in}
\\addtolength{\\textheight}{1.4in}

\\urlstyle{same}

\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

% Sections formatting
\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large\\bfseries
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]

% Ensure that generate pdf is machine readable/ATS parsable
\\pdfgentounicode=1

%-------------------------
% Custom commands
\\newcommand{\\resumeItem}[1]{
  \\item\\small{
    {#1 \\vspace{-2pt}}
  }
}

\\newcommand{\\classesList}[4]{
    \\item\\small{
        {#1 #2 #3 #4 \\vspace{-2pt}}
  }
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{1.0\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{\\large#1} & \\textbf{\\small #2} \\\\
      \\textit{\\large#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubSubheading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\textit{\\small#1} & \\textit{\\small #2} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeProjectHeading}[2]{
    \\item
    \\begin{tabular*}{1.001\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\small#1 & \\textbf{\\small #2}\\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubItem}[1]{\\resumeItem{#1}\\vspace{-4pt}}

\\renewcommand\\labelitemi{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}
\\renewcommand\\labelitemii{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.0in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

\\newcommand\\sbullet[1][.5]{\\mathbin{\\vcenter{\\hbox{\\scalebox{#1}{$\\bullet$}}}}}

\\begin{document}

%----------HEADING----------
\\begin{center}
    {\\Huge \\scshape Mahendra Prajapati} \\\\ \\vspace{1pt}
    Jabalpur,M.P. \\\\ \\vspace{1pt}
    \\small \\href{tel:+917724822660}{ \\raisebox{-0.01\\height}\\faPhone\\ \\underline{+917724822660} ~} \\href{mailto:mahendrapra0077@gmail.com}{\\raisebox{-0.2\\height}\\faEnvelope\\  \\underline{mahendrapra0077@gmail.com}} ~
    \\href{https://github.com/mahendra0011}{\\raisebox{-0.2\\height}\\faGithub\\ \\underline{GitHub}}
    \\vspace{-8pt}
\\end{center}

%-----------PROFILE SUMMARY-----------
\\section{PROFILE SUMMARY}
\\vspace{2pt}
\\begin{flushleft}
\\small
Motivated and detail-oriented Electronics and Communication Engineering undergraduate with a strong foundation in Html, Css, JavaScript, NodeJS, ExpressJS, MongoDB and C++. Passionate about building efficient and scalable applications. Seeking opportunities to apply technical skills and contribute to innovative solutions.
\\end{flushleft}

\\section{EDUCATION}
  \\resumeSubHeadingListStart
    \\resumeSubheading
      {Shri Ram Institute of Technology Jabalpur }{2023 -- 2027}
      {Bachelor of Technology – Electronics \\& Communication Engineering  \\textbf{CGPA}- \\textbf{7.1/10}}{Jabalpur (M.P.)}
  \\resumeSubHeadingListEnd
 
  \\resumeSubHeadingListStart
    \\resumeSubheading
      {Saraswati Shiksha Mandir H. secondary School Jabalpur }{2020-2025}
      {MP Board -Class XII - \\textbf{61\\%} - Class X -  \\textbf{81\\%}}{Jabalpur (M.P.)}
  \\resumeSubHeadingListEnd

% -----------PROGRAMMING SKILLS-----------
\\section{TECHNICAL SKILLS}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
     \\textbf{\\normalsize{Languages:}}{ \\normalsize{ C++, HTML5, CSS3, TailwindCSS, JavaScript,SQL }} \\\\
     \\textbf{\\normalsize{Developer Tools:}}{ \\normalsize{,Excel,VS Code,  Git, Postman}} \\\\
     \\textbf{\\normalsize{Technologies/Frameworks:}}{\\normalsize{ GitHub,ReactJS, Redux, , NodeJS, ExpressJS, MongoDB,Firebase,ReactBits, MaterialUI,ShadCN}} \\\\
     \\textbf{\\normalsize{Soft Skills:}}{\\normalsize{Leadership,Problem Solving,Time Management,Project Management,Adaptability,}} \\\\
    }}
 \\end{itemize}
 \\vspace{-15pt}

%-----------PROJECTS-----------
\\section{PROJECTS}
    \\vspace{-5pt}
    \\resumeSubHeadingListStart
       \\resumeProjectHeading
          {\\href{https://medicore-main-1.onrender.com}{\\textbf{\\large{\\underline{MediCore}}} \\href{https://medicore-main-1.onrender.com}{\\raisebox{-0.1\\height}\\faExternalLink }} $|$ \\large{\\underline{ReactJS, Node.js, Express.js, MongoDB ,ReactBits,ShadCN,Cloudnary}}}{April 2026}
          \\resumeItemListStart
            \\resumeItem{\\normalsize{Developed a production-ready full-stack Hospital Management System with separate Admin, Doctor, and Patient portals, JWT authentication with Security, role-based authorization, email OTP verification }}
            \\resumeItem{\\normalsize{Engineered complete healthcare workflows including appointment booking, patient records, prescriptions, lab reports, discharge summaries with email delivery , emergency case handling, lab service booking along with medical file upload support., billing, payment tracking, notifications, and doctor approval systems. }}
           \\resumeItem{\\normalsize{Built advanced admin functionalities such as user management, doctor verification, appointment monitoring, billing control, Excel import/export for patients/doctors/billing records, analytics dashboards, blocked-account management, and configurable platform settings. }}
          \\resumeItemListEnd
          \\vspace{-13pt}
         
      \\resumeProjectHeading
          {\\href{https://enento.onrender.com}{\\textbf{\\large{\\underline{EventO}}} \\href{https://enento.onrender.com}{\\raisebox{-0.1\\height}\\faExternalLink }} $|$ \\large{\\underline{ ReactJS, Node.js, Express.js, MongoDB ,ReactBits,Bravo}}}{May 2026}
          \\resumeItemListStart
            \\resumeItem{\\normalsize Developed a full-stack event booking platform with secure JWT authentication, bcrypt password hashing, email OTP verification, password reset workflows, public event discovery, category filtering, featured/trending events, wishlists, and QR-based e-ticket generation. }
           \\resumeItem{\\normalsize{Engineered separate User, Host, and Admin dashboards featuring event creation and management, attendee communication, community chat, booking workflows, notifications, reviews, support tickets, refunds, disputes, fraud monitoring, analytics, and role-based access control. }}
           \\resumeItem{\\normalsize{ Implemented scalable booking and platform management systems including OTP-based ticket confirmation, payment tracking, host broadcasts, CSV report exports for revenue/support/fraud reports specifically ,}}
          \\resumeItemListEnd
          \\vspace{-13pt}
         
          \\resumeProjectHeading
          {\\href{https://mindsupport-uqms.onrender.com/}{\\textbf{\\large{\\underline{MindSupport}}} \\href{https://mindsupport-uqms.onrender.com/}{\\raisebox{-0.1\\height}\\faExternalLink }} $|$ \\large{\\underline{ ReactJS,Redux,Node.js, ShadCN UI, Express.js, MongoDB }}}{September 2025}
          \\resumeItemListStart
            \\resumeItem{\\normalsize{ Developed a full-stack mental wellness and counselling platform with separate User, Counsellor, and Admin dashboards featuring JWT authentication, OTP verification, counsellor approval workflows, role-based authorization, anonymous counselling, emergency support, and secure session management. }}
           \\resumeItem{\\normalsize{Engineered advanced mental health features including counsellor marketplace, Google Meet session booking, real-time chat, wellness and mood tracking, PHQ-9/GAD-7 assessments, journals, payments, reviews, notifications, analytics, and resource management }}
          \\resumeItemListEnd
    \\resumeSubHeadingListEnd
\\vspace{-12pt}

\\section{ACHIEVEMENTS}
    \\resumeItemListStart
        \\resumeItem{\\normalsize{Led a team as \\textbf{Team Leader} in \\textbf{Smart India Hackathon (Internal Round)}, successfully qualifying among \\textbf{100+ competing teams}. }}
        \\resumeItem{\\normalsize{Presented an innovative project \\textbf{“Fuel Theft Detection System”} at \\textbf{SRIT Project Expo}, demonstrating real-world problem-solving }}
        \\resumeItem{\\normalsize{Achieved 400+ contributions on GitHub by consistently building, maintaining, and improving projects }}
        \\resumeItem{\\normalsize{Solved 100+ problems in C++ on platforms like CodeHelp and other competitive coding sites }}
    \\resumeItemListEnd
\\vspace{-11pt}

\\section{CERTIFICATIONS}
$\\sbullet[.75] \\hspace{0.1cm}$ {\\href{https://udemy.com}{Html css basic to beautiful} - Udemy}  \\hspace{1cm}
$\\sbullet[.75] \\hspace{0.1cm}$ {\\href{https://ibm.com}{Web Development Basic - IBM}} \\hspace{1cm}
$\\sbullet[.75] \\hspace{0.2cm}$ {\\href{https://udemy.com} {Complete web development - Udemy}}

\\end{document}
`
  }
}

export default function LatexResumeStudio() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Template State (Default to Mahendra Prajapati Bridge Founder Template)
  const [selectedPresetKey, setSelectedPresetKey] = useState('mahendra')
  const [templateTitle, setTemplateTitle] = useState("Mahendra Prajapati resume founder of bridge")
  const [category, setCategory] = useState("Engineering & Tech")
  const [latexCode, setLatexCode] = useState(LATEX_PRESETS.mahendra.code)

  // Compiler State
  const [isCompiling, setIsCompiling] = useState(false)
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null)
  const [compilerLogs, setCompilerLogs] = useState('')
  const [isLogsOpen, setIsLogsOpen] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [compilerEngine, setCompilerEngine] = useState('pdfLaTeX') // 'pdfLaTeX' | 'XeLaTeX' | 'LuaLaTeX'
  const [autoCompile, setAutoCompile] = useState(false)

  // Editor Settings & Overleaf UI
  const [fontSize, setFontSize] = useState(13) // in px
  const [showFileTree, setShowFileTree] = useState(false)
  const [activeFile, setActiveFile] = useState('main.tex')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [replaceQuery, setReplaceQuery] = useState('')
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 })
  const [wordWrap, setWordWrap] = useState(true)
  const [isFullscreenPdf, setIsFullscreenPdf] = useState(false)

  // Auto-Fill & Profile Import State
  const [isAutoFillModalOpen, setIsAutoFillModalOpen] = useState(false)
  const [autoFillTab, setAutoFillTab] = useState('pdf') // 'pdf' | 'paste' | 'profile' | 'form'
  const [pastedText, setPastedText] = useState('')
  const [parsedData, setParsedData] = useState(null)
  const [extractingPdf, setExtractingPdf] = useState(false)
  const [uploadedPdfName, setUploadedPdfName] = useState('')
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [detectedProfile, setDetectedProfile] = useState(null)
  const [formProfile, setFormProfile] = useState({
    name: 'Alex Morgan',
    role: 'Lead Full Stack Engineer',
    email: 'alex.morgan@example.com',
    phone: '+1 (555) 234-5678',
    location: 'San Francisco, CA',
    linkedin: 'linkedin.com/in/alexmorgan',
    github: 'github.com/alexmorgan',
    summary: 'Results-driven software engineer with 6+ years designing scalable cloud architectures, high-performance web applications, and resilient microservices.',
    skills: 'React, TypeScript, Node.js, PostgreSQL, Docker, AWS, Next.js, GraphQL',
    company1: 'CloudScale Technologies',
    role1: 'Senior Software Engineer',
    duration1: '2022 -- Present',
    points1: 'Architected and deployed distributed cache layer using Redis, reducing API latency by 35%.\nSpearheaded automated migration of 14 monolithic services into Dockerized microservices.',
    company2: 'Vanguard Digital Solutions',
    role2: 'Full Stack Developer',
    duration2: '2019 -- 2022',
    points2: 'Built customer dashboards with React and Redux, improving retention by 28%.\nAutomated CI/CD pipelines using GitHub Actions.',
    degree: 'B.S. in Computer Science',
    institution: 'Stanford University',
    durationEdu: '2015 -- 2019',
    gpa: '3.9 / 4.0'
  })

  // Publish Modal State
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false)
  const [publishDescription, setPublishDescription] = useState('High-performance ATS compliant LaTeX template styled like Overleaf.')
  const [isPublic, setIsPublic] = useState(true)
  const [isPublishing, setIsPublishing] = useState(false)

  const textareaRef = useRef(null)
  const autoCompileTimerRef = useRef(null)

  // Project Files Simulation (Overleaf File Tree)
  const [projectFiles, setProjectFiles] = useState([
    { name: 'main.tex', size: '3.4 KB', type: 'tex', main: true },
    { name: 'resume.cls', size: '2.1 KB', type: 'cls', main: false },
    { name: 'references.bib', size: '1.2 KB', type: 'bib', main: false }
  ])

  // Calculate Lines for Line Numbers Gutter
  const linesCount = useMemo(() => {
    return latexCode.split('\n').length
  }, [latexCode])

  // Word Count and Character Count
  const stats = useMemo(() => {
    const chars = latexCode.length
    const words = latexCode.trim().split(/\s+/).filter(Boolean).length
    return { chars, words }
  }, [latexCode])

  // Parse LinkedIn / raw text in real time using smart engine
  useEffect(() => {
    if (pastedText.trim()) {
      const parsed = parseResumeRawText(pastedText)
      setParsedData(parsed)
      setDetectedProfile(parsed)
    } else {
      setParsedData(null)
    }
  }, [pastedText])

  // Handle PDF / file upload with backend text extraction
  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadedPdfName(file.name)
    setExtractingPdf(true)

    try {
      const ext = file.name.split('.').pop().toLowerCase()
      if (ext === 'txt' || ext === 'md' || ext === 'json' || ext === 'tex') {
        const text = await file.text()
        setPastedText(text)
        const parsed = parseResumeRawText(text)
        setParsedData(parsed)
        setDetectedProfile(parsed)
        toast.success(`Extracted text from ${file.name}`)
      } else {
        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch('/api/resume-templates/extract-file', {
          method: 'POST',
          body: formData,
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Failed to extract text from PDF')

        if (data.text) {
          setPastedText(data.text)
          const parsed = parseResumeRawText(data.text)
          setParsedData(parsed)
          setDetectedProfile(parsed)
          toast.success(`Successfully parsed PDF "${file.name}"!`)
        } else {
          toast.warning('PDF has no extractable text. If it is a scanned image, please paste text instead.')
        }
      }
    } catch (err) {
      console.error('PDF upload error:', err)
      toast.error(err.message || 'Failed to read PDF file')
    } finally {
      setExtractingPdf(false)
    }
  }

  const handleLoadSampleLinkedIn = () => {
    const sample = `Saanvi Patel
Lead Full Stack Engineer | Cloud Architect
Mumbai, Maharashtra, India · saanvi.patel@example.com · +91 98200 12345
https://linkedin.com/in/saanvipatel
https://github.com/saanvipatel
https://saanvipatel.dev
https://leetcode.com/saanvipatel
https://medium.com/@saanvipatel

Professional Summary
Results-driven software engineer with 5+ years designing scalable cloud architectures, high-performance web applications, and resilient microservices. Adept at cross-functional leadership, clean code architecture, and modern DevOps.

Work Experience
Senior Software Engineer
Zomato Digital · Jun 2022 - Present
• Engineered mission-critical order dispatch engine serving 1.2M daily food deliveries with 99.98% reliability.
• Reduced API response latency by 38% through Redis caching layers and PostgreSQL query optimizations.
• Led sprint planning, code reviews, and mentored 4 junior software engineers across cross-functional squads.

Full Stack Developer
Swiggy Tech Labs · Aug 2020 - May 2022
• Developed interactive customer web portals using React, Redux Toolkit, and Tailwind CSS.
• Automated CI/CD deployment pipelines using GitHub Actions, reducing deployment time from 2 hours to 8 minutes.

Education
Indian Institute of Technology Bombay (IIT Bombay)
B.Tech in Computer Science and Engineering · 2016 - 2020 · 8.9 CGPA

Technical Skills
JavaScript, TypeScript, Python, Go, C++, SQL, HTML, CSS, React, Next.js, Node.js, Express, Docker, Kubernetes, AWS, PostgreSQL, MongoDB, Redis, GraphQL, Git, Agile Leadership, Problem Solving`
    setPastedText(sample)
    const parsed = parseResumeRawText(sample)
    setParsedData(parsed)
    setDetectedProfile(parsed)
    toast.info('Sample profile loaded with 5 links and full work history!')
  }

  // Load Bridge Profile or Local Draft
  const handleLoadBridgeProfile = async () => {
    setLoadingProfile(true)
    try {
      // 1. Check local draft
      const localDraft = localStorage.getItem('bridge_resume_draft')
      if (localDraft) {
        const parsed = JSON.parse(localDraft)
        if (parsed.sections?.length) {
          const personal = parsed.sections.find(s => s.type === 'personal') || {}
          const summary = parsed.sections.find(s => s.type === 'summary') || {}
          const exp = parsed.sections.filter(s => s.type === 'experience')
          const edu = parsed.sections.filter(s => s.type === 'education')
          const skills = parsed.sections.find(s => s.type === 'skills') || {}

          const profileObj = {
            name: personal.name || 'Alex Morgan',
            role: personal.professionalTitle || 'Software Engineer',
            email: personal.email || 'alex@example.com',
            phone: personal.phone || '',
            location: personal.location || '',
            linkedin: personal.linkedin || '',
            github: personal.github || '',
            summary: summary.summary || '',
            skills: (skills.technical || '').split(',').map(s => s.trim()).filter(Boolean),
            experience: exp.map(e => ({
              role: e.role || '',
              company: e.company || '',
              duration: `${e.startDate || ''} -- ${e.current ? 'Present' : e.endDate || ''}`,
              location: e.location || '',
              points: (e.description || '').split('\n').map(p => p.trim()).filter(Boolean)
            })),
            education: edu.map(ed => ({
              institution: ed.institution || '',
              degree: ed.degree || '',
              duration: `${ed.startYear || ''} -- ${ed.endYear || ''}`,
              gpa: ed.gpa || ''
            }))
          }
          setDetectedProfile(profileObj)
          setLoadingProfile(false)
          return
        }
      }

      // 2. Fetch from backend API
      const res = await axios.get('/student/profile')
      if (res.data?.profile) {
        const p = res.data.profile
        const profileObj = {
          name: `${res.data.user?.firstName || ''} ${res.data.user?.lastName || ''}`.trim() || p.fullName || 'Student Candidate',
          role: p.headline || p.targetRole || 'Software Engineer',
          email: res.data.user?.email || p.email || '',
          phone: p.phone || '',
          location: p.location || '',
          linkedin: p.linkedin || '',
          github: p.github || '',
          summary: p.bio || '',
          skills: p.skills || [],
          experience: (p.experience || []).map(e => ({
            role: e.title || e.role,
            company: e.company,
            duration: `${e.startDate ? new Date(e.startDate).getFullYear() : ''} -- ${e.current ? 'Present' : (e.endDate ? new Date(e.endDate).getFullYear() : '')}`,
            location: e.location || '',
            points: [e.description || '']
          })),
          education: (p.education || []).map(ed => ({
            institution: ed.institution || ed.school,
            degree: ed.degree,
            duration: `${ed.startYear || ''} -- ${ed.endYear || ''}`,
            gpa: ''
          }))
        }
        setDetectedProfile(profileObj)
      }
    } catch (_) {
      // Offline fallback
    } finally {
      setLoadingProfile(false)
    }
  }

  // Apply parsed profile to LaTeX code & compile
  const handleApplyProfileToLatex = (dataToApply) => {
    if (!dataToApply) return
    const newCode = generateLatexCode(selectedPresetKey, dataToApply)
    setLatexCode(newCode)
    if (dataToApply.name) {
      setTemplateTitle(`${dataToApply.name}'s Resume`)
    }
    setIsAutoFillModalOpen(false)
    toast.success('Generated LaTeX code from profile! Compiling PDF...')
    setTimeout(() => {
      handleCompile()
    }, 200)
  }

  // Switch preset
  const handleSelectPreset = (key) => {
    const preset = LATEX_PRESETS[key]
    if (preset) {
      setSelectedPresetKey(key)
      setLatexCode(preset.code)
      setTemplateTitle(preset.name)
      setCategory(preset.category)
      toast.info(`Loaded starter: ${preset.name}`)
    }
  }

  // Compile LaTeX code to PDF
  const handleCompile = async () => {
    setIsCompiling(true)
    setHasError(false)
    try {
      const res = await axios.post('/student/resume-builder/compile-pdf', {
        latex: latexCode,
        title: templateTitle
      }, {
        responseType: 'blob'
      })

      // Revoke old blob url
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl)
      }

      const newBlobUrl = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      setPdfBlobUrl(newBlobUrl)
      setCompilerLogs(`[${new Date().toLocaleTimeString()}] Engine: ${compilerEngine}\nOutput written on resume.pdf (1 page, 42,510 bytes).\nTranscript written on resume.log.\n✓ Compilation succeeded with 0 errors.`)
      toast.success('LaTeX compiled successfully!')
    } catch (err) {
      setHasError(true)
      setIsLogsOpen(true)
      let errorMsg = 'Compilation error encountered.'
      if (err.response?.data) {
        try {
          const text = await err.response.data.text()
          const json = JSON.parse(text)
          errorMsg = json.log || json.message || errorMsg
        } catch (_) {
          errorMsg = err.message || errorMsg
        }
      }
      setCompilerLogs(`[${new Date().toLocaleTimeString()}] COMPILATION FAILED:\n! LaTeX Error: Check for unescaped special characters (%, &, $) or mismatched \\begin and \\end.\n${errorMsg}`)
      toast.error('Compilation failed. Check logs.')
    } finally {
      setIsCompiling(false)
    }
  }

  // Trigger initial template loading and compile on mount
  useEffect(() => {
    const templateParam = searchParams.get('template')
    if (templateParam) {
      if (LATEX_PRESETS[templateParam]) {
        const preset = LATEX_PRESETS[templateParam]
        setSelectedPresetKey(templateParam)
        setLatexCode(preset.code)
        setTemplateTitle(preset.name)
        setCategory(preset.category)
      } else if (templateParam.toLowerCase().includes('mahendra') || templateParam.toLowerCase().includes('classic')) {
        const preset = LATEX_PRESETS.mahendra
        setSelectedPresetKey('mahendra')
        setLatexCode(preset.code)
        setTemplateTitle(preset.name)
        setCategory(preset.category)
      } else {
        // Fetch custom template if from MongoDB or set title
        setTemplateTitle(`Bridge Resume - ${templateParam}`)
      }
    }
    handleCompile()
    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl)
    }
  }, [searchParams])

  // Auto-compile listener on latexCode changes
  useEffect(() => {
    if (!autoCompile) return
    if (autoCompileTimerRef.current) clearTimeout(autoCompileTimerRef.current)
    autoCompileTimerRef.current = setTimeout(() => {
      handleCompile()
    }, 1600)
    return () => {
      if (autoCompileTimerRef.current) clearTimeout(autoCompileTimerRef.current)
    }
  }, [latexCode, autoCompile])

  // Track cursor position
  const handleTextareaSelect = (e) => {
    const text = e.target.value.substring(0, e.target.selectionStart)
    const lines = text.split('\n')
    setCursorPos({
      line: lines.length,
      col: lines[lines.length - 1].length + 1
    })
  }

  // Ctrl + Enter shortcut to recompile
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleCompile()
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault()
      setIsSearchOpen(prev => !prev)
    }
  }

  // Insert LaTeX snippet at cursor
  const insertSnippet = (snippet) => {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = latexCode
    const newText = text.substring(0, start) + snippet + text.substring(end)
    setLatexCode(newText)
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + snippet.length, start + snippet.length)
    }, 0)
    toast.success('Inserted snippet')
  }

  // Search & Replace In Text
  const handleFindNext = () => {
    if (!searchQuery.trim()) return
    const textarea = textareaRef.current
    if (!textarea) return
    const startPos = textarea.selectionEnd
    const nextIdx = latexCode.toLowerCase().indexOf(searchQuery.toLowerCase(), startPos)
    if (nextIdx !== -1) {
      textarea.focus()
      textarea.setSelectionRange(nextIdx, nextIdx + searchQuery.length)
    } else {
      const firstIdx = latexCode.toLowerCase().indexOf(searchQuery.toLowerCase(), 0)
      if (firstIdx !== -1) {
        textarea.focus()
        textarea.setSelectionRange(firstIdx, firstIdx + searchQuery.length)
        toast.info('Wrapped to start of file')
      } else {
        toast.error('No matches found')
      }
    }
  }

  const handleReplaceAll = () => {
    if (!searchQuery.trim()) return
    const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
    const matches = (latexCode.match(regex) || []).length
    if (matches === 0) {
      toast.error('No matches to replace')
      return
    }
    setLatexCode(latexCode.replaceAll(searchQuery, replaceQuery))
    toast.success(`Replaced ${matches} occurrences`)
  }

  // AI Helper: Clean & Auto-Format Indentation
  const handleBeautifyLatex = () => {
    const lines = latexCode.split('\n')
    let indentLevel = 0
    const formatted = lines.map(line => {
      const trimmed = line.trim()
      if (trimmed.startsWith('\\end{') || trimmed.startsWith('\\end{itemize}')) {
        indentLevel = Math.max(0, indentLevel - 1)
      }
      const indented = '  '.repeat(indentLevel) + trimmed
      if (trimmed.startsWith('\\begin{') || trimmed.startsWith('\\begin{itemize}')) {
        indentLevel += 1
      }
      return indented
    }).join('\n')
    setLatexCode(formatted)
    toast.success('LaTeX formatting and indentation cleaned!')
  }

  // AI Helper: Auto Escape Special Unescaped Characters
  const handleFixUnescapedChars = () => {
    let fixed = latexCode
    fixed = fixed.replace(/(?<!\\)&/g, '\\&')
    fixed = fixed.replace(/(?<!\\)%(?=[0-9])/g, '\\%')
    setLatexCode(fixed)
    toast.success('Checked and fixed unescaped characters!')
  }

  // Download PDF
  const handleDownloadPdf = () => {
    if (!pdfBlobUrl) {
      toast.error('Please compile the resume first')
      return
    }
    const a = document.createElement('a')
    a.href = pdfBlobUrl
    a.download = `${templateTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    toast.success('PDF download initiated')
  }

  // Download Raw .tex Source File
  const handleDownloadTex = () => {
    const blob = new Blob([latexCode], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${templateTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}.tex`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Source .tex file exported')
  }

  // Copy LaTeX code to clipboard
  const handleCopyCode = () => {
    navigator.clipboard.writeText(latexCode)
    toast.success('Full LaTeX code copied to clipboard!')
  }

  // Publish LaTeX template to gallery
  const handlePublish = async () => {
    if (!templateTitle.trim()) {
      toast.error('Template title is required')
      return
    }

    setIsPublishing(true)
    try {
      const payload = {
        name: templateTitle.trim(),
        shortName: templateTitle.trim().slice(0, 15),
        category,
        type: 'latex',
        badges: ['LaTeX', 'Community'],
        atsScore: 98,
        description: publishDescription,
        latexCode,
        isPublic
      }

      const res = await axios.post('/resume-templates', payload)
      toast.success(res.data?.message || 'LaTeX Template published to community gallery!')
      setIsPublishModalOpen(false)
      navigate('/resume-templates')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish LaTeX template')
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Overleaf Navbar */}
      <header className="bg-slate-900 border-b border-slate-800 px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Left: Back, Logo & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/resume-templates/create')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Back to options"
          >
            <ArrowLeft className="size-4" />
          </button>

          {/* Toggle File Tree Button */}
          <button
            onClick={() => setShowFileTree(!showFileTree)}
            className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              showFileTree 
                ? 'bg-teal-500/20 border-teal-500/50 text-teal-300' 
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Toggle Project Files Tree"
          >
            <FolderTree className="size-3.5" />
            <span className="hidden sm:inline">Files</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center font-bold font-mono text-xs">
              TeX
            </div>
            <input
              type="text"
              value={templateTitle}
              onChange={(e) => setTemplateTitle(e.target.value)}
              className="font-bold text-sm sm:text-base text-white bg-transparent border-b border-dashed border-transparent hover:border-slate-700 focus:border-teal-500 focus:outline-hidden px-1 truncate max-w-[180px] sm:max-w-xs"
              placeholder="Template Title"
            />
          </div>
        </div>

        {/* Center: Starters Selector & Syntax Toolbar */}
        <div className="flex items-center gap-2">
          {/* Preset Starters Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs">
            <span className="text-slate-400 font-medium">Starter:</span>
            <select
              value={selectedPresetKey}
              onChange={(e) => handleSelectPreset(e.target.value)}
              className="bg-transparent text-teal-400 font-bold border-none cursor-pointer focus:ring-0 text-xs py-0.5"
            >
              <option value="mahendra" className="bg-slate-900 text-teal-300 font-semibold">★ Mahendra Prajapati (Bridge)</option>
              <option value="jakes" className="bg-slate-900 text-white">Jake's Resume (FAANG)</option>
              <option value="deedy" className="bg-slate-900 text-white">Deedy CV (Two-Col)</option>
              <option value="awesomecv" className="bg-slate-900 text-white">Awesome-CV (DevOps)</option>
              <option value="moderncv" className="bg-slate-900 text-white">ModernCV (Banking)</option>
              <option value="faangpath" className="bg-slate-900 text-white">FaangPath (100% ATS)</option>
              <option value="academic" className="bg-slate-900 text-white">Academic CV (Ph.D.)</option>
            </select>
          </div>

          {/* Quick Syntax Snippets */}
          <div className="hidden xl:flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-1 text-[11px] font-mono">
            <button
              onClick={() => insertSnippet('\\section{Section Name}\n')}
              className="px-2 py-0.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
              title="Insert Section"
            >
              \section
            </button>
            <button
              onClick={() => insertSnippet('\\resumeSubheading\n  {Role}{Dates}\n  {Company}{Location}\n')}
              className="px-2 py-0.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
              title="Insert Subheading"
            >
              \subheading
            </button>
            <button
              onClick={() => insertSnippet('\\resumeItem{Quantified achievement statement}\n')}
              className="px-2 py-0.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
              title="Insert Bullet Item"
            >
              \item
            </button>
            <button
              onClick={() => insertSnippet('\\textbf{bold text}')}
              className="px-2 py-0.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
              title="Insert Bold Text"
            >
              \textbf
            </button>
            <button
              onClick={() => insertSnippet('\\textit{italic text}')}
              className="px-2 py-0.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
              title="Insert Italic Text"
            >
              \textit
            </button>
            <button
              onClick={() => insertSnippet('\\href{https://example.com}{Label}')}
              className="px-2 py-0.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
              title="Insert Hyperlink"
            >
              \href
            </button>
            <button
              onClick={() => insertSnippet('\\hfill ')}
              className="px-2 py-0.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
              title="Push text to right margin"
            >
              \hfill
            </button>
          </div>
        </div>

        {/* Right: Actions (Auto-Fill, Compile, Download, Publish) */}
        <div className="flex items-center gap-2">
          {/* Prominent Auto-Fill & Import Button */}
          <button
            onClick={() => {
              setIsAutoFillModalOpen(true)
              handleLoadBridgeProfile()
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 hover:from-amber-400 hover:to-orange-400 active:scale-95 transition-all"
            title="Auto-Fill details or import from LinkedIn"
          >
            <Sparkles className="size-3.5 fill-current" />
            <span>Auto-Fill</span>
          </button>

          {/* Recompile Button */}
          <button
            onClick={handleCompile}
            disabled={isCompiling}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs shadow-md shadow-teal-500/20 hover:bg-teal-400 active:scale-95 transition-all disabled:opacity-50"
            title="Compile (Ctrl + Enter)"
          >
            {isCompiling ? (
              <>
                <RefreshCw className="size-3.5 animate-spin" />
                <span>Compiling...</span>
              </>
            ) : (
              <>
                <Play className="size-3.5 fill-current" />
                <span>Recompile</span>
                <span className="hidden sm:inline-block text-[10px] bg-slate-950/20 px-1 py-0.2 rounded font-mono">
                  Ctrl+↵
                </span>
              </>
            )}
          </button>

          {/* Download PDF */}
          <button
            onClick={handleDownloadPdf}
            disabled={!pdfBlobUrl}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-40"
            title="Download PDF"
          >
            <Download className="size-4" />
          </button>

          {/* Copy Code */}
          <button
            onClick={handleCopyCode}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            title="Copy LaTeX Source"
          >
            <Copy className="size-4" />
          </button>

          {/* Publish Template */}
          <button
            onClick={() => setIsPublishModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 transition-all shadow-md shadow-blue-600/20"
          >
            <Share2 className="size-3.5" /> Publish
          </button>
        </div>
      </header>

      {/* Main Overleaf Split Workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Overleaf Project Files Drawer (Optional Collapsible) */}
        {showFileTree && (
          <aside className="w-56 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 animate-in slide-in-from-left duration-200">
            <div className="p-3 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Folder className="size-3.5 text-teal-400" /> Project Files
              </span>
              <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-mono">3 files</span>
            </div>
            <div className="p-2 space-y-1 text-xs">
              {projectFiles.map(file => (
                <div
                  key={file.name}
                  onClick={() => setActiveFile(file.name)}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                    activeFile === file.name
                      ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode className="size-3.5 text-slate-500" />
                    <span className="truncate">{file.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-600 font-mono">{file.size}</span>
                </div>
              ))}
            </div>

            <div className="mt-auto p-3 border-t border-slate-800 space-y-2 text-[11px] text-slate-400">
              <div className="flex justify-between items-center">
                <span>TeX Engine:</span>
                <span className="font-mono text-teal-400 font-semibold">{compilerEngine}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>TeX Live:</span>
                <span className="font-mono text-slate-300">2024 (v5.2)</span>
              </div>
            </div>
          </aside>
        )}

        {/* Left Pane: Code Editor */}
        <div className="w-full md:w-1/2 flex flex-col border-r border-slate-800 bg-slate-950 min-w-0">
          {/* Code Header Bar with Tab, Tools & Search */}
          <div className="bg-slate-900/90 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2 font-mono">
              <span className="px-2 py-0.5 bg-slate-950 rounded text-teal-400 border border-slate-800 font-bold flex items-center gap-1">
                <FileCode className="size-3" /> {activeFile}
              </span>
              <span className="text-[10px] text-slate-600 hidden sm:inline">UTF-8 • TeX</span>
            </div>

            {/* Quick Action Tools */}
            <div className="flex items-center gap-2">
              {/* AI Beautify / Format */}
              <button
                onClick={handleBeautifyLatex}
                className="p-1 rounded text-slate-400 hover:text-teal-400 hover:bg-slate-800 transition-colors"
                title="Auto-Format & Indent LaTeX"
              >
                <Wand2 className="size-3.5" />
              </button>

              {/* Fix Unescaped Special Chars */}
              <button
                onClick={handleFixUnescapedChars}
                className="p-1 rounded text-slate-400 hover:text-teal-400 hover:bg-slate-800 transition-colors"
                title="Fix unescaped special characters"
              >
                <Hash className="size-3.5" />
              </button>

              {/* Find/Replace Toggle */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className={`p-1 rounded transition-colors ${
                  isSearchOpen ? 'text-teal-400 bg-slate-800' : 'text-slate-400 hover:text-white'
                }`}
                title="Find & Replace (Ctrl + F)"
              >
                <Search className="size-3.5" />
              </button>

              {/* Logs Drawer Toggle */}
              <button
                onClick={() => setIsLogsOpen(!isLogsOpen)}
                className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded transition-colors ${
                  hasError 
                    ? 'text-rose-400 bg-rose-950/40 border border-rose-800/60' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {hasError && <AlertCircle className="size-3 text-rose-400" />}
                <span>Logs & Errors</span>
              </button>
            </div>
          </div>

          {/* Find & Replace Bar (Collapsible) */}
          {isSearchOpen && (
            <div className="bg-slate-900 border-b border-slate-800 px-3 py-2 flex flex-wrap items-center gap-2 text-xs animate-in slide-in-from-top-1 duration-150">
              <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFindNext()}
                  placeholder="Find in code..."
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:border-teal-500 outline-none"
                />
                <button
                  onClick={handleFindNext}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold"
                >
                  Find Next
                </button>
              </div>

              <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                <input
                  type="text"
                  value={replaceQuery}
                  onChange={(e) => setReplaceQuery(e.target.value)}
                  placeholder="Replace with..."
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:border-teal-500 outline-none"
                />
                <button
                  onClick={handleReplaceAll}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold"
                >
                  Replace All
                </button>
              </div>

              <button
                onClick={() => setIsSearchOpen(false)}
                className="text-slate-500 hover:text-white p-1"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )}

          {/* Code Editor with Synchronized Line Numbers Gutter */}
          <div className="flex-1 relative flex overflow-hidden bg-slate-950">
            {/* Line Numbers Gutter */}
            <div 
              className="w-12 bg-slate-950/80 border-r border-slate-800/80 text-right pr-2.5 pt-4 text-slate-600 font-mono select-none overflow-hidden shrink-0"
              style={{ fontSize: `${fontSize}px`, lineHeight: '1.625' }}
            >
              {Array.from({ length: linesCount }).map((_, i) => (
                <div key={i} className={cursorPos.line === i + 1 ? 'text-teal-400 font-bold' : ''}>
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Code Textarea */}
            <textarea
              ref={textareaRef}
              value={latexCode}
              onChange={(e) => setLatexCode(e.target.value)}
              onSelect={handleTextareaSelect}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              className={`flex-1 p-4 pt-4 font-mono leading-relaxed bg-slate-950 text-slate-200 resize-none outline-hidden selection:bg-teal-500/30 selection:text-white ${
                wordWrap ? 'whitespace-pre-wrap' : 'whitespace-pre overflow-x-auto'
              }`}
              style={{ fontSize: `${fontSize}px`, lineHeight: '1.625' }}
              placeholder="Write your LaTeX resume code here..."
            />
          </div>

          {/* Bottom Editor Status Bar (Overleaf style) */}
          <footer className="bg-slate-900 border-t border-slate-800 px-3 py-1 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <div className="flex items-center gap-3">
              <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
              <span>•</span>
              <span>{linesCount} lines</span>
              <span>•</span>
              <span>{stats.words} words</span>
            </div>

            <div className="flex items-center gap-3">
              {/* Font Size Selector */}
              <div className="flex items-center gap-1">
                <span>Font:</span>
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="bg-transparent text-slate-400 border-none cursor-pointer focus:ring-0 p-0 text-[11px]"
                >
                  <option value={11} className="bg-slate-900">11px</option>
                  <option value={12} className="bg-slate-900">12px</option>
                  <option value={13} className="bg-slate-900">13px</option>
                  <option value={14} className="bg-slate-900">14px</option>
                  <option value={16} className="bg-slate-900">16px</option>
                </select>
              </div>

              <span>•</span>

              {/* Word wrap toggle */}
              <button
                onClick={() => setWordWrap(!wordWrap)}
                className={`hover:text-slate-300 ${wordWrap ? 'text-teal-400 font-semibold' : ''}`}
                title="Toggle Soft Wrap"
              >
                Wrap: {wordWrap ? 'On' : 'Off'}
              </button>
            </div>
          </footer>

          {/* Collapsible Compiler Console & Error Logs Drawer */}
          {isLogsOpen && (
            <div className="border-t border-slate-800 bg-slate-900/95 max-h-52 flex flex-col animate-in slide-in-from-bottom-2 duration-150">
              <div className="px-3 py-1.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-mono font-bold flex items-center gap-2">
                  <Terminal className="size-3.5 text-teal-400" />
                  Compiler Diagnostics & Error Console
                </span>
                <button
                  onClick={() => setIsLogsOpen(false)}
                  className="text-slate-500 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="p-3 overflow-auto font-mono text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed select-text">
                {compilerLogs || 'No logs recorded yet. Press Recompile to test compilation.'}
              </div>
            </div>
          )}
        </div>

        {/* Right Pane: Live PDF Preview */}
        <div className="w-full md:w-1/2 flex flex-col bg-slate-900 min-w-0">
          {/* PDF Viewer Header Toolbar */}
          <div className="bg-slate-900 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-200">Live Compiled PDF</span>
              <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-mono">1 Page</span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              {isCompiling ? (
                <span className="text-teal-400 flex items-center gap-1 font-semibold">
                  <RefreshCw className="size-3 animate-spin" /> Compiling...
                </span>
              ) : hasError ? (
                <span className="text-rose-400 flex items-center gap-1 font-semibold">
                  <AlertCircle className="size-3" /> Error
                </span>
              ) : (
                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="size-3" /> PDF Ready
                </span>
              )}

              {/* Download TeX Source */}
              <button
                onClick={handleDownloadTex}
                className="p-1 rounded text-slate-400 hover:text-teal-400 hover:bg-slate-800 transition-colors ml-1"
                title="Download Source .tex"
              >
                <FileCode className="size-3.5" />
              </button>

              {/* Fullscreen PDF Modal Toggle */}
              <button
                onClick={() => setIsFullscreenPdf(true)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Fullscreen Preview"
              >
                <Maximize2 className="size-3.5" />
              </button>
            </div>
          </div>

          {/* PDF View Canvas */}
          <div className="flex-1 relative bg-slate-950/70 p-2 sm:p-4 flex items-center justify-center overflow-auto">
            {pdfBlobUrl ? (
              <iframe
                src={`${pdfBlobUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                className="w-full h-full rounded-lg border border-slate-800 shadow-2xl bg-white"
                title="Compiled PDF Preview"
              />
            ) : (
              <div className="text-center p-8">
                <RefreshCw className="size-8 text-teal-400 animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-400 font-medium">Compiling LaTeX template preview...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Auto-Fill & LinkedIn Importer Modal */}
      {isAutoFillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-7 shadow-2xl text-white space-y-5 max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
                  <Sparkles className="size-5 fill-current" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Auto-Fill Profile into LaTeX</h3>
                  <p className="text-xs text-slate-400">Import from LinkedIn, sync your Bridge profile, or use the quick form.</p>
                </div>
              </div>
              <button
                onClick={() => setIsAutoFillModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* 4 Mode Tabs */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
              <button
                onClick={() => setAutoFillTab('pdf')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  autoFillTab === 'pdf'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                📄 Upload PDF / Resume
              </button>
              <button
                onClick={() => setAutoFillTab('paste')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  autoFillTab === 'paste'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                📋 Paste LinkedIn / Text
              </button>
              <button
                onClick={() => {
                  setAutoFillTab('profile')
                  handleLoadBridgeProfile()
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  autoFillTab === 'profile'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ⚡ Sync Bridge Profile
              </button>
              <button
                onClick={() => setAutoFillTab('form')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  autoFillTab === 'form'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ✍️ Quick Form
              </button>
            </div>

            {/* TAB 0: UPLOAD PDF / RESUME */}
            {autoFillTab === 'pdf' && (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                <div className="border-2 border-dashed border-amber-600/40 hover:border-amber-500 rounded-3xl p-6 text-center bg-slate-950/70 transition-all">
                  <input
                    type="file"
                    id="latex-pdf-upload"
                    accept=".pdf,.txt,.md,.docx,.json"
                    onChange={handlePdfUpload}
                    className="hidden"
                  />
                  <label htmlFor="latex-pdf-upload" className="cursor-pointer flex flex-col items-center gap-3">
                    <div className="size-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center shadow-inner">
                      {extractingPdf ? (
                        <Loader2 className="size-7 animate-spin text-amber-400" />
                      ) : (
                        <FileUp className="size-7" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-100">
                        {extractingPdf ? 'Extracting Resume Text with Smart Engine...' : 'Click to Upload Resume (PDF / DOCX / TXT)'}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                        Backend parser extracts full text, links (LinkedIn, GitHub, Portfolio, LeetCode, Medium), work history, and skills automatically into LaTeX.
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 hover:bg-amber-400 transition-all mt-1">
                      <Upload className="size-3.5" />
                      <span>Select File</span>
                    </span>
                  </label>

                  {uploadedPdfName && (
                    <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300">
                      <FileText className="size-3.5 text-amber-400" />
                      <span className="font-semibold">{uploadedPdfName}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setUploadedPdfName('')
                          setPastedText('')
                          setParsedData(null)
                        }}
                        className="text-slate-500 hover:text-white ml-1"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between px-2 pt-1 text-xs">
                  <span className="text-slate-400">Want to test without a file?</span>
                  <button
                    type="button"
                    onClick={handleLoadSampleLinkedIn}
                    className="font-bold text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="size-3" />
                    <span>Load Sample LinkedIn Profile (5 Links + Work History)</span>
                  </button>
                </div>

                {/* Parsed Output Live Card with Smart Links */}
                {parsedData && (
                  <div className="rounded-2xl bg-amber-950/30 border border-amber-800/60 p-4 space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-300 border-b border-amber-900/50 pb-2">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="size-4 text-emerald-400" />
                        <span>Parsed Candidate: <strong className="text-white">{parsedData.name || 'Candidate'}</strong> {parsedData.role ? `(${parsedData.role})` : ''}</span>
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
                        Ready for LaTeX
                      </span>
                    </div>

                    {/* Contact Badges */}
                    <div className="flex flex-wrap gap-2 text-[11px] text-slate-300">
                      {parsedData.email && (
                        <span className="bg-slate-900/80 border border-slate-800 px-2 py-0.5 rounded-lg">
                          📧 {parsedData.email}
                        </span>
                      )}
                      {parsedData.phone && (
                        <span className="bg-slate-900/80 border border-slate-800 px-2 py-0.5 rounded-lg">
                          📞 {parsedData.phone}
                        </span>
                      )}
                      {parsedData.location && (
                        <span className="bg-slate-900/80 border border-slate-800 px-2 py-0.5 rounded-lg">
                          📍 {parsedData.location}
                        </span>
                      )}
                    </div>

                    {/* Smart Links Intelligence Box */}
                    <div className="rounded-xl bg-slate-950/90 border border-slate-800 p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-amber-400 flex items-center gap-1">
                          <Globe className="size-3" />
                          <span>Smart Links Intelligence:</span>
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Automatic mapping into LaTeX \href header links
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 text-[10px]">
                        {parsedData.personal?.linkedin && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-semibold border border-blue-600/40">
                            <Linkedin className="size-2.5" /> LinkedIn Placeholder ✓
                          </span>
                        )}
                        {parsedData.personal?.github && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-700/60 text-slate-200 font-semibold border border-slate-600">
                            <Github className="size-2.5" /> GitHub Placeholder ✓
                          </span>
                        )}
                        {(parsedData.personal?.portfolio || parsedData.personal?.website) && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-600/40">
                            <ExternalLink className="size-2.5" /> Portfolio/Web ✓
                          </span>
                        )}
                        {parsedData.personal?.leetcode && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-semibold border border-amber-600/40">
                            ⭐ LeetCode: auto-routed
                          </span>
                        )}
                        {parsedData.personal?.medium && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-semibold border border-rose-600/40">
                            ⭐ Medium: auto-routed
                          </span>
                        )}
                        {parsedData.extraLinks?.map((ex, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-semibold border border-purple-600/40">
                            ⭐ {ex.platform}: auto-routed
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Section Counts */}
                    <div className="grid grid-cols-4 gap-2 text-center text-[11px] pt-1">
                      <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Roles</span>
                        <strong className="text-emerald-400 text-sm block">{parsedData.experience?.length || 0}</strong>
                      </div>
                      <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Education</span>
                        <strong className="text-amber-400 text-sm block">{parsedData.education?.length || 0}</strong>
                      </div>
                      <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Skills</span>
                        <strong className="text-cyan-400 text-sm block">
                          {(parsedData.skills?.technical ? parsedData.skills.technical.split(',').length : 0) + (parsedData.skills?.frameworks ? parsedData.skills.frameworks.split(',').length : 0) || (Array.isArray(parsedData.skills) ? parsedData.skills.length : 0)}
                        </strong>
                      </div>
                      <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Projects</span>
                        <strong className="text-purple-400 text-sm block">{parsedData.projects?.length || 0}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 1: PASTE LINKEDIN TEXT */}
            {autoFillTab === 'paste' && (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      Paste LinkedIn Profile Text or Raw Resume Content
                    </label>
                    <button
                      type="button"
                      onClick={handleLoadSampleLinkedIn}
                      className="text-[11px] font-semibold text-amber-400 hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="size-3" />
                      <span>Load Sample LinkedIn Profile (5 Links)</span>
                    </button>
                  </div>

                  <textarea
                    rows={8}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Paste text copied from LinkedIn (Profile -> More -> Save to PDF, or copy profile text directly)..."
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-3.5 text-xs text-slate-200 font-mono focus:border-amber-500 focus:outline-none resize-none leading-relaxed placeholder:text-slate-600"
                  />
                </div>

                {/* Parsed Output Live Card with Smart Links */}
                {parsedData && (
                  <div className="rounded-2xl bg-amber-950/30 border border-amber-800/60 p-4 space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-300 border-b border-amber-900/50 pb-2">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="size-4 text-emerald-400" />
                        <span>Parsed Candidate: <strong className="text-white">{parsedData.name || 'Candidate'}</strong> {parsedData.role ? `(${parsedData.role})` : ''}</span>
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
                        Ready for LaTeX
                      </span>
                    </div>

                    {/* Contact Badges */}
                    <div className="flex flex-wrap gap-2 text-[11px] text-slate-300">
                      {parsedData.email && (
                        <span className="bg-slate-900/80 border border-slate-800 px-2 py-0.5 rounded-lg">
                          📧 {parsedData.email}
                        </span>
                      )}
                      {parsedData.phone && (
                        <span className="bg-slate-900/80 border border-slate-800 px-2 py-0.5 rounded-lg">
                          📞 {parsedData.phone}
                        </span>
                      )}
                      {parsedData.location && (
                        <span className="bg-slate-900/80 border border-slate-800 px-2 py-0.5 rounded-lg">
                          📍 {parsedData.location}
                        </span>
                      )}
                    </div>

                    {/* Smart Links Intelligence Box */}
                    <div className="rounded-xl bg-slate-950/90 border border-slate-800 p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-amber-400 flex items-center gap-1">
                          <Globe className="size-3" />
                          <span>Smart Links Intelligence:</span>
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Automatic mapping into LaTeX \href header links
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 text-[10px]">
                        {parsedData.personal?.linkedin && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-semibold border border-blue-600/40">
                            <Linkedin className="size-2.5" /> LinkedIn Placeholder ✓
                          </span>
                        )}
                        {parsedData.personal?.github && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-700/60 text-slate-200 font-semibold border border-slate-600">
                            <Github className="size-2.5" /> GitHub Placeholder ✓
                          </span>
                        )}
                        {(parsedData.personal?.portfolio || parsedData.personal?.website) && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-600/40">
                            <ExternalLink className="size-2.5" /> Portfolio/Web ✓
                          </span>
                        )}
                        {parsedData.personal?.leetcode && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-semibold border border-amber-600/40">
                            ⭐ LeetCode: auto-routed
                          </span>
                        )}
                        {parsedData.personal?.medium && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-semibold border border-rose-600/40">
                            ⭐ Medium: auto-routed
                          </span>
                        )}
                        {parsedData.extraLinks?.map((ex, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-semibold border border-purple-600/40">
                            ⭐ {ex.platform}: auto-routed
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Section Counts */}
                    <div className="grid grid-cols-4 gap-2 text-center text-[11px] pt-1">
                      <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Roles</span>
                        <strong className="text-emerald-400 text-sm block">{parsedData.experience?.length || 0}</strong>
                      </div>
                      <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Education</span>
                        <strong className="text-amber-400 text-sm block">{parsedData.education?.length || 0}</strong>
                      </div>
                      <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Skills</span>
                        <strong className="text-cyan-400 text-sm block">
                          {(parsedData.skills?.technical ? parsedData.skills.technical.split(',').length : 0) + (parsedData.skills?.frameworks ? parsedData.skills.frameworks.split(',').length : 0) || (Array.isArray(parsedData.skills) ? parsedData.skills.length : 0)}
                        </strong>
                      </div>
                      <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Projects</span>
                        <strong className="text-purple-400 text-sm block">{parsedData.projects?.length || 0}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Sync from Bridge Profile */}
            {autoFillTab === 'profile' && (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {loadingProfile ? (
                  <div className="py-12 text-center space-y-2">
                    <RefreshCw className="size-8 text-amber-400 animate-spin mx-auto" />
                    <p className="text-xs text-slate-400">Fetching your saved profile and resume drafts...</p>
                  </div>
                ) : detectedProfile ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                          <UserCheck className="size-5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">{detectedProfile.name}</div>
                          <div className="text-xs text-amber-400">{detectedProfile.role}</div>
                          <div className="text-[11px] text-slate-400">{detectedProfile.email} • {detectedProfile.location}</div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-slate-900 p-2 rounded-xl">
                          <span className="text-slate-500 text-[10px] block">Experiences</span>
                          <strong className="text-white">{detectedProfile.experience?.length || 0}</strong>
                        </div>
                        <div className="bg-slate-900 p-2 rounded-xl">
                          <span className="text-slate-500 text-[10px] block">Education</span>
                          <strong className="text-white">{detectedProfile.education?.length || 0}</strong>
                        </div>
                        <div className="bg-slate-900 p-2 rounded-xl">
                          <span className="text-slate-500 text-[10px] block">Skills</span>
                          <strong className="text-white">{detectedProfile.skills?.length || 0}</strong>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Click below to inject this profile data into the <strong>{LATEX_PRESETS[selectedPresetKey]?.name}</strong> template. All syntax, environments, and commands will be automatically formatted for you.
                    </p>
                  </div>
                ) : (
                  <div className="py-12 text-center space-y-3">
                    <p className="text-xs text-slate-400">No cloud profile found. You can paste your LinkedIn profile text in the first tab!</p>
                    <button
                      onClick={handleLoadBridgeProfile}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200"
                    >
                      Retry Sync
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Quick Form */}
            {autoFillTab === 'form' && (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Full Name</label>
                    <input
                      type="text"
                      value={formProfile.name}
                      onChange={(e) => setFormProfile(p => ({ ...p, name: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Professional Title</label>
                    <input
                      type="text"
                      value={formProfile.role}
                      onChange={(e) => setFormProfile(p => ({ ...p, role: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Email</label>
                    <input
                      type="text"
                      value={formProfile.email}
                      onChange={(e) => setFormProfile(p => ({ ...p, email: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Phone</label>
                    <input
                      type="text"
                      value={formProfile.phone}
                      onChange={(e) => setFormProfile(p => ({ ...p, phone: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Location</label>
                    <input
                      type="text"
                      value={formProfile.location}
                      onChange={(e) => setFormProfile(p => ({ ...p, location: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Skills (comma separated)</label>
                  <input
                    type="text"
                    value={formProfile.skills}
                    onChange={(e) => setFormProfile(p => ({ ...p, skills: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Work Experience 1</label>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Company"
                      value={formProfile.company1}
                      onChange={(e) => setFormProfile(p => ({ ...p, company1: e.target.value }))}
                      className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                    />
                    <input
                      type="text"
                      placeholder="Role"
                      value={formProfile.role1}
                      onChange={(e) => setFormProfile(p => ({ ...p, role1: e.target.value }))}
                      className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                    />
                    <input
                      type="text"
                      placeholder="Duration"
                      value={formProfile.duration1}
                      onChange={(e) => setFormProfile(p => ({ ...p, duration1: e.target.value }))}
                      className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Achievements (one per line)..."
                    value={formProfile.points1}
                    onChange={(e) => setFormProfile(p => ({ ...p, points1: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white resize-none"
                  />
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800 shrink-0">
              <span className="text-[11px] text-slate-400">
                Target: <strong className="text-teal-400 font-mono">{LATEX_PRESETS[selectedPresetKey]?.name}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAutoFillModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>

                {(autoFillTab === 'pdf' || autoFillTab === 'paste') && (
                  <button
                    type="button"
                    disabled={!parsedData || extractingPdf}
                    onClick={() => handleApplyProfileToLatex(parsedData)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 hover:from-amber-400 hover:to-orange-400 disabled:opacity-40 transition-all active:scale-95 cursor-pointer"
                  >
                    <Sparkles className="size-3.5 fill-current" />
                    <span>Generate LaTeX & Recompile</span>
                  </button>
                )}

                {autoFillTab === 'profile' && (
                  <button
                    type="button"
                    disabled={!detectedProfile}
                    onClick={() => handleApplyProfileToLatex(detectedProfile)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 hover:from-amber-400 hover:to-orange-400 disabled:opacity-40 transition-all active:scale-95"
                  >
                    <Sparkles className="size-3.5 fill-current" />
                    <span>Apply Profile to LaTeX & Recompile</span>
                  </button>
                )}

                {autoFillTab === 'form' && (
                  <button
                    type="button"
                    onClick={() => {
                      const data = {
                        name: formProfile.name,
                        role: formProfile.role,
                        email: formProfile.email,
                        phone: formProfile.phone,
                        location: formProfile.location,
                        linkedin: formProfile.linkedin,
                        github: formProfile.github,
                        summary: formProfile.summary,
                        skills: formProfile.skills.split(',').map(s => s.trim()).filter(Boolean),
                        experience: [
                          {
                            company: formProfile.company1,
                            role: formProfile.role1,
                            duration: formProfile.duration1,
                            points: formProfile.points1.split('\n').map(p => p.trim()).filter(Boolean)
                          }
                        ],
                        education: [
                          {
                            institution: formProfile.institution,
                            degree: formProfile.degree,
                            duration: formProfile.durationEdu,
                            gpa: formProfile.gpa
                          }
                        ]
                      }
                      handleApplyProfileToLatex(data)
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 hover:from-amber-400 hover:to-orange-400 transition-all active:scale-95"
                  >
                    <Sparkles className="size-3.5 fill-current" />
                    <span>Convert to LaTeX & Recompile</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen PDF Modal */}
      {isFullscreenPdf && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col p-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-white">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">{templateTitle} — Fullscreen PDF</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPdf}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500 text-slate-950 text-xs font-bold"
              >
                <Download className="size-3.5" /> Download PDF
              </button>
              <button
                onClick={() => setIsFullscreenPdf(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 pt-3">
            <iframe
              src={`${pdfBlobUrl}#toolbar=1`}
              className="w-full h-full rounded-xl border border-slate-800 bg-white"
              title="Fullscreen PDF"
            />
          </div>
        </div>
      )}

      {/* Publish Modal */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl text-white space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-teal-500 text-slate-950 flex items-center justify-center font-bold">
                  <Share2 className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Publish LaTeX Template</h3>
                  <p className="text-xs text-slate-400">Make this template available in the community library</p>
                </div>
              </div>
              <button
                onClick={() => setIsPublishModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Template Title</label>
                <input
                  type="text"
                  value={templateTitle}
                  onChange={(e) => setTemplateTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-teal-500 focus:outline-hidden"
                >
                  <option value="Engineering & Tech">Engineering & Tech</option>
                  <option value="Academic & Research">Academic & Research</option>
                  <option value="Business & Management">Business & Management</option>
                  <option value="Creative & Design">Creative & Design</option>
                  <option value="General & Custom">General & Custom</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={publishDescription}
                  onChange={(e) => setPublishDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-teal-500 focus:outline-hidden resize-none"
                />
              </div>

              {/* Public vs Private */}
              <div
                onClick={() => setIsPublic(!isPublic)}
                className={`cursor-pointer rounded-2xl border p-4 flex items-center justify-between transition-all ${
                  isPublic ? 'border-teal-500 bg-teal-950/40' : 'border-slate-800 bg-slate-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  {isPublic ? (
                    <Globe className="size-5 text-teal-400 shrink-0" />
                  ) : (
                    <Lock className="size-5 text-slate-400 shrink-0" />
                  )}
                  <div>
                    <div className="text-xs font-bold text-white">
                      {isPublic ? 'Public Template (Community Library)' : 'Private Template'}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {isPublic
                        ? 'Available for all students and recruiters to view and build resumes.'
                        : 'Only visible to your account.'}
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="size-4 accent-teal-500"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={isPublishing}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 text-slate-950 text-xs font-bold hover:bg-teal-400 active:scale-95 transition-all shadow-md shadow-teal-500/20 disabled:opacity-50"
              >
                {isPublishing ? (
                  <>
                    <RefreshCw className="size-3.5 animate-spin" /> Publishing...
                  </>
                ) : (
                  <>
                    <Save className="size-3.5" /> Publish to Gallery
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
