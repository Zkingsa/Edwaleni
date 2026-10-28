import { useState } from "react";
import { useAuth } from "@/src/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldAlert, KeyRound, CheckCircle2, Lock } from "lucide-react";
import { toast } from "sonner";

export function PasswordChangeModal() {
  const { user, mustChangePassword, changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user || !mustChangePassword) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPassword) {
      setError("Please enter your current temporary password.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (newPassword === currentPassword) {
      setError("New password must be different from the temporary default password.");
      return;
    }

    setLoading(true);
    const result = await changePassword(currentPassword, newPassword);
    setLoading(false);

    if (result.success) {
      toast.success("Password updated successfully! Your account is now secure.");
    } else {
      setError(result.error || "Failed to update password. Verify current password.");
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border-2 border-amber-300 overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-6 text-white text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <KeyRound className="w-7 h-7 text-amber-100" />
          </div>
          <h2 className="font-serif text-2xl font-bold">Password Update Required</h2>
          <p className="text-amber-100 text-xs sm:text-sm mt-1 max-w-xs mx-auto">
            Welcome to GTRA! For security, you must replace your temporary initial password before proceeding.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8">
          <div className="mb-4 p-3.5 bg-amber-50 rounded-xl border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Account:</strong> <span className="font-mono">{user.loginIdentifier}</span>
              <p className="text-amber-800/80 mt-0.5">Please create a strong password containing at least 8 characters.</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-xs font-semibold text-stone-700 mb-1.5 block">
                Current Temporary Password
              </Label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="password"
                  placeholder="Enter current temporary password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="pl-9 h-11 rounded-xl border-stone-200"
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-stone-700 mb-1.5 block">
                New Secure Password
              </Label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="password"
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-9 h-11 rounded-xl border-stone-200"
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-stone-700 mb-1.5 block">
                Confirm New Password
              </Label>
              <div className="relative">
                <CheckCircle2 className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-9 h-11 rounded-xl border-stone-200"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-church-gold hover:bg-church-gold-hover text-white rounded-xl h-12 text-sm font-semibold shadow-md mt-2"
            >
              {loading ? "Updating Password..." : "Set Secure Password & Continue"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
