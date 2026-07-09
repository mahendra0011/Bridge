import { SiteLayout } from '@/components/site/site-layout'
import { Link } from 'react-router-dom'
import { Briefcase, Users, ShieldCheck, Clock, Heart, Globe, Mail, Linkedin, Twitter, FileText, CheckCircle } from 'lucide-react'

export default function About() {
  return (
    <SiteLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-violet-600 text-white">
        <div className="absolute -top-20 -right-20 size-80 rounded-full bg-white/10" />
        <div className="absolute -bottom-32 -left-32 size-96 rounded-full bg-white/5" />
        <div className="relative mx-auto max-w-4xl px-6 py-20 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Connecting students with opportunities that matter
          </h1>
          <p className="mt-4 text-lg text-indigo-100 max-w-2xl mx-auto">
            Bridge is where ambitious students meet companies that invest in potential, not pedigree.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link 
              to="/internships" 
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-primary hover:bg-white/90 shadow-lg transition-all"
            >
              Explore Internships
            </Link>
            <Link 
              to="/jobs" 
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/20 px-6 py-3 text-sm font-bold text-white hover:bg-white/30 backdrop-blur-sm transition-all"
            >
              Browse Jobs
            </Link>
            <Link 
              to="/post-opportunity" 
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 px-6 py-3 text-sm font-bold text-white hover:bg-white/10 transition-all"
            >
              Hire Talent
            </Link>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section id="story" className="py-16 px-6 bg-white">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="grid size-10 place-items-center rounded-xl bg-primary/10">
              <Heart className="size-5 text-primary" />
            </div>
            <h2 className="text-2xl font-extrabold">Our Story</h2>
          </div>
          <div className="space-y-4 text-slate-600 leading-relaxed">
            <p>
              We were tired of watching talented students get overlooked because they didn't attend the "right" college 
              or didn't know the secret handshake. The system was broken — companies couldn't find genuine candidates, 
              and students had no way to prove they were better than their resume suggested.
            </p>
            <p>
              Bridge started in 2023 when our founders, after struggling through their own early-career chaos, 
              realized the real problem wasn't the lack of opportunities — it was the lack of trust. We built Bridge 
              to fix that: a place where skills speak louder than surnames, and where companies can confidently 
              invest in raw potential.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 px-6 bg-slate-50">
        <div className="mx-auto max-w-4xl grid md:grid-cols-2 gap-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-8">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Briefcase className="size-5 text-primary" />
              Our Mission
            </h3>
            <p className="text-slate-600">
              Make entry-level hiring transparent, fair, and based on real potential — not just past credentials.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-8">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Globe className="size-5 text-violet-500" />
              Our Vision
            </h3>
            <p className="text-slate-600">
              A world where every student, regardless of background, has access to meaningful early-career opportunities.
            </p>
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="py-16 px-6 bg-white">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-primary/10">
              <Users className="size-5 text-primary" />
            </div>
            <h2 className="text-2xl font-extrabold">What We Do</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-primary/5 to-white p-8">
              <h3 className="text-xl font-bold mb-4 text-primary">For Candidates</h3>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="inline-block size-1.5 rounded-full bg-primary mt-1.5" />
                  Browse verified internships and entry-level jobs
                </li>
                <li className="flex items-start gap-2">
                  <span className="inline-block size-1.5 rounded-full bg-primary mt-1.5" />
                  One-click applications with tracked status
                </li>
                <li className="flex items-start gap-2">
                  <span className="inline-block size-1.5 rounded-full bg-primary mt-1.5" />
                  Skill-based matching — let your abilities shine
                </li>
                <li className="flex items-start gap-2">
                  <span className="inline-block size-1.5 rounded-full bg-primary mt-1.5" />
                  Build a profile that companies actually read
                </li>
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50 to-white p-8">
              <h3 className="text-xl font-bold mb-4 text-blue-600">For Companies</h3>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="inline-block size-1.5 rounded-full bg-blue-500 mt-1.5" />
                  Post listings to thousands of verified students
                </li>
                <li className="flex items-start gap-2">
                  <span className="inline-block size-1.5 rounded-full bg-blue-500 mt-1.5" />
                  Manage applicants with our simple pipeline
                </li>
                <li className="flex items-start gap-2">
                  <span className="inline-block size-1.5 rounded-full bg-blue-500 mt-1.5" />
                  Find talent based on skills, not just keywords
                </li>
                <li className="flex items-start gap-2">
                  <span className="inline-block size-1.5 rounded-full bg-blue-500 mt-1.5" />
                  Reduce hiring time with pre-vetted candidates
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Numbers That Matter */}
      <section id="numbers" className="py-16 px-6 bg-slate-50">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-primary/10">
              <Clock className="size-5 text-primary" />
            </div>
            <h2 className="text-2xl font-extrabold">Numbers That Matter</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { n: '15K+', l: 'Registered Students', icon: Users },
              { n: '800+', l: 'Verified Companies', icon: Briefcase },
              { n: '12K+', l: 'Opportunities Posted', icon: FileText },
              { n: '3.2K+', l: 'Successful Placements', icon: CheckCircle },
              { n: '7 days', l: 'Avg. Time to Hire', icon: Clock },
              { n: '200+', l: 'Colleges Covered', icon: Globe },
            ].map((stat) => (
              <div key={stat.l} className="rounded-2xl border border-slate-200 bg-white p-6 text-center hover:shadow-md transition-all">
                <div className="grid size-10 place-items-center rounded-xl bg-primary/10 mx-auto mb-3">
                  <stat.icon className="size-5 text-primary" />
                </div>
                <div className="text-2xl font-extrabold text-slate-800">{stat.n}</div>
                <div className="mt-1 text-xs font-semibold text-slate-500">{stat.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section id="values" className="py-16 px-6 bg-white">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-primary/10">
              <ShieldCheck className="size-5 text-primary" />
            </div>
            <h2 className="text-2xl font-extrabold">Our Values</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { t: 'Verified & Trusted', d: 'Every company goes through identity verification', icon: ShieldCheck },
              { t: 'Speed', d: 'From application to interview in record time', icon: Clock },
              { t: 'Transparency', d: 'Clear salary ranges, open processes', icon: Heart },
              { t: 'Candidate-First', d: 'Your career journey, our priority', icon: Users },
              { t: 'Accessibility', d: 'Breaking barriers across regions and languages', icon: Globe },
            ].map((v) => (
              <div key={v.t} className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
                <v.icon className="size-8 text-primary mx-auto mb-3" />
                <h3 className="font-bold text-sm text-slate-800 mb-1">{v.t}</h3>
                <p className="text-xs text-slate-500">{v.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Safety */}
      <section id="trust" className="py-16 px-6 bg-slate-50">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-primary/10">
              <ShieldCheck className="size-5 text-primary" />
            </div>
            <h2 className="text-2xl font-extrabold">Trust & Safety</h2>
          </div>
          <div className="space-y-4 text-slate-600 leading-relaxed">
            <p>
              We verify every company before they can post — checking business registration, contact details, 
              and employment history. This protects students from fake listings and gives companies credibility.
            </p>
            <p>
              Your data stays yours. We don't sell or share personal information. All communications happen 
              on-platform until you decide otherwise, so you're always in control.
            </p>
          </div>
        </div>
      </section>

      {/* Meet the Team */}
      <section id="team" className="py-16 px-6 bg-white">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-primary/10">
              <Users className="size-5 text-primary" />
            </div>
            <h2 className="text-2xl font-extrabold">Meet the Team</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: 'Anshul Patel', role: 'Co-founder & CEO', bio: 'Previously at Microsoft, passionate about democratizing opportunities' },
              { name: 'Riya Sharma', role: 'Co-founder & CTO', bio: 'Built scalable systems at startups, believer in skill-first hiring' },
              { name: 'Arjun Mehta', role: 'Head of Growth', bio: 'Focused on making entry-level hiring accessible to all' },
            ].map((member) => (
              <div key={member.name} className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
                <div className="grid size-20 place-items-center rounded-full bg-gradient-to-br from-primary to-violet-600 mx-auto mb-4 text-2xl font-bold text-white">
                  {member.name[0]}
                </div>
                <h3 className="font-bold text-slate-800">{member.name}</h3>
                <p className="text-xs text-primary font-semibold mt-1">{member.role}</p>
                <p className="mt-2 text-xs text-slate-500">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Careers at Bridge */}
      <section className="py-16 px-6 bg-primary/5">
        <div className="mx-auto max-w-3xl text-center space-y-4">
          <h2 className="text-2xl font-extrabold">Careers at Bridge</h2>
          <p className="text-slate-600">
            We're building the future of hiring. Join us in making opportunity accessible to everyone.
          </p>
          <Link 
            to="/jobs" 
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary/90 transition-colors"
          >
            View Open Roles
          </Link>
        </div>
      </section>

      {/* Contact & Social */}
      <section id="contact" className="py-16 px-6 bg-white">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-primary/10">
              <Mail className="size-5 text-primary" />
            </div>
            <h2 className="text-2xl font-extrabold">Get in Touch</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
              <p className="font-semibold text-slate-800">Contact Us</p>
              <p className="text-sm text-slate-500">hello@bridge.app</p>
              <p className="text-sm text-slate-500">support@bridge.app</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
              <p className="font-semibold text-slate-800">Follow Us</p>
              <div className="flex gap-3">
                <a href="#" className="text-slate-400 hover:text-primary transition-colors">
                  <Twitter className="size-5" />
                </a>
                <a href="#" className="text-slate-400 hover:text-primary transition-colors">
                  <Linkedin className="size-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="py-16 px-6 bg-gradient-to-br from-primary to-violet-600 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-extrabold">Ready to get started?</h2>
          <p className="mt-2 text-indigo-100">
            Join thousands of students and companies on Bridge today.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link 
              to="/internships" 
              className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-primary hover:bg-white/90 transition-colors"
            >
              Find Your First Role
            </Link>
            <Link 
              to="/post-opportunity" 
              className="rounded-xl border border-white/30 px-6 py-3 text-sm font-bold text-white hover:bg-white/10 transition-colors"
            >
              Hire Today
            </Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  )
}