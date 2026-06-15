import { useState } from 'react'
import { X, Eye, CreditCard, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { adminAPI } from '../services/api'
import { formatDateShort} from '../utils/dateUtils'
import { EmptyState, SectionHeader } from '../components/SharedComponents'

export default function IdCardsSection({ requests, loading, onRefresh }) {
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

const handleApprove = async (requestId) => {
    setActionLoading(requestId);
    try {
      await adminAPI.approveIdCard(requestId);
      onRefresh();
    } catch {
      // Catch block
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActionLoading(rejectModal);
    try {
      await adminAPI.rejectIdCard(rejectModal, rejectReason);
      setRejectModal(null);
      setRejectReason('');
      onRefresh();
    } catch {
        //Catch block
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <SectionHeader title="ID Card Requests" subtitle="Review and approve or reject ID card update requests from students and teachers" />
      {loading ? <div className="p-[60px] text-center text-[#94a3b8] text-[14px]">Loading…</div>
        : pendingRequests.length === 0 ? <EmptyState icon={CreditCard} text="No pending ID card requests" sub="All requests have been processed" />
          : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[16px] mb-[32px]">
              {pendingRequests.map(req => (
                <div key={req.id} className="bg-white rounded-[14px] overflow-hidden border-[1.5px] border-[#fde68a]">
                  <div className="p-[13px_16px] flex items-center gap-[10px] border-b border-[#fef3c7]">
                    <div className="w-[36px] h-[36px] rounded-[9px] flex items-center justify-center shrink-0 bg-[#fef3c7]"><CreditCard size={18} color="#d97706" /></div>
                    <div className="flex-1">
                      <div className="text-[14px] font-bold text-[#0f172a]">{req.fullName}</div>
                      <div className="text-[11px] text-[#94a3b8]">{req.email} · {req.role}</div>
                    </div>
                    <span className="inline-flex items-center gap-[5px] text-[11px] font-bold px-[10px] py-[3px] rounded-[20px] whitespace-nowrap border bg-[#fef3c7] text-[#d97706] border-[#fde68a]">
                      <span className="w-[5px] h-[5px] rounded-full shrink-0 bg-[#f59e0b]" />Pending
                    </span>
                  </div>
                  <div className="p-[15px]">
                    {req.newIdCardUrl && (
                      <div className="mb-[12px]">
                        <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.6px] mb-[8px]">New ID Card</div>
                        <div className="relative cursor-pointer rounded-[8px] overflow-hidden border border-[#e2e8f0] group" onClick={() => setPreviewUrl(req.newIdCardUrl)}>
                          <img src={req.newIdCardUrl} alt="New ID" className="w-full h-[150px] object-contain bg-[#f9fafb] block" />
                          <div className="absolute inset-0 bg-transparent flex items-center justify-center text-white text-[13px] font-bold gap-[5px] transition-colors duration-150 group-hover:bg-black/30"><Eye size={13} /> Preview</div>
                        </div>
                      </div>
                    )}
                    <div className="text-[11px] text-[#94a3b8] mb-[12px]">Requested: {formatDateShort(req.requestedAt)}</div>
                    <div className="flex gap-[9px]">
                      <button className="flex-1 bg-[#16a34a] text-white rounded-[9px] p-[9px] text-[13px] font-bold cursor-pointer border-none transition-all duration-150 flex items-center justify-center gap-[6px] hover:bg-[#15803d] disabled:opacity-55 disabled:cursor-not-allowed" onClick={() => handleApprove(req.id)} disabled={actionLoading === req.id}>
                        {actionLoading === req.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Approve
                      </button>
                      <button className="flex-1 bg-white text-[#dc2626] rounded-[9px] p-[9px] text-[13px] font-bold cursor-pointer border-[1.5px] border-[#fecaca] transition-all duration-150 flex items-center justify-center gap-[6px] hover:bg-[#fef2f2]" onClick={() => { setRejectModal(req.id); setRejectReason('') }}>
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

      {processedRequests.length > 0 && (
        <>
          <div className="text-[13px] font-bold text-[#374151] mb-[13px] mt-[4px]">Processed Requests</div>
          <div className="flex flex-col gap-[7px]">
            {processedRequests.map(req => (
              <div key={req.id} className="bg-white rounded-[9px] border border-[#f0f0f0] p-[11px_14px] flex items-center gap-[12px]">
                <div className="flex-1 min-w-0"><span className="text-[13px] font-semibold text-[#374151]">{req.fullName}</span><span className="text-[12px] text-[#94a3b8] ml-[8px]">{req.email}</span></div>
                <span className="text-[11px] text-[#94a3b8]">{formatDateShort(req.processedAt)}</span>
                <span className="inline-flex items-center gap-[5px] text-[11px] font-bold px-[10px] py-[3px] rounded-[20px] whitespace-nowrap border" style={req.status === 'approved' ? { background: '#d1fae5', color: '#059669', borderColor: '#6ee7b7' } : { background: '#fee2e2', color: '#dc2626', borderColor: '#fca5a5' }}>
                  <span className="w-[5px] h-[5px] rounded-full shrink-0" style={{ background: req.status === 'approved' ? '#10b981' : '#ef4444' }} />
                  {req.status === 'approved' ? 'Approved' : 'Rejected'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {rejectModal && (
        <div className="fixed inset-0 bg-[#0f172a]/60 flex items-center justify-center z-[200] p-[20px] backdrop-blur-[2px]" onClick={() => setRejectModal(null)}>
          <div className="bg-white rounded-[20px] w-full max-w-[460px] max-h-[90vh] flex flex-col shadow-[0_30px_80px_rgba(0,0,0,0.22)] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-[18px_22px] border-b border-[#f3f4f6] shrink-0">
              <div><div className="text-[15px] font-extrabold text-[#0f172a]">Reject ID Card Request</div><div className="text-[12px] text-[#94a3b8] mt-[2px]">Optionally provide a reason</div></div>
              <button className="w-[32px] h-[32px] rounded-[8px] bg-[#f3f4f6] border-none cursor-pointer flex items-center justify-center text-[#374151] hover:bg-[#fee2e2] hover:text-[#dc2626]" onClick={() => setRejectModal(null)}><X size={14} /></button>
            </div>
            <div className="p-[22px]">
              <textarea className="w-full rounded-[10px] border-[1.5px] border-[#e2e8f0] p-[12px] text-[14px] text-[#374151] min-h-[80px] resize-y outline-none focus:border-[#16a34a] font-['DM_Sans']" value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason (optional)…" />
              <div className="flex gap-[9px] mt-[14px]">
                <button className="flex-1 bg-[#f8fafc] text-[#374151] border-[1.5px] border-[#e2e8f0] rounded-[9px] p-[10px] text-[13px] font-bold cursor-pointer transition-all duration-150 hover:border-[#16a34a] hover:text-[#16a34a] hover:bg-[#f0fdf4]" onClick={() => setRejectModal(null)}>Cancel</button>
                <button className="flex-1 bg-[#dc2626] text-white border-none rounded-[9px] p-[10px] text-[13px] font-bold cursor-pointer transition-all duration-150 hover:bg-[#b91c1c] disabled:opacity-55 disabled:cursor-not-allowed" onClick={handleReject} disabled={!!actionLoading}>
                  {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />} Confirm Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewUrl && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[300] p-[20px]" onClick={() => setPreviewUrl(null)}>
          <div className="bg-white rounded-[16px] overflow-hidden max-w-[90vw] max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-[14px_18px] border-b border-[#e5e7eb] shrink-0"><span className="text-[14px] font-bold">ID Card Preview</span><button className="w-[32px] h-[32px] rounded-[8px] bg-[#f3f4f6] border-none cursor-pointer flex items-center justify-center text-[#374151] hover:bg-[#fee2e2] hover:text-[#dc2626]" onClick={() => setPreviewUrl(null)}><X size={14} /></button></div>
            <div className="overflow-auto"><img src={previewUrl} alt="Preview" className="max-w-[80vw] max-h-[80vh] object-contain block p-[8px]" /></div>
          </div>
        </div>
      )}
    </div>
  )
}
