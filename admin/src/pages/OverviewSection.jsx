import { ChevronRight, CreditCard, Trash2, ShieldAlert, Zap, Droplets, Hammer, Sparkles, Monitor, Shield, Bath, FileText } from 'lucide-react'
import { CATEGORY } from '../constants'
import {formatDateShort} from '../utils/dateUtils'
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

export default function OverviewSection({ stats, cs, complaints, onNavigate, loading }) {
  const recent = complaints.slice(0, 6)
  const statCards = [
    { label: 'Total Complaints', value: cs.total ?? 0, sub: `${cs.pending ?? 0} pending`, subColor: '#d97706', color: '#f59e0b', section: 'complaints' },
    { label: 'Pending', value: cs.pending ?? 0, sub: 'Requires attention', subColor: '#dc2626', color: '#ef4444', section: 'complaints' },
    { label: 'In Progress', value: cs.in_progress ?? 0, sub: 'Staff assigned', subColor: '#7c3aed', color: '#8b5cf6', section: 'complaints' },
    { label: 'Resolved', value: cs.completed ?? 0, sub: `${cs.total ? Math.round((cs.completed / cs.total) * 100) : 0}% success rate`, subColor: '#059669', color: '#10b981', section: 'complaints' },
    { label: 'Students', value: stats.students ?? 0, sub: 'Active profiles', subColor: '#6b7280', color: '#6366f1', section: 'users' },
    { label: 'Active Staff', value: stats.approved ?? 0, sub: 'Verified staff', subColor: '#6b7280', color: '#0ea5e9', section: 'staff' },
  ]
  return (
    <div>
      <SectionHeader title="Campus Overview" subtitle="Welcome back. Here's what's happening across campus today." />
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-[12px] mb-[20px]">
        {statCards.map(card => (
          <div key={card.label} className="group bg-white rounded-[14px] p-[18px_16px] border border-[#f0f0f0] cursor-pointer transition-all duration-180 relative overflow-hidden hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]" onClick={() => onNavigate(card.section)}>
            <div className="text-[10px] font-bold text-[#94a3b8] tracking-[0.6px] uppercase mb-[10px]">{card.label}</div>
            <div className="text-[30px] font-extrabold leading-none mb-[7px] tracking-[-1px]" style={{ color: card.color }}>{loading ? '—' : card.value.toLocaleString()}</div>
            <div className="text-[11px] font-semibold" style={{ color: card.subColor }}>{card.sub}</div>
            <div className="absolute bottom-0 left-0 right-0 h-[3px] opacity-0 transition-opacity duration-180 group-hover:opacity-100" style={{ background: card.color }} />
          </div>
        ))}
      </div>
      {(stats.pendingIdCardRequests > 0 || stats.pendingDeletionRequests > 0 || stats.openSecurityIssues > 0) && (
        <div className="flex flex-col md:flex-row gap-[12px] mb-[20px]">
          {stats.pendingIdCardRequests > 0 && (
            <div className="bg-white rounded-[12px] p-[14px_20px] flex items-center gap-[12px] cursor-pointer transition-all duration-150 border-[1.5px] border-[#fde68a] hover:-translate-y-[1px] hover:shadow-[0_4px_14px_rgba(0,0,0,0.07)]" onClick={() => onNavigate('idcards')}>
              <div className="w-[40px] h-[40px] rounded-[10px] flex items-center justify-center shrink-0 bg-[#fef3c7]"><CreditCard size={18} color="#d97706" /></div>
              <div><div className="text-[20px] font-extrabold leading-none text-[#d97706]">{stats.pendingIdCardRequests}</div><div className="text-[12px] font-semibold mt-[2px] text-[#92400e]">Pending ID Card Requests</div></div>
            </div>
          )}
          {stats.pendingDeletionRequests > 0 && (
            <div className="bg-white rounded-[12px] p-[14px_20px] flex items-center gap-[12px] cursor-pointer transition-all duration-150 border-[1.5px] border-[#fecaca] hover:-translate-y-[1px] hover:shadow-[0_4px_14px_rgba(0,0,0,0.07)]" onClick={() => onNavigate('deletions')}>
              <div className="w-[40px] h-[40px] rounded-[10px] flex items-center justify-center shrink-0 bg-[#fef2f2]"><Trash2 size={18} color="#dc2626" /></div>
              <div><div className="text-[20px] font-extrabold leading-none text-[#dc2626]">{stats.pendingDeletionRequests}</div><div className="text-[12px] font-semibold mt-[2px] text-[#991b1b]">Pending Deletion Requests</div></div>
            </div>
          )}
          {stats.openSecurityIssues > 0 && (
            <div className="bg-white rounded-[12px] p-[14px_20px] flex items-center gap-[12px] cursor-pointer transition-all duration-150 border-[1.5px] border-[#fcd34d] hover:-translate-y-[1px] hover:shadow-[0_4px_14px_rgba(0,0,0,0.07)]" onClick={() => onNavigate('security')}>
              <div className="w-[40px] h-[40px] rounded-[10px] flex items-center justify-center shrink-0 bg-[#fef3c7]"><ShieldAlert size={18} color="#d97706" /></div>
              <div><div className="text-[20px] font-extrabold leading-none text-[#d97706]">{stats.openSecurityIssues}</div><div className="text-[12px] font-semibold mt-[2px] text-[#92400e]">Open Security Issues</div></div>
            </div>
          )}
        </div>
      )}
      <div className="bg-white rounded-[16px] border border-[#f0f0f0] overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="flex justify-between items-center p-[16px_22px] border-b border-[#f5f5f5]">
          <span className="text-[14px] font-bold text-[#0f172a]">Recent Activity</span>
          <button className="bg-none border-none text-[#16a34a] text-[13px] font-bold cursor-pointer flex items-center gap-[4px] transition-[gap] duration-150 hover:gap-[7px]" onClick={() => onNavigate('complaints')}>View All <ChevronRight size={14} /></button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead><tr className="bg-[#fafafa]">{['Complaint', 'Location', 'Reported By', 'Status', 'Date'].map(h => <th key={h} className="p-[10px_20px] text-left text-[10px] font-bold text-[#94a3b8] tracking-[0.6px] uppercase border-b border-[#f0f0f0] whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={5} className="p-[60px] text-center text-[#94a3b8] text-[14px]">Loading…</td></tr>
                : recent.length === 0 ? <tr><td colSpan={5} className="p-[60px] text-center text-[#94a3b8] text-[14px]">No complaints yet</td></tr>
                  : recent.map(c => {
                    const catMeta = CATEGORY[c.category] ?? CATEGORY.others
                    const CatIcon = CATEGORY_ICONS[c.category] ?? CATEGORY_ICONS.others
                    return (
                      <tr key={c.id} className="transition-colors duration-100 cursor-default hover:bg-[#fafafa]">
                        <td className="p-[13px_20px] border-b border-[#f9f9f9] align-middle">
                          <div className="flex items-center gap-[10px]">
                            <div className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center shrink-0" style={{ background: catMeta.bg }}><CatIcon size={14} color={catMeta.color} /></div>
                            <span className="text-[13px] font-semibold text-[#0f172a]">{c.subIssue || c.customIssue || 'Issue Reported'}</span>
                          </div>
                        </td>
                        <td className="p-[13px_20px] border-b border-[#f9f9f9] align-middle text-[13px] text-[#374151]">{[c.building, c.roomDetail].filter(Boolean).join(', ') || '—'}</td>
                        <td className="p-[13px_20px] border-b border-[#f9f9f9] align-middle text-[13px] text-[#374151] font-medium">{c.submittedByName || '—'}</td>
                        <td className="p-[13px_20px] border-b border-[#f9f9f9] align-middle"><StatusBadge status={c.status} /></td>
                        <td className="p-[13px_20px] border-b border-[#f9f9f9] align-middle"><span className="text-[12px] text-[#94a3b8]">{formatDateShort(c.createdAt)}</span></td>
                      </tr>
                    )
                  })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
