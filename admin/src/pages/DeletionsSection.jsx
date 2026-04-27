import { useState } from 'react'
import { X, Wrench, User, Users, Trash2, Lock, CheckCircle2, Loader2, GraduationCap, BookUser } from 'lucide-react'
import { adminAPI } from '../services/api'
import { formatDate, formatDateShort, cap } from '../utils/dateUtils'
import {EmptyState, SectionHeader } from '../components/SharedComponents'

export default function DeletionsSection({ data, loading, onRefresh }) {
  const [actionLoading, setActionLoading] = useState(null)
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const staffRequests = data.staffRequests ?? []
  const userDeletions = data.userDeletions ?? []
  const pendingStaff = staffRequests.filter(r => r.status === 'pending')
  const processedStaff = staffRequests.filter(r => r.status !== 'pending')

  const handleApprove = async (requestId) => {
    setActionLoading(requestId)
    try { await adminAPI.approveDeletion(requestId); onRefresh() }
    catch {
        //Catch block
     } finally { setActionLoading(null) }
  }

  const handleReject = async () => {
    if (!rejectModal) return
    setActionLoading(rejectModal)
    try { await adminAPI.rejectDeletion(rejectModal, rejectReason); setRejectModal(null); setRejectReason(''); onRefresh() }
    catch {
        //Catch block
     } finally { setActionLoading(null) }
  }

  return (
    <div>
      <SectionHeader title="Account Deletions" subtitle="Monitor student/teacher deletions and approve or reject staff deletion requests" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[24px]">
        <div>
          <div className="text-[14px] font-bold text-[#0f172a] mb-[14px] flex items-center gap-[8px]"><Wrench size={15} color="#dc2626" /> Staff Deletion Requests<span className="text-[11px] font-semibold p-[2px_8px] rounded-[20px] bg-[#fef2f2] text-[#dc2626]">Action Required</span></div>
          {loading ? <div className="text-[#9ca3af] p-[16px] text-[13px]">Loading…</div>
            : pendingStaff.length === 0 ? <EmptyState icon={CheckCircle2} text="No pending staff deletion requests" />
              : pendingStaff.map(req => (
                <div key={req.id} className="bg-white rounded-[12px] border border-[#fecaca] p-[16px] mb-[12px]">
                  <div className="flex items-center gap-[10px] mb-[12px]">
                    <div className="w-[36px] h-[36px] rounded-[9px] flex items-center justify-center shrink-0 bg-[#fef2f2]"><Trash2 size={16} color="#dc2626" /></div>
                    <div className="flex-1"><div className="text-[14px] font-bold text-[#0f172a]">{req.fullName}</div><div className="text-[11px] text-[#94a3b8]">{req.email} · {req.designation}</div></div>
                  </div>
                  <div className="text-[11px] text-[#94a3b8] mb-[12px]">Requested: {formatDate(req.requestedAt)}</div>
                  <div className="flex gap-[9px]">
                    <button className="flex-1 bg-[#dc2626] text-white rounded-[9px] p-[9px] text-[13px] font-bold cursor-pointer border-none transition-all duration-150 flex items-center justify-center gap-[6px] hover:bg-[#b91c1c] disabled:opacity-55 disabled:cursor-not-allowed" onClick={() => handleApprove(req.id)} disabled={actionLoading === req.id}>
                      {actionLoading === req.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Delete Account
                    </button>
                    <button className="flex-1 bg-[#f8fafc] text-[#374151] border-[1.5px] border-[#e2e8f0] rounded-[9px] p-[9px] text-[13px] font-bold cursor-pointer transition-all duration-150 flex items-center justify-center gap-[6px] hover:border-[#16a34a] hover:text-[#16a34a]" onClick={() => { setRejectModal(req.id); setRejectReason('') }}><Lock size={13} /> Keep Account</button>
                  </div>
                </div>
              ))}
          {processedStaff.length > 0 && (
            <div className="mt-[20px]">
              <div className="text-[12px] font-bold text-[#374151] mb-[13px] mt-[4px]">Processed</div>
              <div className="flex flex-col gap-[7px]">
                {processedStaff.map(req => (
                  <div key={req.id} className="bg-[#f9fafb] rounded-[9px] border border-[#f0f0f0] p-[11px_14px] flex items-center gap-[12px]">
                    <div className="flex-1"><span className="text-[13px] font-semibold text-[#374151]">{req.fullName}</span></div>
                    <span className="text-[11px] text-[#94a3b8]">{formatDateShort(req.processedAt)}</span>
                    <span className="inline-flex items-center gap-[5px] text-[11px] font-bold px-[10px] py-[3px] rounded-[20px] whitespace-nowrap border" style={req.status === 'approved' ? { background: '#fee2e2', color: '#dc2626', borderColor: '#fca5a5' } : { background: '#d1fae5', color: '#059669', borderColor: '#6ee7b7' }}>
                      <span className="w-[5px] h-[5px] rounded-full shrink-0" style={{ background: req.status === 'approved' ? '#ef4444' : '#10b981' }} />
                      {req.status === 'approved' ? 'Deleted' : 'Kept'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div>
          <div className="text-[14px] font-bold text-[#0f172a] mb-[14px] flex items-center gap-[8px]"><User size={15} color="#6b7280" /> Student / Teacher Deletions<span className="text-[11px] font-semibold p-[2px_8px] rounded-[20px] bg-[#f3f4f6] text-[#6b7280]">Info only</span></div>
          {loading ? <div className="text-[#9ca3af] p-[16px] text-[13px]">Loading…</div>
            : userDeletions.length === 0 ? <EmptyState icon={Users} text="No account deletions yet" />
              : (
                <div className="flex flex-col gap-[7px]">
                  {userDeletions.map(log => (
                    <div key={log.id} className="bg-white rounded-[9px] border border-[#f0f0f0] p-[11px_14px] flex items-center gap-[12px]">
                      <div className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center shrink-0" style={{ background: log.role === 'student' ? '#ede9fe' : '#dbeafe' }}>
                        {log.role === 'student' ? <GraduationCap size={14} color="#6366f1" /> : <BookUser size={14} color="#0ea5e9" />}
                      </div>
                      <div className="flex-1"><div className="text-[13px] font-semibold text-[#374151]">{log.fullName}</div><div className="text-[11px] text-[#94a3b8]">{log.email} · {cap(log.role)}</div></div>
                      <div className="text-[11px] text-[#94a3b8] text-right">{formatDate(log.deletedAt)}</div>
                    </div>
                  ))}
                </div>
              )}
        </div>
      </div>

      {rejectModal && (
        <div className="fixed inset-0 bg-[#0f172a]/60 flex items-center justify-center z-[200] p-[20px] backdrop-blur-[2px]" onClick={() => setRejectModal(null)}>
          <div className="bg-white rounded-[20px] w-full max-w-[460px] max-h-[90vh] flex flex-col shadow-[0_30px_80px_rgba(0,0,0,0.22)] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-[18px_22px] border-b border-[#f3f4f6] shrink-0">
              <div><div className="text-[15px] font-extrabold text-[#0f172a]">Keep Account</div><div className="text-[12px] text-[#94a3b8] mt-[2px]">Provide a reason for rejecting the deletion request</div></div>
              <button className="w-[32px] h-[32px] rounded-[8px] bg-[#f3f4f6] border-none cursor-pointer flex items-center justify-center text-[#374151] hover:bg-[#fee2e2] hover:text-[#dc2626]" onClick={() => setRejectModal(null)}><X size={14} /></button>
            </div>
            <div className="p-[22px]">
              <textarea className="w-full rounded-[10px] border-[1.5px] border-[#e2e8f0] p-[12px] text-[14px] text-[#374151] min-h-[80px] resize-y outline-none focus:border-[#16a34a] font-['DM_Sans']" value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason (optional)…" />
              <div className="flex gap-[9px] mt-[14px]">
                <button className="flex-1 bg-[#f8fafc] text-[#374151] border-[1.5px] border-[#e2e8f0] rounded-[9px] p-[10px] text-[13px] font-bold cursor-pointer transition-all duration-150 hover:border-[#16a34a] hover:text-[#16a34a] hover:bg-[#f0fdf4]" onClick={() => setRejectModal(null)}>Cancel</button>
                <button className="flex-1 bg-[#16a34a] text-white border-none rounded-[9px] p-[10px] text-[13px] font-bold cursor-pointer transition-all duration-150 hover:bg-[#15803d] disabled:opacity-55 disabled:cursor-not-allowed" onClick={handleReject} disabled={!!actionLoading}>
                  {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Keep Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
