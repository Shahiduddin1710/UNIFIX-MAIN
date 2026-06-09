import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { adminAPI } from '../services/api'
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Eye,
  FileText,
  AlertCircle,
  Loader2,
  X,
  ShieldCheck,
  IdCard,
  Info,
  User2,
  Briefcase,
  Phone,
  Mail,
  Clock,
  Hash
} from "lucide-react"

export default function StaffDetail() {
  const { uid } = useParams()
  const navigate = useNavigate()
  const [staff, setStaff] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [rejectModal, setRejectModal] = useState(false)
  const [rejectionText, setRejectionText] = useState('')
  const [rejectionError, setRejectionError] = useState('')
  const [previewDoc, setPreviewDoc] = useState(null)

  useEffect(() => {
    const fetchStaff = async () => {
      setLoading(true)
      try {
        const res = await adminAPI.getStaff(uid)
        setStaff(res.data.staff)
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('unifix_admin_token')
          navigate('/login')
        } else {
          setError('Failed to load staff details.')
        }
      } finally {
        setLoading(false)
      }
    }
    fetchStaff()
  }, [uid, navigate])

  const handleApprove = async () => {
    setActionLoading(true)
    setError('')
    try {
      await adminAPI.approveStaff(uid)
      setSuccessMsg('Staff approved successfully! They will be notified via email.')
      setStaff(prev => ({ ...prev, verificationStatus: 'approved' }))
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve staff.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    setRejectionError('')
    if (!rejectionText.trim()) return setRejectionError('Please enter a rejection reason.')
    if (rejectionText.trim().length < 10) return setRejectionError('Please provide a more detailed reason.')
    setActionLoading(true)
    try {
      await adminAPI.rejectStaff(uid, rejectionText.trim())
      setSuccessMsg('Staff rejected and notified via email.')
      setStaff(prev => ({ ...prev, verificationStatus: 'rejected', rejectionMessage: rejectionText.trim() }))
      setRejectModal(false)
      setRejectionText('')
    } catch (err) {
      setRejectionError(err.response?.data?.error || 'Failed to reject staff.')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f6f8] font-['DM_Sans']">
      <div className="text-center">
        <div className="w-[60px] h-[60px] rounded-[16px] bg-[#f0fdf4] flex items-center justify-center mx-auto mb-[16px]">
          <Loader2 size={28} color="#16a34a" className="animate-spin" />
        </div>
        <div className="text-[#94a3b8] text-[14px] font-medium">Loading staff profile…</div>
      </div>
    </div>
  )

  if (error && !staff) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f6f8] font-['DM_Sans']">
      <div className="text-center">
        <div className="w-[60px] h-[60px] rounded-[16px] bg-[#fef2f2] flex items-center justify-center mx-auto mb-[16px]">
          <AlertCircle size={28} color="#dc2626" />
        </div>
        <div className="text-[#dc2626] text-[14px] font-medium mb-[18px]">{error}</div>
        <button onClick={() => navigate('/')} className="bg-white text-[#374151] border-[1.5px] border-[#e2e8f0] rounded-[10px] p-[10px_20px] text-[14px] font-semibold cursor-pointer flex items-center gap-[7px] mx-auto transition-all hover:border-[#16a34a] hover:text-[#16a34a] hover:bg-[#f0fdf4]">
          <ArrowLeft size={14} /> Back to Dashboard
        </button>
      </div>
    </div>
  )

  const STATUS_STYLE = {
    pending: { bg: '#fef3c7', color: '#d97706', border: '#fde68a' },
    approved: { bg: '#d1fae5', color: '#059669', border: '#6ee7b7' },
    rejected: { bg: '#fee2e2', color: '#dc2626', border: '#fca5a5' },
  }
  const sc = STATUS_STYLE[staff?.verificationStatus] ?? STATUS_STYLE.pending

  const infoRows = [
    { label: 'Employee ID', value: staff?.employeeId, Icon: Hash },
    { label: 'Designation', value: staff?.designation, Icon: Briefcase },
    { label: 'Experience', value: staff?.experience ? `${staff.experience} years` : null, Icon: Clock },
    { label: 'Phone', value: staff?.phone, Icon: Phone },
    { label: 'Email', value: staff?.email, Icon: Mail },
    { label: 'Joined', value: staff?.createdAt?.seconds ? new Date(staff.createdAt.seconds * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null, Icon: Clock },
  ]

  const docs = [
    { title: 'ID Card', Icon: IdCard, url: staff?.idCardUrl, fileName: staff?.idCardName },
    { title: 'Certificate / Proof', Icon: FileText, url: staff?.certificateUrl, fileName: staff?.certificateName },
  ]

  return (
    <div className="sd-root min-h-screen bg-[#f4f6f8] font-['DM_Sans'] pb-[60px]">
      <div className="sd-topbar bg-white border-b border-[#e9ecef] px-[28px] flex items-center justify-between h-[58px] sticky top-0 z-10">
        <div className="sd-topbar-left flex items-center gap-[14px]">
          <button className="sd-back-btn flex items-center gap-[6px] bg-[#f8fafc] border-[1.5px] border-[#e2e8f0] rounded-[8px] p-[7px_13px] text-[13px] font-semibold text-[#475569] cursor-pointer transition-all hover:border-[#16a34a] hover:text-[#16a34a] hover:bg-[#f0fdf4]" onClick={() => navigate('/')}>
            <ArrowLeft size={13} /> Back
          </button>
          <div className="sd-divider w-[1px] h-[22px] bg-[#e2e8f0]" />
          <div className="sd-brand flex items-center gap-[9px]">
            <div className="sd-brand-mark w-[30px] h-[30px] rounded-[8px] overflow-hidden">
              <img src="/logo192.png" alt="logo" className="w-full h-full object-contain" />
            </div>
            <span className="sd-brand-name text-[14px] font-bold text-[#0f172a]">UniFiX Admin</span>
          </div>
        </div>
        <div className="sd-topbar-right flex items-center gap-[12px]">
          <span className="sd-page-label text-[12px] text-[#94a3b8]">Staff Profile</span>
          <span className="sd-status-pill text-[11px] font-bold p-[4px_12px] rounded-[20px] border flex items-center gap-[5px] tracking-[0.3px]" style={{ background: sc.bg, color: sc.color, borderColor: sc.border }}>
            <span className="w-[5px] h-[5px] rounded-full shrink-0" style={{ background: sc.color }} />
            {staff?.verificationStatus?.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="sd-page max-w-[1020px] mx-auto p-[28px_24px]">
        {successMsg && (
          <div className="sd-alert success flex items-center gap-[9px] rounded-[10px] p-[12px_16px] text-[13px] font-medium mb-[20px] border border-[#6ee7b7] bg-[#d1fae5] text-[#065f46]">
            <CheckCircle2 size={15} className="shrink-0" /> {successMsg}
          </div>
        )}
        {error && (
          <div className="sd-alert error flex items-center gap-[9px] rounded-[10px] p-[12px_16px] text-[13px] font-medium mb-[20px] border border-[#fecaca] bg-[#fef2f2] text-[#dc2626]">
            <AlertCircle size={15} className="shrink-0" /> {error}
          </div>
        )}

        <div className="sd-grid grid grid-cols-1 md:grid-cols-[320px_1fr] gap-[20px] items-start">
          <div className="sd-col flex flex-col gap-[16px]">
            <div className="sd-card bg-white rounded-[16px] border border-[#f0f0f0] overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <div className="sd-card-accent h-[5px]" style={{ background: 'linear-gradient(90deg, #16a34a, #15803d)' }} />
              <div className="sd-card-body p-[22px]">
                <div className="sd-profile-head flex items-center gap-[14px] mb-[20px]">
                  <div className="sd-avatar w-[54px] h-[54px] rounded-[14px] bg-[#f0fdf4] border-[1.5px] border-[#bbf7d0] flex items-center justify-center text-[22px] font-extrabold text-[#16a34a] shrink-0">
                    {staff?.fullName?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <div className="sd-profile-name text-[17px] font-extrabold text-[#0f172a] mb-[3px]">{staff?.fullName}</div>
                    <div className="sd-profile-role text-[12px] text-[#94a3b8]">{staff?.designation || 'Maintenance Staff'}</div>
                  </div>
                </div>
                <div className="sd-info-rows flex flex-col">
                  {infoRows.map(item => item.value ? (
                    <div key={item.label} className="sd-info-row flex justify-between items-center py-[9px] border-b border-[#f9f9f9] last:border-none">
                      <span className="sd-info-key flex items-center gap-[7px] text-[12px] text-[#94a3b8] font-medium">
                        <item.Icon size={12} /> {item.label}
                      </span>
                      <span className="sd-info-val text-[12px] text-[#374151] font-bold text-right max-w-[60%] break-words">{item.value}</span>
                    </div>
                  ) : null)}
                </div>
              </div>
            </div>

            {staff?.verificationStatus === 'rejected' && staff?.rejectionMessage && (
              <div className="sd-rejection-box bg-[#fef2f2] border border-[#fecaca] rounded-[14px] p-[18px]">
                <div className="sd-rejection-title flex items-center gap-[8px] text-[13px] font-bold text-[#dc2626] mb-[8px]">
                  <XCircle size={14} /> Rejection Reason
                </div>
                <p className="sd-rejection-text text-[13px] text-[#7f1d1d] leading-[1.6]">{staff.rejectionMessage}</p>
              </div>
            )}

            {staff?.verificationStatus === 'pending' && (
              <div className="sd-actions-card bg-white rounded-[14px] p-[20px] border border-[#f0f0f0] shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                <div className="sd-actions-title text-[14px] font-bold text-[#0f172a] mb-[5px]">Admin Actions</div>
                <p className="sd-actions-sub text-[12px] text-[#94a3b8] mb-[18px] leading-[1.5]">Review the documents carefully before taking action.</p>
                <button className="sd-action-btn approve w-full rounded-[10px] p-[13px] text-[14px] font-bold cursor-pointer transition-all flex items-center justify-center gap-[8px] mb-[10px] bg-[#16a34a] text-white hover:not-disabled:bg-[#15803d] disabled:opacity-[0.65] disabled:cursor-not-allowed border-none" onClick={handleApprove} disabled={actionLoading}>
                  {actionLoading ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  Approve Staff
                </button>
                <button className="sd-action-btn reject w-full rounded-[10px] p-[13px] text-[14px] font-bold cursor-pointer transition-all flex items-center justify-center gap-[8px] bg-white text-[#dc2626] border-[1.5px] border-[#fecaca] hover:not-disabled:bg-[#fef2f2] disabled:opacity-[0.65] disabled:cursor-not-allowed" onClick={() => setRejectModal(true)} disabled={actionLoading}>
                  <XCircle size={15} /> Reject & Notify
                </button>
              </div>
            )}

            {staff?.verificationStatus === 'approved' && (
              <div className="sd-approved-box bg-[#f0fdf4] rounded-[14px] p-[22px] border-[1.5px] border-[#bbf7d0] text-center">
                <div className="sd-approved-icon w-[52px] h-[52px] rounded-full bg-[#16a34a] flex items-center justify-center mx-auto mb-[12px]">
                  <ShieldCheck size={24} color="#fff" />
                </div>
                <div className="sd-approved-title text-[15px] font-extrabold text-[#065f46] mb-[4px]">Approved & Active</div>
                <div className="sd-approved-sub text-[12px] text-[#16a34a] leading-[1.5]">This staff member can now receive and manage complaints.</div>
              </div>
            )}
          </div>

          <div className="sd-col flex flex-col gap-[16px]">
            <div className="sd-docs-card bg-white rounded-[16px] p-[22px] border border-[#f0f0f0] shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <div className="sd-docs-title text-[15px] font-extrabold text-[#0f172a] mb-[4px]">Uploaded Documents</div>
              <p className="sd-docs-sub text-[12px] text-[#94a3b8] mb-[20px]">Click on any image to enlarge. PDFs will open in a new tab.</p>
              <div className="sd-docs-grid grid grid-cols-1 sm:grid-cols-2 gap-[16px]">
                {docs.map(doc => {
                  const isPdf = doc.fileName?.toLowerCase().endsWith('.pdf')
                  const hasDoc = !!doc.url
                  return (
                    <div key={doc.title} className="sd-doc-item border-[1.5px] border-[#e2e8f0] rounded-[12px] overflow-hidden bg-[#fafafa]">
                      {hasDoc && !isPdf ? (
                        <div className="sd-doc-img-wrap relative h-[175px] cursor-pointer overflow-hidden group" onClick={() => setPreviewDoc({ url: doc.url, title: doc.title })}>
                          <img src={doc.url} alt={doc.title} className="w-full h-full object-cover block" />
                          <div className="sd-doc-img-overlay absolute inset-0 bg-transparent flex items-center justify-center text-white text-[13px] font-bold gap-[6px] transition-all group-hover:bg-black/35">
                            <Eye size={14} /> Enlarge
                          </div>
                        </div>
                      ) : (
                        <div className="sd-doc-placeholder h-[120px] flex items-center justify-center bg-[#f3f4f6]">
                          <doc.Icon size={38} color="#d1d5db" />
                        </div>
                      )}
                      <div className="sd-doc-foot p-[14px] text-center">
                        <div className="sd-doc-name text-[13px] font-bold text-[#374151] mb-[3px]">{doc.title}</div>
                        {doc.fileName && <div className="sd-doc-file text-[10px] text-[#94a3b8] mb-[10px] break-all">{doc.fileName}</div>}
                        {hasDoc ? (
                          <button className="sd-doc-btn bg-[#f3f4f6] text-[#374151] border-none rounded-[7px] py-[6px] px-[14px] text-[12px] font-semibold cursor-pointer flex items-center gap-[5px] mx-auto transition-all hover:bg-[#e2e8f0]" onClick={() => isPdf ? window.open(doc.url, '_blank') : setPreviewDoc({ url: doc.url, title: doc.title })}>
                            {isPdf ? <><FileText size={12} /> View PDF</> : <><Eye size={12} /> Full Size</>}
                          </button>
                        ) : (
                          <span className="sd-doc-empty text-[12px] text-[#d1d5db] italic">Not uploaded</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {previewDoc && (
        <div className="sd-modal-overlay fixed inset-0 bg-[#0f172a]/70 flex items-center justify-center z-[200] p-[20px] backdrop-blur-[2px]" onClick={() => setPreviewDoc(null)}>
          <div className="sd-modal bg-white rounded-[20px] overflow-hidden max-w-[90vw] max-h-[90vh] flex flex-col shadow-[0_30px_80px_rgba(0,0,0,0.22)]" onClick={e => e.stopPropagation()}>
            <div className="sd-modal-head flex justify-between items-center p-[14px_18px] border-b border-[#e5e7eb] shrink-0">
              <span className="sd-modal-title text-[14px] font-bold text-[#0f172a]">{previewDoc.title}</span>
              <button className="sd-close-btn w-[32px] h-[32px] rounded-[8px] bg-[#f3f4f6] border-none cursor-pointer flex items-center justify-center text-[#374151] transition-all hover:bg-[#fee2e2] hover:text-[#dc2626]" onClick={() => setPreviewDoc(null)}><X size={14} /></button>
            </div>
            <div className="overflow-auto p-[4px]">
              <img src={previewDoc.url} alt={previewDoc.title} className="max-w-full max-h-[80vh] object-contain block" />
            </div>
          </div>
        </div>
      )}

      {rejectModal && (
        <div className="sd-modal-overlay fixed inset-0 bg-[#0f172a]/70 flex items-center justify-center z-[200] p-[20px] backdrop-blur-[2px]" onClick={() => setRejectModal(false)}>
          <div className="sd-reject-modal bg-white rounded-[20px] p-[32px] w-full max-w-[460px] shadow-[0_24px_80px_rgba(0,0,0,0.2)]" onClick={e => e.stopPropagation()}>
            <div className="sd-reject-title text-[20px] font-extrabold text-[#0f172a] mb-[6px]">Reject Staff Profile</div>
            <p className="sd-reject-sub text-[13px] text-[#6b7280] mb-[18px] leading-[1.6]">This message will be shown to the staff member in the app and sent via email.</p>
            <textarea
              className="sd-textarea w-full rounded-[10px] border-[1.5px] border-[#e2e8f0] p-[12px_14px] text-[13px] text-[#0f172a] font-['DM_Sans'] resize-y outline-none bg-[#f9fafb] min-h-[100px] mb-[10px] transition-all focus:border-[#16a34a] focus:bg-white"
              placeholder="e.g. Your ID card is not clearly visible. Please re-upload a clearer photo."
              value={rejectionText}
              onChange={e => setRejectionText(e.target.value)}
              rows={4}
            />
            {rejectionError && (
              <div className="sd-reject-error bg-[#fef2f2] text-[#dc2626] border border-[#fecaca] rounded-[8px] p-[8px_12px] text-[12px] mb-[12px] flex items-center gap-[7px]">
                <AlertCircle size={13} className="shrink-0" /> {rejectionError}
              </div>
            )}
            <div className="sd-btn-row flex gap-[10px]">
              <button className="sd-btn cancel flex-1 rounded-[10px] p-[12px] text-[14px] font-bold cursor-pointer transition-all flex items-center justify-center gap-[7px] bg-[#f8fafc] text-[#374151] border-[1.5px] border-[#e2e8f0] hover:border-[#94a3b8]" onClick={() => { setRejectModal(false); setRejectionText(''); setRejectionError('') }}>
                Cancel
              </button>
              <button className="sd-btn danger flex-1 rounded-[10px] p-[12px] text-[14px] font-bold cursor-pointer transition-all flex items-center justify-center gap-[7px] border-none bg-[#dc2626] text-white hover:not-disabled:bg-[#b91c1c] disabled:opacity-[0.65] disabled:cursor-not-allowed" onClick={handleReject} disabled={actionLoading}>
                {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                Reject & Notify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}