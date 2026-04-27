export const CATEGORY = {
  electrical: { Icon: null, color: '#f59e0b', bg: '#fef3c7' },
  plumbing: { Icon: null, color: '#3b82f6', bg: '#dbeafe' },
  carpentry: { Icon: null, color: '#ec4899', bg: '#fce7f3' },
  cleaning: { Icon: null, color: '#10b981', bg: '#d1fae5' },
  technician: { Icon: null, color: '#8b5cf6', bg: '#ede9fe' },
  safety: { Icon: null, color: '#ef4444', bg: '#fee2e2' },
  washroom: { Icon: null, color: '#0ea5e9', bg: '#e0f2fe' },
  others: { Icon: null, color: '#6b7280', bg: '#f3f4f6' },
}

export const STATUS = {
  pending: { label: 'Pending', color: '#d97706', bg: '#fef3c7', border: '#fde68a', dot: '#f59e0b' },
  assigned: { label: 'Assigned', color: '#2563eb', bg: '#dbeafe', border: '#93c5fd', dot: '#3b82f6' },
  in_progress: { label: 'In Progress', color: '#7c3aed', bg: '#ede9fe', border: '#c4b5fd', dot: '#8b5cf6' },
  completed: { label: 'Completed', color: '#059669', bg: '#d1fae5', border: '#6ee7b7', dot: '#10b981' },
  rejected: { label: 'Rejected', color: '#dc2626', bg: '#fee2e2', border: '#fca5a5', dot: '#ef4444' },
}

export const VERIFICATION = {
  pending: { label: 'Pending', color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
  approved: { label: 'Approved', color: '#059669', bg: '#d1fae5', border: '#6ee7b7' },
  rejected: { label: 'Rejected', color: '#dc2626', bg: '#fee2e2', border: '#fca5a5' },
}

export const COMPLAINT_FLOW = ['pending', 'assigned', 'in_progress', 'completed']