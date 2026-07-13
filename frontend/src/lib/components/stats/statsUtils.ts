import type { Ticket } from '../../../types/index.ts';

export const STATUS_COLORS: Record<string, string> = {
  open: '#3b82f6',
  in_progress: '#f97316',
  waiting_for_response: '#a855f7',
  resolved: '#22c55e',
  closed: '#6b7280',
};

export const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  waiting_for_response: 'Waiting',
  resolved: 'Resolved',
  closed: 'Closed',
};

export const STATUSES = ['open', 'in_progress', 'waiting_for_response', 'resolved', 'closed'] as const;
export type Status = (typeof STATUSES)[number];

export const AGENT_LINE_COLORS = ['#3b82f6', '#f97316', '#a855f7', '#22c55e', '#ec4899', '#14b8a6', '#eab308', '#ef4444'];

export const PRIORITY_ORDER: Record<string, number> = { low: 0, medium: 1, high: 2, critical: 3 };
export const CATEGORY_ORDER: Record<string, number> = { bug: 0, feature_request: 1, support: 2, other: 3 };
export const PRIORITY_LABELS = ['Low', 'Medium', 'High', 'Critical'];
export const CATEGORY_LABELS = ['Bug', 'Feature Req.', 'Support', 'Other'];

export const PRIORITY_COLORS: Record<string, string> = { low: '#22c55e', medium: '#f97316', high: '#ef4444', critical: '#dc2626' };
export const CATEGORY_COLORS: Record<string, string> = { bug: '#ef4444', feature_request: '#3b82f6', support: '#a855f7', other: '#6b7280' };
export const PRIORITY_ITEMS = ['critical', 'high', 'medium', 'low'] as const;
export const CATEGORY_ITEMS = ['bug', 'feature_request', 'support', 'other'] as const;
export const PRIORITY_DISPLAY: Record<string, string> = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' };
export const CATEGORY_DISPLAY: Record<string, string> = { bug: 'Bug', feature_request: 'Feature Req.', support: 'Support', other: 'Other' };

// Resolution time can never be negative; clamp away any clock-skew artifacts in the data.
export function resolutionMs(t: Ticket): number {
  return Math.max(0, new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime());
}

export function monthKey(d: Date | string): string {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
}

export function monthLabel(key: string): string {
  const [y, m] = key.split('-');
  return new Date(Number(y), Number(m) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export function fmtDays(days: number | null): string {
  if (days === null) return '—';
  if (days < 1) return `${Math.round(days * 24)}h`;
  return `${days.toFixed(1)}d`;
}

export function labelStep(n: number): number {
  return n <= 6 ? 1 : n <= 12 ? 2 : n <= 24 ? 3 : 6;
}
