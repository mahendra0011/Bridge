import { useState } from 'react'
import { SiteLayout } from '@/components/site/site-layout'
import { Button } from '@/components/ui/button'
import { Mail, Phone, MapPin, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'

function Field({ label, type = 'text', placeholder, value, onChange, required }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}
      </label>
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
      />
    </div>
  )
}

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSending(true)
    try {
      await api.post('/api/contact', form)
      setSent(true)
      toast.success('Message sent!')
    } catch (err) {
      toast.error(err.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  return (
    <SiteLayout>
      <header className="bg-surface px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-4xl font-extrabold tracking-tight">Contact Us</h1>
          <p className="mt-2 text-slate-600">We'd love to hear from you. Send us a message and we'll respond within 24 hours.</p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid gap-12 lg:grid-cols-[1fr_360px]">
          {/* Form */}
          <div className="rounded-2xl border border-slate-200 bg-white p-8">
            {!sent ? (
              <>
                <h2 className="mb-6 text-xl font-bold">Send a message</h2>
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Your name" placeholder="Ada Lovelace" required value={form.name} onChange={set('name')} />
                    <Field label="Email" type="email" placeholder="you@email.com" required value={form.email} onChange={set('email')} />
                  </div>
                  <Field label="Subject" placeholder="How can we help?" required value={form.subject} onChange={set('subject')} />
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Message
                    </label>
                    <textarea
                      rows={5}
                      required
                      placeholder="Tell us more..."
                      value={form.message}
                      onChange={set('message')}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <Button disabled={sending} className="w-full rounded-xl bg-primary py-5 font-bold text-primary-foreground hover:bg-primary/90">
                    {sending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                    {sending ? 'Sending...' : 'Send message'}
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex flex-col items-center py-12 text-center">
                <div className="mb-4 grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                  <Check className="size-7" />
                </div>
                <h3 className="text-xl font-extrabold">Message sent!</h3>
                <p className="mt-2 text-sm text-slate-500">Thanks for reaching out. We'll get back to you within 24 hours.</p>
                <button
                  onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }) }}
                  className="mt-6 text-sm font-bold text-primary hover:underline"
                >
                  Send another message
                </button>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-4">
            {[
              { icon: Mail, label: 'Email', value: 'support@bridge.io', sub: 'For general enquiries' },
              { icon: Phone, label: 'Phone', value: '+91 98765 43210', sub: 'Mon–Fri, 9am–6pm IST' },
              { icon: MapPin, label: 'Office', value: 'Bangalore, India', sub: '560001' },
            ].map(({ icon: Icon, label, value, sub }) => (
              <div key={label} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
                  <p className="font-semibold text-foreground">{value}</p>
                  <p className="text-xs text-slate-500">{sub}</p>
                </div>
              </div>
            ))}

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Support hours</p>
              <p className="text-sm text-slate-600">Monday – Friday</p>
              <p className="font-semibold">9:00 AM – 6:00 PM IST</p>
              <p className="mt-1 text-xs text-slate-400">We typically respond within a few hours during business days.</p>
            </div>
          </div>
        </div>
      </main>
    </SiteLayout>
  )
}
