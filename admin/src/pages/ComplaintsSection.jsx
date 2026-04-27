import { X, Eye, CheckCheck, Zap, Droplets, Hammer, Sparkles, Monitor, Shield, Bath, FileText } from 'lucide-react'
import { CATEGORY, STATUS, COMPLAINT_FLOW } from '../constants'
import { formatDate, formatDateShort, cap } from '../utils/dateUtils'
import { StatusBadge, SectionHeader } from '../components/SharedComponents'

const CATEGORY_ICONS = {
  electrical: Zap,
  plumbing: Droplets,
  carpentry: Hammer,
  cleaning: Sparkles,
  technician: Monitor,
  safety: Shield,
  washroom: Bath,
  others: FileText,
}

export function ComplaintsSection({ allComplaints, visible, activeTab, onTabChange, cs, loading, focused, setFocused }) {
  const flaggedCount = allComplaints.filter(c => c.flagged && !c.flagResolved && ['pending', 'assigned', 'in_progress'].includes(c.status)).length
  const tabs = [
    { key: 'all', label: 'All', count: cs.total ?? allComplaints.length },
    { key: 'flagged', label: 'Flagged', count: flaggedCount },
    { key: 'pending', label: 'Pending', count: cs.pending },
    { key: 'assigned', label: 'Assigned', count: cs.assigned },
    { key: 'in_progress', label: 'In Progress', count: cs.in_progress },
    { key: 'completed', label: 'Completed', count: cs.completed },
    { key: 'rejected', label: 'Rejected', count: cs.rejected },
  ]
  return (
    <div>
      <SectionHeader title="Complaint Management" subtitle="Full complaint history and real-time status tracking" />
      <div className="bg-white rounded-[16px] border border-[#f0f0f0] overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="flex gap-[5px] p-[14px_18px] border-b border-[#f5f5f5] flex-wrap">
          {tabs.map(tab => (
            <button key={tab.key} className={`p-[6px_11px] rounded-[7px] border-[1.5px] text-[12px] font-semibold cursor-pointer transition-all duration-150 ${activeTab === tab.key ? 'bg-[#0f172a] text-white border-[#0f172a]' : 'bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#0f172a]'}`} onClick={() => onTabChange(tab.key)}>
              {tab.label}
              <span className={`ml-[5px] text-[10px] font-extrabold px-[6px] py-[1px] rounded-[20px] ${activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-[#f1f5f9] text-[#64748b]'}`}>{tab.count ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead><tr className="bg-[#fafafa]">{['', 'Complaint', 'Category', 'Location', 'Reported By', 'Status', 'Date', ''].map((h, i) => <th key={i} className="p-[10px_20px] text-left text-[10px] font-bold text-[#94a3b8] tracking-[0.6px] uppercase border-b border-[#f0f0f0] whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={8} className="p-[60px] text-center text-[#94a3b8] text-[14px]">Loading…</td></tr>
                : visible.length === 0 ? <tr><td colSpan={8} className="p-[60px] text-center text-[#94a3b8] text-[14px]">No complaints found</td></tr>
                  : visible.map(c => {
                    const catMeta = CATEGORY[c.category] ?? CATEGORY.others
                    const CatIcon = CATEGORY_ICONS[c.category] ?? CATEGORY_ICONS.others
                    return (
                     <tr key={c.id} className={`transition-colors duration-100 cursor-pointer hover:bg-[#fafafa] ${c.flagged && !c.flagResolved && ['pending','assigned','in_progress'].includes(c.status) ? 'bg-[#fff8f8] border-l-[3px] border-l-[#dc2626]' : ''}`}>
                        <td className="p-[11px_8px_11px_18px] border-b border-[#f9f9f9] align-middle">
                          <div className="w-[36px] h-[36px] rounded-[9px] bg-[#f3f4f6] overflow-hidden flex items-center justify-center shrink-0">
                            {c.photoUrl ? <img src={c.photoUrl} className="w-full h-full object-cover" alt="" /> : <CatIcon size={16} color={catMeta.color} />}
                          </div>
                        </td>
                        <td className="p-[13px_20px] border-b border-[#f9f9f9] align-middle">
                          <div className="text-[13px] font-bold text-[#0f172a] mb-[2px]">{c.subIssue || c.customIssue || 'Issue Reported'}</div>
                          <div className="font-['DM_Mono'] text-[11px] text-[#94a3b8]">{c.ticketId}</div>
                        </td>
                        <td className="p-[13px_20px] border-b border-[#f9f9f9] align-middle text-[12px] font-bold" style={{ color: catMeta.color }}>{cap(c.category)}</td>
                        <td className="p-[13px_20px] border-b border-[#f9f9f9] align-middle">
                          <div className="text-[12px] text-[#374151]">{c.building || '—'}</div>
                          <div className="text-[11px] text-[#94a3b8]">{c.roomDetail}</div>
                        </td>
                        <td className="p-[13px_20px] border-b border-[#f9f9f9] align-middle">
                          <div className="text-[12px] font-semibold text-[#374151]">{c.submittedByName || '—'}</div>
                          <div className="text-[11px] text-[#94a3b8]">{cap(c.submittedByRole)}</div>
                        </td>
                      <td className="p-[13px_20px] border-b border-[#f9f9f9] align-middle">
                          <StatusBadge status={c.status} />
                          {c.flagged && !c.flagResolved && ['pending','assigned','in_progress'].includes(c.status) && (
                            <span className="inline-flex items-center gap-[3px] mt-[4px] text-[10px] font-bold px-[7px] py-[2px] rounded-[20px] bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]">🚩 FLAGGED</span>
                          )}
                          {c.hodEmailSent && (
                            <span className="inline-flex items-center gap-[3px] mt-[4px] text-[10px] font-bold px-[7px] py-[2px] rounded-[20px] bg-[#fffbeb] text-[#d97706] border border-[#fde68a] ml-[4px]">✉ HOD</span>
                          )}
                        </td>
                        <td className="p-[13px_20px] border-b border-[#f9f9f9] align-middle"><span className="text-[11px] text-[#94a3b8]">{formatDateShort(c.createdAt)}</span></td>
                        <td className="p-[13px_20px] border-b border-[#f9f9f9] align-middle">
                          <button className="bg-[#16a34a] text-white p-[5px_13px] rounded-[6px] border-none text-[12px] font-bold cursor-pointer transition-all duration-150 flex items-center gap-[4px] hover:bg-[#15803d]" onClick={() => setFocused(c)}><Eye size={12} /> View</button>
                        </td>
                      </tr>
                    )
                  })}
            </tbody>
          </table>
        </div>
        <div className="p-[11px_20px] border-t border-[#f5f5f5] flex justify-between items-center">
          <span className="text-[12px] text-[#94a3b8]">Showing {visible.length} of {allComplaints.length} entries</span>
        </div>
      </div>
      {focused && <ComplaintModal complaint={focused} onClose={() => setFocused(null)} />}
    </div>
  )
}

export function ComplaintModal({ complaint, onClose }) {
  const catMeta = CATEGORY[complaint.category] ?? CATEGORY.others
  const CatIcon = CATEGORY_ICONS[complaint.category] ?? CATEGORY_ICONS.others
  const stepIndex = COMPLAINT_FLOW.indexOf(complaint.status)
  return (
    <div className="fixed inset-0 bg-[#0f172a]/60 flex items-center justify-center z-[200] p-[20px] backdrop-blur-[2px]" onClick={onClose}>
      <div className="bg-white rounded-[20px] w-full max-w-[720px] max-h-[90vh] flex flex-col shadow-[0_30px_80px_rgba(0,0,0,0.22)] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-[18px_22px] border-b border-[#f3f4f6] shrink-0">
          <div className="flex items-center gap-[12px]">
            <div className="flex items-center justify-center w-[42px] h-[42px] rounded-[11px]" style={{ background: catMeta.bg }}><CatIcon size={20} color={catMeta.color} /></div>
            <div>
              <div className="text-[15px] font-extrabold text-[#0f172a]">{complaint.subIssue || complaint.customIssue || 'Issue Reported'}</div>
              <div className="font-['DM_Mono'] text-[11px] text-[#94a3b8] mt-[3px]">{complaint.ticketId}</div>
            </div>
          </div>
          <div className="flex gap-[10px] items-center">
            <StatusBadge status={complaint.status} />
            <button className="w-[32px] h-[32px] rounded-[8px] bg-[#f3f4f6] border-none cursor-pointer flex items-center justify-center text-[#374151] transition-all duration-150 hover:bg-[#fee2e2] hover:text-[#dc2626]" onClick={onClose}><X size={14} /></button>
          </div>
        </div>
        <div className="overflow-y-auto p-[22px] flex flex-col gap-[18px]">
          {complaint.status !== 'rejected' && (
            <div className="bg-[#f9fafb] rounded-[12px] p-[18px]">
              <div className="text-[10px] font-bold text-[#94a3b8] tracking-[0.6px] uppercase mb-[16px]">Progress</div>
              <div className="flex items-start">
                {COMPLAINT_FLOW.map((step, i) => {
                  const done = i <= stepIndex
                  return (
                    <div key={step} className="flex-1 flex flex-col items-center relative">
                      <div className={`w-[26px] h-[26px] rounded-full flex items-center justify-center z-[1] mb-[8px] transition-colors duration-200 ${done ? 'bg-[#0f172a]' : 'bg-[#e2e8f0]'}`}>{done && <CheckCheck size={11} color="#fff" strokeWidth={3} />}</div>
                      {i < COMPLAINT_FLOW.length - 1 && <div className={`absolute top-[13px] left-[50%] w-full h-[2px] z-[0] transition-colors duration-200 ${i < stepIndex ? 'bg-[#0f172a]' : 'bg-[#e2e8f0]'}`} />}
                      <div className={`text-[10px] text-center font-medium ${done ? 'text-[#0f172a] font-bold' : 'text-[#94a3b8]'}`}>{STATUS[step]?.label}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[14px]">
            {[
              { title: 'Complaint Details', rows: [['Category', cap(complaint.category)], ['Issue', complaint.subIssue || complaint.customIssue], ...(complaint.description ? [['Description', complaint.description]] : []), ['Building', complaint.building], ['Room / Area', complaint.roomDetail], ['Submitted', formatDate(complaint.createdAt)]] },
              { title: 'Reported By', rows: [['Name', complaint.submittedByName], ['Email', complaint.submittedByEmail], ['Phone', complaint.submittedByPhone || '—'], ['Role', cap(complaint.submittedByRole)]] },
              { title: 'Assignment', rows: [['Assigned To', complaint.assignedToName || 'Not yet assigned']] },
            ].map(panel => (
              <div key={panel.title} className="bg-[#f9fafb] rounded-[12px] p-[15px]">
                <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.6px] mb-[12px]">{panel.title}</div>
                <div className="flex flex-col gap-[8px]">
                  {panel.rows.map(([k, v]) => <div key={k} className="flex justify-between gap-[8px]"><span className="text-[12px] text-[#94a3b8] font-medium shrink-0">{k}</span><span className="text-[12px] text-[#374151] font-semibold text-right break-words">{v || '—'}</span></div>)}
                </div>
              </div>
            ))}
          </div>
          {complaint.photoUrl && (
            <div>
              <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.6px] mb-[10px]">Attached Photo</div>
              <img src={complaint.photoUrl} alt="complaint" onClick={() => window.open(complaint.photoUrl, '_blank')} className="w-full max-h-[280px] object-cover rounded-[10px] cursor-pointer border border-[#f0f0f0] block" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
