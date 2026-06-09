import { useState } from 'react'
import { X, Search, Package, PackageCheck, MapPin, Pin, HandMetal, AlertCircle, CheckCircle, Calendar, Phone, Tag, User, Mail } from 'lucide-react'
import { formatDateShort,  cap } from '../utils/dateUtils'
import { EmptyState, SectionHeader } from '../components/SharedComponents'

export default function LostFoundSection({ items, allItems, lostReports, activeTab, onTabChange, available, handedOver, lrActive, lrFound, loading }) {
  const [previewUrl, setPreviewUrl] = useState(null)
  const [focusedReport, setFocusedReport] = useState(null)
  const [focusedFoundItem, setFocusedFoundItem] = useState(null)
  const isLostReportsTab = ['lost_reports', 'lost_active', 'lost_found'].includes(activeTab)
  const tabs = [
    { key: 'found_items', label: 'Found Items', count: allItems.length, section: 'found' },
    { key: 'available', label: 'Available', count: available, section: 'found' },
    { key: 'handed_over', label: 'Handed Over', count: handedOver, section: 'found' },
    { key: 'lost_reports', label: 'Lost Reports', count: lostReports?.length ?? 0, section: 'lost' },
    { key: 'lost_active', label: 'Still Lost', count: lrActive, section: 'lost' },
    { key: 'lost_found', label: 'Found', count: lrFound, section: 'lost' },
  ]

  return (
    <div>
      <SectionHeader title="Lost & Found" subtitle="All items posted by students and teachers across campus" />
     <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-[10px] mb-[24px]">
        {[
          { label: 'Found Items', value: allItems.length, color: '#0f172a', sub: 'Posted by staff', accent: '#6366f1' },
          { label: 'Available', value: available, color: '#16a34a', sub: 'Waiting to be claimed', accent: '#16a34a' },
          { label: 'Handed Over', value: handedOver, color: '#059669', sub: 'Successfully returned', accent: '#10b981' },
          { label: 'Lost Reports', value: lostReports?.length ?? 0, color: '#d97706', sub: 'By students/teachers', accent: '#f59e0b' },
          { label: 'Still Lost', value: lrActive, color: '#dc2626', sub: 'Not yet found', accent: '#ef4444' },
          { label: 'Recovered', value: lrFound, color: '#7c3aed', sub: 'Marked as found', accent: '#8b5cf6' },
        ].map(s => (
          <div key={s.label} className="group bg-white rounded-[14px] p-[18px_16px] border border-[#f0f0f0] cursor-default transition-all duration-180 relative overflow-hidden hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
            <div className="text-[10px] font-bold text-[#94a3b8] tracking-[0.6px] uppercase mb-[10px]">{s.label}</div>
            <div className="text-[30px] font-extrabold leading-none mb-[7px] tracking-[-1px]" style={{ color: s.color }}>{loading ? '—' : s.value}</div>
            <div className="text-[11px] font-semibold text-[#94a3b8]">{s.sub}</div>
            <div className="absolute bottom-0 left-0 right-0 h-[3px] opacity-0 transition-opacity duration-180 group-hover:opacity-100" style={{ background: s.accent }} />
          </div>
        ))}
      </div>

  <div className="flex gap-[6px] mb-[20px] flex-wrap">
        <div className="flex gap-[6px] flex-wrap items-center">
          <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.6px] pr-[4px]">Found</span>
          {tabs.filter(t => t.section === 'found').map(tab => (
            <button key={tab.key} className={`flex items-center gap-[6px] p-[7px_13px] rounded-[8px] text-[12px] font-semibold cursor-pointer transition-all duration-150 border-[1.5px] ${activeTab === tab.key ? 'bg-[#0f172a] text-white border-[#0f172a]' : 'bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#16a34a] hover:text-[#16a34a]'}`} onClick={() => onTabChange(tab.key)}>
              {tab.label}
              <span className={`text-[10px] font-extrabold px-[6px] py-[1px] rounded-[20px] shrink-0 ${activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-[#f1f5f9] text-[#64748b]'}`}>{tab.count}</span>
            </button>
          ))}
        </div>
        <div className="w-[1px] bg-[#e2e8f0] mx-[4px] self-stretch" />
        <div className="flex gap-[6px] flex-wrap items-center">
          <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.6px] pr-[4px]">Lost</span>
          {tabs.filter(t => t.section === 'lost').map(tab => (
            <button key={tab.key} className={`flex items-center gap-[6px] p-[7px_13px] rounded-[8px] text-[12px] font-semibold cursor-pointer transition-all duration-150 border-[1.5px] ${activeTab === tab.key ? 'bg-[#d97706] text-white border-[#d97706]' : 'bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#d97706] hover:text-[#d97706]'}`} onClick={() => onTabChange(tab.key)}>
              {tab.label}
              <span className={`text-[10px] font-extrabold px-[6px] py-[1px] rounded-[20px] shrink-0 ${activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-[#f1f5f9] text-[#64748b]'}`}>{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

   {loading ? <div className="p-[60px] text-center text-[#94a3b8] text-[14px]">Loading…</div>
        : items.length === 0 ? <EmptyState icon={Search} text="No items found" sub="No lost & found items match this filter" />
       : isLostReportsTab ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[16px]">
            {items.map(report => {
              const isFound = report.status === 'found'
              return (
                <div key={report.id} onClick={() => setFocusedReport(report)} className={`bg-white rounded-[14px] border overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04)] transition-all duration-150 hover:shadow-[0_4px_14px_rgba(0,0,0,0.08)] hover:-translate-y-[1px] cursor-pointer ${isFound ? 'border-[#bbf7d0]' : 'border-[#fecaca]'}`}>
                  <div className={`px-[16px] py-[10px] flex items-center justify-between ${isFound ? 'bg-[#f0fdf4]' : 'bg-[#fef2f2]'}`}>
                    <span className={`text-[10px] font-bold uppercase tracking-[0.6px] flex items-center gap-[5px] ${isFound ? 'text-[#16a34a]' : 'text-[#dc2626]'}`}>
                      {isFound ? <CheckCircle size={11} /> : <AlertCircle size={11} />}
                      {isFound ? 'Found' : 'Still Lost'}
                    </span>
                    <span className="text-[10px] text-[#94a3b8]">{formatDateShort(report.postedAt)}</span>
                  </div>
                  <div className="p-[14px_16px]">
                    <div className="flex items-center gap-[9px] mb-[10px]">
                      <div className="w-[30px] h-[30px] rounded-[8px] bg-[#fff7ed] border-[1.5px] border-[#fed7aa] flex items-center justify-center text-[12px] font-extrabold text-[#d97706] shrink-0">{report.postedBy?.name?.[0]?.toUpperCase() ?? '?'}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-[#0f172a]">{report.postedBy?.name || '—'}</div>
                        <div className="text-[11px] text-[#94a3b8]">{cap(report.postedBy?.role)} · {report.postedBy?.email}</div>
                      </div>
                    </div>
                    <div className="text-[15px] font-extrabold text-[#0f172a] mb-[6px]">{report.itemName}</div>
                    {report.description && <div className="text-[12px] text-[#64748b] leading-[1.55] mb-[8px]" style={{display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{report.description}</div>}
                    <div className="flex items-center gap-[5px] text-[12px] text-[#64748b] mb-[3px]">
                      <MapPin size={11} color="#64748b" />
                      {report.locationLost || report.lastSeenLocation || '—'}
                    </div>
                    <div className="flex items-center gap-[5px] text-[12px] text-[#94a3b8]">
                      <Calendar size={11} color="#94a3b8" />
                      {report.dateLost || report.lastSeenDate || '—'}
                    </div>
                    {(report.images?.[0] || report.photoUrl) && (
                      <img src={report.images?.[0] || report.photoUrl} alt={report.itemName} className="w-full h-[110px] object-cover rounded-[8px] mt-[10px] border border-[#f0f0f0]" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[16px]">
            {items.map(item => {
                const isHandedOver = item.status === 'handed_over'
                return (
                  <div key={item.id} onClick={() => setFocusedFoundItem(item)} className="bg-white rounded-[14px] border border-[#f0f0f0] overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04)] transition-all duration-150 hover:shadow-[0_4px_14px_rgba(0,0,0,0.08)] hover:-translate-y-[1px] cursor-pointer">
                    {item.photoUrl ? (
                      <div className="relative" onClick={e => { e.stopPropagation(); setPreviewUrl(item.photoUrl) }}>
                        <img src={item.photoUrl} alt={item.itemName} className="w-full h-[160px] object-cover block bg-[#f8fafc]" />
                        <div className="absolute top-[10px] right-[10px]">
                          {isHandedOver
                            ? <span className="text-[10px] font-bold p-[3px_9px] rounded-[20px] bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0] inline-flex items-center gap-[4px]"><PackageCheck size={10} /> Handed Over</span>
                            : <span className="text-[10px] font-bold p-[3px_9px] rounded-[20px] bg-[#16a34a] text-white">Available</span>}
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-[110px] bg-[#f8fafc] flex items-center justify-center border-b border-[#f0f0f0]">
                        <Package size={34} color="#d1d5db" />
                      </div>
                    )}

                    <div className="p-[14px_16px]">
                      <div className="flex items-center gap-[9px] mb-[10px]">
                        <div className="w-[30px] h-[30px] rounded-[8px] bg-[#f0fdf4] border-[1.5px] border-[#bbf7d0] flex items-center justify-center text-[12px] font-extrabold text-[#16a34a] shrink-0">{item.postedByName?.[0]?.toUpperCase() ?? '?'}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-semibold text-[#0f172a]">{item.postedByName || '—'}</div>
                          <div className="text-[11px] text-[#94a3b8]">{cap(item.postedByRole)} · {formatDateShort(item.createdAt)}</div>
                        </div>
                        {!item.photoUrl && (
                          isHandedOver
                            ? <span className="text-[10px] font-bold p-[3px_9px] rounded-[20px] bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0] inline-flex items-center gap-[4px]"><PackageCheck size={10} /> Handed Over</span>
                            : <span className="text-[10px] font-bold p-[3px_9px] rounded-[20px] bg-[#16a34a] text-white">Available</span>
                        )}
                      </div>

                      <div className="text-[15px] font-extrabold text-[#0f172a] mb-[6px]">{item.itemName}</div>
                      {item.description ? <div className="text-[12px] text-[#64748b] leading-[1.55] mb-[8px]">{item.description}</div> : null}

                      <div className="flex items-center gap-[5px] text-[12px] text-[#64748b] mb-[3px]">
                        <MapPin size={12} color="#64748b" />
                        Room {item.roomNumber}{item.roomLabel ? ` — ${item.roomLabel}` : ''}
                      </div>
                      {item.collectLocation && (
                        <div className="flex items-center gap-[5px] text-[12px] text-[#16a34a] font-medium mb-[3px]">
                          <Pin size={12} color="#16a34a" />
                          Collect from: {item.collectLocation}
                        </div>
                      )}

                      {isHandedOver && (
                        <div className="flex items-center gap-[8px] bg-[#f0fdf4] rounded-[9px] p-[10px_12px] mt-[10px] border border-[#bbf7d0]">
                          <HandMetal size={15} color="#16a34a" className="shrink-0" />
                          <div>
                            <div className="text-[13px] font-bold text-[#16a34a]">Handed to {item.handedToName}</div>
                            <div className="text-[11px] text-[#86efac] mt-[1px]">{formatDateShort(item.handedAt)}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          
        )}
{previewUrl && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[300] p-[20px]" onClick={() => setPreviewUrl(null)}>
          <div className="bg-white rounded-[16px] overflow-hidden max-w-[90vw] max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-[14px_18px] border-b border-[#e5e7eb] shrink-0">
              <span className="text-[14px] font-bold text-[#0f172a]">Photo</span>
              <button className="w-[32px] h-[32px] rounded-[8px] bg-[#f3f4f6] border-none cursor-pointer flex items-center justify-center text-[#374151] hover:bg-[#fee2e2] hover:text-[#dc2626]" onClick={() => setPreviewUrl(null)}><X size={14} /></button>
            </div>
            <div className="overflow-auto">
              <img src={previewUrl} alt="Item" className="max-w-[80vw] max-h-[80vh] object-contain block p-[8px]" />
            </div>
          </div>
        </div>
      )}

      {focusedReport && (
        <div className="fixed inset-0 bg-[#0f172a]/60 flex items-center justify-center z-[200] p-[20px] backdrop-blur-[2px]" onClick={() => setFocusedReport(null)}>
          <div className="bg-white rounded-[20px] w-full max-w-[560px] max-h-[90vh] flex flex-col shadow-[0_30px_80px_rgba(0,0,0,0.22)] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-[18px_22px] border-b border-[#f3f4f6] shrink-0">
              <div className="flex items-center gap-[10px]">
                <div className={`w-[38px] h-[38px] rounded-[10px] flex items-center justify-center ${focusedReport.status === 'found' ? 'bg-[#f0fdf4]' : 'bg-[#fef2f2]'}`}>
                  {focusedReport.status === 'found' ? <CheckCircle size={20} color="#16a34a" /> : <AlertCircle size={20} color="#dc2626" />}
                </div>
                <div>
                  <div className="text-[15px] font-extrabold text-[#0f172a]">{focusedReport.itemName}</div>
                  <div className={`text-[11px] font-bold mt-[2px] ${focusedReport.status === 'found' ? 'text-[#16a34a]' : 'text-[#dc2626]'}`}>{focusedReport.status === 'found' ? 'Found' : 'Still Lost'}</div>
                </div>
              </div>
              <button className="w-[32px] h-[32px] rounded-[8px] bg-[#f3f4f6] border-none cursor-pointer flex items-center justify-center text-[#374151] hover:bg-[#fee2e2] hover:text-[#dc2626]" onClick={() => setFocusedReport(null)}><X size={14} /></button>
            </div>
            <div className="overflow-y-auto p-[20px] flex flex-col gap-[14px]">
              {(focusedReport.images?.length > 0 || focusedReport.photoUrl) && (
                <div className="flex gap-[8px] flex-wrap">
                  {(focusedReport.images?.length > 0 ? focusedReport.images : [focusedReport.photoUrl]).map((url, i) => (
                    <img key={i} src={url} alt={focusedReport.itemName} onClick={() => setPreviewUrl(url)} className="h-[160px] rounded-[10px] object-cover cursor-pointer border border-[#f0f0f0] hover:opacity-90 transition-opacity" style={{maxWidth:'100%',flex:'1 1 140px'}} />
                  ))}
                </div>
              )}

              <div className="bg-[#f9fafb] rounded-[12px] p-[14px] flex flex-col gap-[10px]">
                <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.6px] mb-[2px]">Reporter</div>
                <div className="flex items-center gap-[10px]">
                  <div className="w-[38px] h-[38px] rounded-[10px] bg-[#fff7ed] border-[1.5px] border-[#fed7aa] flex items-center justify-center text-[14px] font-extrabold text-[#d97706] shrink-0">{focusedReport.postedBy?.name?.[0]?.toUpperCase() ?? '?'}</div>
                  <div>
                    <div className="text-[13px] font-bold text-[#0f172a]">{focusedReport.postedBy?.name || '—'}</div>
                    <div className="text-[11px] text-[#64748b]">{cap(focusedReport.postedBy?.role)}</div>
                  </div>
                </div>
                {focusedReport.postedBy?.email && (
                  <div className="flex items-center gap-[7px] text-[12px] text-[#374151]">
                    <Mail size={13} color="#94a3b8" />
                    {focusedReport.postedBy.email}
                  </div>
                )}
                {focusedReport.postedBy?.department && (
                  <div className="flex items-center gap-[7px] text-[12px] text-[#374151]">
                    <User size={13} color="#94a3b8" />
                    {focusedReport.postedBy.department}
                  </div>
                )}
              </div>

              <div className="bg-[#f9fafb] rounded-[12px] p-[14px] flex flex-col gap-[8px]">
                <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.6px] mb-[2px]">Item Details</div>
                {focusedReport.category && (
                  <div className="flex items-center gap-[7px] text-[12px] text-[#374151]">
                    <Tag size={13} color="#94a3b8" />
                    <span className="font-semibold">Category:</span> {focusedReport.category}
                  </div>
                )}
                {focusedReport.description && (
                  <div className="text-[12px] text-[#64748b] leading-[1.6]">{focusedReport.description}</div>
                )}
                <div className="flex items-center gap-[7px] text-[12px] text-[#374151]">
                  <MapPin size={13} color="#94a3b8" />
                  <span className="font-semibold">Lost at:</span> {focusedReport.locationLost || focusedReport.lastSeenLocation || '—'}
                </div>
                {(focusedReport.dateLost || focusedReport.lastSeenDate) && (
                  <div className="flex items-center gap-[7px] text-[12px] text-[#374151]">
                    <Calendar size={13} color="#94a3b8" />
                    <span className="font-semibold">Date:</span> {focusedReport.dateLost || focusedReport.lastSeenDate}
                  </div>
                )}
                {focusedReport.howToReach && (
                  <div className="flex items-center gap-[7px] text-[12px] text-[#374151]">
                    <Phone size={13} color="#94a3b8" />
                    <span className="font-semibold">Contact:</span> {focusedReport.howToReach}
                  </div>
                )}
                <div className="flex items-center gap-[7px] text-[12px] text-[#94a3b8]">
                  <Calendar size={13} color="#94a3b8" />
                  <span>Posted:</span> {formatDateShort(focusedReport.postedAt)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {focusedFoundItem && (
        <div className="fixed inset-0 bg-[#0f172a]/60 flex items-center justify-center z-[200] p-[20px] backdrop-blur-[2px]" onClick={() => setFocusedFoundItem(null)}>
          <div className="bg-white rounded-[20px] w-full max-w-[560px] max-h-[90vh] flex flex-col shadow-[0_30px_80px_rgba(0,0,0,0.22)] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-[18px_22px] border-b border-[#f3f4f6] shrink-0">
              <div className="flex items-center gap-[10px]">
                <div className={`w-[38px] h-[38px] rounded-[10px] flex items-center justify-center ${focusedFoundItem.status === 'handed_over' ? 'bg-[#f0fdf4]' : 'bg-[#eff6ff]'}`}>
                  {focusedFoundItem.status === 'handed_over' ? <PackageCheck size={20} color="#16a34a" /> : <Package size={20} color="#3b82f6" />}
                </div>
                <div>
                  <div className="text-[15px] font-extrabold text-[#0f172a]">{focusedFoundItem.itemName}</div>
                  <div className={`text-[11px] font-bold mt-[2px] ${focusedFoundItem.status === 'handed_over' ? 'text-[#16a34a]' : 'text-[#3b82f6]'}`}>{focusedFoundItem.status === 'handed_over' ? 'Handed Over' : 'Available'}</div>
                </div>
              </div>
              <button className="w-[32px] h-[32px] rounded-[8px] bg-[#f3f4f6] border-none cursor-pointer flex items-center justify-center text-[#374151] hover:bg-[#fee2e2] hover:text-[#dc2626]" onClick={() => setFocusedFoundItem(null)}><X size={14} /></button>
            </div>
            <div className="overflow-y-auto p-[20px] flex flex-col gap-[14px]">
              {focusedFoundItem.photoUrl && (
                <img src={focusedFoundItem.photoUrl} alt={focusedFoundItem.itemName} onClick={() => setPreviewUrl(focusedFoundItem.photoUrl)} className="w-full h-[200px] object-cover rounded-[12px] cursor-pointer border border-[#f0f0f0] hover:opacity-90 transition-opacity" />
              )}

              <div className="bg-[#f9fafb] rounded-[12px] p-[14px] flex flex-col gap-[10px]">
                <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.6px] mb-[2px]">Posted By</div>
                <div className="flex items-center gap-[10px]">
                  <div className="w-[38px] h-[38px] rounded-[10px] bg-[#f0fdf4] border-[1.5px] border-[#bbf7d0] flex items-center justify-center text-[14px] font-extrabold text-[#16a34a] shrink-0">{focusedFoundItem.postedByName?.[0]?.toUpperCase() ?? '?'}</div>
                  <div>
                    <div className="text-[13px] font-bold text-[#0f172a]">{focusedFoundItem.postedByName || '—'}</div>
                    <div className="text-[11px] text-[#64748b]">{cap(focusedFoundItem.postedByRole)}</div>
                  </div>
                </div>
              </div>

              <div className="bg-[#f9fafb] rounded-[12px] p-[14px] flex flex-col gap-[8px]">
                <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.6px] mb-[2px]">Item Details</div>
                {focusedFoundItem.description && (
                  <div className="text-[12px] text-[#64748b] leading-[1.6]">{focusedFoundItem.description}</div>
                )}
                <div className="flex items-center gap-[7px] text-[12px] text-[#374151]">
                  <MapPin size={13} color="#94a3b8" />
                  <span className="font-semibold">Found at:</span> Room {focusedFoundItem.roomNumber}{focusedFoundItem.roomLabel ? ` — ${focusedFoundItem.roomLabel}` : ''}
                </div>
                {focusedFoundItem.collectLocation && (
                  <div className="flex items-center gap-[7px] text-[12px] text-[#16a34a] font-medium">
                    <Pin size={13} color="#16a34a" />
                    <span className="font-semibold">Collect from:</span> {focusedFoundItem.collectLocation}
                  </div>
                )}
                <div className="flex items-center gap-[7px] text-[12px] text-[#94a3b8]">
                  <Calendar size={13} color="#94a3b8" />
                  Posted: {formatDateShort(focusedFoundItem.createdAt)}
                </div>
              </div>

              {focusedFoundItem.status === 'handed_over' && (
                <div className="bg-[#f0fdf4] rounded-[12px] p-[14px] border border-[#bbf7d0] flex flex-col gap-[6px]">
                  <div className="text-[10px] font-bold text-[#16a34a] uppercase tracking-[0.6px] mb-[2px]">Handover Details</div>
                  <div className="flex items-center gap-[7px] text-[12px] text-[#374151]">
                    <User size={13} color="#16a34a" />
                    <span className="font-semibold">Handed to:</span> {focusedFoundItem.handedToName || '—'}
                  </div>
                  <div className="flex items-center gap-[7px] text-[12px] text-[#374151]">
                    <Calendar size={13} color="#16a34a" />
                    <span className="font-semibold">Handed at:</span> {formatDateShort(focusedFoundItem.handedAt)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
