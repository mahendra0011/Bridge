import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CreditCard, CheckCircle2, ArrowLeft } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'

const PLANS = [
  {
    name: 'Free',
    price: '₹0',
    period: 'forever',
    features: [
      'Up to 3 active listings',
      'Basic analytics',
      'Email support',
      'Team up to 2 members',
    ],
    cta: 'Current Plan',
    popular: false,
  },
  {
    name: 'Pro',
    price: '₹999',
    period: '/month',
    features: [
      'Unlimited active listings',
      'Advanced analytics & export',
      'Priority support',
      'Team up to 10 members',
      'Boosted listings',
      'Custom branding',
    ],
    cta: 'Upgrade',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    features: [
      'Everything in Pro',
      'Unlimited team members',
      'Dedicated account manager',
      'API access',
      'Custom integrations',
      'SLA guarantee',
    ],
    cta: 'Contact Us',
    popular: false,
  },
]

export default function CompanyBilling() {
  const [selectedPlan] = useState('Free')

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
        <div className="flex items-center gap-3">
          <Link to="/company/settings" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">Billing & Subscription</h2>
            <p className="mt-1 text-sm text-slate-500">Manage your plan and billing information.</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div key={plan.name} className={`relative rounded-2xl border-2 p-6 ${
              plan.popular ? 'border-primary bg-primary/5' : 'border-slate-200 bg-white'
            }`}>
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold text-white">
                  Most Popular
                </span>
              )}
              <h3 className="text-lg font-bold">{plan.name}</h3>
              <div className="mt-3">
                <span className="text-3xl font-extrabold">{plan.price}</span>
                <span className="text-sm text-slate-500">{plan.period}</span>
              </div>
              <ul className="mt-5 space-y-3">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <button disabled={plan.name === selectedPlan}
                className={`mt-6 w-full rounded-xl py-2.5 text-sm font-bold transition-colors ${
                  plan.name === selectedPlan
                    ? 'bg-slate-100 text-slate-400 cursor-default'
                    : plan.popular
                      ? 'bg-primary text-white hover:bg-primary/90'
                      : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}>
                {plan.name === selectedPlan ? 'Current Plan' : plan.cta}
              </button>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-bold mb-4">Payment Method</h3>
          <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4">
            <CreditCard className="size-6 text-slate-400" />
            <div>
              <p className="text-sm font-semibold">No payment method added</p>
              <p className="text-xs text-slate-500">Add a card to upgrade to a paid plan.</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}