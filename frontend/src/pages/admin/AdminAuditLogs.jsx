import { useEffect, useState } from 'react'
import { ScrollText, Search } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Pagination } from '@/components/site/pagination'
import { api } from '@/lib/api'

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const limit = 50

  useEffect(() => {
    setLoading(true)
    api.get(`/api/admin/audit-logs?page=${page}&limit=${limit}`)
      .then(data => { setLogs(data.logs || []); setTotal(data.total || 0) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page])

  const pages = Math.max(1, Math.ceil(total / limit))

  const actionLabels = {
    block_user: 'Blocked User', unblock_user: 'Unblocked User', assign_role: 'Assigned Role',
    verify_company: 'Verified Company', unverify_company: 'Unverified Company', override_company_profile: 'Overrode Company Profile',
    approve_posting: 'Approved Posting', delete_posting: 'Deleted Posting',
    update_report_status: 'Updated Report Status', update_ticket_status: 'Updated Ticket Status',
    create_plan: 'Created Plan', create_master_data: 'Created Master Data', create_announcement: 'Created Announcement',
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Audit Logs</h1>
          <p className="mt-1 text-sm text-slate-500">{loading ? 'Loading...' : `${total} actions logged`}</p>
        </div>

        {loading ? (
          <div className="space-y-2">{Array.from({ length: 10 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded-xl bg-slate-100" />)}</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No audit logs yet.</div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-surface text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3">Admin</th>
                  <th className="px-6 py-3">Action</th>
                  <th className="px-6 py-3">Target</th>
                  <th className="px-6 py-3">Details</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map(log => (
                  <tr key={log._id} className="hover:bg-surface">
                    <td className="px-6 py-4 font-semibold">{log.admin?.name || 'Unknown'}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                        {actionLabels[log.action] || log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{log.target || '—'}</td>
                    <td className="px-6 py-4 text-slate-500 max-w-[200px] truncate">
                      {log.details ? JSON.stringify(log.details).slice(0, 60) : '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={page} pages={pages} onChange={setPage} />
      </div>
    </DashboardLayout>
  )
}
