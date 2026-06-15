import { useState } from 'react'
import { X, Eye, IdCard, GraduationCap, BookUser } from 'lucide-react'
import { adminAPI } from '../services/api'
import { EmptyState, SectionHeader } from '../components/SharedComponents'
import {  cap } from '../utils/dateUtils'

export default function StaffUsersSection({ items, activeTab, onTabChange, stats, loading }) {
  const [idCardUser, setIdCardUser] = useState(null)
  const [idCardData, setIdCardData] = useState(null)
  const [idCardLoading, setIdCardLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)

  const viewIdCard = async (user) => {
    setIdCardUser(user); setIdCardData(null); setIdCardLoading(true)
    try { const res = await adminAPI.getUserIdCard(user.id); setIdCardData(res.data.idCard) }
    catch { 
        //Catch block
    } finally { setIdCardLoading(false) }
  }

  const tabs = [
    { key: 'student', label: 'Students', count: stats.students },
    { key: 'teacher', label: 'Teachers', count: stats.teachers },
  ]

  return (
    <div>
      <SectionHeader title="Staff & Users" subtitle="All registered students and teachers on the platform" />
      <div className="flex gap-[14px] mb-[24px] flex-wrap">
        {[{ label: 'Students', value: stats.students ?? 0, color: '#6366f1', Icon: GraduationCap }, { label: 'Teachers', value: stats.teachers ?? 0, color: '#0ea5e9', Icon: BookUser }].map(s => (
          <div key={s.label} className="bg-white rounded-[12px] p-[16px_24px] border border-[#f0f0f0] flex items-center gap-[14px]">
            <div className="w-[42px] h-[42px] rounded-[11px] flex items-center justify-center shrink-0" style={{ background: s.color + '18' }}><s.Icon size={20} color={s.color} /></div>
            <div>
              <div className="text-[26px] font-extrabold leading-none" style={{ color: s.color }}>{loading ? '—' : s.value}</div>
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
        : items.length === 0 ? <EmptyState icon={activeTab === 'student' ? GraduationCap : BookUser} text={`No ${activeTab}s registered yet`} />
          : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[14px]">
              {items.map(user => {
                const isStudent = user.role === 'student'
                const accentColor = isStudent ? '#6366f1' : '#0ea5e9'
                return (
                  <div key={user.id} className="bg-white rounded-[14px] border border-[#f0f0f0] overflow-hidden">
                    <div className="h-[4px]" style={{ background: accentColor }} />
                    <div className="p-[15px_18px]">
                      <div className="flex items-center gap-[12px] mb-[14px]">
                        <div className="w-[42px] h-[42px] rounded-[11px] flex items-center justify-center text-[16px] font-extrabold shrink-0 border-[1.5px]" style={{ background: isStudent ? '#ede9fe' : '#dbeafe', color: accentColor, borderColor: isStudent ? '#c4b5fd' : '#93c5fd' }}>{user.fullName?.[0]?.toUpperCase() ?? '?'}</div>
                        <div className="flex-1 min-w-0"><div className="text-[14px] font-bold text-[#0f172a] mb-[2px]">{user.fullName || '—'}</div><div className="text-[11px] text-[#94a3b8] overflow-hidden text-ellipsis whitespace-nowrap">{user.email}</div></div>
                      </div>
                      <div className="flex flex-col gap-[6px] mb-[13px]">
                        {user.gender && <div className="flex justify-between items-center py-[6px] border-b border-[#f9f9f9] last:border-none"><span className="text-[12px] text-[#94a3b8] font-medium">Gender</span><span className="text-[12px] text-[#374151] font-semibold text-right">{user.gender}</span></div>}
                        {isStudent ? (
                          <>
                            {user.year && <div className="flex justify-between items-center py-[6px] border-b border-[#f9f9f9] last:border-none"><span className="text-[12px] text-[#94a3b8] font-medium">Year</span><span className="text-[12px] text-[#374151] font-semibold text-right">{user.year}</span></div>}
                            {user.branch && <div className="flex justify-between items-center py-[6px] border-b border-[#f9f9f9] last:border-none"><span className="text-[12px] text-[#94a3b8] font-medium">Branch</span><span className="text-[12px] text-[#374151] font-semibold text-right">{user.branch}</span></div>}
                          </>
                        ) : (
                          user.department && <div className="flex justify-between items-center py-[6px] border-b border-[#f9f9f9] last:border-none"><span className="text-[12px] text-[#94a3b8] font-medium">Department</span><span className="text-[12px] text-[#374151] font-semibold text-right">{user.department}</span></div>
                        )}
                        {user.phone && <div className="flex justify-between items-center py-[6px] border-b border-[#f9f9f9] last:border-none"><span className="text-[12px] text-[#94a3b8] font-medium">Phone</span><span className="text-[12px] text-[#374151] font-semibold text-right">{user.phone}</span></div>}
                      </div>
                      <button className="w-full bg-[#f8fafc] text-[#374151] border-[1.5px] border-[#e2e8f0] rounded-[9px] p-[10px] text-[13px] font-bold cursor-pointer flex items-center justify-center gap-[6px] transition-all duration-150 hover:border-[#16a34a] hover:text-[#16a34a] hover:bg-[#f0fdf4]" onClick={() => viewIdCard(user)}><IdCard size={14} /> View ID Card</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

      {idCardUser && (
        <div className="fixed inset-0 bg-[#0f172a]/60 flex items-center justify-center z-[200] p-[20px] backdrop-blur-[2px]" onClick={() => { setIdCardUser(null); setIdCardData(null) }}>
          <div className="bg-white rounded-[20px] w-full max-w-[460px] max-h-[90vh] flex flex-col shadow-[0_30px_80px_rgba(0,0,0,0.22)] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-[18px_22px] border-b border-[#f3f4f6] shrink-0">
              <div>
                <div className="text-[15px] font-extrabold text-[#0f172a]">ID Card — {idCardUser.fullName}</div>
                <div className="text-[12px] text-[#94a3b8] mt-[2px] flex items-center gap-[5px]">{idCardUser.role === 'student' ? <GraduationCap size={12} /> : <BookUser size={12} />} {cap(idCardUser.role)}</div>
              </div>
              <button className="w-[32px] h-[32px] rounded-[8px] bg-[#f3f4f6] border-none cursor-pointer flex items-center justify-center text-[#374151] hover:bg-[#fee2e2] hover:text-[#dc2626]" onClick={() => { setIdCardUser(null); setIdCardData(null) }}><X size={14} /></button>
            </div>
            <div className="p-[22px]">
              {idCardLoading ? <div className="p-[60px] text-center text-[#94a3b8] text-[14px]">Loading…</div>
                : idCardData ? (() => {
                  const url = idCardData.studentIdCardUrl || idCardData.teacherIdCardUrl
                  return url ? (
                    <div>
                      <div className="relative cursor-pointer rounded-[8px] overflow-hidden border border-[#e2e8f0] mb-[12px] group" onClick={() => setPreviewUrl(url)}>
                        <img src={url} alt="ID Card" className="w-full max-h-[280px] object-contain block bg-[#f9fafb]" />
                        <div className="absolute inset-0 bg-transparent flex items-center justify-center text-white text-[12px] font-bold gap-[5px] transition-colors duration-150 group-hover:bg-black/30"><Eye size={14} /> Enlarge</div>
                      </div>
                      <button className="w-full bg-[#0f172a] text-white border-none rounded-[9px] p-[10px] text-[13px] font-bold cursor-pointer flex items-center justify-center gap-[6px] transition-all duration-150 hover:bg-[#1e293b]" onClick={() => setPreviewUrl(url)}><Eye size={14} /> View Full Size</button>
                    </div>
                  ) : <div className="p-[60px] text-center text-[#94a3b8] text-[14px]">No ID card uploaded yet</div>
                })() : <div className="p-[60px] text-center text-[#94a3b8] text-[14px]">No ID card found</div>}
            </div>
          </div>
        </div>
      )}

      {previewUrl && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[300] p-[20px]" onClick={() => setPreviewUrl(null)}>
          <div className="bg-white rounded-[16px] overflow-hidden max-w-[90vw] max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-[14px_18px] border-b border-[#e5e7eb] shrink-0">
              <span className="text-[14px] font-bold text-[#0f172a]">ID Card Preview</span>
              <button className="w-[32px] h-[32px] rounded-[8px] bg-[#f3f4f6] border-none cursor-pointer flex items-center justify-center text-[#374151] hover:bg-[#fee2e2] hover:text-[#dc2626]" onClick={() => setPreviewUrl(null)}><X size={14} /></button>
            </div>
            <div className="overflow-auto">
              <img src={previewUrl} alt="ID Card" className="max-w-[80vw] max-h-[80vh] object-contain block p-[8px]" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
