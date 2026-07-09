import { SiteLayout } from '@/components/site/site-layout'

function Section({ title, children }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="text-slate-600 leading-relaxed space-y-2">{children}</div>
    </section>
  )
}

export default function Terms() {
  return (
    <SiteLayout>
      <header className="bg-surface px-6 py-12">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-extrabold tracking-tight">Terms &amp; Conditions</h1>
          <p className="mt-2 text-slate-600">Last updated: June 2025</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12 space-y-10">
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <p className="text-sm font-semibold text-primary">
            By using Bridge, you agree to these Terms & Conditions. Please read them carefully.
          </p>
        </div>

        <Section title="1. Acceptance of Terms">
          <p className="text-sm">
            By accessing or using Bridge Marketplace ("the platform"), you agree to be bound by these Terms. If you do not agree, please do not use the platform.
          </p>
        </Section>

        <Section title="2. Eligibility">
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Students: You must be at least 16 years old to create a student account.</li>
            <li>Companies: You must be an authorized representative of your organization.</li>
            <li>All users must provide accurate information during registration.</li>
          </ul>
        </Section>

        <Section title="3. Student Accounts">
          <p className="text-sm">
            As a student, you may browse listings, create a profile, upload a resume, and apply to internships and jobs. You are responsible for the accuracy of your profile information. Misrepresentation may result in account suspension.
          </p>
        </Section>

        <Section title="4. Company Accounts">
          <p className="text-sm">
            Companies may post internship and job listings after account verification. Listings must be genuine opportunities. Bridge reserves the right to remove listings that violate our guidelines or are fraudulent. Companies must not misuse applicant data.
          </p>
        </Section>

        <Section title="5. Prohibited Conduct">
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Posting fake or misleading job/internship listings</li>
            <li>Harassing, spamming, or defrauding other users</li>
            <li>Attempting to bypass platform security</li>
            <li>Using the platform for any unlawful purpose</li>
          </ul>
        </Section>

        <Section title="6. Intellectual Property">
          <p className="text-sm">
            All content on the platform, including design, code, and text, is owned by Bridge Marketplace Inc. You may not reproduce or distribute any part of the platform without written permission.
          </p>
        </Section>

        <Section title="7. Disclaimers">
          <p className="text-sm">
            Bridge acts as a marketplace and does not guarantee employment or internship placement. We are not responsible for the conduct of employers or students outside the platform.
          </p>
        </Section>

        <Section title="8. Limitation of Liability">
          <p className="text-sm">
            To the maximum extent permitted by law, Bridge shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform.
          </p>
        </Section>

        <Section title="9. Changes to Terms">
          <p className="text-sm">
            We may update these Terms at any time. Continued use of the platform after changes constitutes acceptance of the new Terms.
          </p>
        </Section>

        <Section title="10. Contact">
          <p className="text-sm">
            Questions about these Terms? Email us at{' '}
            <a href="mailto:legal@bridge.io" className="font-semibold text-primary hover:underline">
              legal@bridge.io
            </a>
            .
          </p>
        </Section>
      </main>
    </SiteLayout>
  )
}
