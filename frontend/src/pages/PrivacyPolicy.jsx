import { SiteLayout } from '@/components/site/site-layout'

function Section({ title, children }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="text-slate-600 leading-relaxed space-y-2">{children}</div>
    </section>
  )
}

export default function PrivacyPolicy() {
  return (
    <SiteLayout>
      <header className="bg-surface px-6 py-12">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-extrabold tracking-tight">Privacy Policy</h1>
          <p className="mt-2 text-slate-600">Last updated: June 2025</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12 space-y-10">
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <p className="text-sm font-semibold text-primary">
            Bridge is committed to protecting your privacy. This policy explains what data we collect, how we use it, and your rights.
          </p>
        </div>

        <Section title="1. Information We Collect">
          <p>We collect information you provide directly to us, including:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Account registration details (name, email, phone number)</li>
            <li>Profile information (education, skills, work experience)</li>
            <li>Uploaded resumes and cover letters</li>
            <li>Application data submitted to employers</li>
            <li>Communication you send to us</li>
          </ul>
          <p className="text-sm">We also collect usage data automatically (IP address, browser type, pages visited, and time spent).</p>
        </Section>

        <Section title="2. How We Use Your Information">
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>To create and manage your account</li>
            <li>To match you with relevant internships and jobs</li>
            <li>To share your profile with employers when you apply</li>
            <li>To send you notifications about applications and status updates</li>
            <li>To improve our platform and user experience</li>
            <li>To comply with legal obligations</li>
          </ul>
        </Section>

        <Section title="3. Data Sharing">
          <p className="text-sm">
            We share your information with employers <strong>only when you apply</strong> to their listing. We do not sell your personal data to third parties. We may share data with trusted service providers who help us operate the platform (e.g., cloud hosting, email delivery).
          </p>
        </Section>

        <Section title="4. Data Retention">
          <p className="text-sm">
            We retain your data as long as your account is active. You can request deletion of your account and associated data at any time by contacting us at privacy@bridge.io.
          </p>
        </Section>

        <Section title="5. Your Rights">
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Access the personal data we hold about you</li>
            <li>Correct inaccurate or incomplete information</li>
            <li>Request deletion of your account and data</li>
            <li>Opt out of marketing communications at any time</li>
          </ul>
        </Section>

        <Section title="6. Security">
          <p className="text-sm">
            We implement industry-standard security measures including HTTPS encryption, hashed passwords, and regular security audits. However, no system is 100% secure and we cannot guarantee absolute security.
          </p>
        </Section>

        <Section title="7. Cookies">
          <p className="text-sm">
            We use cookies to maintain session state and understand usage patterns. You can disable cookies in your browser settings, though some features may not work as expected.
          </p>
        </Section>

        <Section title="8. Contact">
          <p className="text-sm">
            For any privacy-related questions, email us at{' '}
            <a href="mailto:privacy@bridge.io" className="font-semibold text-primary hover:underline">
              privacy@bridge.io
            </a>
            .
          </p>
        </Section>
      </main>
    </SiteLayout>
  )
}
