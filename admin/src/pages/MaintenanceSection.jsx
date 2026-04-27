import { Wrench, ClipboardList, ArrowRight } from 'lucide-react'
import { StatusBadge, EmptyState, SectionHeader } from '../components/SharedComponents.jsx'

export default function MaintenanceSection({ items, activeTab, onTabChange, stats, loading, navigate }) {
  const tabs = [
    { key: 'pending', label: 'Pending', count: stats.pending },
    { key: 'approved', label: 'Approved', count: stats.approved },
    { key: 'rejected', label: 'Rejected', count: stats.rejected },
  ]
  const miniStats = [
    { label: 'Total Staff', value: stats.total ?? 0, color: '#0f172a' },
    { label: 'Pending Review', value: stats.pending ?? 0, color: '#d97706' },
    { label: 'Approved', value: stats.approved ?? 0, color: '#059669' },
    { label: 'Rejected', value: stats.rejected ?? 0, color: '#dc2626' },
  ]
  return (
    <div>
      <SectionHeader title="Maintenance Staff" subtitle="Review and manage maintenance staff verification requests" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-[14px] mb-[24px]">
        {miniStats.map(s => (
          <div key={s.label} className="bg-white rounded-[12px] p-[16px_20px] border border-[#f0f0f0] flex items-center gap-[14px]">
            <div className="w-[40px] h-[40px] rounded-[10px] bg-[#f8fafc] flex items-center justify-center shrink-0"><Wrench size={18} color={s.color} /></div>
            <div>
              <div className="text-[24px] font-extrabold leading-none" style={{ color: s.color }}>{loading ? '—' : s.value}</div>
              <div className="text-[12px] text-[#94a3b8] font-medium mt-[3px]">{s.label}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-[6px] mb-[20px] flex-wrap">
        {tabs.map(tab => (
          <button key={tab.key} className={`flex items-center gap-[6px] p-[7px_13px] rounded-[8px] text-[12px] font-semibold cursor-pointer transition-all duration-150 border-[1.5px] ${activeTab === tab.key ? 'bg-[#0f172a] text-white border-[#0f172a]' : 'bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#16a34a] hover:text-[#16a34a]'}`} onClick={() => onTabChange(tab.key)}>
            {tab.label}<span className={`text-[10px] font-extrabold px-[6px] py-[1px] rounded-[20px] shrink-0 ${activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-[#f1f5f9] text-[#64748b]'}`}>{tab.count ?? 0}</span>
          </button>
        ))}
      </div>
      {loading ? <div className="p-[60px] text-center text-[#94a3b8] text-[14px]">Loading…</div>
        : items.length === 0 ? <EmptyState icon={ClipboardList} text={`No ${activeTab} applications`} sub="Check back later" />
          : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[16px]">
              {items.map(member => (
                <div key={member.id} className="bg-white rounded-[14px] border border-[#f0f0f0] overflow-hidden">
                  <div className="p-[16px_18px] border-b border-[#f9f9f9] flex items-center gap-[12px]">
                    <div className="w-[42px] h-[42px] rounded-[11px] flex items-center justify-center text-[16px] font-extrabold shrink-0 border-[1.5px] bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]">{member.fullName?.[0]?.toUpperCase() ?? '?'}</div>
                    <div className="flex-1 min-w-0"><div className="text-[14px] font-bold text-[#0f172a] mb-[2px]">{member.fullName}</div><div className="text-[11px] text-[#94a3b8] overflow-hidden text-ellipsis whitespace-nowrap">{member.email}</div></div>
                    <StatusBadge verification={member.verificationStatus} />
                  </div>
                  <div className="p-[13px_18px]">
                    {[['Employee ID', member.employeeId], ['Designation', member.designation], ['Experience', member.experience ? `${member.experience} yrs` : null], ['Phone', member.phone]].map(([k, v]) => v ? (
                      <div key={k} className="flex justify-between items-center py-[6px] border-b border-[#f9f9f9] last:border-none"><span className="text-[12px] text-[#94a3b8] font-medium">{k}</span><span className="text-[12px] text-[#374151] font-semibold text-right">{v}</span></div>
                    ) : null)}
                  </div>
                  <div className="p-[12px_18px]">
                    <button className="w-full bg-[#0f172a] text-white border-none rounded-[9px] p-[10px] text-[13px] font-bold cursor-pointer flex items-center justify-center gap-[6px] transition-all duration-150 hover:bg-[#1e293b]" onClick={() => navigate(`/staff/${member.id}`)}>View Full Profile <ArrowRight size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
    </div>
  )
}
