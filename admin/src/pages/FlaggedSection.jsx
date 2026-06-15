import { useState } from 'react'
import { Flag, Mail, Clock, ChevronRight, CheckCircle, AlertTriangle } from 'lucide-react'
import { formatDateShort } from '../utils/dateUtils'
import { SectionHeader } from '../components/SharedComponents'
import { ComplaintModal } from './ComplaintsSection'
import { adminAPI } from '../services/api'

function toTimestamp(ts) {
  if (!ts) return null
  if (typeof ts === 'number') return ts * 1000
  const secs = ts._seconds ?? ts.seconds
  return secs ? secs * 1000 : null
}

function formatElapsed(ts) {
  const ms = toTimestamp(ts)
  if (!ms) return 'N/A'
  const diff = Date.now() - ms
  const totalMins = Math.floor(diff / 60000)
  const hours = Math.floor(totalMins / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days} day${days > 1 ? 's' : ''}`
  if (hours > 0) return `${hours}h ${totalMins % 60}m`
  return `${totalMins}m`
}

export default function FlaggedSection({ allComplaints, loading, onRefresh }) {
  const [focused, setFocused] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)
  const [msg, setMsg] = useState('')

  const flaggedComplaints = allComplaints.filter(
    c => c.flagged === true && !c.flagResolved && ['pending', 'assigned', 'in_progress'].includes(c.status)
  )

  async function handleIWillHandle(complaintId) {
    try {
      setActionLoading('handle_' + complaintId)
      await adminAPI.iwillHandle(complaintId)
      setMsg('Marked as handling. Student notified.')
      setTimeout(() => setMsg(''), 3000)
      onRefresh()
    } catch (e) {
      setMsg('Action failed: ' + e.message)
    } finally {
      setActionLoading(null)
    }
  }

const [confirmId, setConfirmId] = useState(null)

  async function handleMarkResolved(complaintId) {
    setConfirmId(complaintId)
  }

  async function confirmResolve() {
    const complaintId = confirmId
    setConfirmId(null)
    try {
      setActionLoading('resolve_' + complaintId)
      await adminAPI.markFlagResolved(complaintId)
      setMsg('Complaint resolved. HOD and student notified.')
      setTimeout(() => setMsg(''), 3000)
      setFocused(null)
      onRefresh()
    } catch (e) {
      setMsg('Action failed: ' + e.message)
    } finally {
      setActionLoading(null)
    }
  }
  return (
    <div>
      <SectionHeader title="Flagged Complaints" subtitle="Escalated complaints requiring immediate attention" />

      {msg && (
        <div className="mb-[16px] bg-[#f0fdf4] border border-[#bbf7d0] rounded-[10px] p-[12px_16px] text-[13px] font-semibold text-[#16a34a]">
          {msg}
        </div>
      )}

      {loading ? (
        <div className="p-[60px] text-center text-[#94a3b8] text-[14px]">Loading…</div>
      ) : flaggedComplaints.length === 0 ? (
        <div className="bg-white rounded-[16px] p-[60px] text-center border border-[#f0f0f0]">
          <CheckCircle size={36} color="#cbd5e1" className="mx-auto mb-[12px]" />
          <div className="text-[14px] font-bold text-[#475569] mb-[4px]">No flagged complaints</div>
          <div className="text-[12px] text-[#94a3b8]">All complaints are within time limits</div>
        </div>
      ) : (
        <div className="flex flex-col gap-[12px]">
          {flaggedComplaints.map(item => (
            <div key={item.id} className="bg-white rounded-[16px] border border-[#fecaca] border-l-[4px] border-l-[#ef4444] shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="p-[16px]">
                <div className="flex items-start justify-between mb-[12px]">
                  <div className="flex items-center gap-[8px] flex-wrap">
                    <span className="text-[10px] font-bold px-[9px] py-[3px] rounded-[6px] bg-[#fef2f2] text-[#dc2626] border border-[#fecaca] flex items-center gap-[4px]">
                      <Flag size={10} /> FLAGGED
                    </span>
                    {item.hodEmailSent && (
                      <span className="text-[10px] font-semibold px-[8px] py-[3px] rounded-[6px] bg-[#fffbeb] text-[#d97706] border border-[#fde68a] flex items-center gap-[4px]">
                        <Mail size={10} /> HOD Notified
                      </span>
                    )}
                    {item.adminHandling && (
                      <span className="text-[10px] font-semibold px-[8px] py-[3px] rounded-[6px] bg-[#eff6ff] text-[#3b82f6] border border-[#bfdbfe] flex items-center gap-[4px]">
                        <AlertTriangle size={10} /> Admin Handling
                      </span>
                    )}
                  </div>
                  <button onClick={() => setFocused(item)} className="flex items-center gap-[4px] text-[11px] font-bold text-[#16a34a] bg-[#f0fdf4] border border-[#bbf7d0] px-[10px] py-[5px] rounded-[7px] cursor-pointer hover:bg-[#dcfce7] transition-colors">
                    View <ChevronRight size={12} />
                  </button>
                </div>

                <div className="text-[15px] font-bold text-[#0f172a] mb-[6px]">
                  {item.subIssue || item.customIssue || item.category || 'Complaint'}
                </div>

                <div className="grid grid-cols-2 gap-[8px] mb-[12px]">
                  <div className="bg-[#f9fafb] rounded-[8px] p-[10px]">
                    <div className="text-[10px] font-bold text-[#94a3b8] uppercase mb-[3px]">Reported By</div>
                    <div className="text-[12px] font-semibold text-[#374151]">{item.submittedByName || '—'}</div>
                    <div className="text-[11px] text-[#94a3b8]">{item.submittedByRole}</div>
                  </div>
                  <div className="bg-[#f9fafb] rounded-[8px] p-[10px]">
                    <div className="text-[10px] font-bold text-[#94a3b8] uppercase mb-[3px]">Assigned To</div>
                    <div className="text-[12px] font-semibold text-[#374151]">{item.assignedToName || 'Not assigned'}</div>
                    <div className="text-[11px] text-[#94a3b8]">{item.category}</div>
                  </div>
                </div>

                <div className="flex items-center gap-[6px] text-[12px] font-bold text-[#dc2626] mb-[12px]">
                  <Clock size={13} color="#dc2626" />
                  Flagged {formatElapsed(item.flaggedAt)} ago · {formatDateShort(item.flaggedAt)}
                </div>

                <div className="flex gap-[8px]">
                  {!item.adminHandling && (
                    <button
                      onClick={() => handleIWillHandle(item.id)}
                      disabled={!!actionLoading}
                      className="flex-1 bg-[#3b82f6] text-white text-[12px] font-bold py-[9px] rounded-[9px] border-none cursor-pointer hover:bg-[#2563eb] transition-colors disabled:opacity-50"
                    >
                      {actionLoading === 'handle_' + item.id ? 'Processing…' : 'I Will Handle'}
                    </button>
                  )}
                  {item.adminHandling && (
                    <div className="flex-1 bg-[#eff6ff] text-[#3b82f6] text-[12px] font-bold py-[9px] rounded-[9px] text-center border border-[#bfdbfe]">
                      You are handling this
                    </div>
                  )}
                  <button
                    onClick={() => handleMarkResolved(item.id)}
                    disabled={!!actionLoading}
                    className="flex-1 bg-[#16a34a] text-white text-[12px] font-bold py-[9px] rounded-[9px] border-none cursor-pointer hover:bg-[#15803d] transition-colors disabled:opacity-50"
                  >
                    {actionLoading === 'resolve_' + item.id ? 'Processing…' : 'Mark as Resolved'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

{focused && <ComplaintModal complaint={focused} onClose={() => setFocused(null)} />}

      {confirmId && (
        <div className="fixed inset-0 bg-[#0f172a]/60 flex items-center justify-center z-[300] p-[20px] backdrop-blur-[2px]" onClick={() => setConfirmId(null)}>
          <div className="bg-white rounded-[20px] w-full max-w-[400px] shadow-[0_30px_80px_rgba(0,0,0,0.22)] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-[24px_24px_0]">
              <div className="w-[48px] h-[48px] rounded-[14px] bg-[#f0fdf4] border border-[#bbf7d0] flex items-center justify-center mb-[16px]">
                <CheckCircle size={24} color="#16a34a" />
              </div>
              <div className="text-[16px] font-extrabold text-[#0f172a] mb-[8px]">Mark as Resolved</div>
              <div className="text-[13px] text-[#64748b] leading-[1.6] mb-[24px]">
                This will mark the complaint as completed. The student will be notified and a resolution email will be sent to the HOD.
              </div>
            </div>
            <div className="flex gap-[10px] p-[0_24px_24px]">
              <button
                onClick={() => setConfirmId(null)}
                className="flex-1 bg-[#f8fafc] text-[#475569] border border-[#e2e8f0] rounded-[10px] py-[11px] text-[13px] font-semibold cursor-pointer hover:bg-[#f1f5f9] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmResolve}
                className="flex-1 bg-[#16a34a] text-white rounded-[10px] py-[11px] text-[13px] font-bold cursor-pointer hover:bg-[#15803d] transition-colors"
              >
                Yes, Resolve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}