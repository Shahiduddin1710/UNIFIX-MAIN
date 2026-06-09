import { memo } from 'react'
import { STATUS, VERIFICATION } from '../constants'

export const StatusBadge = memo(({ status, verification }) => {
  const meta = status ? (STATUS[status] ?? STATUS.pending) : (VERIFICATION[verification] ?? VERIFICATION.pending)
  return (
    <span className="inline-flex items-center gap-[5px] text-[11px] font-bold px-[10px] py-[3px] rounded-[20px] whitespace-nowrap border" style={{ background: meta.bg, color: meta.color, borderColor: meta.border }}>
      <span className="w-[5px] h-[5px] rounded-full shrink-0" style={{ background: meta.dot ?? meta.color }} />
      {meta.label}
    </span>
  )
})

export function EmptyState({ icon: Icon, text, sub }) {
  return (
    <div className="text-center py-[80px] px-[20px]">
      <div className="w-[60px] h-[60px] rounded-[16px] bg-[#f0fdf4] flex items-center justify-center mx-auto mb-[16px]">
        <Icon size={26} color="#16a34a" />
      </div>
      <div className="text-[15px] font-bold text-[#374151] mb-[5px]">{text}</div>
      {sub && <div className="text-[13px] text-[#9ca3af]">{sub}</div>}
    </div>
  )
}

export function SectionHeader({ title, subtitle }) {
  return (
    <div className="mb-[24px]">
      <h1 className="text-[20px] font-extrabold text-[#0f172a] tracking-[-0.4px] mb-[3px]">{title}</h1>
      {subtitle && <p className="text-[13px] text-[#94a3b8] font-normal">{subtitle}</p>}
    </div>
  )
}