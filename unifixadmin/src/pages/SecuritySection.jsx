import { useState } from 'react'
import { X, ShieldAlert, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
import { adminAPI } from '../services/api'
import {  formatDateShort, cap } from '../utils/dateUtils'
import { EmptyState, SectionHeader } from '../components/SharedComponents'

export default function SecuritySection({ issues, loading, onRefresh }) {
  const [actionLoading, setActionLoading] = useState(null)
  const [resolveModal, setResolveModal] = useState(null)
  const [resolution, setResolution] = useState('')

  const openIssues = issues.filter(i => i.status === 'open')
  const resolvedIssues = issues.filter(i => i.status === 'resolved')

  const handleResolve = async () => {
    if (!resolveModal) return
    setActionLoading(resolveModal)
    try { await adminAPI.resolveSecurityIssue(resolveModal, resolution); setResolveModal(null); setResolution(''); onRefresh() }
    catch { 
        //Catch block
    } finally { setActionLoading(null) }
  }

  return (
    <div>
      <SectionHeader title="Security Issues" subtitle="Review and resolve security issues reported by users" />
      {loading ? <div className="p-[60px] text-center text-[#94a3b8] text-[14px]">Loading…</div>
        : openIssues.length === 0 ? <EmptyState icon={ShieldAlert} text="No open security issues" sub="All issues have been resolved" />
          : (
            <div className="flex flex-col gap-[12px] mb-[28px]">
              {openIssues.map(issue => (
                <div key={issue.id} className="bg-white rounded-[14px] border-[1.5px] border-[#fde68a] p-[20px]">
                  <div className="flex items-start gap-[14px] mb-[14px]">
                    <div className="w-[40px] h-[40px] rounded-[10px] bg-[#fef3c7] flex items-center justify-center shrink-0"><ShieldAlert size={20} color="#d97706" /></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-[10px] mb-[4px]">
                        <span className="text-[14px] font-extrabold text-[#0f172a]">{issue.issueType}</span>
                        <span className="text-[11px] font-bold p-[2px_9px] rounded-[20px] bg-[#fef3c7] text-[#d97706] border border-[#fde68a] inline-flex items-center gap-[5px]"><AlertTriangle size={9} /> Open</span>
                      </div>
                      <div className="text-[13px] text-[#374151] line-height-[1.55] mb-[8px]">{issue.description}</div>
                      <div className="text-[12px] text-[#9ca3af]">Reported by <strong className="text-[#374151]">{issue.fullName}</strong> ({cap(issue.role)}) · {issue.email} · {formatDateShort(issue.reportedAt)}</div>
                    </div>
                  </div>
                  <button className="w-full sm:w-auto flex items-center justify-center gap-[6px] rounded-[9px] p-[9px_16px] text-[13px] font-bold cursor-pointer border-none bg-[#0f172a] text-white transition-all duration-150 hover:bg-[#1e293b]" onClick={() => { setResolveModal(issue.id); setResolution('') }}>
                    <CheckCircle2 size={14} /> Mark as Resolved
                  </button>
                </div>
              ))}
            </div>
          )}

      {resolvedIssues.length > 0 && (
        <>
          <div className="text-[13px] font-bold text-[#374151] mb-[13px] mt-[4px]">Resolved Issues</div>
          <div className="flex flex-col gap-[7px]">
            {resolvedIssues.map(issue => (
              <div key={issue.id} className="bg-[#f9fafb] rounded-[9px] border border-[#f0f0f0] flex items-start gap-[12px] p-[13px_16px]">
                <div className="flex-1">
                  <div className="text-[13px] font-bold text-[#374151] mb-[2px]">{issue.issueType}</div>
                  <div className="text-[12px] text-[#9ca3af]">{issue.fullName} · {formatDateShort(issue.reportedAt)}</div>
                  {issue.resolution && <div className="text-[12px] text-[#059669] mt-[4px]">Resolution: {issue.resolution}</div>}
                </div>
                <span className="text-[11px] font-bold p-[3px_10px] rounded-[20px] bg-[#d1fae5] text-[#059669] border border-[#6ee7b7] whitespace-nowrap inline-flex items-center gap-[4px]"><CheckCircle2 size={10} /> Resolved</span>
              </div>
            ))}
          </div>
        </>
      )}

      {resolveModal && (
        <div className="fixed inset-0 bg-[#0f172a]/60 flex items-center justify-center z-[200] p-[20px] backdrop-blur-[2px]" onClick={() => setResolveModal(null)}>
          <div className="bg-white rounded-[20px] w-full max-w-[460px] max-h-[90vh] flex flex-col shadow-[0_30px_80px_rgba(0,0,0,0.22)] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-[18px_22px] border-b border-[#f3f4f6] shrink-0">
              <div><div className="text-[15px] font-extrabold text-[#0f172a]">Resolve Security Issue</div><div className="text-[12px] text-[#94a3b8] mt-[2px]">Add a resolution note (optional)</div></div>
              <button className="w-[32px] h-[32px] rounded-[8px] bg-[#f3f4f6] border-none cursor-pointer flex items-center justify-center text-[#374151] hover:bg-[#fee2e2] hover:text-[#dc2626]" onClick={() => setResolveModal(null)}><X size={14} /></button>
            </div>
            <div className="p-[22px]">
              <textarea className="w-full rounded-[10px] border-[1.5px] border-[#e2e8f0] p-[12px] text-[14px] text-[#374151] min-h-[80px] resize-y outline-none focus:border-[#16a34a] font-['DM_Sans']" value={resolution} onChange={e => setResolution(e.target.value)} placeholder="Describe how this was resolved…" />
              <div className="flex gap-[9px] mt-[14px]">
                <button className="flex-1 bg-[#f8fafc] text-[#374151] border-[1.5px] border-[#e2e8f0] rounded-[9px] p-[10px] text-[13px] font-bold cursor-pointer transition-all duration-150 hover:border-[#16a34a] hover:text-[#16a34a] hover:bg-[#f0fdf4]" onClick={() => setResolveModal(null)}>Cancel</button>
                <button className="flex-1 bg-[#16a34a] text-white border-none rounded-[9px] p-[10px] text-[13px] font-bold cursor-pointer transition-all duration-150 hover:bg-[#15803d] disabled:opacity-55 disabled:cursor-not-allowed" onClick={handleResolve} disabled={!!actionLoading}>
                  {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Mark Resolved
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
