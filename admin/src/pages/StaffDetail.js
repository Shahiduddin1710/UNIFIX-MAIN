import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { adminAPI } from '../services/api'
import {
  ArrowLeft, CheckCircle2, XCircle, Eye, FileText,
  AlertCircle, Loader2, X, ShieldCheck, IdCard, Info,
  User, Briefcase, Phone, Mail, Clock, Hash,
} from 'lucide-react'

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .sd-root {
    min-height: 100vh; background: #f4f6f8;
    font-family: 'DM Sans', sans-serif; padding-bottom: 60px;
  }

  .sd-topbar {
    background: #fff; border-bottom: 1px solid #e9ecef;
    padding: 0 28px; display: flex; align-items: center;
    justify-content: space-between; height: 58px;
    position: sticky; top: 0; z-index: 10;
  }

  .sd-topbar-left { display: flex; align-items: center; gap: 14px; }

  .sd-back-btn {
    display: flex; align-items: center; gap: 6px;
    background: #f8fafc; border: 1.5px solid #e2e8f0;
    border-radius: 8px; padding: 7px 13px;
    font-size: 13px; font-weight: 600; color: #475569;
    cursor: pointer; font-family: 'DM Sans', sans-serif;
    transition: all 0.15s;
  }

  .sd-back-btn:hover { border-color: #16a34a; color: #16a34a; background: #f0fdf4; }

  .sd-divider { width: 1px; height: 22px; background: #e2e8f0; }

  .sd-brand { display: flex; align-items: center; gap: 9px; }

  .sd-brand-mark {
    width: 30px; height: 30px; border-radius: 8px;
    background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
    display: flex; align-items: center; justify-content: center;
  }

  .sd-brand-mark span { font-size: 11px; font-weight: 900; color: #fff; letter-spacing: -0.5px; }
  .sd-brand-name { font-size: 14px; font-weight: 700; color: #0f172a; }

  .sd-topbar-right { display: flex; align-items: center; gap: 12px; }
  .sd-page-label { font-size: 12px; color: #94a3b8; }

  .sd-status-pill {
    font-size: 11px; font-weight: 700; padding: 4px 12px;
    border-radius: 20px; border: 1px solid; letter-spacing: 0.3px;
    display: flex; align-items: center; gap: 5px;
  }

  .sd-page { max-width: 1020px; margin: 0 auto; padding: 28px 24px; }

  .sd-alert {
    display: flex; align-items: center; gap: 9px;
    border-radius: 10px; padding: 12px 16px;
    font-size: 13px; font-weight: 500; margin-bottom: 20px; border: 1px solid;
  }

  .sd-alert.success { background: #d1fae5; color: #065f46; border-color: #6ee7b7; }
  .sd-alert.error   { background: #fef2f2; color: #dc2626;  border-color: #fecaca; }

  .sd-grid { display: grid; grid-template-columns: 320px 1fr; gap: 20px; align-items: start; }

  .sd-col { display: flex; flex-direction: column; gap: 16px; }

  .sd-card {
    background: #fff; border-radius: 16px; border: 1px solid #f0f0f0;
    overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  }

  .sd-card-accent { height: 5px; }

  .sd-card-body { padding: 22px; }

  .sd-profile-head {
    display: flex; align-items: center; gap: 14px; margin-bottom: 20px;
  }

  .sd-avatar {
    width: 54px; height: 54px; border-radius: 14px;
    background: #f0fdf4; border: 1.5px solid #bbf7d0;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; font-weight: 800; color: #16a34a; flex-shrink: 0;
  }

  .sd-profile-name { font-size: 17px; font-weight: 800; color: #0f172a; margin-bottom: 3px; }
  .sd-profile-role { font-size: 12px; color: #94a3b8; }

  .sd-info-rows { display: flex; flex-direction: column; }

  .sd-info-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 9px 0; border-bottom: 1px solid #f9f9f9;
  }

  .sd-info-row:last-child { border-bottom: none; }

  .sd-info-key {
    display: flex; align-items: center; gap: 7px;
    font-size: 12px; color: #94a3b8; font-weight: 500;
  }

  .sd-info-val { font-size: 12px; color: #374151; font-weight: 700; text-align: right; max-width: 60%; word-break: break-word; }

  .sd-rejection-box {
    background: #fef2f2; border: 1px solid #fecaca;
    border-radius: 14px; padding: 18px;
  }

  .sd-rejection-title {
    display: flex; align-items: center; gap: 8px;
    font-size: 13px; font-weight: 700; color: #dc2626; margin-bottom: 8px;
  }

  .sd-rejection-text { font-size: 13px; color: '#7f1d1d'; line-height: 1.6; }

  .sd-actions-card {
    background: #fff; border-radius: 14px; padding: 20px;
    border: 1px solid #f0f0f0; box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  }

  .sd-actions-title { font-size: 14px; font-weight: 700; color: '#0f172a'; margin-bottom: 5px; }
  .sd-actions-sub { font-size: 12px; color: #94a3b8; margin-bottom: 18px; line-height: 1.5; }

  .sd-action-btn {
    width: 100%; border: none; border-radius: 10px; padding: 13px;
    font-size: 14px; font-weight: 700; cursor: pointer;
    font-family: 'DM Sans', sans-serif; transition: all 0.15s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    margin-bottom: 10px;
  }

  .sd-action-btn:last-child { margin-bottom: 0; }

  .sd-action-btn.approve { background: #16a34a; color: #fff; }
  .sd-action-btn.approve:hover:not(:disabled) { background: #15803d; }

  .sd-action-btn.reject { background: #fff; color: #dc2626; border: 1.5px solid #fecaca !important; }
  .sd-action-btn.reject:hover:not(:disabled) { background: #fef2f2; }

  .sd-action-btn:disabled { opacity: 0.65; cursor: not-allowed; }

  .sd-approved-box {
    background: #f0fdf4; border-radius: 14px; padding: 22px;
    border: 1.5px solid #bbf7d0; text-align: center;
  }

  .sd-approved-icon {
    width: 52px; height: 52px; border-radius: 50%;
    background: #16a34a; display: flex; align-items: center;
    justify-content: center; margin: 0 auto 12px;
  }

  .sd-approved-title { font-size: 15px; font-weight: 800; color: #065f46; margin-bottom: 4px; }
  .sd-approved-sub { font-size: 12px; color: #16a34a; line-height: 1.5; }

  .sd-docs-card {
    background: #fff; border-radius: 16px; padding: 22px;
    border: 1px solid #f0f0f0; box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  }

  .sd-docs-title { font-size: 15px; font-weight: 800; color: '#0f172a'; margin-bottom: 4px; }
  .sd-docs-sub { font-size: 12px; color: #94a3b8; margin-bottom: 20px; }

  .sd-docs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

  .sd-doc-item {
    border: 1.5px solid #e2e8f0; border-radius: 12px;
    overflow: hidden; background: #fafafa;
  }

  .sd-doc-img-wrap {
    position: relative; height: 175px; cursor: pointer; overflow: hidden;
  }

  .sd-doc-img-overlay {
    position: absolute; inset: 0; background: rgba(0,0,0,0);
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-size: 13px; font-weight: 700; gap: 6px;
    transition: background 0.15s;
  }

  .sd-doc-img-overlay:hover { background: rgba(0,0,0,0.35); }

  .sd-doc-placeholder {
    height: 120px; display: flex; align-items: center;
    justify-content: center; background: #f3f4f6;
  }

  .sd-doc-foot { padding: 14px; text-align: center; }
  .sd-doc-name { font-size: 13px; font-weight: 700; color: #374151; margin-bottom: 3px; }
  .sd-doc-file { font-size: 10px; color: #94a3b8; margin-bottom: 10px; word-break: break-all; }

  .sd-doc-btn {
    background: #f3f4f6; color: #374151; border: none;
    border-radius: 7px; padding: '6px 14px'; font-size: 12px;
    font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif;
    display: inline-flex; align-items: center; gap: 5px;
    padding: 6px 14px; transition: all 0.15s;
  }

  .sd-doc-btn:hover { background: #e2e8f0; }

  .sd-doc-empty { font-size: 12px; color: #d1d5db; font-style: italic; }

  .sd-modal-overlay {
    position: fixed; inset: 0; background: rgba(15,23,42,0.7);
    display: flex; align-items: center; justify-content: center;
    z-index: 200; padding: 20px; backdrop-filter: blur(2px);
  }

  .sd-modal {
    background: #fff; border-radius: 20px; overflow: hidden;
    max-width: 90vw; max-height: 90vh; display: flex; flex-direction: column;
    box-shadow: 0 30px 80px rgba(0,0,0,0.22);
  }

  .sd-modal-head {
    display: flex; justify-content: space-between; align-items: center;
    padding: 14px 18px; border-bottom: 1px solid #e5e7eb; flex-shrink: 0;
  }

  .sd-modal-title { font-size: 14px; font-weight: 700; color: '#0f172a'; }

  .sd-close-btn {
    width: 32px; height: 32px; border-radius: 8px;
    background: #f3f4f6; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: #374151; transition: all 0.15s;
  }

  .sd-close-btn:hover { background: #fee2e2; color: #dc2626; }

  .sd-reject-modal {
    background: #fff; border-radius: 20px; padding: 32px;
    width: 100%; max-width: 460px;
    box-shadow: 0 24px 80px rgba(0,0,0,0.2);
  }

  .sd-reject-title { font-size: 20px; font-weight: 800; color: '#0f172a'; margin-bottom: 6px; }
  .sd-reject-sub { font-size: 13px; color: #6b7280; margin-bottom: 18px; line-height: 1.6; }

  .sd-textarea {
    width: 100%; border-radius: 10px; border: 1.5px solid #e2e8f0;
    padding: 12px 14px; font-size: 13px; color: '#0f172a';
    font-family: 'DM Sans', sans-serif; resize: vertical;
    outline: none; background: #f9fafb; min-height: 100px;
    margin-bottom: 10px; transition: border-color 0.15s;
  }

  .sd-textarea:focus { border-color: #16a34a; background: #fff; }

  .sd-reject-error {
    background: #fef2f2; color: #dc2626; border: 1px solid #fecaca;
    border-radius: 8px; padding: 8px 12px; font-size: 12px; margin-bottom: 12px;
    display: flex; align-items: center; gap: 7px;
  }

  .sd-btn-row { display: flex; gap: 10px; }

  .sd-btn {
    flex: 1; border-radius: 10px; padding: 12px;
    font-size: 14px; font-weight: 700; cursor: pointer;
    font-family: 'DM Sans', sans-serif; transition: all 0.15s;
    display: flex; align-items: center; justify-content: center; gap: 7px;
    border: none;
  }

  .sd-btn.cancel { background: #f8fafc; color: #374151; border: 1.5px solid #e2e8f0 !important; }
  .sd-btn.cancel:hover { border-color: #94a3b8 !important; }

  .sd-btn.danger { background: #dc2626; color: #fff; }
  .sd-btn.danger:hover:not(:disabled) { background: #b91c1c; }
  .sd-btn.danger:disabled { opacity: 0.65; cursor: not-allowed; }

  .sd-loader {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: #f4f6f8; font-family: 'DM Sans', sans-serif;
  }

  .sd-loader-inner { text-align: center; }
  .sd-loader-icon { width: 60px; height: 60px; border-radius: 16px; background: #f0fdf4; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
  .sd-loader-text { color: #94a3b8; font-size: 14px; font-weight: 500; }

  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .spin { animation: spin 0.8s linear infinite; }

  @media (max-width: 900px) {
    .sd-grid { grid-template-columns: 1fr; }
    .sd-docs-grid { grid-template-columns: 1fr; }
  }
`

export default function StaffDetail() {
  const { uid }       = useParams()
  const navigate      = useNavigate()
  const [staff, setStaff]               = useState(null)
  const [loading, setLoading]           = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError]               = useState('')
  const [successMsg, setSuccessMsg]     = useState('')
  const [rejectModal, setRejectModal]   = useState(false)
  const [rejectionText, setRejectionText] = useState('')
  const [rejectionError, setRejectionError] = useState('')
  const [previewDoc, setPreviewDoc]     = useState(null)

  useEffect(() => {
    const fetchStaff = async () => {
      setLoading(true)
      try {
        const res = await adminAPI.getStaff(uid)
        setStaff(res.data.staff)
      } catch (err) {
        if (err.response?.status === 401) { localStorage.removeItem('unifix_admin_token'); navigate('/login') }
        else setError('Failed to load staff details.')
      } finally { setLoading(false) }
    }
    fetchStaff()
  }, [uid])

  const handleApprove = async () => {
    setActionLoading(true); setError('')
    try {
      await adminAPI.approveStaff(uid)
      setSuccessMsg('Staff approved successfully! They will be notified via email.')
      setStaff(prev => ({ ...prev, verificationStatus: 'approved' }))
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve staff.')
    } finally { setActionLoading(false) }
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
      setRejectModal(false); setRejectionText('')
    } catch (err) {
      setRejectionError(err.response?.data?.error || 'Failed to reject staff.')
    } finally { setActionLoading(false) }
  }

  if (loading) return (
    <>
      <style>{css}</style>
      <div className="sd-loader">
        <div className="sd-loader-inner">
          <div className="sd-loader-icon"><Loader2 size={28} color="#16a34a" className="spin" /></div>
          <div className="sd-loader-text">Loading staff profile…</div>
        </div>
      </div>
    </>
  )

  if (error && !staff) return (
    <>
      <style>{css}</style>
      <div className="sd-loader">
        <div className="sd-loader-inner">
          <div className="sd-loader-icon" style={{ background: '#fef2f2' }}><AlertCircle size={28} color="#dc2626" /></div>
          <div className="sd-loader-text" style={{ color: '#dc2626', marginBottom: 18 }}>{error}</div>
          <button onClick={() => navigate('/')} style={{ background: '#fff', color: '#374151', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', display: 'flex', alignItems: 'center', gap: 7, margin: '0 auto' }}>
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
        </div>
      </div>
    </>
  )

  const STATUS_STYLE = {
    pending:  { bg: '#fef3c7', color: '#d97706', border: '#fde68a' },
    approved: { bg: '#d1fae5', color: '#059669', border: '#6ee7b7' },
    rejected: { bg: '#fee2e2', color: '#dc2626', border: '#fca5a5' },
  }
  const sc = STATUS_STYLE[staff?.verificationStatus] ?? STATUS_STYLE.pending

  const infoRows = [
    { label: 'Employee ID', value: staff?.employeeId,   Icon: Hash },
    { label: 'Designation', value: staff?.designation,  Icon: Briefcase },
    { label: 'Experience',  value: staff?.experience ? `${staff.experience} years` : null, Icon: Clock },
    { label: 'Phone',       value: staff?.phone,        Icon: Phone },
    { label: 'Email',       value: staff?.email,        Icon: Mail },
    { label: 'Joined',      value: staff?.createdAt?.seconds ? new Date(staff.createdAt.seconds * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null, Icon: Clock },
  ]

  const docs = [
    { title: 'ID Card',             Icon: IdCard,    url: staff?.idCardUrl,      fileName: staff?.idCardName },
    { title: 'Certificate / Proof', Icon: FileText,  url: staff?.certificateUrl, fileName: staff?.certificateName },
  ]

  return (
    <>
      <style>{css}</style>
      <div className="sd-root">
        <div className="sd-topbar">
          <div className="sd-topbar-left">
            <button className="sd-back-btn" onClick={() => navigate('/')}>
              <ArrowLeft size={13} /> Back
            </button>
            <div className="sd-divider" />
            <div className="sd-brand">
              <div className="sd-brand-mark"><span>UF</span></div>
              <span className="sd-brand-name">UniFiX Admin</span>
            </div>
          </div>
          <div className="sd-topbar-right">
            <span className="sd-page-label">Staff Profile</span>
            <span className="sd-status-pill" style={{ background: sc.bg, color: sc.color, borderColor: sc.border }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: sc.color, flexShrink: 0 }} />
              {staff?.verificationStatus?.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="sd-page">
          {successMsg && (
            <div className="sd-alert success">
              <CheckCircle2 size={15} style={{ flexShrink: 0 }} /> {successMsg}
            </div>
          )}
          {error && (
            <div className="sd-alert error">
              <AlertCircle size={15} style={{ flexShrink: 0 }} /> {error}
            </div>
          )}

          <div className="sd-grid">
            <div className="sd-col">
              <div className="sd-card">
                <div className="sd-card-accent" style={{ background: 'linear-gradient(90deg, #16a34a, #15803d)' }} />
                <div className="sd-card-body">
                  <div className="sd-profile-head">
                    <div className="sd-avatar">{staff?.fullName?.[0]?.toUpperCase() || '?'}</div>
                    <div>
                      <div className="sd-profile-name">{staff?.fullName}</div>
                      <div className="sd-profile-role">{staff?.designation || 'Maintenance Staff'}</div>
                    </div>
                  </div>
                  <div className="sd-info-rows">
                    {infoRows.map(item => item.value ? (
                      <div key={item.label} className="sd-info-row">
                        <span className="sd-info-key">
                          <item.Icon size={12} /> {item.label}
                        </span>
                        <span className="sd-info-val">{item.value}</span>
                      </div>
                    ) : null)}
                  </div>
                </div>
              </div>

              {staff?.verificationStatus === 'rejected' && staff?.rejectionMessage && (
                <div className="sd-rejection-box">
                  <div className="sd-rejection-title">
                    <XCircle size={14} /> Rejection Reason
                  </div>
                  <p className="sd-rejection-text">{staff.rejectionMessage}</p>
                </div>
              )}

              {staff?.verificationStatus === 'pending' && (
                <div className="sd-actions-card">
                  <div className="sd-actions-title">Admin Actions</div>
                  <p className="sd-actions-sub">Review the documents carefully before taking action.</p>
                  <button className="sd-action-btn approve" onClick={handleApprove} disabled={actionLoading}>
                    {actionLoading
                      ? <Loader2 size={15} className="spin" />
                      : <CheckCircle2 size={15} />}
                    Approve Staff
                  </button>
                  <button className="sd-action-btn reject" onClick={() => setRejectModal(true)} disabled={actionLoading}>
                    <XCircle size={15} /> Reject & Notify
                  </button>
                </div>
              )}

              {staff?.verificationStatus === 'approved' && (
                <div className="sd-approved-box">
                  <div className="sd-approved-icon">
                    <ShieldCheck size={24} color="#fff" />
                  </div>
                  <div className="sd-approved-title">Approved & Active</div>
                  <div className="sd-approved-sub">This staff member can now receive and manage complaints.</div>
                </div>
              )}
            </div>

            <div className="sd-col">
              <div className="sd-docs-card">
                <div className="sd-docs-title">Uploaded Documents</div>
                <p className="sd-docs-sub">Click on any image to enlarge. PDFs will open in a new tab.</p>
                <div className="sd-docs-grid">
                  {docs.map(doc => {
                    const isPdf   = doc.fileName?.toLowerCase().endsWith('.pdf')
                    const hasDoc  = !!doc.url
                    return (
                      <div key={doc.title} className="sd-doc-item">
                        {hasDoc && !isPdf ? (
                          <div className="sd-doc-img-wrap" onClick={() => setPreviewDoc({ url: doc.url, title: doc.title })}>
                            <img src={doc.url} alt={doc.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            <div className="sd-doc-img-overlay">
                              <Eye size={14} /> Enlarge
                            </div>
                          </div>
                        ) : (
                          <div className="sd-doc-placeholder">
                            <doc.Icon size={38} color="#d1d5db" />
                          </div>
                        )}
                        <div className="sd-doc-foot">
                          <div className="sd-doc-name">{doc.title}</div>
                          {doc.fileName && <div className="sd-doc-file">{doc.fileName}</div>}
                          {hasDoc ? (
                            <button className="sd-doc-btn" onClick={() => isPdf ? window.open(doc.url, '_blank') : setPreviewDoc({ url: doc.url, title: doc.title })}>
                              {isPdf ? <><FileText size={12} /> View PDF</> : <><Eye size={12} /> Full Size</>}
                            </button>
                          ) : (
                            <span className="sd-doc-empty">Not uploaded</span>
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
          <div className="sd-modal-overlay" onClick={() => setPreviewDoc(null)}>
            <div className="sd-modal" onClick={e => e.stopPropagation()}>
              <div className="sd-modal-head">
                <span className="sd-modal-title">{previewDoc.title}</span>
                <button className="sd-close-btn" onClick={() => setPreviewDoc(null)}><X size={14} /></button>
              </div>
              <div style={{ overflow: 'auto', padding: 4 }}>
                <img src={previewDoc.url} alt={previewDoc.title} style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', display: 'block' }} />
              </div>
            </div>
          </div>
        )}

        {rejectModal && (
          <div className="sd-modal-overlay" onClick={() => setRejectModal(false)}>
            <div className="sd-reject-modal" onClick={e => e.stopPropagation()}>
              <div className="sd-reject-title">Reject Staff Profile</div>
              <p className="sd-reject-sub">This message will be shown to the staff member in the app and sent via email.</p>
              <textarea
                className="sd-textarea"
                placeholder="e.g. Your ID card is not clearly visible. Please re-upload a clearer photo."
                value={rejectionText}
                onChange={e => setRejectionText(e.target.value)}
                rows={4}
              />
              {rejectionError && (
                <div className="sd-reject-error">
                  <AlertCircle size={13} style={{ flexShrink: 0 }} /> {rejectionError}
                </div>
              )}
              <div className="sd-btn-row">
                <button className="sd-btn cancel" onClick={() => { setRejectModal(false); setRejectionText(''); setRejectionError('') }}>
                  Cancel
                </button>
                <button className="sd-btn danger" onClick={handleReject} disabled={actionLoading}>
                  {actionLoading ? <Loader2 size={14} className="spin" /> : <XCircle size={14} />}
                  Reject & Notify
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}