import { Department, Position, Role } from './types';

export const INITIAL_ROLES: Role[] = [
  {
    id: 'system_admin',
    name: 'System Administrator',
    description: 'Full administrative access across staff, departments, technical settings, and audit logs.',
    permissions: [
      'users.view', 'users.create', 'users.update', 'users.deactivate',
      'departments.manage',
      'members.view', 'members.create', 'members.update', 'members.deactivate',
      'finance.transactions.view', 'finance.transactions.create', 'finance.transactions.approve', 'finance.reports.view', 'finance.reconciliation.manage',
      'worship.schedule.view', 'worship.schedule.manage', 'worship.members.manage', 'worship.attendance.manage',
      'announcements.create', 'announcements.approve',
      'events.manage',
      'reports.view',
      'pastoral_care.view'
    ]
  },
  {
    id: 'senior_pastor',
    name: 'Senior Pastor',
    description: 'Spiritual shepherd overseeing ministries, member records, pastoral care, and church-wide reports.',
    permissions: [
      'members.view', 'members.create', 'members.update',
      'pastoral_care.view',
      'announcements.create', 'announcements.approve',
      'events.manage',
      'reports.view',
      'worship.schedule.view'
    ]
  },
  {
    id: 'assistant_pastor_elder',
    name: 'Assistant Pastor & Elder',
    description: 'Assisting in pastoral visitation, church member care, and delegated ministry oversight.',
    permissions: [
      'members.view',
      'pastoral_care.view',
      'announcements.create',
      'worship.schedule.view',
      'events.manage'
    ]
  },
  {
    id: 'church_admin',
    name: 'Church Administrator',
    description: 'Manages member registrations, church records, scheduling, and administrative reports.',
    permissions: [
      'users.view',
      'members.view', 'members.create', 'members.update',
      'announcements.create', 'announcements.approve',
      'events.manage',
      'reports.view'
    ]
  },
  {
    id: 'cfo',
    name: 'Chief Financial Officer (CFO)',
    description: 'Oversees church budgets, financial audits, transaction approval, and fiscal reporting.',
    permissions: [
      'finance.transactions.view', 'finance.transactions.create', 'finance.transactions.approve',
      'finance.reports.view', 'finance.reconciliation.manage',
      'reports.view'
    ]
  },
  {
    id: 'treasurer',
    name: 'Treasurer',
    description: 'Records church income, tithes, offerings, donations, expenses, and reconciles bank deposits.',
    permissions: [
      'finance.transactions.view', 'finance.transactions.create',
      'finance.reports.view', 'finance.reconciliation.manage'
    ]
  },
  {
    id: 'tithes_officer',
    name: 'Tithes and Offerings Officer',
    description: 'Records donor contributions, calculates tallies, and generates giving summaries.',
    permissions: [
      'finance.transactions.view', 'finance.transactions.create'
    ]
  },
  {
    id: 'finance_auditor',
    name: 'Finance Auditor',
    description: 'Read-only review of original transactions, ledgers, reconciliations, and audit trails.',
    permissions: [
      'finance.transactions.view', 'finance.reports.view', 'reports.view'
    ]
  },
  {
    id: 'worship_manager',
    name: 'Worship Team Manager',
    description: 'Coordinates worship rehearsals, sets dates/times, assigns musicians/vocalists, and tracks attendance.',
    permissions: [
      'worship.schedule.view', 'worship.schedule.manage',
      'worship.members.manage', 'worship.attendance.manage',
      'announcements.create',
      'reports.view'
    ]
  },
  {
    id: 'worship_leader_choir',
    name: 'Worship Leader & Choir Director',
    description: 'Prepares song repertoire, conducts rehearsals, and coordinates vocal/instrumental teams.',
    permissions: [
      'worship.schedule.view', 'worship.schedule.manage',
      'worship.attendance.manage'
    ]
  },
  {
    id: 'media_manager',
    name: 'Media Manager',
    description: 'Oversees audio/visual production, livestream operations, and public church announcements.',
    permissions: [
      'events.manage', 'announcements.create', 'announcements.approve'
    ]
  },
  {
    id: 'youth_children_leader',
    name: 'Youth & Children Ministry Leader',
    description: 'Coordinates youth and children programs, safe attendance, and parental notices.',
    permissions: [
      'members.view', 'events.manage', 'announcements.create', 'reports.view'
    ]
  },
  {
    id: 'department_leader',
    name: 'Department Leader',
    description: 'Coordinates departmental activities, schedules, and ministry volunteers.',
    permissions: [
      'events.manage', 'announcements.create', 'reports.view'
    ]
  },
  {
    id: 'church_member',
    name: 'Church Member',
    description: 'Registered church member with access to member services, appointment booking, and giving.',
    permissions: []
  }
];

export const INITIAL_DEPARTMENTS: Department[] = [
  {
    id: 'dept-leadership',
    name: 'Church Leadership',
    code: 'LEADERSHIP',
    categoryDomain: 'pastor-gtra.org',
    description: 'Pastoral shepherding, spiritual guidance, eldership, and doctrinal oversight.',
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'dept-admin',
    name: 'Administration',
    code: 'ADMIN',
    categoryDomain: 'admin-gtra.org',
    description: 'Secretariat, office management, church membership records, and central correspondence.',
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'dept-finance',
    name: 'Finance',
    code: 'FINANCE',
    categoryDomain: 'finance-gtra.org',
    description: 'Treasury, tithes & offerings recording, fiscal compliance, and financial reporting.',
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'dept-worship',
    name: 'Worship and Praise',
    code: 'WORSHIP',
    categoryDomain: 'worship-gtra.org',
    description: 'Music ministry, choir, instrumentalists, and service liturgy leadership.',
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'dept-media',
    name: 'Media and Communications',
    code: 'MEDIA',
    categoryDomain: 'media-gtra.org',
    description: 'Sound engineering, livestream broadcast, photography, and digital communication.',
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'dept-youth',
    name: 'Youth Ministry',
    code: 'YOUTH',
    categoryDomain: 'youth-gtra.org',
    description: 'Youth discipleship, Friday fellowships, campus outreach, and young adults.',
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'dept-children',
    name: 'Children Ministry',
    code: 'CHILDREN',
    categoryDomain: 'leader-gtra.org',
    description: 'Sunday School, Bible foundational classes, and child protection.',
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'dept-women',
    name: "Women's Fellowship",
    code: 'WOMEN',
    categoryDomain: 'leader-gtra.org',
    description: 'Mothers union, prayer vigils, mentorship, and home building seminars.',
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'dept-men',
    name: "Men's Fellowship",
    code: 'MEN',
    categoryDomain: 'leader-gtra.org',
    description: 'Fathers in Christ, brotherhood meetings, and community service.',
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'dept-prayer',
    name: 'Prayer and Intercession',
    code: 'PRAYER',
    categoryDomain: 'leader-gtra.org',
    description: 'Midweek prayer altar, 24/7 intercession chain, and fasting periods.',
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'dept-outreach',
    name: 'Evangelism and Missions',
    code: 'OUTREACH',
    categoryDomain: 'leader-gtra.org',
    description: 'Edwaleni community evangelism, hospital visits, and missionary support.',
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'dept-hospitality',
    name: 'Protocol and Ushers',
    code: 'HOSPITALITY',
    categoryDomain: 'admin-gtra.org',
    description: 'Sanctuary welcoming, order of service ushering, and VIP dignitary care.',
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'dept-facilities',
    name: 'Facilities and Logistics',
    code: 'FACILITIES',
    categoryDomain: 'admin-gtra.org',
    description: 'Church sanctuary property, groundskeeping, equipment maintenance, and security.',
    status: 'active',
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_POSITIONS: Position[] = [
  // Church Leadership
  { id: 'pos-senior-pastor', title: 'Senior Pastor', departmentId: 'dept-leadership', defaultRoleId: 'senior_pastor', description: 'Chief spiritual shepherd and vision holder of GTRA.' },
  { id: 'pos-assistant-pastor', title: 'Assistant Pastor', departmentId: 'dept-leadership', defaultRoleId: 'assistant_pastor_elder', description: 'Assisting pastor in pulpit ministry and member visitation.' },
  { id: 'pos-church-elder', title: 'Church Elder', departmentId: 'dept-leadership', defaultRoleId: 'assistant_pastor_elder', description: 'Church elder providing counsel and doctrinal governance.' },
  
  // Administration
  { id: 'pos-church-admin', title: 'Church Administrator', departmentId: 'dept-admin', defaultRoleId: 'church_admin', description: 'Oversees daily church operations, schedules, and staff.' },
  { id: 'pos-church-secretary', title: 'Church Secretary', departmentId: 'dept-admin', defaultRoleId: 'church_admin', description: 'Coordinates official church documentation, records, and minutes.' },
  { id: 'pos-admin-assistant', title: 'Administrative Assistant', departmentId: 'dept-admin', defaultRoleId: 'church_admin', description: 'Assists with reception, notices, and member inquiries.' },

  // Finance
  { id: 'pos-cfo', title: 'Chief Financial Officer (CFO)', departmentId: 'dept-finance', defaultRoleId: 'cfo', description: 'Strategic financial director and transaction approver.' },
  { id: 'pos-treasurer', title: 'Treasurer', departmentId: 'dept-finance', defaultRoleId: 'treasurer', description: 'Custodian of bank accounts, tithes, and operating budgets.' },
  { id: 'pos-finance-officer', title: 'Finance Officer', departmentId: 'dept-finance', defaultRoleId: 'treasurer', description: 'Handles vouchers, accounts payable, and receipts.' },
  { id: 'pos-tithes-officer', title: 'Tithes and Offerings Officer', departmentId: 'dept-finance', defaultRoleId: 'tithes_officer', description: 'Reconciles service collections and individual envelopes.' },
  { id: 'pos-finance-auditor', title: 'Finance Auditor', departmentId: 'dept-finance', defaultRoleId: 'finance_auditor', description: 'Independent auditor conducting read-only inspections.' },

  // Worship & Praise
  { id: 'pos-worship-manager', title: 'Worship Team Manager', departmentId: 'dept-worship', defaultRoleId: 'worship_manager', description: 'Coordinates rehearsal dates, roster assignments, and attendance.' },
  { id: 'pos-worship-leader', title: 'Worship Leader', departmentId: 'dept-worship', defaultRoleId: 'worship_leader_choir', description: 'Leads congregation in praise and adoration.' },
  { id: 'pos-choir-director', title: 'Choir Director', departmentId: 'dept-worship', defaultRoleId: 'worship_leader_choir', description: 'Directs choir vocal harmonies and rehearsals.' },
  { id: 'pos-musician', title: 'Musician', departmentId: 'dept-worship', defaultRoleId: 'worship_leader_choir', description: 'Instrumentalist serving on keys, drums, bass, or guitar.' },
  { id: 'pos-choir-member', title: 'Choir Member', departmentId: 'dept-worship', defaultRoleId: 'worship_leader_choir', description: 'Vocalist serving in the mass or praise choir.' },

  // Media
  { id: 'pos-media-manager', title: 'Media Manager', departmentId: 'dept-media', defaultRoleId: 'media_manager', description: 'Directs church broadcast, media team, and audiovisual systems.' },
  { id: 'pos-sound-tech', title: 'Sound Technician', departmentId: 'dept-media', defaultRoleId: 'media_manager', description: 'Operates front-of-house sound console and monitor feeds.' },
  { id: 'pos-livestream-operator', title: 'Livestream Operator', departmentId: 'dept-media', defaultRoleId: 'media_manager', description: 'Broadcasts Sunday services to online congregants.' },
  { id: 'pos-photographer', title: 'Photographer/Videographer', departmentId: 'dept-media', defaultRoleId: 'media_manager', description: 'Documents church milestones, conferences, and baptisms.' },
  { id: 'pos-comm-officer', title: 'Communications Officer', departmentId: 'dept-media', defaultRoleId: 'media_manager', description: 'Prepares weekly bulletins, press releases, and announcements.' },

  // Other Ministries
  { id: 'pos-youth-leader', title: 'Youth Leader', departmentId: 'dept-youth', defaultRoleId: 'youth_children_leader', description: 'Directs youth fellowship, mentorship, and camps.' },
  { id: 'pos-children-leader', title: "Children's Ministry Leader", departmentId: 'dept-children', defaultRoleId: 'youth_children_leader', description: 'Coordinates Sunday school and child spiritual development.' },
  { id: 'pos-women-leader', title: "Women's Ministry Leader", departmentId: 'dept-women', defaultRoleId: 'department_leader', description: 'Leads the women of faith fellowship.' },
  { id: 'pos-men-leader', title: "Men's Ministry Leader", departmentId: 'dept-men', defaultRoleId: 'department_leader', description: 'Leads the brotherhood fellowship.' },
  { id: 'pos-prayer-leader', title: 'Prayer Team Leader', departmentId: 'dept-prayer', defaultRoleId: 'department_leader', description: 'Mobilises prayer warriors and prayer requests.' },
  { id: 'pos-evangelism-leader', title: 'Evangelism Leader', departmentId: 'dept-outreach', defaultRoleId: 'department_leader', description: 'Directs community soul winning and tract distribution.' },
  { id: 'pos-head-usher', title: 'Head Usher', departmentId: 'dept-hospitality', defaultRoleId: 'department_leader', description: 'Oversees ushering team, seating, and sanctuary decorum.' },
  { id: 'pos-bible-study-coord', title: 'Bible Study Coordinator', departmentId: 'dept-leadership', defaultRoleId: 'department_leader', description: 'Coordinates midweek biblical study syllabus.' },
  { id: 'pos-missions-coord', title: 'Missions Coordinator', departmentId: 'dept-outreach', defaultRoleId: 'department_leader', description: 'Liaises with mission fields and regional outreaches.' },
  { id: 'pos-welfare-coord', title: 'Welfare Coordinator', departmentId: 'dept-outreach', defaultRoleId: 'department_leader', description: 'Provides compassionate assistance to needy members.' },
  { id: 'pos-events-coord', title: 'Events Coordinator', departmentId: 'dept-admin', defaultRoleId: 'department_leader', description: 'Coordinates church conferences, dinners, and retreats.' },
  { id: 'pos-facilities-mgr', title: 'Facilities Manager', departmentId: 'dept-facilities', defaultRoleId: 'department_leader', description: 'Ensures sanctuary cleanliness, electrical safety, and maintenance.' },
  { id: 'pos-family-leader', title: 'Family Ministry Leader', departmentId: 'dept-leadership', defaultRoleId: 'department_leader', description: 'Coordinates marriage seminars and family counselling.' },
  { id: 'pos-pastoral-care-coord', title: 'Pastoral Care Coordinator', departmentId: 'dept-leadership', defaultRoleId: 'department_leader', description: 'Manages pastor appointments, home visits, and hospital calls.' },
  { id: 'pos-protocol-officer', title: 'Protocol Officer', departmentId: 'dept-hospitality', defaultRoleId: 'department_leader', description: 'Ensures VIP guest protocol and security coordination.' }
];
