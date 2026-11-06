import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function PasswordSetupModal() {
  const { refreshProfile } = useAuth();
  const [isInvite, setIsInvite] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invited = params.get("setup") === "invite";
    setIsInvite(invited);
    if (!invited || !supabase) return;

    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (sessionError) {
        setError("This invitation link is invalid or has expired. Ask the administrator to send a new one.");
        return;
      }
      if (data.session?.access_token) {
        setAccessToken(data.session.access_token);
        setInviteEmail(data.session.user.email || "");
      }
      else setError("This invitation link is invalid or has expired. Ask the administrator to send a new one.");
    });
  }, []);

  if (!isInvite) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!supabase || !accessToken) {
      setError("Invitation session is unavailable. Reopen the link from your email.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { error: passwordError } = await supabase.auth.updateUser({ password });
      if (passwordError) throw passwordError;

      const response = await fetch("/api/auth/activate", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not activate this account.");

      await refreshProfile();
      window.history.replaceState({}, "", window.location.pathname);
      setIsInvite(false);
      toast.success("Your email is verified and your password has been set.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not set your password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-3xl border border-church-stone bg-white p-7 shadow-2xl">
        <h2 className="font-serif text-2xl font-bold text-stone-900">Set up your portal account</h2>
        <p className="mt-2 text-sm text-stone-600">
          Choose a password to verify your email and activate your account.
          {inviteEmail && <> You will sign in with <strong>{inviteEmail}</strong>.</>}
        </p>
        {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <Label htmlFor="invite-password">Password</Label>
            <Input id="invite-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} />
          </div>
          <div>
            <Label htmlFor="invite-confirm-password">Confirm password</Label>
            <Input id="invite-confirm-password" type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
          </div>
          <Button type="submit" disabled={loading || !accessToken} className="w-full bg-church-gold text-white hover:bg-church-gold-hover">
            {loading ? "Saving password..." : "Verify email and continue"}
          </Button>
        </form>
      </div>
    </div>
  );
}
