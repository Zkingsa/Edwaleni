import { useState, useEffect } from "react";
import { useAuth } from "@/src/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Church, Users, Shield, DollarSign, Music, BookOpen, 
  Plus, Check, X, Clock, Calendar, CheckCircle2, AlertCircle, 
  FileText, ShieldCheck, UserCheck, RefreshCw, Layers, Lock, ChevronRight
} from "lucide-react";
import { toast } from "sonner";

interface StaffPortalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StaffPortal({ isOpen, onClose }: StaffPortalProps) {
  const { user, token, permissions, isSystemAdmin, hasPermission, isStaff } = useAuth();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<"admin" | "pastor" | "finance" | "worship" | "profile">("admin");
  const [loading, setLoading] = useState(false);

  // Data states
  const [staffList, setStaffList] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [worshipSchedules, setWorshipSchedules] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Modals & sub-forms inside portal
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [showAddTxModal, setShowAddTxModal] = useState(false);
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);

  // New staff form state
  const [newStaffFirst, setNewStaffFirst] = useState("");
  const [newStaffLast, setNewStaffLast] = useState("");
  const [newStaffDept, setNewStaffDept] = useState("");
  const [newStaffPos, setNewStaffPos] = useState("");
  const [newStaffRole, setNewStaffRole] = useState("");
  const [newStaffPhone, setNewStaffPhone] = useState("");

  // New dept form state
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptCode, setNewDeptCode] = useState("");
  const [newDeptDomain, setNewDeptDomain] = useState("leader-gtra.org");
  const [newDeptDesc, setNewDeptDesc] = useState("");

  // New transaction form state
  const [newTxType, setNewTxType] = useState<"tithe" | "offering" | "project" | "expense">("tithe");
  const [newTxCategory, setNewTxCategory] = useState("");
  const [newTxAmount, setNewTxAmount] = useState("");
  const [newTxCurrency, setNewTxCurrency] = useState<"USD" | "ZAR">("USD");
  const [newTxDesc, setNewTxDesc] = useState("");
  const [newTxDonor, setNewTxDonor] = useState("");

  // New worship schedule form state
  const [newWsTitle, setNewWsTitle] = useState("");
  const [newWsDate, setNewWsDate] = useState("");
  const [newWsTime, setNewWsTime] = useState("18:30 - 20:30");
  const [newWsVenue, setNewWsVenue] = useState("Main Sanctuary • Edwaleni");
  const [newWsSongs, setNewWsSongs] = useState("Way Maker (G)\nThe Rock of Ages (D)");
  const [newWsRoster, setNewWsRoster] = useState("Musa Dlamini (Worship Leader)\nBongani Shongwe (Keys)");
  const [newWsNotes, setNewWsNotes] = useState("");

  // Default initial tab based on permissions
  useEffect(() => {
    if (isSystemAdmin || hasPermission("users.view")) {
      setActiveTab("admin");
    } else if (hasPermission("members.view") || hasPermission("pastoral_care.view")) {
      setActiveTab("pastor");
    } else if (hasPermission("finance.transactions.view")) {
      setActiveTab("finance");
    } else if (hasPermission("worship.schedule.view")) {
      setActiveTab("worship");
    } else {
      setActiveTab("profile");
    }
  }, [isSystemAdmin, permissions]);

  // Load portal data
  const loadData = async () => {
    if (!token) return;
    setLoading(true);

    try {
      // 1. Always load departments, positions, roles
      const [deptRes, posRes, rolesRes] = await Promise.all([
        fetch("/api/departments"),
        fetch("/api/positions"),
        fetch("/api/roles")
      ]);
      if (deptRes.ok) setDepartments(await deptRes.json());
      if (posRes.ok) setPositions(await posRes.json());
      if (rolesRes.ok) setRoles(await rolesRes.json());

      // 2. Staff & Audit logs if authorized
      if (hasPermission("users.view") || isSystemAdmin) {
        const staffRes = await fetch("/api/staff", { headers: { Authorization: `Bearer ${token}` } });
        if (staffRes.ok) setStaffList(await staffRes.json());

        const auditRes = await fetch("/api/audit-logs", { headers: { Authorization: `Bearer ${token}` } });
        if (auditRes.ok) setAuditLogs(await auditRes.json());
      }

      // 3. Members directory if authorized
      if (hasPermission("members.view") || isSystemAdmin) {
        const mbrRes = await fetch("/api/members", { headers: { Authorization: `Bearer ${token}` } });
        if (mbrRes.ok) setMembers(await mbrRes.json());
      }

      // 4. Financial transactions if authorized
      if (hasPermission("finance.transactions.view") || isSystemAdmin) {
        const txRes = await fetch("/api/finance/transactions", { headers: { Authorization: `Bearer ${token}` } });
        if (txRes.ok) setTransactions(await txRes.json());
      }

      // 5. Worship schedules if authorized
      if (hasPermission("worship.schedule.view") || isSystemAdmin) {
        const wsRes = await fetch("/api/worship/schedules", { headers: { Authorization: `Bearer ${token}` } });
        if (wsRes.ok) setWorshipSchedules(await wsRes.json());
      }
    } catch (err) {
      console.error("Failed to load portal data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, token]);

  if (!isOpen) return null;

  // Handlers
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffFirst || !newStaffLast || !newStaffDept || !newStaffPos || !newStaffRole) {
      toast.error("Please fill in all required staff fields.");
      return;
    }

    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          firstName: newStaffFirst,
          lastName: newStaffLast,
          departmentId: newStaffDept,
          positionId: newStaffPos,
          roleId: newStaffRole,
          phone: newStaffPhone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create staff member.");
        return;
      }

      toast.success(
        `Staff member created!\nLogin: ${data.staff.loginIdentifier}\nTemporary Password: ${data.initialPassword}`,
        { duration: 10000 }
      );

      setShowAddStaffModal(false);
      setNewStaffFirst("");
      setNewStaffLast("");
      setNewStaffPhone("");
      loadData();
    } catch {
      toast.error("Network error creating staff member.");
    }
  };

  const handleToggleStaffStatus = async (staffId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      const res = await fetch(`/api/staff/${staffId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to update status.");
        return;
      }
      toast.success(`Staff account marked as ${newStatus}.`);
      loadData();
    } catch {
      toast.error("Failed to update staff status.");
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName || !newDeptCode || !newDeptDomain) {
      toast.error("Department name, code, and category domain are required.");
      return;
    }

    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: newDeptName,
          code: newDeptCode,
          categoryDomain: newDeptDomain,
          description: newDeptDesc,
        }),
      });
      if (!res.ok) {
        toast.error("Failed to create department.");
        return;
      }
      toast.success("Department created successfully!");
      setShowAddDeptModal(false);
      setNewDeptName("");
      setNewDeptCode("");
      setNewDeptDesc("");
      loadData();
    } catch {
      toast.error("Network error creating department.");
    }
  };

  const handleRecordTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(newTxAmount);
    if (!newTxCategory || isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid category and positive amount.");
      return;
    }

    try {
      const res = await fetch("/api/finance/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          type: newTxType,
          category: newTxCategory,
          amount: amountNum,
          currency: newTxCurrency,
          description: newTxDesc,
          donorName: newTxDonor,
        }),
      });
      if (!res.ok) {
        toast.error("Failed to record transaction.");
        return;
      }
      toast.success("Transaction recorded successfully!");
      setShowAddTxModal(false);
      setNewTxCategory("");
      setNewTxAmount("");
      setNewTxDesc("");
      setNewTxDonor("");
      loadData();
    } catch {
      toast.error("Failed to record transaction.");
    }
  };

  const handleApproveTransaction = async (txId: string) => {
    try {
      const res = await fetch(`/api/finance/transactions/${txId}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error || "Approval failed.");
        return;
      }
      toast.success("Expense transaction approved!");
      loadData();
    } catch {
      toast.error("Network error approving transaction.");
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsTitle || !newWsDate || !newWsTime) {
      toast.error("Title, date, and time are required.");
      return;
    }

    const parsedSongs = newWsSongs
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split("(");
        return {
          title: parts[0].trim(),
          key: parts[1] ? parts[1].replace(")", "").trim() : "G",
          lead: "Worship Leader",
        };
      });

    const parsedRoster = newWsRoster
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, idx) => {
        const parts = line.split("(");
        return {
          memberId: `mbr-${idx}`,
          name: parts[0].trim(),
          role: (parts[1] ? parts[1].replace(")", "").trim() : "Vocalist") as any,
          status: "confirmed" as const,
        };
      });

    try {
      const res = await fetch("/api/worship/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: newWsTitle,
          type: "rehearsal",
          date: newWsDate,
          time: newWsTime,
          venue: newWsVenue,
          songs: parsedSongs,
          roster: parsedRoster,
          notes: newWsNotes,
        }),
      });

      if (!res.ok) {
        toast.error("Failed to schedule rehearsal.");
        return;
      }

      toast.success("Worship rehearsal schedule published!");
      setShowAddScheduleModal(false);
      setNewWsTitle("");
      setNewWsDate("");
      loadData();
    } catch {
      toast.error("Failed to create rehearsal schedule.");
    }
  };

  const handleMarkAttendance = async (schedId: string, roster: any[]) => {
    try {
      const attended = roster.map((r) => r.name);
      const res = await fetch(`/api/worship/schedules/${schedId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ attendedMembers: attended }),
      });
      if (res.ok) {
        toast.success(`Attendance recorded for ${attended.length} team members!`);
        loadData();
      }
    } catch {
      toast.error("Failed to record attendance.");
    }
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-2 sm:p-4 bg-church-rock/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl bg-white rounded-3xl shadow-2xl border border-church-stone overflow-hidden flex flex-col h-[94vh]">
        {/* Top App Bar */}
        <div className="bg-church-rock p-4 sm:p-6 text-white flex items-center justify-between border-b border-church-gold/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-church-gold/25 flex items-center justify-center text-amber-300 border border-church-gold/40 shadow-xs">
              <Church className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-tight">
                  GTRA Management Portal
                </h1>
                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-church-gold/90 text-white text-[11px] font-semibold uppercase tracking-wider">
                  Edwaleni Staff
                </span>
              </div>
              <p className="text-xs text-stone-300">
                Connected as: <strong className="text-amber-300">{user?.name}</strong> ({user?.loginIdentifier})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              className="border-white/20 text-white hover:bg-white/10 hidden sm:flex items-center gap-1.5 text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <button
              onClick={onClose}
              aria-label="Close portal"
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-church-cream border-b border-church-stone px-4 sm:px-6 flex overflow-x-auto gap-2 py-2 shrink-0">
          {(isSystemAdmin || hasPermission("users.view")) && (
            <button
              onClick={() => setActiveTab("admin")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "admin"
                  ? "bg-church-rock text-white shadow-xs"
                  : "text-stone-600 hover:text-stone-900 hover:bg-white/60"
              }`}
            >
              <Shield className="w-4 h-4 text-amber-400" />
              <span>System & Staff RBAC</span>
            </button>
          )}

          {(hasPermission("members.view") || hasPermission("pastoral_care.view") || isSystemAdmin) && (
            <button
              onClick={() => setActiveTab("pastor")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "pastor"
                  ? "bg-church-rock text-white shadow-xs"
                  : "text-stone-600 hover:text-stone-900 hover:bg-white/60"
              }`}
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Pastoral & Members</span>
            </button>
          )}

          {(hasPermission("finance.transactions.view") || isSystemAdmin) && (
            <button
              onClick={() => setActiveTab("finance")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "finance"
                  ? "bg-church-rock text-white shadow-xs"
                  : "text-stone-600 hover:text-stone-900 hover:bg-white/60"
              }`}
            >
              <DollarSign className="w-4 h-4 text-amber-400" />
              <span>Finance & Stewardship</span>
            </button>
          )}

          {(hasPermission("worship.schedule.view") || isSystemAdmin) && (
            <button
              onClick={() => setActiveTab("worship")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "worship"
                  ? "bg-church-rock text-white shadow-xs"
                  : "text-stone-600 hover:text-stone-900 hover:bg-white/60"
              }`}
            >
              <Music className="w-4 h-4 text-amber-400" />
              <span>Worship & Rehearsals</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "profile"
                ? "bg-church-rock text-white shadow-xs"
                : "text-stone-600 hover:text-stone-900 hover:bg-white/60"
            }`}
          >
            <UserCheck className="w-4 h-4 text-amber-400" />
            <span>My Account & Role</span>
          </button>
        </div>

        {/* Tab Content Panes */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-50/50">
          {/* TAB 1: SYSTEM ADMIN & STAFF RBAC */}
          {activeTab === "admin" && (
            <div className="space-y-8">
              {/* Top Action Row */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-church-stone shadow-xs">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-stone-900">
                    Staff & Department Governance
                  </h2>
                  <p className="text-stone-500 text-xs sm:text-sm">
                    Manage GTRA staff credentials, auto-generated email convention (<code>initialSurname@domain</code>), and departmental permissions.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      if (departments.length > 0) setNewStaffDept(departments[0].id);
                      if (positions.length > 0) setNewStaffPos(positions[0].id);
                      if (roles.length > 0) setNewStaffRole(roles[0].id);
                      setShowAddStaffModal(true);
                    }}
                    className="bg-church-gold hover:bg-church-gold-hover text-white shadow-xs text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Staff Member
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAddDeptModal(true)}
                    className="border-stone-300 text-stone-700 hover:bg-stone-100 text-xs"
                  >
                    <Layers className="w-3.5 h-3.5 mr-1" /> New Department
                  </Button>
                </div>
              </div>

              {/* Staff Table */}
              <div className="bg-white rounded-2xl border border-church-stone shadow-xs overflow-hidden">
                <div className="p-4 border-b border-church-stone bg-church-cream/40 flex items-center justify-between">
                  <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-church-gold-dark" />
                    GTRA Staff Directory & Identifiers ({staffList.length})
                  </h3>
                  <span className="text-xs text-stone-500">Backend Enforced RBAC</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-stone-100/70 text-stone-600 font-semibold border-b border-stone-200">
                      <tr>
                        <th className="p-3.5 pl-5">Staff Member</th>
                        <th className="p-3.5">Assigned Login Identifier</th>
                        <th className="p-3.5">Department & Position</th>
                        <th className="p-3.5">Application Role</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 pr-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-stone-800">
                      {staffList.map((stf) => {
                        const firstAssign = stf.assignments?.[0];
                        const dept = departments.find((d) => d.id === firstAssign?.departmentId);
                        const pos = positions.find((p) => p.id === firstAssign?.positionId);
                        const role = roles.find((r) => r.id === firstAssign?.roleId);

                        return (
                          <tr key={stf.id} className="hover:bg-amber-50/30 transition-colors">
                            <td className="p-3.5 pl-5 font-semibold text-stone-900">
                              <div>{stf.name}</div>
                              <div className="text-[11px] text-stone-400 font-normal">{stf.phone || "No phone"}</div>
                            </td>
                            <td className="p-3.5 font-mono text-xs text-amber-900">
                              <span className="bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-semibold">
                                {stf.loginIdentifier}
                              </span>
                            </td>
                            <td className="p-3.5">
                              <div className="font-medium">{dept?.name || "Church Administration"}</div>
                              <div className="text-[11px] text-stone-500">{pos?.title || "Staff Member"}</div>
                            </td>
                            <td className="p-3.5">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-stone-100 text-stone-700">
                                {role?.name || "General Staff"}
                              </span>
                            </td>
                            <td className="p-3.5">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                  stf.status === "active"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {stf.status}
                              </span>
                            </td>
                            <td className="p-3.5 pr-5 text-right">
                              {stf.loginIdentifier !== "admin@system-gtra.org" ? (
                                <button
                                  type="button"
                                  onClick={() => handleToggleStaffStatus(stf.id, stf.status)}
                                  className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                                    stf.status === "active"
                                      ? "border-red-200 text-red-600 hover:bg-red-50"
                                      : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                  }`}
                                >
                                  {stf.status === "active" ? "Deactivate" : "Activate"}
                                </button>
                              ) : (
                                <span className="text-[11px] text-stone-400 italic">Primary Admin</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Departments Grid */}
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900 mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-church-gold-dark" />
                  Configured Church Departments & Assigned Domains
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {departments.map((dept) => (
                    <Card key={dept.id} className="border border-church-stone rounded-2xl bg-white p-4 shadow-xs">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-church-cream text-church-gold-dark px-2 py-0.5 rounded-md border border-church-stone">
                          {dept.code}
                        </span>
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                          {dept.status}
                        </span>
                      </div>
                      <h4 className="font-serif text-lg font-bold text-stone-900">{dept.name}</h4>
                      <p className="text-xs text-stone-500 mb-3 line-clamp-2">{dept.description}</p>
                      <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                        <span className="text-stone-400">Staff Domain:</span>
                        <code className="text-amber-800 font-mono font-medium">@{dept.categoryDomain}</code>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Audit Logs Table */}
              <div className="bg-white rounded-2xl border border-church-stone shadow-xs overflow-hidden">
                <div className="p-4 border-b border-church-stone bg-church-cream/40 flex items-center justify-between">
                  <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-church-gold-dark" />
                    Security Audit Trail (Last {auditLogs.length} Actions)
                  </h3>
                  <span className="text-xs text-stone-500 font-medium">POPIA & Accountability Compliant</span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-100/70 text-stone-600 sticky top-0">
                      <tr>
                        <th className="p-2.5 pl-4">Timestamp</th>
                        <th className="p-2.5">Actor</th>
                        <th className="p-2.5">Action</th>
                        <th className="p-2.5 pr-4">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-stone-50">
                          <td className="p-2.5 pl-4 text-stone-500 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="p-2.5 font-mono text-amber-900 font-medium">
                            {log.userIdentifier}
                          </td>
                          <td className="p-2.5 font-semibold text-stone-800">
                            {log.action}
                          </td>
                          <td className="p-2.5 pr-4 text-stone-600 truncate max-w-xs">
                            {JSON.stringify(log.details)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PASTORAL & MEMBERS */}
          {activeTab === "pastor" && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-church-stone shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-stone-900">
                    Pastoral Care & Member Directory
                  </h2>
                  <p className="text-stone-500 text-xs sm:text-sm">
                    Shepherding records for registered church members and confidential pastoral appointments.
                  </p>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 max-w-sm">
                  <strong>Pastoral Confidentiality:</strong> Financial transactions, audit trails, and system passwords remain restricted to maintain ethical boundaries.
                </div>
              </div>

              {/* Members List */}
              <div className="bg-white rounded-2xl border border-church-stone shadow-xs overflow-hidden">
                <div className="p-4 border-b border-church-stone bg-church-cream/40 flex items-center justify-between">
                  <h3 className="font-serif text-lg font-bold text-stone-900">
                    Church Members Directory ({members.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-stone-100/70 text-stone-600 font-semibold border-b border-stone-200">
                      <tr>
                        <th className="p-3.5 pl-5">Member Name</th>
                        <th className="p-3.5">Contact Details</th>
                        <th className="p-3.5">Location</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5">Ministry Interests</th>
                        <th className="p-3.5 pr-5">Pastoral Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {members.map((mbr) => (
                        <tr key={mbr.id} className="hover:bg-amber-50/20">
                          <td className="p-3.5 pl-5 font-bold text-stone-900">{mbr.fullName}</td>
                          <td className="p-3.5">
                            <div>{mbr.phone}</div>
                            <div className="text-[11px] text-stone-400">{mbr.email}</div>
                          </td>
                          <td className="p-3.5 text-stone-600">{mbr.address}</td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-full text-[11px] bg-emerald-100 text-emerald-800 font-semibold">
                              {mbr.membershipStatus}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <div className="flex flex-wrap gap-1">
                              {mbr.ministryInterests?.map((m: string) => (
                                <span key={m} className="px-1.5 py-0.5 bg-stone-100 text-stone-700 rounded text-[10px]">
                                  {m}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-3.5 pr-5 text-stone-500 italic max-w-xs truncate">
                            {mbr.pastoralNotes || "No notes"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FINANCE & STEWARDSHIP */}
          {activeTab === "finance" && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-church-stone shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-stone-900">
                    Church Treasury & Financial Operations
                  </h2>
                  <p className="text-stone-500 text-xs sm:text-sm">
                    Tithes, offerings, budget expenditures, and approval workflows.
                  </p>
                </div>
                {hasPermission("finance.transactions.create") && (
                  <Button
                    size="sm"
                    onClick={() => setShowAddTxModal(true)}
                    className="bg-church-gold hover:bg-church-gold-hover text-white shadow-xs text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Record Collection / Expense
                  </Button>
                )}
              </div>

              {/* Finance summary tiles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="p-4 bg-white border border-church-stone rounded-2xl shadow-xs">
                  <span className="text-xs text-stone-500 uppercase tracking-wider font-semibold">Total Income Recorded</span>
                  <div className="font-serif text-3xl font-bold text-emerald-700 mt-1">
                    ${transactions.filter((t) => t.type !== "expense").reduce((acc, t) => acc + t.amount, 0).toLocaleString()}
                  </div>
                  <span className="text-[11px] text-stone-400">Tithes, offerings & building gifts</span>
                </Card>
                <Card className="p-4 bg-white border border-church-stone rounded-2xl shadow-xs">
                  <span className="text-xs text-stone-500 uppercase tracking-wider font-semibold">Total Expenditures</span>
                  <div className="font-serif text-3xl font-bold text-amber-700 mt-1">
                    ${transactions.filter((t) => t.type === "expense").reduce((acc, t) => acc + t.amount, 0).toLocaleString()}
                  </div>
                  <span className="text-[11px] text-stone-400">Sanctuary utilities, missions, fuel</span>
                </Card>
                <Card className="p-4 bg-white border border-church-stone rounded-2xl shadow-xs">
                  <span className="text-xs text-stone-500 uppercase tracking-wider font-semibold">Pending Approvals</span>
                  <div className="font-serif text-3xl font-bold text-red-600 mt-1">
                    {transactions.filter((t) => t.status === "pending").length}
                  </div>
                  <span className="text-[11px] text-stone-400">Expense vouchers awaiting CFO/Treasurer</span>
                </Card>
              </div>

              {/* Transactions Table */}
              <div className="bg-white rounded-2xl border border-church-stone shadow-xs overflow-hidden">
                <div className="p-4 border-b border-church-stone bg-church-cream/40 flex items-center justify-between">
                  <h3 className="font-serif text-lg font-bold text-stone-900">
                    Financial Transactions ({transactions.length})
                  </h3>
                  {!hasPermission("finance.transactions.approve") && (
                    <span className="text-xs text-amber-800 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                      Read-Only Auditor Mode
                    </span>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-stone-100/70 text-stone-600 font-semibold border-b border-stone-200">
                      <tr>
                        <th className="p-3.5 pl-5">Receipt / Date</th>
                        <th className="p-3.5">Category</th>
                        <th className="p-3.5">Type</th>
                        <th className="p-3.5">Amount</th>
                        <th className="p-3.5">Recorded By</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 pr-5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-amber-50/20">
                          <td className="p-3.5 pl-5">
                            <div className="font-mono text-xs font-semibold text-stone-800">{tx.receiptNumber}</div>
                            <div className="text-[11px] text-stone-400">{new Date(tx.date).toLocaleDateString()}</div>
                          </td>
                          <td className="p-3.5 font-medium text-stone-900">{tx.category}</td>
                          <td className="p-3.5 capitalize">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              tx.type === "expense" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
                            }`}>
                              {tx.type}
                            </span>
                          </td>
                          <td className="p-3.5 font-bold text-stone-900">
                            {tx.currency} {tx.amount.toLocaleString()}
                          </td>
                          <td className="p-3.5 text-stone-600">{tx.recordedByName}</td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              tx.status === "approved"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}>
                              {tx.status}
                            </span>
                          </td>
                          <td className="p-3.5 pr-5 text-right">
                            {tx.status === "pending" && hasPermission("finance.transactions.approve") ? (
                              <Button
                                size="sm"
                                onClick={() => handleApproveTransaction(tx.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs rounded-lg px-3"
                              >
                                Approve
                              </Button>
                            ) : tx.status === "pending" ? (
                              <span className="text-[11px] text-stone-400 italic">Awaiting CFO</span>
                            ) : (
                              <span className="text-[11px] text-emerald-600 font-medium">✓ Settled</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: WORSHIP & PRAISE */}
          {activeTab === "worship" && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-church-stone shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-stone-900">
                    Worship Team Management & Rehearsals
                  </h2>
                  <p className="text-stone-500 text-xs sm:text-sm">
                    Schedule practices, assign vocalists and musicians, manage song lists, and record attendance.
                  </p>
                </div>
                {hasPermission("worship.schedule.manage") && (
                  <Button
                    size="sm"
                    onClick={() => setShowAddScheduleModal(true)}
                    className="bg-church-gold hover:bg-church-gold-hover text-white shadow-xs text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Schedule Rehearsal / Service
                  </Button>
                )}
              </div>

              {/* Schedules Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {worshipSchedules.map((ws) => (
                  <Card key={ws.id} className="border border-church-stone rounded-3xl bg-white p-6 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full bg-church-cream text-church-gold-dark border border-church-stone">
                          {ws.type === "rehearsal" ? "Choir & Band Rehearsal" : "Sunday Liturgy"}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-stone-500">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{ws.date}</span>
                        </div>
                      </div>

                      <h3 className="font-serif text-2xl font-bold text-stone-900 mb-2">{ws.title}</h3>
                      <div className="flex items-center gap-4 text-xs text-stone-600 mb-4">
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-church-gold-dark" /> {ws.time}</span>
                        <span>•</span>
                        <span>{ws.venue}</span>
                      </div>

                      {/* Song Setlist */}
                      <div className="mb-4 p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block mb-2">
                          Repertoire & Song Setlist
                        </span>
                        <ul className="space-y-1.5">
                          {ws.songs?.map((song: any, sIdx: number) => (
                            <li key={sIdx} className="flex justify-between items-center text-xs text-stone-800">
                              <span className="font-medium">• {song.title}</span>
                              <span className="font-mono text-amber-900 bg-white px-2 py-0.5 rounded border border-stone-200 text-[10px]">
                                Key: {song.key}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Musician & Choir Roster */}
                      <div className="mb-4">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block mb-2">
                          Rostered Team ({ws.roster?.length || 0})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {ws.roster?.map((m: any, mIdx: number) => (
                            <span key={mIdx} className="px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-950 font-medium">
                              {m.name} ({m.role})
                            </span>
                          ))}
                        </div>
                      </div>

                      {ws.notes && (
                        <p className="text-xs text-stone-500 italic bg-church-cream/50 p-2.5 rounded-xl border border-church-stone mb-4">
                          Note: {ws.notes}
                        </p>
                      )}
                    </div>

                    <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                      {ws.attendanceRecorded ? (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                          <CheckCircle2 className="w-4 h-4" /> Attendance Recorded ({ws.attendedMembers?.length} present)
                        </div>
                      ) : hasPermission("worship.attendance.manage") ? (
                        <Button
                          size="sm"
                          onClick={() => handleMarkAttendance(ws.id, ws.roster)}
                          className="bg-church-rock hover:bg-stone-800 text-white text-xs rounded-xl"
                        >
                          Record Rehearsal Attendance
                        </Button>
                      ) : (
                        <span className="text-xs text-stone-400">Attendance pending</span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: MY ACCOUNT & PERMISSIONS */}
          {activeTab === "profile" && (
            <div className="max-w-3xl mx-auto space-y-6">
              <Card className="p-6 bg-white border border-church-stone rounded-3xl shadow-xs">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-church-stone">
                  <div className="w-16 h-16 rounded-2xl bg-church-gold/20 flex items-center justify-center text-church-gold text-2xl font-bold border border-church-gold/40">
                    {user?.name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-stone-900">{user?.name}</h2>
                    <p className="text-sm font-mono text-amber-900">{user?.loginIdentifier}</p>
                    <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                      Account Status: {user?.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-serif text-lg font-bold text-stone-900">
                    Your Assigned Departments & Positions
                  </h3>
                  {user?.assignments && user.assignments.length > 0 ? (
                    <div className="space-y-2">
                      {user.assignments.map((assign, aIdx) => {
                        const dept = departments.find((d) => d.id === assign.departmentId);
                        const pos = positions.find((p) => p.id === assign.positionId);
                        const role = roles.find((r) => r.id === assign.roleId);
                        return (
                          <div key={aIdx} className="p-4 rounded-2xl bg-church-cream/60 border border-church-stone flex justify-between items-center">
                            <div>
                              <div className="font-semibold text-stone-900">{dept?.name || assign.departmentId}</div>
                              <div className="text-xs text-stone-600">{pos?.title || assign.positionId}</div>
                            </div>
                            <span className="px-3 py-1 bg-white rounded-xl border border-church-stone text-xs font-semibold text-church-gold-dark shadow-xs">
                              {role?.name || assign.roleId}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-stone-500 italic">No departmental staff assignments (Church Member account).</p>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t border-church-stone">
                  <h3 className="font-serif text-lg font-bold text-stone-900 mb-3">
                    Effective System Permissions ({permissions.length})
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {permissions.map((perm) => (
                      <span key={perm} className="px-2.5 py-1 bg-stone-100 border border-stone-200 text-stone-700 rounded-lg text-xs font-mono">
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* SUB-MODAL: Add Staff Member */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-church-stone">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif text-2xl font-bold text-stone-900">Add Church Staff Member</h3>
              <button onClick={() => setShowAddStaffModal(false)} className="p-1 rounded-full hover:bg-stone-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-stone-500 mb-5">
              Staff login identifier is automatically generated using GTRA convention: first-name initial and surname with the department domain.
            </p>
            <form onSubmit={handleCreateStaff} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">First Name</Label>
                  <Input
                    placeholder="First name"
                    value={newStaffFirst}
                    onChange={(e) => setNewStaffFirst(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs">Surname</Label>
                  <Input
                    placeholder="Surname"
                    value={newStaffLast}
                    onChange={(e) => setNewStaffLast(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Assigned Department</Label>
                <select
                  value={newStaffDept}
                  onChange={(e) => setNewStaffDept(e.target.value)}
                  className="w-full h-10 rounded-xl border border-stone-300 px-3 text-sm bg-white"
                  required
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} (@{d.categoryDomain})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-xs">Position Title</Label>
                <select
                  value={newStaffPos}
                  onChange={(e) => setNewStaffPos(e.target.value)}
                  className="w-full h-10 rounded-xl border border-stone-300 px-3 text-sm bg-white"
                  required
                >
                  {positions
                    .filter((p) => !newStaffDept || p.departmentId === newStaffDept)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <Label className="text-xs">Application Role (RBAC)</Label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value)}
                  className="w-full h-10 rounded-xl border border-stone-300 px-3 text-sm bg-white"
                  required
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-xs">Contact Phone</Label>
                <Input
                  placeholder="+268 7600 0000"
                  value={newStaffPhone}
                  onChange={(e) => setNewStaffPhone(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full bg-church-gold hover:bg-church-gold-hover text-white rounded-xl h-11 mt-2">
                Generate Staff Account
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL: Add Department */}
      {showAddDeptModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-church-stone">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif text-2xl font-bold text-stone-900">Create New Department</h3>
              <button onClick={() => setShowAddDeptModal(false)} className="p-1 rounded-full hover:bg-stone-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateDepartment} className="space-y-3.5">
              <div>
                <Label className="text-xs">Department Name</Label>
                <Input
                  placeholder="e.g. Media and Communications"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label className="text-xs">Department Code</Label>
                <Input
                  placeholder="e.g. MEDIA"
                  value={newDeptCode}
                  onChange={(e) => setNewDeptCode(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label className="text-xs">Category Domain</Label>
                <select
                  value={newDeptDomain}
                  onChange={(e) => setNewDeptDomain(e.target.value)}
                  className="w-full h-10 rounded-xl border border-stone-300 px-3 text-sm bg-white"
                >
                  <option value="system-gtra.org">system-gtra.org</option>
                  <option value="leader-gtra.org">leader-gtra.org</option>
                  <option value="finance-gtra.org">finance-gtra.org</option>
                  <option value="worship-gtra.org">worship-gtra.org</option>
                  <option value="pastor-gtra.org">pastor-gtra.org</option>
                  <option value="youth-gtra.org">youth-gtra.org</option>
                  <option value="media-gtra.org">media-gtra.org</option>
                  <option value="admin-gtra.org">admin-gtra.org</option>
                </select>
              </div>
              <div>
                <Label className="text-xs">Description</Label>
                <Input
                  placeholder="Department scope and responsibilities"
                  value={newDeptDesc}
                  onChange={(e) => setNewDeptDesc(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full bg-church-gold hover:bg-church-gold-hover text-white rounded-xl h-11 mt-2">
                Save Department
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL: Record Financial Transaction */}
      {showAddTxModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-church-stone">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif text-2xl font-bold text-stone-900">Record Church Transaction</h3>
              <button onClick={() => setShowAddTxModal(false)} className="p-1 rounded-full hover:bg-stone-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRecordTransaction} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Type</Label>
                  <select
                    value={newTxType}
                    onChange={(e) => setNewTxType(e.target.value as any)}
                    className="w-full h-10 rounded-xl border border-stone-300 px-3 text-sm bg-white"
                  >
                    <option value="tithe">Tithe</option>
                    <option value="offering">Offering</option>
                    <option value="project">Building Fund</option>
                    <option value="expense">Expense Voucher</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Currency</Label>
                  <select
                    value={newTxCurrency}
                    onChange={(e) => setNewTxCurrency(e.target.value as any)}
                    className="w-full h-10 rounded-xl border border-stone-300 px-3 text-sm bg-white"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="ZAR">ZAR (R)</option>
                  </select>
                </div>
              </div>

              <div>
                <Label className="text-xs">Category Name</Label>
                <Input
                  placeholder="e.g. Sunday Morning Tithes or Fuel Purchase"
                  value={newTxCategory}
                  onChange={(e) => setNewTxCategory(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label className="text-xs">Amount</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={newTxAmount}
                  onChange={(e) => setNewTxAmount(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label className="text-xs">Donor Name (Optional / Confidential)</Label>
                <Input
                  placeholder="Envelope number or member name"
                  value={newTxDonor}
                  onChange={(e) => setNewTxDonor(e.target.value)}
                />
              </div>

              <div>
                <Label className="text-xs">Description / Voucher Details</Label>
                <Input
                  placeholder="Purpose, check number, or bank deposit reference"
                  value={newTxDesc}
                  onChange={(e) => setNewTxDesc(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full bg-church-gold hover:bg-church-gold-hover text-white rounded-xl h-11 mt-2">
                Commit Transaction
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL: Schedule Worship Rehearsal */}
      {showAddScheduleModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-church-stone">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif text-2xl font-bold text-stone-900">Schedule Worship Rehearsal</h3>
              <button onClick={() => setShowAddScheduleModal(false)} className="p-1 rounded-full hover:bg-stone-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSchedule} className="space-y-3.5">
              <div>
                <Label className="text-xs">Rehearsal / Service Title</Label>
                <Input
                  placeholder="e.g. Thursday Praise Team Rehearsal"
                  value={newWsTitle}
                  onChange={(e) => setNewWsTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Date</Label>
                  <Input
                    type="date"
                    value={newWsDate}
                    onChange={(e) => setNewWsDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs">Time</Label>
                  <Input
                    value={newWsTime}
                    onChange={(e) => setNewWsTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Venue</Label>
                <Input
                  value={newWsVenue}
                  onChange={(e) => setNewWsVenue(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label className="text-xs">Songs List (One per line with key e.g. Song Name (G))</Label>
                <textarea
                  rows={2}
                  value={newWsSongs}
                  onChange={(e) => setNewWsSongs(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 p-2.5 text-xs font-mono"
                />
              </div>

              <div>
                <Label className="text-xs">Rostered Musicians & Singers (One per line)</Label>
                <textarea
                  rows={2}
                  value={newWsRoster}
                  onChange={(e) => setNewWsRoster(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 p-2.5 text-xs"
                />
              </div>

              <Button type="submit" className="w-full bg-church-gold hover:bg-church-gold-hover text-white rounded-xl h-11 mt-2">
                Publish Rehearsal Schedule
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
