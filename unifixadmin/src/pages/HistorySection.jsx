import { useState } from 'react'
import { Flag, Mail, CheckCircle, Clock, ChevronRight, FileText, Star } from 'lucide-react'
import { formatDateShort } from '../utils/dateUtils'
import { SectionHeader } from '../components/SharedComponents'
import { ComplaintModal } from './ComplaintsSection'

function formatElapsed(ts) {
  if (!ts) return 'N/A'
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

function toTimestamp(ts) {
  if (!ts) return null
  if (typeof ts === 'number') return ts * 1000
  const secs = ts._seconds ?? ts.seconds
  return secs ? secs * 1000 : null
}

function formatResolutionTime(acceptedAt, completedAt) {
  const start = toTimestamp(acceptedAt)
  const end = toTimestamp(completedAt)
  if (!start || !end) return 'N/A'
  const diff = end - start
  const totalMins = Math.floor(diff / 60000)
  const hours = Math.floor(totalMins / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days} day${days > 1 ? 's' : ''}`
  if (hours > 0) return `${hours}h ${totalMins % 60}m`
  return `${totalMins}m`
}

export default function HistorySection({ allComplaints, loading }) {
  const [activeTab, setActiveTab] = useState('flagged')
  const [focused, setFocused] = useState(null)

  const completedComplaints = allComplaints.filter(c => c.status === 'completed' && c.flagged === true)
  const flaggedActive = allComplaints.filter(c => c.flagged === true && !c.flagResolved && c.status !== 'completed')
  const flaggedResolved = allComplaints.filter(c => c.flagged === true && c.flagResolved === true)
  const allFlagged = [...flaggedActive, ...flaggedResolved]

  const tabs = [
    { key: 'flagged', label: 'Flagged', count: allFlagged.length },
    { key: 'completed', label: 'Completed (Flagged)', count: completedComplaints.length },
  ]

  return (
    <div>
      <SectionHeader title="Resolution History" subtitle="Flagged complaints and resolved escalations" />

      <div className="flex gap-[6px] mb-[20px]">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-[6px] p-[7px_13px] rounded-[8px] text-[12px] font-semibold cursor-pointer transition-all duration-150 border-[1.5px] ${activeTab === tab.key ? 'bg-[#0f172a] text-white border-[#0f172a]' : 'bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#0f172a]'}`}>
            {tab.label}
            <span className={`text-[10px] font-extrabold px-[6px] py-[1px] rounded-[20px] shrink-0 ${activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-[#f1f5f9] text-[#64748b]'}`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-[60px] text-center text-[#94a3b8] text-[14px]">Loading…</div>
      ) : activeTab === 'flagged' ? (
        allFlagged.length === 0 ? (
          <div className="bg-white rounded-[16px] p-[48px] text-center border border-[#f0f0f0]">
            <Flag size={32} color="#cbd5e1" className="mx-auto mb-[12px]" />
            <div className="text-[14px] font-bold text-[#475569] mb-[4px]">No flagged complaints</div>
            <div className="text-[12px] text-[#94a3b8]">Escalated complaints will appear here</div>
          </div>
        ) : (
          <div className="flex flex-col gap-[10px]">
            {allFlagged.map(item => {
              const isResolved = item.flagResolved === true
              return (
                <div key={item.id} onClick={() => setFocused(item)} className={`bg-white rounded-[14px] p-[16px] border-l-[4px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] cursor-pointer hover:shadow-[0_4px_14px_rgba(0,0,0,0.08)] transition-all duration-150 ${isResolved ? 'border-l-[#16a34a]' : 'border-l-[#ef4444]'}`}>
                  <div className="flex items-center justify-between mb-[10px]">
                    <div className="flex items-center gap-[8px]">
                      <span className={`text-[10px] font-bold px-[9px] py-[3px] rounded-[6px] border flex items-center gap-[4px] ${isResolved ? 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]' : 'bg-[#fef2f2] text-[#dc2626] border-[#fecaca]'}`}>
                        {isResolved ? <CheckCircle size={10} /> : <Flag size={10} />}
                        {isResolved ? 'RESOLVED' : 'FLAGGED'}
                      </span>
                      {item.hodEmailSent && (
                        <span className="text-[10px] font-semibold px-[8px] py-[3px] rounded-[6px] bg-[#f8fafc] text-[#64748b] border border-[#e2e8f0] flex items-center gap-[4px]">
                          <Mail size={10} /> HOD Notified
                        </span>
                      )}
                    </div>
                    <ChevronRight size={15} color="#94a3b8" />
                  </div>

                  <div className="text-[14px] font-bold text-[#0f172a] mb-[8px]">
                    {item.subIssue || item.customIssue || item.category || 'Complaint'}
                  </div>

                  {item.assignedToName && (
                    <div className="flex items-center gap-[6px] text-[12px] text-[#64748b] mb-[6px]">
                      <Clock size={12} color="#94a3b8" />
                      Assigned to: {item.assignedToName}
                    </div>
                  )}

                  <div className={`flex items-center gap-[6px] text-[12px] font-bold mb-[10px] ${isResolved ? 'text-[#16a34a]' : 'text-[#dc2626]'}`}>
                    <Clock size={12} color={isResolved ? '#16a34a' : '#dc2626'} />
                    {isResolved
                      ? `Resolved in ${formatResolutionTime(item.acceptedAt, item.completedAt)}`
                      : item.flaggedAt
                      ? `Flagged ${formatElapsed(item.flaggedAt)} ago`
                      : 'Flagged'}
                  </div>

                  <div className="flex items-center justify-between pt-[10px] border-t border-[#f1f5f9]">
                    <span className="text-[10px] font-bold text-[#94a3b8] tracking-[0.5px] uppercase">Category: {item.category || 'N/A'}</span>
                    <span className="text-[10px] text-[#94a3b8]">{formatDateShort(item.flaggedAt)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )
      ) : (
        completedComplaints.length === 0 ? (
          <div className="bg-white rounded-[16px] p-[48px] text-center border border-[#f0f0f0]">
            <CheckCircle size={32} color="#cbd5e1" className="mx-auto mb-[12px]" />
            <div className="text-[14px] font-bold text-[#475569] mb-[4px]">No completed flagged complaints</div>
            <div className="text-[12px] text-[#94a3b8]">Resolved escalated complaints will appear here</div>
          </div>
        ) : (
          <div className="flex flex-col gap-[10px]">
            {completedComplaints.map(item => (
              <div key={item.id} onClick={() => setFocused(item)} className="bg-white rounded-[14px] p-[16px] border-l-[4px] border-l-[#16a34a] shadow-[0_1px_4px_rgba(0,0,0,0.04)] cursor-pointer hover:shadow-[0_4px_14px_rgba(0,0,0,0.08)] transition-all duration-150">
                <div className="flex items-center justify-between mb-[10px]">
                  <span className="text-[10px] font-bold px-[9px] py-[3px] rounded-[6px] bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0] flex items-center gap-[4px]">
                    <CheckCircle size={10} /> COMPLETED
                  </span>
                  <ChevronRight size={15} color="#94a3b8" />
                </div>

                <div className="text-[14px] font-bold text-[#0f172a] mb-[8px]">
                  {item.subIssue || item.customIssue || item.category || 'Complaint'}
                </div>

                {item.assignedToName && (
                  <div className="flex items-center gap-[6px] text-[12px] text-[#64748b] mb-[6px]">
                    <Clock size={12} color="#94a3b8" />
                    Staff: {item.assignedToName}
                  </div>
                )}

                <div className="flex items-center gap-[6px] text-[12px] font-bold text-[#16a34a] mb-[10px]">
                  <CheckCircle size={12} color="#16a34a" />
                  Resolved in {formatResolutionTime(item.acceptedAt, item.completedAt)}
                </div>

                {item.rating !== null && item.rating !== undefined && (
                  <div className="flex items-center gap-[3px] mb-[10px]">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} size={13} color={i <= item.rating ? '#f59e0b' : '#e2e8f0'} fill={i <= item.rating ? '#f59e0b' : 'none'} />
                    ))}
                    <span className="text-[12px] font-bold text-[#f59e0b] ml-[4px]">{item.rating}/5</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-[10px] border-t border-[#f1f5f9]">
                  <span className="text-[10px] font-bold text-[#94a3b8] tracking-[0.5px] uppercase">Category: {item.category || 'N/A'}</span>
                  <div className="flex items-center gap-[4px] text-[11px] font-bold text-[#16a34a]">
                    <FileText size={11} color="#16a34a" /> View Log
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {focused && <ComplaintModal complaint={focused} onClose={() => setFocused(null)} />}
    </div>
  )
}