export type UserStatus = 'active' | 'inactive';

export interface DepartmentAssignment {
  departmentId: string;
  positionId: string;
  roleId: string;
}

export interface User {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  loginIdentifier: string; // e.g. admin@system-gtra.org or fSiximba@system-gtra.org
  passwordHash: string;
  mustChangePassword: boolean;
  status: UserStatus;
  departmentAssignments: DepartmentAssignment[];
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  categoryDomain: string; // e.g. "system-gtra.org", "finance-gtra.org", "worship-gtra.org", etc.
  description: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Position {
  id: string;
  title: string;
  departmentId: string;
  defaultRoleId: string;
  description: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

export interface Member {
  id: string;
  userId?: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  membershipStatus: 'active' | 'inquiry' | 'visitor';
  joinDate: string;
  baptismDate?: string;
  ministryInterests: string[];
  pastoralNotes?: string;
}

export interface FinancialTransaction {
  id: string;
  date: string;
  type: 'tithe' | 'offering' | 'donation' | 'expense' | 'project';
  category: string;
  amount: number;
  currency: 'USD' | 'ZAR';
  description: string;
  recordedBy: string; // user id
  recordedByName: string;
  donorName?: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  receiptNumber: string;
}

export interface WorshipSong {
  title: string;
  key: string;
  lead: string;
}

export interface WorshipRosterMember {
  memberId: string;
  name: string;
  role: 'Worship Leader' | 'Choir Director' | 'Vocalist' | 'Keys' | 'Drums' | 'Bass' | 'Guitar' | 'Choir Member' | 'Sound Tech';
  status: 'confirmed' | 'pending' | 'declined';
}

export interface WorshipSchedule {
  id: string;
  title: string;
  type: 'rehearsal' | 'sunday_service' | 'special_event';
  date: string;
  time: string;
  venue: string;
  recurrence: 'none' | 'weekly' | 'biweekly';
  songs: WorshipSong[];
  roster: WorshipRosterMember[];
  notes: string;
  attendanceRecorded?: boolean;
  attendedMembers?: string[];
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userIdentifier: string;
  action: string;
  details: Record<string, any>;
  ipAddress?: string;
}

export interface DatabaseSchema {
  users: User[];
  departments: Department[];
  positions: Position[];
  roles: Role[];
  members: Member[];
  transactions: FinancialTransaction[];
  worshipSchedules: WorshipSchedule[];
  auditLogs: AuditLog[];
}
