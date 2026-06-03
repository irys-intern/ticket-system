export enum UserRole {
  USER = 'user',
  AGENT = 'agent',
  ADMIN = 'admin',
}

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  REOPENED = 'reopened',
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TicketCategory {
  BUG = 'bug',
  FEATURE_REQUEST = 'feature_request',
  SUPPORT = 'support',
  OTHER = 'other',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  createdBy: string;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  ticketId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditEvent {
  id: string;
  ticketId: string;
  userId: string;
  action: string;
  changes?: Record<string, unknown>;
  createdAt: Date;
}

export interface Assignment {
  id: string;
  ticketId: string;
  userId: string;
  assignedAt: Date;
}
