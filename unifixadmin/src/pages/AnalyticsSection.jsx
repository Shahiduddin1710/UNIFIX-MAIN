import { useMemo } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
} from 'recharts'
import { CATEGORY } from '../constants'
import { SectionHeader } from '../components/SharedComponents'
import { TrendingUp, Clock, AlertTriangle, Award, Activity } from 'lucide-react'

const HOURS = Array.from({ length: 24 }, (_, i) => {
  if (i === 0) return '12a'
  if (i < 12) return `${i}a`
  if (i === 12) return '12p'
  return `${i - 12}p`
})

function toMs(ts) {
  if (!ts) return null
  if (ts.toDate) return ts.toDate().getTime()
  if (ts._seconds) return ts._seconds * 1000
  return new Date(ts).getTime()
}

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-white rounded-[14px] p-[18px_16px] border border-[#f0f0f0]">
      <div className="flex items-center gap-[10px] mb-[12px]">
        <div className="w-[36px] h-[36px] rounded-[10px] flex items-center justify-center" style={{ background: color + '18' }}>
          <Icon size={16} color={color} />
        </div>
        <span className="text-[11px] font-bold text-[#94a3b8] tracking-[0.6px] uppercase">{label}</span>
      </div>
      <div className="text-[28px] font-extrabold leading-none tracking-[-1px] text-[#0f172a] mb-[6px]">{value}</div>
      <div className="text-[12px] font-semibold text-[#64748b]">{sub}</div>
    </div>
  )
}

const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export default function AnalyticsSection({ complaints, loading }) {
  const categoryData = useMemo(() => {
    const counts = {}
    complaints.forEach(c => {
      const key = c.category || 'others'
      counts[key] = (counts[key] || 0) + 1
    })
    return Object.entries(counts)
      .map(([key, value]) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value,
        color: CATEGORY[key]?.color || CATEGORY.others.color,
      }))
      .sort((a, b) => b.value - a.value)
  }, [complaints])

  const avgResolutionTime = useMemo(() => {
    const resolved = complaints.filter(c => c.status === 'completed' && c.acceptedAt && c.completedAt)
    if (!resolved.length) return 'N/A'
    const total = resolved.reduce((sum, c) => {
      const start = toMs(c.acceptedAt)
      const end = toMs(c.completedAt)
      return sum + (end - start)
    }, 0)
    const avgMs = total / resolved.length
    const hours = Math.floor(avgMs / 3600000)
    const mins = Math.floor((avgMs % 3600000) / 60000)
    if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`
    if (hours > 0) return `${hours}h ${mins}m`
    return `${mins}m`
  }, [complaints])

  const escalationRate = useMemo(() => {
    if (!complaints.length) return '0%'
    const flagged = complaints.filter(c => c.flagged === true).length
    return `${Math.round((flagged / complaints.length) * 100)}%`
  }, [complaints])

  const staffPerformance = useMemo(() => {
    const map = {}
    complaints.forEach(c => {
      if (!c.assignedToName) return
      if (!map[c.assignedToName]) map[c.assignedToName] = { name: c.assignedToName, resolved: 0, total: 0, totalMs: 0 }
      map[c.assignedToName].total++
      if (c.status === 'completed') {
        map[c.assignedToName].resolved++
        if (c.acceptedAt && c.completedAt) {
          const ms = toMs(c.completedAt) - toMs(c.acceptedAt)
          if (ms > 0) map[c.assignedToName].totalMs += ms
        }
      }
    })
    return Object.values(map)
      .map(s => ({
        ...s,
        rate: s.total > 0 ? Math.round((s.resolved / s.total) * 100) : 0,
        avgTime: s.resolved > 0 ? Math.round(s.totalMs / s.resolved / 3600000) : 0,
      }))
      .sort((a, b) => b.resolved - a.resolved)
      .slice(0, 8)
  }, [complaints])

  const peakHours = useMemo(() => {
    const counts = Array(24).fill(0)
    complaints.forEach(c => {
      const ms = toMs(c.createdAt)
      if (!ms) return
      const hour = new Date(ms).getHours()
      counts[hour]++
    })
    return counts.map((count, i) => ({ hour: HOURS[i], count }))
  }, [complaints])

  const monthlyTrend = useMemo(() => {
    const map = {}
    complaints.forEach(c => {
      const ms = toMs(c.createdAt)
      if (!ms) return
      const d = new Date(ms)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!map[key]) map[key] = { month: key, submitted: 0, resolved: 0 }
      map[key].submitted++
      if (c.status === 'completed') map[key].resolved++
    })
    return Object.values(map)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6)
      .map(m => ({ ...m, month: new Date(m.month + '-01').toLocaleString('en', { month: 'short', year: '2-digit' }) }))
  }, [complaints])

  const peakHour = useMemo(() => {
    const max = peakHours.reduce((a, b) => b.count > a.count ? b : a, { count: 0 })
    return max.count > 0 ? max.hour : 'N/A'
  }, [peakHours])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[300px] text-[#94a3b8] text-[14px]">Loading analytics…</div>
    )
  }

  return (
    <div>
      <SectionHeader title="Analytics" subtitle="Performance insights and complaint trends across campus." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-[12px] mb-[20px]">
        <StatCard icon={Activity} label="Total Complaints" value={complaints.length} sub="All time" color="#6366f1" />
        <StatCard icon={Clock} label="Avg Resolution" value={avgResolutionTime} sub="Accepted → Completed" color="#0ea5e9" />
        <StatCard icon={AlertTriangle} label="Escalation Rate" value={escalationRate} sub="Flagged complaints" color="#ef4444" />
        <StatCard icon={TrendingUp} label="Peak Hour" value={peakHour} sub="Most complaints submitted" color="#f59e0b" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px] mb-[16px]">
        <div className="bg-white rounded-[16px] border border-[#f0f0f0] p-[20px]">
          <div className="text-[13px] font-bold text-[#0f172a] mb-[4px]">Complaints by Category</div>
          <div className="text-[11px] text-[#94a3b8] mb-[16px]">Distribution across all complaint types</div>
          {categoryData.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-[#94a3b8] text-[13px]">No data</div>
          ) : (
            <div className="flex gap-[16px] items-center">
              <ResponsiveContainer width="55%" height={220}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" outerRadius={90} dataKey="value" labelLine={false} label={CustomPieLabel}>
                    {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ borderRadius: 10, border: '1px solid #f0f0f0', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-[8px] flex-1">
                {categoryData.map((d, i) => (
                  <div key={i} className="flex items-center gap-[8px]">
                    <div className="w-[10px] h-[10px] rounded-full shrink-0" style={{ background: d.color }} />
                    <span className="text-[12px] text-[#374151] flex-1 truncate">{d.name}</span>
                    <span className="text-[12px] font-bold text-[#0f172a]">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-[16px] border border-[#f0f0f0] p-[20px]">
          <div className="text-[13px] font-bold text-[#0f172a] mb-[4px]">Monthly Trend</div>
          <div className="text-[11px] text-[#94a3b8] mb-[16px]">Submitted vs resolved over last 6 months</div>
          {monthlyTrend.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-[#94a3b8] text-[13px]">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #f0f0f0', fontSize: 12 }} />
                <Line type="monotone" dataKey="submitted" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} name="Submitted" />
                <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Resolved" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[16px] border border-[#f0f0f0] p-[20px] mb-[16px]">
        <div className="text-[13px] font-bold text-[#0f172a] mb-[4px]">Peak Complaint Hours</div>
        <div className="text-[11px] text-[#94a3b8] mb-[16px]">Number of complaints submitted by hour of day</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={peakHours} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#94a3b8' }} interval={1} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #f0f0f0', fontSize: 12 }} />
            <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Complaints" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-[16px] border border-[#f0f0f0] overflow-hidden">
        <div className="flex items-center gap-[10px] p-[16px_22px] border-b border-[#f5f5f5]">
          <Award size={16} color="#f59e0b" />
          <span className="text-[14px] font-bold text-[#0f172a]">Staff Performance</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#fafafa]">
                {['Rank', 'Staff Name', 'Assigned', 'Resolved', 'Success Rate', 'Avg Time'].map(h => (
                  <th key={h} className="p-[10px_20px] text-left text-[10px] font-bold text-[#94a3b8] tracking-[0.6px] uppercase border-b border-[#f0f0f0] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staffPerformance.length === 0 ? (
                <tr><td colSpan={6} className="p-[60px] text-center text-[#94a3b8] text-[14px]">No staff data</td></tr>
              ) : staffPerformance.map((s, i) => (
                <tr key={s.name} className="hover:bg-[#fafafa] transition-colors duration-100">
                  <td className="p-[13px_20px] border-b border-[#f9f9f9] align-middle">
                    <div className={`w-[24px] h-[24px] rounded-full flex items-center justify-center text-[11px] font-bold ${i === 0 ? 'bg-[#fef3c7] text-[#d97706]' : i === 1 ? 'bg-[#f1f5f9] text-[#475569]' : i === 2 ? 'bg-[#fef3c7] text-[#92400e]' : 'bg-[#f8fafc] text-[#94a3b8]'}`}>
                      {i + 1}
                    </div>
                  </td>
                  <td className="p-[13px_20px] border-b border-[#f9f9f9] align-middle text-[13px] font-semibold text-[#0f172a]">{s.name}</td>
                  <td className="p-[13px_20px] border-b border-[#f9f9f9] align-middle text-[13px] text-[#374151]">{s.total}</td>
                  <td className="p-[13px_20px] border-b border-[#f9f9f9] align-middle text-[13px] text-[#374151]">{s.resolved}</td>
                  <td className="p-[13px_20px] border-b border-[#f9f9f9] align-middle">
                    <div className="flex items-center gap-[8px]">
                      <div className="flex-1 max-w-[80px] h-[6px] rounded-full bg-[#f1f5f9] overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${s.rate}%`, background: s.rate >= 80 ? '#10b981' : s.rate >= 50 ? '#f59e0b' : '#ef4444' }} />
                      </div>
                      <span className="text-[12px] font-bold" style={{ color: s.rate >= 80 ? '#10b981' : s.rate >= 50 ? '#f59e0b' : '#ef4444' }}>{s.rate}%</span>
                    </div>
                  </td>
                  <td className="p-[13px_20px] border-b border-[#f9f9f9] align-middle text-[12px] text-[#94a3b8]">{s.avgTime > 0 ? `${s.avgTime}h` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}