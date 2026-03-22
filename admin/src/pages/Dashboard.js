import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminAPI } from '../services/api'
import logo from '../icon.png'
import {
  LayoutDashboard, ClipboardList, Wrench, Users, Search, CreditCard,
  Trash2, ShieldAlert, LogOut, RefreshCw, ChevronRight, X,
  AlertTriangle, Clock, Loader2, CheckCircle2, XCircle,
  Zap, Droplets, Hammer, Sparkles, Monitor, Shield, Bath,
  FileText, Eye, IdCard, User, GraduationCap, BookUser,
  ArrowRight, AlertCircle, Lock, CheckCheck,
  MapPin, Pin, HandMetal, Package, PackageCheck,  
} from 'lucide-react'

const CATEGORY = {
  electrical: { Icon: Zap,        color: '#f59e0b', bg: '#fef3c7' },
  plumbing:   { Icon: Droplets,   color: '#3b82f6', bg: '#dbeafe' },
  carpentry:  { Icon: Hammer,     color: '#ec4899', bg: '#fce7f3' },
  cleaning:   { Icon: Sparkles,   color: '#10b981', bg: '#d1fae5' },
  technician: { Icon: Monitor,    color: '#8b5cf6', bg: '#ede9fe' },
  safety:     { Icon: Shield,     color: '#ef4444', bg: '#fee2e2' },
  washroom:   { Icon: Bath,       color: '#0ea5e9', bg: '#e0f2fe' },
  others:     { Icon: FileText,   color: '#6b7280', bg: '#f3f4f6' },
}

const STATUS = {
  pending:     { label: 'Pending',     color: '#d97706', bg: '#fef3c7', border: '#fde68a', dot: '#f59e0b' },
  assigned:    { label: 'Assigned',    color: '#2563eb', bg: '#dbeafe', border: '#93c5fd', dot: '#3b82f6' },
  in_progress: { label: 'In Progress', color: '#7c3aed', bg: '#ede9fe', border: '#c4b5fd', dot: '#8b5cf6' },
  completed:   { label: 'Completed',   color: '#059669', bg: '#d1fae5', border: '#6ee7b7', dot: '#10b981' },
  rejected:    { label: 'Rejected',    color: '#dc2626', bg: '#fee2e2', border: '#fca5a5', dot: '#ef4444' },
}

const VERIFICATION = {
  pending:  { label: 'Pending',  color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
  approved: { label: 'Approved', color: '#059669', bg: '#d1fae5', border: '#6ee7b7' },
  rejected: { label: 'Rejected', color: '#dc2626', bg: '#fee2e2', border: '#fca5a5' },
}

const COMPLAINT_FLOW = ['pending', 'assigned', 'in_progress', 'completed']

function toTimestamp(ts) {
  if (!ts) return null
  if (typeof ts === 'number') return ts * 1000
  const secs = ts._seconds ?? ts.seconds
  return secs ? secs * 1000 : null
}

function formatDate(ts) {
  const ms = toTimestamp(ts)
  if (!ms || isNaN(ms)) return '—'
  return new Date(ms).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatDateShort(ts) {
  const ms = toTimestamp(ts)
  if (!ms || isNaN(ms)) return '—'
  return new Date(ms).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function cap(str) { return str ? str[0].toUpperCase() + str.slice(1) : '—' }

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', sans-serif; }
  .unifix-root { display: flex; min-height: 100vh; background: #f4f6f8; font-family: 'DM Sans', sans-serif; }
  .sidebar { width: 228px; flex-shrink: 0; background: #0f172a; display: flex; flex-direction: column; position: fixed; top: 0; left: 0; bottom: 0; z-index: 20; }
  .sidebar-logo { padding: 22px 18px 18px; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; gap: 11px; }
  .sidebar-logo-mark { width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .sidebar-logo-mark span { font-size: 16px; font-weight: 900; color: #fff; letter-spacing: -1px; }
  .sidebar-logo-name { font-size: 15px; font-weight: 800; color: #fff; letter-spacing: -0.3px; }
  .sidebar-logo-sub { font-size: 9px; font-weight: 700; color: #4ade80; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 2px; }
  .sidebar-nav { padding: 14px 10px; flex: 1; display: flex; flex-direction: column; gap: 2px; overflow-y: auto; }
  .sidebar-section-label { font-size: 9px; font-weight: 700; color: rgba(255,255,255,0.25); letter-spacing: 1.2px; text-transform: uppercase; padding: 10px 8px 6px; }
  .nav-btn { display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 9px; border: none; background: none; color: rgba(255,255,255,0.5); font-size: 13px; font-weight: 500; cursor: pointer; width: 100%; text-align: left; transition: all 0.15s; font-family: 'DM Sans', sans-serif; position: relative; }
  .nav-btn:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.85); }
  .nav-btn.active { background: rgba(22,163,74,0.18); color: #4ade80; font-weight: 700; }
  .nav-btn.active::before { content: ''; position: absolute; left: 0; top: 6px; bottom: 6px; width: 3px; border-radius: 0 3px 3px 0; background: #16a34a; }
  .nav-btn-icon { width: 16px; height: 16px; flex-shrink: 0; }
  .nav-badge { margin-left: auto; font-size: 10px; font-weight: 800; padding: 1px 7px; border-radius: 20px; background: #f59e0b; color: #0f172a; flex-shrink: 0; }
  .nav-btn.active .nav-badge { background: #16a34a; color: #fff; }
  .sidebar-footer { padding: 12px 10px 16px; border-top: 1px solid rgba(255,255,255,0.06); }
  .logout-btn { display: flex; align-items: center; gap: 9px; padding: 9px 10px; border-radius: 9px; border: none; background: rgba(220,38,38,0.1); color: #f87171; font-size: 13px; font-weight: 600; cursor: pointer; width: 100%; font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
  .logout-btn:hover { background: rgba(220,38,38,0.18); color: #fca5a5; }
  .main-area { flex: 1; margin-left: 228px; display: flex; flex-direction: column; min-height: 100vh; }
  .topbar { height: 58px; background: #fff; display: flex; align-items: center; justify-content: space-between; padding: 0 28px; flex-shrink: 0; position: sticky; top: 0; z-index: 10; border-bottom: 1px solid #e9ecef; }
  .topbar-title { font-size: 14px; font-weight: 700; color: #0f172a; letter-spacing: -0.2px; }
  .topbar-sub { font-size: 12px; color: #94a3b8; margin-top: 1px; }
  .refresh-btn { display: flex; align-items: center; gap: 7px; background: #f8fafc; color: #475569; border: 1.5px solid #e2e8f0; border-radius: 9px; padding: 7px 14px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; font-family: 'DM Sans', sans-serif; }
  .refresh-btn:hover { background: #f0fdf4; border-color: #16a34a; color: #16a34a; }
  .spin { animation: spin 0.8s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .page-content { flex: 1; padding: 28px; overflow: auto; }
  .error-bar { display: flex; align-items: center; gap: 10px; background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; border-radius: 10px; padding: 12px 16px; font-size: 13px; font-weight: 600; margin-bottom: 20px; }
  .section-header { margin-bottom: 24px; }
  .section-title { font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.4px; margin-bottom: 3px; }
  .section-sub { font-size: 13px; color: #94a3b8; font-weight: 400; }
  .stat-grid-6 { display: grid; grid-template-columns: repeat(6,1fr); gap: 12px; margin-bottom: 20px; }
  .stat-grid-4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin-bottom: 24px; }
  .stat-grid-3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; margin-bottom: 24px; }
  .stat-card { background: #fff; border-radius: 14px; padding: 18px 16px; border: 1px solid #f0f0f0; cursor: pointer; transition: all 0.18s; position: relative; overflow: hidden; }
  .stat-card::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: var(--accent); opacity: 0; transition: opacity 0.18s; }
  .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
  .stat-card:hover::after { opacity: 1; }
  .stat-label { font-size: 10px; font-weight: 700; color: #94a3b8; letter-spacing: 0.6px; text-transform: uppercase; margin-bottom: 10px; }
  .stat-value { font-size: 30px; font-weight: 800; line-height: 1; margin-bottom: 7px; letter-spacing: -1px; }
  .stat-sub { font-size: 11px; font-weight: 600; }
  .alert-row { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
  .alert-card { background: #fff; border-radius: 12px; padding: 14px 20px; display: flex; align-items: center; gap: 12px; cursor: pointer; transition: all 0.15s; border: 1.5px solid; }
  .alert-card:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(0,0,0,0.07); }
  .alert-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .alert-count { font-size: 20px; font-weight: 800; line-height: 1; }
  .alert-text { font-size: 12px; font-weight: 600; margin-top: 2px; }
  .card { background: #fff; border-radius: 16px; border: 1px solid #f0f0f0; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
  .card-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 22px; border-bottom: 1px solid #f5f5f5; }
  .card-title { font-size: 14px; font-weight: 700; color: #0f172a; }
  .link-btn { background: none; border: none; color: #16a34a; font-size: 13px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 4px; font-family: 'DM Sans', sans-serif; transition: gap 0.15s; }
  .link-btn:hover { gap: 7px; }
  table { width: 100%; border-collapse: collapse; }
  thead tr { background: #fafafa; }
  th { padding: 10px 20px; text-align: left; font-size: 10px; font-weight: 700; color: #94a3b8; letter-spacing: 0.6px; text-transform: uppercase; border-bottom: 1px solid #f0f0f0; white-space: nowrap; }
  td { padding: 13px 20px; border-bottom: 1px solid #f9f9f9; vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tbody tr { transition: background 0.1s; cursor: default; }
  tbody tr:hover { background: #fafafa; }
  .cat-icon-wrap { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .status-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; white-space: nowrap; border: 1px solid; }
  .status-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
  .table-footer { padding: 11px 20px; border-top: 1px solid #f5f5f5; display: flex; justify-content: space-between; align-items: center; }
  .table-footer-text { font-size: 12px; color: #94a3b8; }
  .filter-tabs { display: flex; gap: 6px; margin-bottom: 20px; flex-wrap: wrap; }
  .filter-tab { display: flex; align-items: center; gap: 6px; padding: 7px 13px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; border: 1.5px solid; font-family: 'DM Sans', sans-serif; }
  .filter-tab.active { background: #0f172a; color: #fff; border-color: #0f172a; }
  .filter-tab.inactive { background: #fff; color: #64748b; border-color: #e2e8f0; }
  .filter-tab.inactive:hover { border-color: #16a34a; color: #16a34a; }
  .tab-count { font-size: 10px; font-weight: 800; padding: 1px 6px; border-radius: 20px; flex-shrink: 0; }
  .tab-count.active { background: rgba(255,255,255,0.2); color: #fff; }
  .tab-count.inactive { background: #f1f5f9; color: #64748b; }
  .inner-tabs { display: flex; gap: 5px; padding: 14px 18px; border-bottom: 1px solid #f5f5f5; flex-wrap: wrap; }
  .inner-tab { padding: 6px 11px; border-radius: 7px; border: 1.5px solid; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; font-family: 'DM Sans', sans-serif; }
  .inner-tab.active { background: #0f172a; color: #fff; border-color: #0f172a; }
  .inner-tab.inactive { background: #fff; color: #64748b; border-color: #e2e8f0; }
  .inner-tab.inactive:hover { border-color: #0f172a; }
  .view-btn { padding: 5px 13px; border-radius: 6px; border: none; background: #16a34a; color: #fff; font-size: 12px; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; display: flex; align-items: center; gap: 4px; }
  .view-btn:hover { background: #15803d; }
  .empty-state { text-align: center; padding: 80px 20px; }
  .empty-icon { width: 60px; height: 60px; border-radius: 16px; background: #f0fdf4; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
  .empty-title { font-size: 15px; font-weight: 700; color: #374151; margin-bottom: 5px; }
  .empty-sub { font-size: 13px; color: #9ca3af; }
  .staff-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
  .user-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
  .lf-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
  .member-card { background: #fff; border-radius: 14px; border: 1px solid #f0f0f0; overflow: hidden; }
  .member-card-head { padding: 16px 18px; border-bottom: 1px solid #f9f9f9; display: flex; align-items: center; gap: 12px; }
  .avatar { width: 42px; height: 42px; border-radius: 11px; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 800; flex-shrink: 0; border: 1.5px solid; }
  .member-name { font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 2px; }
  .member-email { font-size: 11px; color: #94a3b8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .member-card-body { padding: 13px 18px; }
  .info-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #f9f9f9; }
  .info-row:last-child { border-bottom: none; }
  .info-key { font-size: 12px; color: #94a3b8; font-weight: 500; }
  .info-val { font-size: 12px; color: #374151; font-weight: 600; text-align: right; }
  .member-card-foot { padding: 12px 18px; }
  .full-btn { width: 100%; background: #0f172a; color: #fff; border: none; border-radius: 9px; padding: 10px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; display: flex; align-items: center; justify-content: center; gap: 6px; }
  .full-btn:hover { background: #1e293b; }
  .full-btn.outline { background: #f8fafc; color: #374151; border: 1.5px solid #e2e8f0; }
  .full-btn.outline:hover { border-color: #16a34a; color: #16a34a; background: #f0fdf4; }
  .full-btn.green { background: #16a34a; }
  .full-btn.green:hover { background: #15803d; }
  .full-btn.red { background: #dc2626; }
  .full-btn.red:hover { background: #b91c1c; }
  .user-top-accent { height: 4px; }
  .modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.6); display: flex; align-items: center; justify-content: center; z-index: 200; padding: 20px; backdrop-filter: blur(2px); }
  .modal { background: #fff; border-radius: 20px; width: 100%; max-width: 720px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 30px 80px rgba(0,0,0,0.22); overflow: hidden; }
  .modal-sm { max-width: 460px; }
  .modal-head { display: flex; justify-content: space-between; align-items: center; padding: 18px 22px; border-bottom: 1px solid #f3f4f6; flex-shrink: 0; }
  .modal-title { font-size: 15px; font-weight: 800; color: #0f172a; }
  .modal-sub { font-size: 12px; color: #94a3b8; margin-top: 2px; }
  .close-btn { width: 32px; height: 32px; border-radius: 8px; background: #f3f4f6; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #374151; transition: all 0.15s; flex-shrink: 0; }
  .close-btn:hover { background: #fee2e2; color: #dc2626; }
  .modal-body { overflow-y: auto; padding: 22px; display: flex; flex-direction: column; gap: 18px; }
  .progress-bar { background: #f9fafb; border-radius: 12px; padding: 18px; }
  .progress-bar-label { font-size: 10px; font-weight: 700; color: #94a3b8; letter-spacing: 0.6px; text-transform: uppercase; margin-bottom: 16px; }
  .progress-steps { display: flex; align-items: flex-start; }
  .progress-step { flex: 1; display: flex; flex-direction: column; align-items: center; position: relative; }
  .progress-dot { width: 26px; height: 26px; border-radius: 50%; background: #e2e8f0; display: flex; align-items: center; justify-content: center; z-index: 1; margin-bottom: 8px; transition: background 0.2s; }
  .progress-dot.done { background: #0f172a; }
  .progress-line { position: absolute; top: 13px; left: 50%; width: 100%; height: 2px; background: #e2e8f0; z-index: 0; transition: background 0.2s; }
  .progress-line.done { background: #0f172a; }
  .progress-step-label { font-size: 10px; color: #94a3b8; font-weight: 500; text-align: center; }
  .progress-step-label.done { color: #0f172a; font-weight: 700; }
  .detail-panels { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; }
  .detail-panel { background: #f9fafb; border-radius: 12px; padding: 15px; }
  .detail-panel-title { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 12px; }
  .detail-rows { display: flex; flex-direction: column; gap: 8px; }
  .detail-row { display: flex; justify-content: space-between; gap: 8px; }
  .detail-key { font-size: 12px; color: #94a3b8; font-weight: 500; flex-shrink: 0; }
  .detail-val { font-size: 12px; color: #374151; font-weight: 600; text-align: right; word-break: break-word; }
  .photo-section-label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 10px; }
  .btn-row { display: flex; gap: 9px; }
  .action-btn { flex: 1; border-radius: 9px; padding: 9px; font-size: 13px; font-weight: 700; cursor: pointer; border: none; font-family: 'DM Sans', sans-serif; transition: all 0.15s; display: flex; align-items: center; justify-content: center; gap: 6px; }
  .action-btn.approve { background: #16a34a; color: #fff; }
  .action-btn.approve:hover { background: #15803d; }
  .action-btn.approve:disabled { opacity: 0.55; cursor: not-allowed; }
  .action-btn.reject { background: #fff; color: #dc2626; border: 1.5px solid #fecaca !important; }
  .action-btn.reject:hover { background: #fef2f2; }
  .action-btn.delete { background: #dc2626; color: #fff; }
  .action-btn.delete:hover { background: #b91c1c; }
  .action-btn.delete:disabled { opacity: 0.55; cursor: not-allowed; }
  .action-btn.keep { background: #f9fafb; color: #374151; border: 1.5px solid #e2e8f0 !important; }
  .action-btn.keep:hover { border-color: #16a34a !important; color: #16a34a; }
  .action-btn.resolve { background: #0f172a; color: #fff; }
  .action-btn.resolve:hover { background: #1e293b; }
  .pending-card { background: #fff; border-radius: 14px; overflow: hidden; }
  .pending-card.yellow { border: 1.5px solid #fde68a; }
  .pending-card.red { border: 1.5px solid #fecaca; }
  .pending-card-head { padding: 13px 16px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid; }
  .pending-card.yellow .pending-card-head { border-color: #fef3c7; }
  .pending-card.red .pending-card-head { border-color: #fee2e2; }
  .pending-card-body { padding: 15px; }
  .pending-icon { width: 36px; height: 36px; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .pending-icon.yellow { background: #fef3c7; }
  .pending-icon.red { background: #fef2f2; }
  .pending-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; margin-bottom: 32px; }
  .id-card-preview-wrap { position: relative; cursor: pointer; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; margin-bottom: 12px; }
  .id-card-preview-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 12px; font-weight: 700; gap: 5px; transition: background 0.15s; }
  .id-card-preview-overlay:hover { background: rgba(0,0,0,0.3); }
  .id-card-label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 8px; }
  .req-date { font-size: 11px; color: #94a3b8; margin-bottom: 12px; }
  .processed-list { display: flex; flex-direction: column; gap: 7px; }
  .processed-row { background: #fff; border-radius: 9px; border: 1px solid #f0f0f0; padding: 11px 14px; display: flex; align-items: center; gap: 12px; }
  .processed-row.muted { background: #f9fafb; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .sub-section-title { font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
  .sub-section-badge { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 20px; }
  .deletion-card { background: #fff; border-radius: 12px; border: 1px solid #fecaca; padding: 16px; margin-bottom: 12px; }
  .security-open-card { background: #fff; border-radius: 14px; border: 1.5px solid #fde68a; padding: 20px; }
  .security-issue-head { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 14px; }
  .security-icon { width: 40px; height: 40px; border-radius: 10px; background: #fef3c7; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .security-type { font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 3px; }
  .security-desc { font-size: 13px; color: #374151; line-height: 1.55; margin-bottom: 8px; }
  .security-meta { font-size: 12px; color: #9ca3af; }
  .open-badge { font-size: 11px; font-weight: 700; padding: 2px 9px; border-radius: 20px; background: #fef3c7; color: #d97706; border: 1px solid #fde68a; display: inline-flex; align-items: center; gap: 5px; }
  .resolved-badge { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; background: #d1fae5; color: #059669; border: 1px solid #6ee7b7; white-space: nowrap; display: inline-flex; align-items: center; gap: 4px; }
  .modal-input { width: 100%; border-radius: 10px; border: 1.5px solid #e2e8f0; padding: 12px; font-size: 14px; color: #374151; min-height: 80px; resize: vertical; box-sizing: border-box; font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.15s; }
  .modal-input:focus { border-color: #16a34a; }
  .preview-fullscreen-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; z-index: 300; padding: 20px; }
  .preview-fullscreen-inner { background: #fff; border-radius: 16px; overflow: hidden; max-width: 90vw; max-height: 90vh; display: flex; flex-direction: column; }
  .preview-fullscreen-head { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; border-bottom: 1px solid #e5e7eb; flex-shrink: 0; }
  .preview-fullscreen-body { overflow: auto; }
  .mono { font-family: 'DM Mono', monospace; font-size: 11px; color: #94a3b8; }
  .loading-row { padding: 60px; text-align: center; color: #94a3b8; font-size: 14px; }
  .section-divider { font-size: 13px; font-weight: 700; color: #374151; margin-bottom: 13px; margin-top: 4px; }
  .lf-card { background: #fff; border-radius: 14px; border: 1px solid #f0f0f0; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.04); transition: all 0.15s; }
  .lf-card:hover { box-shadow: 0 4px 14px rgba(0,0,0,0.08); transform: translateY(-1px); }
  .lf-card-img { width: 100%; height: 160px; object-fit: cover; display: block; background: #f8fafc; }
  .lf-card-img-empty { width: 100%; height: 110px; background: #f8fafc; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid #f0f0f0; }
  .lf-card-body { padding: 14px 16px; }
  .lf-card-head { display: flex; align-items: center; gap: 9px; margin-bottom: 10px; }
  .lf-poster-avatar { width: 30px; height: 30px; border-radius: 8px; background: #f0fdf4; border: 1.5px solid #bbf7d0; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; color: #16a34a; flex-shrink: 0; }
  .lf-poster-name { font-size: 13px; font-weight: 600; color: #0f172a; }
  .lf-poster-time { font-size: 11px; color: #94a3b8; }
  .lf-item-name { font-size: 15px; font-weight: 800; color: #0f172a; margin-bottom: 6px; }
  .lf-meta-row { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #64748b; margin-bottom: 3px; }
  .lf-collect-row { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #16a34a; font-weight: 500; margin-bottom: 3px; }
  .lf-handed-box { display: flex; align-items: center; gap: 8px; background: #f0fdf4; border-radius: 9px; padding: 10px 12px; margin-top: 10px; border: 1px solid #bbf7d0; }
  .lf-handed-text { font-size: 13px; font-weight: 700; color: #16a34a; }
  .lf-handed-date { font-size: 11px; color: #86efac; margin-top: 1px; }
  .lf-available-badge { font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 20px; background: #16a34a; color: #fff; }
  .lf-handed-badge { font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 20px; background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; display: inline-flex; align-items: center; gap: 4px; }
  .lf-desc { font-size: 12px; color: #64748b; line-height: 1.55; margin-bottom: 8px; }
  .lf-img-badge-wrap { position: relative; }
  .lf-img-badge { position: absolute; top: 10px; right: 10px; }
  @media (max-width: 1200px) { .stat-grid-6 { grid-template-columns: repeat(3,1fr); } .detail-panels { grid-template-columns: 1fr 1fr; } .stat-grid-3 { grid-template-columns: repeat(2,1fr); } }
  @media (max-width: 900px) { .stat-grid-6 { grid-template-columns: repeat(2,1fr); } .two-col { grid-template-columns: 1fr; } .stat-grid-4 { grid-template-columns: repeat(2,1fr); } .stat-grid-3 { grid-template-columns: 1fr; } }
`

const StatusBadge = memo(({ status, verification }) => {
  const meta = status ? (STATUS[status] ?? STATUS.pending) : (VERIFICATION[verification] ?? VERIFICATION.pending)
  return (
    <span className="status-badge" style={{ background: meta.bg, color: meta.color, borderColor: meta.border }}>
      <span className="status-dot" style={{ background: meta.dot ?? meta.color }} />
      {meta.label}
    </span>
  )
})

function EmptyState({ icon: Icon, text, sub }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Icon size={26} color="#16a34a" /></div>
      <div className="empty-title">{text}</div>
      {sub && <div className="empty-sub">{sub}</div>}
    </div>
  )
}

function SectionHeader({ title, subtitle }) {
  return (
    <div className="section-header">
      <h1 className="section-title">{title}</h1>
      {subtitle && <p className="section-sub">{subtitle}</p>}
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [section, setSection]           = useState('overview')
  const [staff, setStaff]               = useState([])
  const [complaints, setComplaints]     = useState([])
  const [users, setUsers]               = useState([])
  const [lostFoundItems, setLostFoundItems] = useState([])
  const [stats, setStats]               = useState({ pending: 0, approved: 0, rejected: 0, total: 0, students: 0, teachers: 0, complaints: {}, pendingIdCardRequests: 0, pendingDeletionRequests: 0, openSecurityIssues: 0 })
  const [staffTab, setStaffTab]         = useState('pending')
  const [complaintTab, setComplaintTab] = useState('all')
  const [userTab, setUserTab]           = useState('student')
  const [lfTab, setLfTab]               = useState('all')
  const [loading, setLoading]           = useState(true)
  const [lfLoading, setLfLoading]       = useState(false)
  const [refreshing, setRefreshing]     = useState(false)
  const [activeComplaint, setActiveComplaint] = useState(null)
  const [error, setError]               = useState('')
  const [idCardRequests, setIdCardRequests]     = useState([])
  const [deletionRequests, setDeletionRequests] = useState({ staffRequests: [], userDeletions: [] })
  const [securityIssues, setSecurityIssues]     = useState([])

  const fetchAll = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [staffRes, statsRes, complaintsRes, usersRes] = await Promise.all([
        adminAPI.getAllStaff(), adminAPI.getStats(),
        adminAPI.getAllComplaints(), adminAPI.getAllUsers(),
      ])
      setStaff(staffRes.data.staff ?? [])
      setStats(statsRes.data.stats ?? {})
      setComplaints(complaintsRes.data.complaints ?? [])
      setUsers(usersRes.data.users ?? [])
    } catch (err) {
      if (err.response?.status === 401) { localStorage.removeItem('unifix_admin_token'); navigate('/login') }
      else setError('Failed to load dashboard data.')
    } finally { setLoading(false) }
  }, [navigate])

  const fetchLostFound = useCallback(async () => {
    setLfLoading(true)
    try {
      const res = await adminAPI.getAllLostFound()
      setLostFoundItems(res.data.items ?? [])
    } catch {} finally { setLfLoading(false) }
  }, [])

  const fetchIdCardRequests   = useCallback(async () => { try { const r = await adminAPI.getIdCardRequests();   setIdCardRequests(r.data.requests ?? []) } catch {} }, [])
  const fetchDeletionRequests = useCallback(async () => { try { const r = await adminAPI.getDeletionRequests(); setDeletionRequests(r.data ?? { staffRequests: [], userDeletions: [] }) } catch {} }, [])
  const fetchSecurityIssues   = useCallback(async () => { try { const r = await adminAPI.getSecurityIssues();   setSecurityIssues(r.data.issues ?? []) } catch {} }, [])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchAll()
    if (section === 'lostfound')  await fetchLostFound()
    if (section === 'idcards')    await fetchIdCardRequests()
    if (section === 'deletions')  await fetchDeletionRequests()
    if (section === 'security')   await fetchSecurityIssues()
    setRefreshing(false)
  }, [section, fetchAll, fetchLostFound, fetchIdCardRequests, fetchDeletionRequests, fetchSecurityIssues])

  useEffect(() => { fetchAll() }, [fetchAll])

  useEffect(() => {
    if (section === 'lostfound')  fetchLostFound()
    if (section === 'idcards')    fetchIdCardRequests()
    if (section === 'deletions')  fetchDeletionRequests()
    if (section === 'security')   fetchSecurityIssues()
  }, [section, fetchLostFound, fetchIdCardRequests, fetchDeletionRequests, fetchSecurityIssues])

  const logout = useCallback(() => { localStorage.removeItem('unifix_admin_token'); navigate('/login') }, [navigate])

  const cs = stats.complaints ?? {}
  const visibleStaff      = useMemo(() => staff.filter(m => m.verificationStatus === staffTab), [staff, staffTab])
  const visibleComplaints = useMemo(() => complaintTab === 'all' ? complaints : complaints.filter(c => c.status === complaintTab), [complaints, complaintTab])
  const visibleUsers      = useMemo(() => users.filter(u => u.role === userTab), [users, userTab])
  const visibleLf         = useMemo(() => {
    if (lfTab === 'all') return lostFoundItems
    return lostFoundItems.filter(i => i.status === lfTab)
  }, [lostFoundItems, lfTab])

  const lfAvailable  = useMemo(() => lostFoundItems.filter(i => i.status === 'available').length,   [lostFoundItems])
  const lfHandedOver = useMemo(() => lostFoundItems.filter(i => i.status === 'handed_over').length, [lostFoundItems])

  const NAV_SECTIONS = [
    {
      label: 'Main',
      items: [
        { key: 'overview',   Icon: LayoutDashboard, label: 'Dashboard' },
        { key: 'complaints', Icon: ClipboardList,   label: 'Complaints',   badge: cs.pending },
        { key: 'staff',      Icon: Wrench,          label: 'Maintenance',  badge: stats.pending },
        { key: 'users',      Icon: Users,           label: 'Staff & Users' },
        { key: 'lostfound',  Icon: Search,          label: 'Lost & Found' },
      ],
    },
    {
      label: 'Admin Actions',
      items: [
        { key: 'idcards',   Icon: CreditCard,  label: 'ID Cards',   badge: stats.pendingIdCardRequests },
        { key: 'deletions', Icon: Trash2,      label: 'Deletions',  badge: stats.pendingDeletionRequests },
        { key: 'security',  Icon: ShieldAlert, label: 'Security',   badge: stats.openSecurityIssues },
      ],
    },
  ]

  const sectionLabel = NAV_SECTIONS.flatMap(s => s.items).find(i => i.key === section)?.label ?? 'Dashboard'

  return (
    <>
      <style>{css}</style>
      <div className="unifix-root">
        <aside className="sidebar">
        
           <div className="sidebar-logo">
  <img
    src={logo}
    alt="UniFiX"
    style={{ width: 42, height: 42, objectFit: 'contain', flexShrink: 0 }}
  />
  <div>
    <div className="sidebar-logo-name">UniFiX</div>
    <div className="sidebar-logo-sub">Admin Panel</div>
  </div>
</div>
          <nav className="sidebar-nav">
            {NAV_SECTIONS.map(sec => (
              <div key={sec.label}>
                <div className="sidebar-section-label">{sec.label}</div>
                {sec.items.map(({ key, Icon, label, badge }) => (
                  <button key={key} className={`nav-btn${section === key ? ' active' : ''}`} onClick={() => setSection(key)}>
                    <Icon className="nav-btn-icon" size={15} />
                    <span style={{ flex: 1 }}>{label}</span>
                    {badge > 0 && <span className="nav-badge">{badge}</span>}
                  </button>
                ))}
              </div>
            ))}
          </nav>
          <div className="sidebar-footer">
            <button className="logout-btn" onClick={logout}><LogOut size={15} /> Log out</button>
          </div>
        </aside>

        <div className="main-area">
          <header className="topbar">
            <div>
              <div className="topbar-title">{sectionLabel}</div>
              <div className="topbar-sub">UniFiX Admin</div>
            </div>
            <button className="refresh-btn" onClick={handleRefresh}>
              <RefreshCw size={13} className={refreshing ? 'spin' : ''} />
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </header>

          <main className="page-content">
            {error && <div className="error-bar"><AlertCircle size={16} /> {error}</div>}
            {section === 'overview'   && <OverviewSection stats={stats} cs={cs} complaints={complaints} onNavigate={setSection} loading={loading} />}
            {section === 'complaints' && <ComplaintsSection allComplaints={complaints} visible={visibleComplaints} activeTab={complaintTab} onTabChange={setComplaintTab} cs={cs} loading={loading} focused={activeComplaint} setFocused={setActiveComplaint} />}
            {section === 'staff'      && <StaffSection items={visibleStaff} activeTab={staffTab} onTabChange={setStaffTab} stats={stats} loading={loading} navigate={navigate} />}
            {section === 'users'      && <UsersSection items={visibleUsers} activeTab={userTab} onTabChange={setUserTab} stats={stats} loading={loading} />}
            {section === 'lostfound' && <LostFoundSection items={visibleLf} allItems={lostFoundItems} activeTab={lfTab} onTabChange={setLfTab} available={lfAvailable} handedOver={lfHandedOver} loading={lfLoading} />}
            {section === 'idcards'    && <IdCardsSection requests={idCardRequests} loading={loading} onRefresh={fetchIdCardRequests} />}
            {section === 'deletions'  && <DeletionsSection data={deletionRequests} loading={loading} onRefresh={fetchDeletionRequests} />}
            {section === 'security'   && <SecuritySection issues={securityIssues} loading={loading} onRefresh={fetchSecurityIssues} />}
          </main>
        </div>
      </div>
    </>
  )
}

function OverviewSection({ stats, cs, complaints, onNavigate, loading }) {
  const recent = complaints.slice(0, 6)
  const statCards = [
    { label: 'Total Complaints', value: cs.total ?? 0,       sub: `${cs.pending ?? 0} pending`,    subColor: '#d97706', color: '#f59e0b', section: 'complaints' },
    { label: 'Pending',          value: cs.pending ?? 0,     sub: 'Requires attention',             subColor: '#dc2626', color: '#ef4444', section: 'complaints' },
    { label: 'In Progress',      value: cs.in_progress ?? 0, sub: 'Staff assigned',                 subColor: '#7c3aed', color: '#8b5cf6', section: 'complaints' },
    { label: 'Resolved',         value: cs.completed ?? 0,   sub: `${cs.total ? Math.round((cs.completed / cs.total) * 100) : 0}% success rate`, subColor: '#059669', color: '#10b981', section: 'complaints' },
    { label: 'Students',         value: stats.students ?? 0, sub: 'Active profiles',                subColor: '#6b7280', color: '#6366f1', section: 'users' },
    { label: 'Active Staff',     value: stats.approved ?? 0, sub: 'Verified staff',                 subColor: '#6b7280', color: '#0ea5e9', section: 'staff' },
  ]
  return (
    <div>
      <SectionHeader title="Campus Overview" subtitle="Welcome back. Here's what's happening across campus today." />
      <div className="stat-grid-6">
        {statCards.map(card => (
          <div key={card.label} className="stat-card" style={{ '--accent': card.color }} onClick={() => onNavigate(card.section)}>
            <div className="stat-label">{card.label}</div>
            <div className="stat-value" style={{ color: card.color }}>{loading ? '—' : card.value.toLocaleString()}</div>
            <div className="stat-sub" style={{ color: card.subColor }}>{card.sub}</div>
          </div>
        ))}
      </div>
      {(stats.pendingIdCardRequests > 0 || stats.pendingDeletionRequests > 0 || stats.openSecurityIssues > 0) && (
        <div className="alert-row">
          {stats.pendingIdCardRequests > 0 && (
            <div className="alert-card" style={{ borderColor: '#fde68a' }} onClick={() => onNavigate('idcards')}>
              <div className="alert-icon" style={{ background: '#fef3c7' }}><CreditCard size={18} color="#d97706" /></div>
              <div><div className="alert-count" style={{ color: '#d97706' }}>{stats.pendingIdCardRequests}</div><div className="alert-text" style={{ color: '#92400e' }}>Pending ID Card Requests</div></div>
            </div>
          )}
          {stats.pendingDeletionRequests > 0 && (
            <div className="alert-card" style={{ borderColor: '#fecaca' }} onClick={() => onNavigate('deletions')}>
              <div className="alert-icon" style={{ background: '#fef2f2' }}><Trash2 size={18} color="#dc2626" /></div>
              <div><div className="alert-count" style={{ color: '#dc2626' }}>{stats.pendingDeletionRequests}</div><div className="alert-text" style={{ color: '#991b1b' }}>Pending Deletion Requests</div></div>
            </div>
          )}
          {stats.openSecurityIssues > 0 && (
            <div className="alert-card" style={{ borderColor: '#fcd34d' }} onClick={() => onNavigate('security')}>
              <div className="alert-icon" style={{ background: '#fef3c7' }}><ShieldAlert size={18} color="#d97706" /></div>
              <div><div className="alert-count" style={{ color: '#d97706' }}>{stats.openSecurityIssues}</div><div className="alert-text" style={{ color: '#92400e' }}>Open Security Issues</div></div>
            </div>
          )}
        </div>
      )}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Activity</span>
          <button className="link-btn" onClick={() => onNavigate('complaints')}>View All <ChevronRight size={14} /></button>
        </div>
        <table>
          <thead><tr>{['Complaint', 'Location', 'Reported By', 'Status', 'Date'].map(h => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="loading-row">Loading…</td></tr>
              : recent.length === 0 ? <tr><td colSpan={5} className="loading-row">No complaints yet</td></tr>
              : recent.map(c => {
                const cat = CATEGORY[c.category] ?? CATEGORY.others
                const CatIcon = cat.Icon
                return (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="cat-icon-wrap" style={{ background: cat.bg }}><CatIcon size={14} color={cat.color} /></div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{c.subIssue || c.customIssue || 'Issue Reported'}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 13, color: '#374151' }}>{[c.building, c.roomDetail].filter(Boolean).join(', ') || '—'}</td>
                    <td style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{c.submittedByName || '—'}</td>
                    <td><StatusBadge status={c.status} /></td>
                    <td><span style={{ fontSize: 12, color: '#94a3b8' }}>{formatDateShort(c.createdAt)}</span></td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function LostFoundSection({ items, allItems, activeTab, onTabChange, available, handedOver, loading }) {
  const [previewUrl, setPreviewUrl] = useState(null)

  const tabs = [
    { key: 'all',         label: 'All Items',   count: allItems.length },
    { key: 'available',   label: 'Available',   count: available },
    { key: 'handed_over', label: 'Handed Over', count: handedOver },
  ]

  return (
    <div>
      <SectionHeader title="Lost & Found" subtitle="All items posted by students and teachers across campus" />

      <div className="stat-grid-3">
        {[
          { label: 'Total Items',      value: allItems.length, color: '#0f172a', sub: 'All time',              accent: '#6366f1' },
          { label: 'Available',        value: available,       color: '#16a34a', sub: 'Waiting to be claimed', accent: '#16a34a' },
          { label: 'Handed Over',      value: handedOver,      color: '#059669', sub: 'Successfully returned', accent: '#10b981' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ '--accent': s.accent, cursor: 'default' }}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color }}>{loading ? '—' : s.value}</div>
            <div className="stat-sub" style={{ color: '#94a3b8' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="filter-tabs">
        {tabs.map(tab => (
          <button key={tab.key} className={`filter-tab ${activeTab === tab.key ? 'active' : 'inactive'}`} onClick={() => onTabChange(tab.key)}>
            {tab.label}
            <span className={`tab-count ${activeTab === tab.key ? 'active' : 'inactive'}`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {loading
        ? <div className="loading-row">Loading…</div>
        : items.length === 0
          ? <EmptyState icon={Search} text="No items found" sub="No lost & found items match this filter" />
          : (
            <div className="lf-grid">
              {items.map(item => {
                const isHandedOver = item.status === 'handed_over'
                return (
                  <div key={item.id} className="lf-card">
                    {item.photoUrl ? (
                      <div className="lf-img-badge-wrap" style={{ cursor: 'pointer' }} onClick={() => setPreviewUrl(item.photoUrl)}>
                        <img src={item.photoUrl} alt={item.itemName} className="lf-card-img" />
                        <div className="lf-img-badge">
                          {isHandedOver
                            ? <span className="lf-handed-badge"><PackageCheck size={10} /> Handed Over</span>
                            : <span className="lf-available-badge">Available</span>}
                        </div>
                      </div>
                    ) : (
                      <div className="lf-card-img-empty">
                        <Package size={34} color="#d1d5db" />
                      </div>
                    )}

                    <div className="lf-card-body">
                      <div className="lf-card-head">
                        <div className="lf-poster-avatar">{item.postedByName?.[0]?.toUpperCase() ?? '?'}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="lf-poster-name">{item.postedByName || '—'}</div>
                          <div className="lf-poster-time">{cap(item.postedByRole)} · {formatDateShort(item.createdAt)}</div>
                        </div>
                        {!item.photoUrl && (
                          isHandedOver
                            ? <span className="lf-handed-badge"><PackageCheck size={10} /> Handed Over</span>
                            : <span className="lf-available-badge">Available</span>
                        )}
                      </div>

                      <div className="lf-item-name">{item.itemName}</div>
                      {item.description ? <div className="lf-desc">{item.description}</div> : null}

                      <div className="lf-meta-row">
                        <MapPin size={12} color="#64748b" />
                        Room {item.roomNumber}{item.roomLabel ? ` — ${item.roomLabel}` : ''}
                      </div>
                      {item.collectLocation && (
                        <div className="lf-collect-row">
                          <Pin size={12} color="#16a34a" />
                          Collect from: {item.collectLocation}
                        </div>
                      )}

                      {isHandedOver && (
                        <div className="lf-handed-box">
                          <HandMetal size={15} color="#16a34a" style={{ flexShrink: 0 }} />
                          <div>
                            <div className="lf-handed-text">Handed to {item.handedToName}</div>
                            <div className="lf-handed-date">{formatDateShort(item.handedAt)}</div>
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
        <div className="preview-fullscreen-overlay" onClick={() => setPreviewUrl(null)}>
          <div className="preview-fullscreen-inner" onClick={e => e.stopPropagation()}>
            <div className="preview-fullscreen-head">
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Item Photo</span>
              <button className="close-btn" onClick={() => setPreviewUrl(null)}><X size={14} /></button>
            </div>
            <div className="preview-fullscreen-body">
              <img src={previewUrl} alt="Item" style={{ maxWidth: '80vw', maxHeight: '80vh', objectFit: 'contain', display: 'block', padding: 8 }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ComplaintsSection({ allComplaints, visible, activeTab, onTabChange, cs, loading, focused, setFocused }) {
  const tabs = [
    { key: 'all',         label: 'All',        count: cs.total ?? allComplaints.length },
    { key: 'pending',     label: 'Pending',    count: cs.pending },
    { key: 'assigned',    label: 'Assigned',   count: cs.assigned },
    { key: 'in_progress', label: 'In Progress',count: cs.in_progress },
    { key: 'completed',   label: 'Completed',  count: cs.completed },
    { key: 'rejected',    label: 'Rejected',   count: cs.rejected },
  ]
  return (
    <div>
      <SectionHeader title="Complaint Management" subtitle="Full complaint history and real-time status tracking" />
      <div className="card">
        <div className="inner-tabs">
          {tabs.map(tab => (
            <button key={tab.key} className={`inner-tab ${activeTab === tab.key ? 'active' : 'inactive'}`} onClick={() => onTabChange(tab.key)}>
              {tab.label}
              <span style={{ marginLeft: 5, fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 20, ...(activeTab === tab.key ? { background: 'rgba(255,255,255,0.2)', color: '#fff' } : { background: '#f1f5f9', color: '#64748b' }) }}>{tab.count ?? 0}</span>
            </button>
          ))}
        </div>
        <table>
          <thead><tr>{['', 'Complaint', 'Category', 'Location', 'Reported By', 'Status', 'Date', ''].map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={8} className="loading-row">Loading…</td></tr>
              : visible.length === 0 ? <tr><td colSpan={8} className="loading-row">No complaints found</td></tr>
              : visible.map(c => {
                const cat = CATEGORY[c.category] ?? CATEGORY.others
                const CatIcon = cat.Icon
                return (
                  <tr key={c.id} style={{ cursor: 'pointer' }}>
                    <td style={{ padding: '11px 8px 11px 18px' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: '#f3f4f6', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {c.photoUrl ? <img src={c.photoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <CatIcon size={16} color={cat.color} />}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{c.subIssue || c.customIssue || 'Issue Reported'}</div>
                      <div className="mono">{c.ticketId}</div>
                    </td>
                    <td><span style={{ fontSize: 12, color: cat.color, fontWeight: 700 }}>{cap(c.category)}</span></td>
                    <td><div style={{ fontSize: 12, color: '#374151' }}>{c.building || '—'}</div><div style={{ fontSize: 11, color: '#94a3b8' }}>{c.roomDetail}</div></td>
                    <td><div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{c.submittedByName || '—'}</div><div style={{ fontSize: 11, color: '#94a3b8' }}>{cap(c.submittedByRole)}</div></td>
                    <td><StatusBadge status={c.status} /></td>
                    <td><span style={{ fontSize: 11, color: '#94a3b8' }}>{formatDateShort(c.createdAt)}</span></td>
                    <td><button className="view-btn" onClick={() => setFocused(c)}><Eye size={12} /> View</button></td>
                  </tr>
                )
              })}
          </tbody>
        </table>
        <div className="table-footer"><span className="table-footer-text">Showing {visible.length} of {allComplaints.length} entries</span></div>
      </div>
      {focused && <ComplaintModal complaint={focused} onClose={() => setFocused(null)} />}
    </div>
  )
}

function ComplaintModal({ complaint, onClose }) {
  const cat = CATEGORY[complaint.category] ?? CATEGORY.others
  const CatIcon = cat.Icon
  const stepIndex = COMPLAINT_FLOW.indexOf(complaint.status)
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="cat-icon-wrap" style={{ background: cat.bg, width: 42, height: 42, borderRadius: 11 }}><CatIcon size={20} color={cat.color} /></div>
            <div>
              <div className="modal-title">{complaint.subIssue || complaint.customIssue || 'Issue Reported'}</div>
              <div className="mono" style={{ marginTop: 3 }}>{complaint.ticketId}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <StatusBadge status={complaint.status} />
            <button className="close-btn" onClick={onClose}><X size={14} /></button>
          </div>
        </div>
        <div className="modal-body">
          {complaint.status !== 'rejected' && (
            <div className="progress-bar">
              <div className="progress-bar-label">Progress</div>
              <div className="progress-steps">
                {COMPLAINT_FLOW.map((step, i) => {
                  const done = i <= stepIndex
                  return (
                    <div key={step} className="progress-step">
                      <div className={`progress-dot${done ? ' done' : ''}`}>{done && <CheckCheck size={11} color="#fff" strokeWidth={3} />}</div>
                      {i < COMPLAINT_FLOW.length - 1 && <div className={`progress-line${i < stepIndex ? ' done' : ''}`} />}
                      <div className={`progress-step-label${done ? ' done' : ''}`}>{STATUS[step]?.label}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          <div className="detail-panels">
            {[
              { title: 'Complaint Details', rows: [['Category', cap(complaint.category)], ['Issue', complaint.subIssue || complaint.customIssue], ...(complaint.description ? [['Description', complaint.description]] : []), ['Building', complaint.building], ['Room / Area', complaint.roomDetail], ['Submitted', formatDate(complaint.createdAt)]] },
              { title: 'Reported By', rows: [['Name', complaint.submittedByName], ['Email', complaint.submittedByEmail], ['Phone', complaint.submittedByPhone || '—'], ['Role', cap(complaint.submittedByRole)]] },
              { title: 'Assignment', rows: [['Assigned To', complaint.assignedToName || 'Not yet assigned']] },
            ].map(panel => (
              <div key={panel.title} className="detail-panel">
                <div className="detail-panel-title">{panel.title}</div>
                <div className="detail-rows">
                  {panel.rows.map(([k, v]) => <div key={k} className="detail-row"><span className="detail-key">{k}</span><span className="detail-val">{v || '—'}</span></div>)}
                </div>
              </div>
            ))}
          </div>
          {complaint.photoUrl && (
            <div>
              <div className="photo-section-label">Attached Photo</div>
              <img src={complaint.photoUrl} alt="complaint" onClick={() => window.open(complaint.photoUrl, '_blank')} style={{ width: '100%', maxHeight: 280, objectFit: 'cover', borderRadius: 10, cursor: 'pointer', border: '1px solid #f0f0f0', display: 'block' }} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StaffSection({ items, activeTab, onTabChange, stats, loading, navigate }) {
  const tabs = [
    { key: 'pending',  label: 'Pending',  count: stats.pending },
    { key: 'approved', label: 'Approved', count: stats.approved },
    { key: 'rejected', label: 'Rejected', count: stats.rejected },
  ]
  const miniStats = [
    { label: 'Total Staff',    value: stats.total ?? 0,    color: '#0f172a' },
    { label: 'Pending Review', value: stats.pending ?? 0,  color: '#d97706' },
    { label: 'Approved',       value: stats.approved ?? 0, color: '#059669' },
    { label: 'Rejected',       value: stats.rejected ?? 0, color: '#dc2626' },
  ]
  return (
    <div>
      <SectionHeader title="Maintenance Staff" subtitle="Review and manage maintenance staff verification requests" />
      <div className="stat-grid-4">
        {miniStats.map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Wrench size={18} color={s.color} /></div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color, lineHeight: 1 }}>{loading ? '—' : s.value}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500, marginTop: 3 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="filter-tabs">
        {tabs.map(tab => (
          <button key={tab.key} className={`filter-tab ${activeTab === tab.key ? 'active' : 'inactive'}`} onClick={() => onTabChange(tab.key)}>
            {tab.label}<span className={`tab-count ${activeTab === tab.key ? 'active' : 'inactive'}`}>{tab.count ?? 0}</span>
          </button>
        ))}
      </div>
      {loading ? <div className="loading-row">Loading…</div>
        : items.length === 0 ? <EmptyState icon={ClipboardList} text={`No ${activeTab} applications`} sub="Check back later" />
        : (
          <div className="staff-grid">
            {items.map(member => (
              <div key={member.id} className="member-card">
                <div className="member-card-head">
                  <div className="avatar" style={{ background: '#f0fdf4', color: '#16a34a', borderColor: '#bbf7d0' }}>{member.fullName?.[0]?.toUpperCase() ?? '?'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}><div className="member-name">{member.fullName}</div><div className="member-email">{member.email}</div></div>
                  <StatusBadge verification={member.verificationStatus} />
                </div>
                <div className="member-card-body">
                  {[['Employee ID', member.employeeId], ['Designation', member.designation], ['Experience', member.experience ? `${member.experience} yrs` : null], ['Phone', member.phone]].map(([k, v]) => v ? (
                    <div key={k} className="info-row"><span className="info-key">{k}</span><span className="info-val">{v}</span></div>
                  ) : null)}
                </div>
                <div className="member-card-foot">
                  <button className="full-btn" onClick={() => navigate(`/staff/${member.id}`)}>View Full Profile <ArrowRight size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}

function UsersSection({ items, activeTab, onTabChange, stats, loading }) {
  const [idCardUser, setIdCardUser]       = useState(null)
  const [idCardData, setIdCardData]       = useState(null)
  const [idCardLoading, setIdCardLoading] = useState(false)
  const [previewUrl, setPreviewUrl]       = useState(null)

  const viewIdCard = async (user) => {
    setIdCardUser(user); setIdCardData(null); setIdCardLoading(true)
    try { const res = await adminAPI.getUserIdCard(user.id); setIdCardData(res.data.idCard) }
    catch {} finally { setIdCardLoading(false) }
  }

  const tabs = [
    { key: 'student', label: 'Students', count: stats.students },
    { key: 'teacher', label: 'Teachers', count: stats.teachers },
  ]

  return (
    <div>
      <SectionHeader title="Staff & Users" subtitle="All registered students and teachers on the platform" />
      <div style={{ display: 'flex', gap: 14, marginBottom: 24 }}>
        {[{ label: 'Students', value: stats.students ?? 0, color: '#6366f1', Icon: GraduationCap }, { label: 'Teachers', value: stats.teachers ?? 0, color: '#0ea5e9', Icon: BookUser }].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 12, padding: '16px 24px', border: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 11, background: s.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><s.Icon size={20} color={s.color} /></div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color, lineHeight: 1 }}>{loading ? '—' : s.value}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500, marginTop: 3 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="filter-tabs">
        {tabs.map(tab => (
          <button key={tab.key} className={`filter-tab ${activeTab === tab.key ? 'active' : 'inactive'}`} onClick={() => onTabChange(tab.key)}>
            {tab.label}<span className={`tab-count ${activeTab === tab.key ? 'active' : 'inactive'}`}>{tab.count ?? 0}</span>
          </button>
        ))}
      </div>
      {loading ? <div className="loading-row">Loading…</div>
        : items.length === 0 ? <EmptyState icon={activeTab === 'student' ? GraduationCap : BookUser} text={`No ${activeTab}s registered yet`} />
        : (
          <div className="user-grid">
            {items.map(user => {
              const isStudent   = user.role === 'student'
              const accentColor = isStudent ? '#6366f1' : '#0ea5e9'
              return (
                <div key={user.id} className="member-card">
                  <div className="user-top-accent" style={{ background: accentColor }} />
                  <div style={{ padding: '15px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                      <div className="avatar" style={{ background: isStudent ? '#ede9fe' : '#dbeafe', color: accentColor, borderColor: isStudent ? '#c4b5fd' : '#93c5fd' }}>{user.fullName?.[0]?.toUpperCase() ?? '?'}</div>
                      <div style={{ flex: 1, minWidth: 0 }}><div className="member-name">{user.fullName || '—'}</div><div className="member-email">{user.email}</div></div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 13 }}>
                      {user.gender && <div className="info-row"><span className="info-key">Gender</span><span className="info-val">{user.gender}</span></div>}
                      {isStudent ? (<>{user.year && <div className="info-row"><span className="info-key">Year</span><span className="info-val">{user.year}</span></div>}{user.branch && <div className="info-row"><span className="info-key">Branch</span><span className="info-val">{user.branch}</span></div>}</>) : (user.department && <div className="info-row"><span className="info-key">Department</span><span className="info-val">{user.department}</span></div>)}
                      {user.phone && <div className="info-row"><span className="info-key">Phone</span><span className="info-val">{user.phone}</span></div>}
                    </div>
                    <button className="full-btn outline" onClick={() => viewIdCard(user)}><IdCard size={14} /> View ID Card</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      {idCardUser && (
        <div className="modal-overlay" onClick={() => { setIdCardUser(null); setIdCardData(null) }}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div className="modal-title">ID Card — {idCardUser.fullName}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>{idCardUser.role === 'student' ? <GraduationCap size={12} /> : <BookUser size={12} />} {cap(idCardUser.role)}</div>
              </div>
              <button className="close-btn" onClick={() => { setIdCardUser(null); setIdCardData(null) }}><X size={14} /></button>
            </div>
            <div style={{ padding: 22 }}>
              {idCardLoading ? <div className="loading-row">Loading…</div>
                : idCardData ? (() => {
                  const url = idCardData.studentIdCardUrl || idCardData.teacherIdCardUrl
                  return url ? (
                    <div>
                      <div className="id-card-preview-wrap" onClick={() => setPreviewUrl(url)}>
                        <img src={url} alt="ID Card" style={{ width: '100%', maxHeight: 280, objectFit: 'contain', display: 'block', background: '#f9fafb' }} />
                        <div className="id-card-preview-overlay"><Eye size={14} /> Enlarge</div>
                      </div>
                      <button className="full-btn" onClick={() => setPreviewUrl(url)}><Eye size={14} /> View Full Size</button>
                    </div>
                  ) : <div className="loading-row">No ID card uploaded yet</div>
                })() : <div className="loading-row">No ID card found</div>}
            </div>
          </div>
        </div>
      )}

      {previewUrl && (
        <div className="preview-fullscreen-overlay" onClick={() => setPreviewUrl(null)}>
          <div className="preview-fullscreen-inner" onClick={e => e.stopPropagation()}>
            <div className="preview-fullscreen-head">
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>ID Card Preview</span>
              <button className="close-btn" onClick={() => setPreviewUrl(null)}><X size={14} /></button>
            </div>
            <div className="preview-fullscreen-body">
              <img src={previewUrl} alt="ID Card" style={{ maxWidth: '80vw', maxHeight: '80vh', objectFit: 'contain', display: 'block', padding: 8 }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function IdCardsSection({ requests, loading, onRefresh }) {
  const [actionLoading, setActionLoading] = useState(null)
  const [rejectModal, setRejectModal]     = useState(null)
  const [rejectReason, setRejectReason]   = useState('')
  const [previewUrl, setPreviewUrl]       = useState(null)

  const pendingRequests   = requests.filter(r => r.status === 'pending')
  const processedRequests = requests.filter(r => r.status !== 'pending')

  const handleApprove = async (requestId) => {
    setActionLoading(requestId)
    try { await adminAPI.approveIdCard(requestId); onRefresh() }
    catch {} finally { setActionLoading(null) }
  }

  const handleReject = async () => {
    if (!rejectModal) return
    setActionLoading(rejectModal)
    try { await adminAPI.rejectIdCard(rejectModal, rejectReason); setRejectModal(null); setRejectReason(''); onRefresh() }
    catch {} finally { setActionLoading(null) }
  }

  return (
    <div>
      <SectionHeader title="ID Card Requests" subtitle="Review and approve or reject ID card update requests from students and teachers" />
      {loading ? <div className="loading-row">Loading…</div>
        : pendingRequests.length === 0 ? <EmptyState icon={CreditCard} text="No pending ID card requests" sub="All requests have been processed" />
        : (
          <div className="pending-grid">
            {pendingRequests.map(req => (
              <div key={req.id} className="pending-card yellow">
                <div className="pending-card-head">
                  <div className="pending-icon yellow"><CreditCard size={18} color="#d97706" /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{req.fullName}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{req.email} · {cap(req.role)}</div>
                  </div>
                  <span className="status-badge" style={{ background: '#fef3c7', color: '#d97706', borderColor: '#fde68a' }}><Clock size={9} style={{ flexShrink: 0 }} /> Pending</span>
                </div>
                <div className="pending-card-body">
                  {req.newIdCardUrl && (
                    <div style={{ marginBottom: 12 }}>
                      <div className="id-card-label">New ID Card</div>
                      <div className="id-card-preview-wrap" onClick={() => setPreviewUrl(req.newIdCardUrl)}>
                        <img src={req.newIdCardUrl} alt="New ID" style={{ width: '100%', height: 150, objectFit: 'contain', background: '#f9fafb', display: 'block' }} />
                        <div className="id-card-preview-overlay"><Eye size={13} /> Preview</div>
                      </div>
                    </div>
                  )}
                  <div className="req-date">Requested: {formatDateShort(req.requestedAt)}</div>
                  <div className="btn-row">
                    <button className="action-btn approve" onClick={() => handleApprove(req.id)} disabled={actionLoading === req.id}>
                      {actionLoading === req.id ? <Loader2 size={14} className="spin" /> : <CheckCircle2 size={14} />} Approve
                    </button>
                    <button className="action-btn reject" onClick={() => { setRejectModal(req.id); setRejectReason('') }}>
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
          <div className="section-divider">Processed Requests</div>
          <div className="processed-list">
            {processedRequests.map(req => (
              <div key={req.id} className="processed-row">
                <div style={{ flex: 1 }}><span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{req.fullName}</span><span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 8 }}>{req.email}</span></div>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>{formatDateShort(req.processedAt)}</span>
                <span className="status-badge" style={req.status === 'approved' ? { background: '#d1fae5', color: '#059669', borderColor: '#6ee7b7' } : { background: '#fee2e2', color: '#dc2626', borderColor: '#fca5a5' }}>
                  <span className="status-dot" style={{ background: req.status === 'approved' ? '#10b981' : '#ef4444' }} />
                  {req.status === 'approved' ? 'Approved' : 'Rejected'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {rejectModal && (
        <div className="modal-overlay" onClick={() => setRejectModal(null)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div><div className="modal-title">Reject ID Card Request</div><div className="modal-sub">Optionally provide a reason</div></div>
              <button className="close-btn" onClick={() => setRejectModal(null)}><X size={14} /></button>
            </div>
            <div style={{ padding: 22 }}>
              <textarea className="modal-input" value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason (optional)…" />
              <div className="btn-row" style={{ marginTop: 14 }}>
                <button className="full-btn outline" onClick={() => setRejectModal(null)}>Cancel</button>
                <button className="full-btn red" onClick={handleReject} disabled={!!actionLoading}>
                  {actionLoading ? <Loader2 size={14} className="spin" /> : <XCircle size={14} />} Confirm Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewUrl && (
        <div className="preview-fullscreen-overlay" onClick={() => setPreviewUrl(null)}>
          <div className="preview-fullscreen-inner" onClick={e => e.stopPropagation()}>
            <div className="preview-fullscreen-head"><span style={{ fontSize: 14, fontWeight: 700 }}>ID Card Preview</span><button className="close-btn" onClick={() => setPreviewUrl(null)}><X size={14} /></button></div>
            <div className="preview-fullscreen-body"><img src={previewUrl} alt="Preview" style={{ maxWidth: '80vw', maxHeight: '80vh', objectFit: 'contain', display: 'block', padding: 8 }} /></div>
          </div>
        </div>
      )}
    </div>
  )
}

function DeletionsSection({ data, loading, onRefresh }) {
  const [actionLoading, setActionLoading] = useState(null)
  const [rejectModal, setRejectModal]     = useState(null)
  const [rejectReason, setRejectReason]   = useState('')

  const staffRequests  = data.staffRequests  ?? []
  const userDeletions  = data.userDeletions  ?? []
  const pendingStaff   = staffRequests.filter(r => r.status === 'pending')
  const processedStaff = staffRequests.filter(r => r.status !== 'pending')

  const handleApprove = async (requestId) => {
    setActionLoading(requestId)
    try { await adminAPI.approveDeletion(requestId); onRefresh() }
    catch {} finally { setActionLoading(null) }
  }

  const handleReject = async () => {
    if (!rejectModal) return
    setActionLoading(rejectModal)
    try { await adminAPI.rejectDeletion(rejectModal, rejectReason); setRejectModal(null); setRejectReason(''); onRefresh() }
    catch {} finally { setActionLoading(null) }
  }

  return (
    <div>
      <SectionHeader title="Account Deletions" subtitle="Monitor student/teacher deletions and approve or reject staff deletion requests" />
      <div className="two-col">
        <div>
          <div className="sub-section-title"><Wrench size={15} color="#dc2626" /> Staff Deletion Requests<span className="sub-section-badge" style={{ background: '#fef2f2', color: '#dc2626' }}>Action Required</span></div>
          {loading ? <div style={{ color: '#9ca3af', padding: 16, fontSize: 13 }}>Loading…</div>
            : pendingStaff.length === 0 ? <EmptyState icon={CheckCircle2} text="No pending staff deletion requests" />
            : pendingStaff.map(req => (
              <div key={req.id} className="deletion-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div className="pending-icon red"><Trash2 size={16} color="#dc2626" /></div>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{req.fullName}</div><div style={{ fontSize: 11, color: '#94a3b8' }}>{req.email} · {req.designation}</div></div>
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 12 }}>Requested: {formatDate(req.requestedAt)}</div>
                <div className="btn-row">
                  <button className="action-btn delete" onClick={() => handleApprove(req.id)} disabled={actionLoading === req.id}>
                    {actionLoading === req.id ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />} Delete Account
                  </button>
                  <button className="action-btn keep" onClick={() => { setRejectModal(req.id); setRejectReason('') }}><Lock size={13} /> Keep Account</button>
                </div>
              </div>
            ))}
          {processedStaff.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div className="section-divider" style={{ fontSize: 12 }}>Processed</div>
              <div className="processed-list">
                {processedStaff.map(req => (
                  <div key={req.id} className="processed-row muted">
                    <div style={{ flex: 1 }}><span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{req.fullName}</span></div>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{formatDateShort(req.processedAt)}</span>
                    <span className="status-badge" style={req.status === 'approved' ? { background: '#fee2e2', color: '#dc2626', borderColor: '#fca5a5' } : { background: '#d1fae5', color: '#059669', borderColor: '#6ee7b7' }}>
                      <span className="status-dot" style={{ background: req.status === 'approved' ? '#ef4444' : '#10b981' }} />
                      {req.status === 'approved' ? 'Deleted' : 'Kept'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div>
          <div className="sub-section-title"><User size={15} color="#6b7280" /> Student / Teacher Deletions<span className="sub-section-badge" style={{ background: '#f3f4f6', color: '#6b7280' }}>Info only</span></div>
          {loading ? <div style={{ color: '#9ca3af', padding: 16, fontSize: 13 }}>Loading…</div>
            : userDeletions.length === 0 ? <EmptyState icon={Users} text="No account deletions yet" />
            : (
              <div className="processed-list">
                {userDeletions.map(log => (
                  <div key={log.id} className="processed-row">
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: log.role === 'student' ? '#ede9fe' : '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {log.role === 'student' ? <GraduationCap size={14} color="#6366f1" /> : <BookUser size={14} color="#0ea5e9" />}
                    </div>
                    <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{log.fullName}</div><div style={{ fontSize: 11, color: '#94a3b8' }}>{log.email} · {cap(log.role)}</div></div>
                    <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'right' }}>{formatDate(log.deletedAt)}</div>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>

      {rejectModal && (
        <div className="modal-overlay" onClick={() => setRejectModal(null)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div><div className="modal-title">Keep Account</div><div className="modal-sub">Provide a reason for rejecting the deletion request</div></div>
              <button className="close-btn" onClick={() => setRejectModal(null)}><X size={14} /></button>
            </div>
            <div style={{ padding: 22 }}>
              <textarea className="modal-input" value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason (optional)…" />
              <div className="btn-row" style={{ marginTop: 14 }}>
                <button className="full-btn outline" onClick={() => setRejectModal(null)}>Cancel</button>
                <button className="full-btn green" onClick={handleReject} disabled={!!actionLoading}>
                  {actionLoading ? <Loader2 size={14} className="spin" /> : <CheckCircle2 size={14} />} Keep Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SecuritySection({ issues, loading, onRefresh }) {
  const [actionLoading, setActionLoading] = useState(null)
  const [resolveModal, setResolveModal]   = useState(null)
  const [resolution, setResolution]       = useState('')

  const openIssues     = issues.filter(i => i.status === 'open')
  const resolvedIssues = issues.filter(i => i.status === 'resolved')

  const handleResolve = async () => {
    if (!resolveModal) return
    setActionLoading(resolveModal)
    try { await adminAPI.resolveSecurityIssue(resolveModal, resolution); setResolveModal(null); setResolution(''); onRefresh() }
    catch {} finally { setActionLoading(null) }
  }

  return (
    <div>
      <SectionHeader title="Security Issues" subtitle="Review and resolve security issues reported by users" />
      {loading ? <div className="loading-row">Loading…</div>
        : openIssues.length === 0 ? <EmptyState icon={ShieldAlert} text="No open security issues" sub="All issues have been resolved" />
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
            {openIssues.map(issue => (
              <div key={issue.id} className="security-open-card">
                <div className="security-issue-head">
                  <div className="security-icon"><ShieldAlert size={20} color="#d97706" /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span className="security-type">{issue.issueType}</span>
                      <span className="open-badge"><AlertTriangle size={9} /> Open</span>
                    </div>
                    <div className="security-desc">{issue.description}</div>
                    <div className="security-meta">Reported by <strong style={{ color: '#374151' }}>{issue.fullName}</strong> ({cap(issue.role)}) · {issue.email} · {formatDateShort(issue.reportedAt)}</div>
                  </div>
                </div>
                <button className="action-btn resolve" style={{ border: 'none' }} onClick={() => { setResolveModal(issue.id); setResolution('') }}>
                  <CheckCircle2 size={14} /> Mark as Resolved
                </button>
              </div>
            ))}
          </div>
        )}

      {resolvedIssues.length > 0 && (
        <>
          <div className="section-divider">Resolved Issues</div>
          <div className="processed-list">
            {resolvedIssues.map(issue => (
              <div key={issue.id} className="processed-row muted" style={{ alignItems: 'flex-start', padding: '13px 16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 2 }}>{issue.issueType}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>{issue.fullName} · {formatDateShort(issue.reportedAt)}</div>
                  {issue.resolution && <div style={{ fontSize: 12, color: '#059669', marginTop: 4 }}>Resolution: {issue.resolution}</div>}
                </div>
                <span className="resolved-badge"><CheckCircle2 size={10} /> Resolved</span>
              </div>
            ))}
          </div>
        </>
      )}

      {resolveModal && (
        <div className="modal-overlay" onClick={() => setResolveModal(null)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div><div className="modal-title">Resolve Security Issue</div><div className="modal-sub">Add a resolution note (optional)</div></div>
              <button className="close-btn" onClick={() => setResolveModal(null)}><X size={14} /></button>
            </div>
            <div style={{ padding: 22 }}>
              <textarea className="modal-input" value={resolution} onChange={e => setResolution(e.target.value)} placeholder="Describe how this was resolved…" />
              <div className="btn-row" style={{ marginTop: 14 }}>
                <button className="full-btn outline" onClick={() => setResolveModal(null)}>Cancel</button>
                <button className="full-btn green" onClick={handleResolve} disabled={!!actionLoading}>
                  {actionLoading ? <Loader2 size={14} className="spin" /> : <CheckCircle2 size={14} />} Mark Resolved
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}