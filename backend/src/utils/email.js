// Sends transactional email via Brevo's HTTP API (NOT SMTP).
// Docs: https://developers.brevo.com/reference/sendtransacemail
//
// SETUP CHECKLIST (do this before emails will work):
// 1. Sign up at https://app.brevo.com
// 2. Senders & IPs > Senders > Add a new sender (e.g. no-reply@yourdomain.com)
//    Wait for Brevo to send a verification email to that address and confirm it.
//    Without this step Brevo will reject every send with a 400 "sender not verified".
// 3. SMTP & API > API Keys > Create a new API key with "Email" permissions
// 4. Paste the key into backend/.env as BREVO_API_KEY
// 5. Set EMAIL_FROM in .env to match the verified sender, e.g.:
//    EMAIL_FROM=Bridge <no-reply@yourdomain.com>
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'

function parseFromHeader(fromHeader) {
  // Accepts "Bridge <no-reply@bridge.io>" or a plain email address
  const match = /^(.*)<(.+)>$/.exec(fromHeader || '')
  if (match) {
    return { name: match[1].trim().replace(/^"|"$/g, '') || 'Bridge', email: match[2].trim() }
  }
  return { name: 'Bridge', email: fromHeader || 'no-reply@bridge.io' }
}

exports.sendEmail = async ({ to, subject, html }) => {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) {
    throw new Error('BREVO_API_KEY is not set in .env — get one from Brevo dashboard > SMTP & API > API Keys')
  }

  const sender = parseFromHeader(process.env.EMAIL_FROM)

  const res = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'api-key': apiKey
    },
    body: JSON.stringify({
      sender,
      to: [{ email: to }],
      subject,
      htmlContent: html
    })
  })

  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    throw new Error(`Brevo API error (${res.status}): ${errBody}`)
  }

  return res.json()
}

exports.verificationEmail = (name, link) => ({
  subject: 'Verify your Bridge account',
  html: `<h2>Hi ${name},</h2><p>Click to verify your email:</p><a href="${link}">${link}</a>`
})

exports.resetEmail = (name, link) => ({
  subject: 'Reset your Bridge password',
  html: `<h2>Hi ${name},</h2><p>Click to reset your password:</p><a href="${link}">${link}</a><p>This link expires in 1 hour.</p>`
})

exports.applicationStatusEmail = (name, role, company, status) => ({
  subject: `Your application to ${company} was updated`,
  html: `<h2>Hi ${name},</h2><p>Your application for <strong>${role}</strong> at <strong>${company}</strong> has been updated to: <strong>${status}</strong></p>`
})

exports.otpEmail = (name, otp) => ({
  subject: 'Your Bridge verification code',
  html: `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;border:1px solid #e2e8f0;border-radius:12px">
      <h2 style="margin-top:0;color:#0f172a">Hi ${name},</h2>
      <p style="color:#475569">Enter this code to verify your Bridge account:</p>
      <div style="text-align:center;margin:32px 0">
        <span style="font-size:40px;font-weight:800;letter-spacing:12px;color:#6366f1">${otp}</span>
      </div>
      <p style="color:#94a3b8;font-size:13px">This code expires in <strong>10 minutes</strong>. If you didn't sign up, you can ignore this email.</p>
    </div>
  `
})

exports.newMessageEmail = (recipientName, senderName, conversationLink) => ({
  subject: `New message from ${senderName}`,
  html: `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;border:1px solid #e2e8f0;border-radius:12px">
      <h2 style="margin-top:0;color:#0f172a">Hi ${recipientName},</h2>
      <p style="color:#475569">You have a new message from <strong>${senderName}</strong> on Bridge.</p>
      ${conversationLink ? `
      <div style="text-align:center;margin:28px 0">
        <a href="${conversationLink}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700">
          View message
        </a>
      </div>
      ` : ''}
      <p style="color:#94a3b8;font-size:13px">You're receiving this because you have messages enabled on Bridge.</p>
    </div>
  `
})

exports.teamInviteEmail = (invitedName, companyName, inviterName, role, dashboardUrl) => ({
  subject: `You've been invited to join ${companyName}`,
  html: `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;border:1px solid #e2e8f0;border-radius:12px">
      <h2 style="margin-top:0;color:#0f172a">Hi ${invitedName},</h2>
      <p style="color:#475569">
        <strong>${inviterName}</strong> has invited you to join <strong>${companyName}</strong>
        on Bridge as a <strong>${role}</strong>.
      </p>
      ${dashboardUrl ? `
      <div style="text-align:center;margin:28px 0">
        <a href="${dashboardUrl}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700">
          Go to dashboard
        </a>
      </div>
      ` : ''}
      <p style="color:#94a3b8;font-size:13px">You're receiving this because a company owner invited you to their team on Bridge.</p>
    </div>
  `
})

exports.newApplicantEmail = (companyContactName, applicantName, postingTitle, postingType, applicantsUrl) => ({
  subject: `New applicant for ${postingTitle}`,
  html: `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;border:1px solid #e2e8f0;border-radius:12px">
      <h2 style="margin-top:0;color:#0f172a">Hi ${companyContactName},</h2>
      <p style="color:#475569">
        <strong>${applicantName}</strong> just applied to your ${postingType === 'internship' ? 'internship' : 'job'} posting:
      </p>
      <div style="margin:20px 0;padding:16px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0">
        <span style="font-weight:700;color:#0f172a">${postingTitle}</span>
      </div>
      ${applicantsUrl ? `
      <div style="text-align:center;margin:28px 0">
        <a href="${applicantsUrl}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700">
          Review applicant
        </a>
      </div>
      ` : ''}
      <p style="color:#94a3b8;font-size:13px">You're receiving this because you have a company account on Bridge.</p>
    </div>
  `
})
