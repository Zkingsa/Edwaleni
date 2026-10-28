import { useState, useEffect } from "react";
import { useAuth } from "@/src/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Church, X, LogIn, UserPlus, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface AuthModalProps {
  isOpen: boolean;
  initialTab?: "login" | "register";
  onClose: () => void;
  onSuccess?: () => void;
}

export function AuthModal({ isOpen, initialTab = "login", onClose, onSuccess }: AuthModalProps) {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<"login" | "register">(initialTab);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");

  useEffect(() => {
    setTab(initialTab);
    setErrorMessage(null);
  }, [initialTab, isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanIdent = loginIdentifier.trim();
    if (!cleanIdent || !loginPassword) {
      setErrorMessage("Please enter both your login identifier and password.");
      return;
    }

    setLoading(true);
    const result = await login(cleanIdent, loginPassword);
    setLoading(false);

    if (result.success) {
      toast.success("Welcome back to God The Rock Assembly!");
      onClose();
      if (onSuccess) onSuccess();
    } else {
      setErrorMessage(result.error || "Invalid login credentials. Please try again.");
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanName = regFullName.trim();
    const cleanEmail = regEmail.trim().toLowerCase();

    if (!cleanName || !cleanEmail || !regPassword) {
      setErrorMessage("Full name, email address, and password are required.");
      return;
    }

    if (regPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    // Check privileged staff domain
    if (cleanEmail.includes("-gtra.org")) {
      setErrorMessage("Privileged staff emails (@*-gtra.org) are assigned by the Church Administrator. Please use your personal email.");
      return;
    }

    setLoading(true);
    const result = await register({
      fullName: cleanName,
      email: cleanEmail,
      phone: regPhone.trim(),
      password: regPassword,
    });
    setLoading(false);

    if (result.success) {
      toast.success("Registration successful! Welcome to the GTRA church family.");
      onClose();
      if (onSuccess) onSuccess();
    } else {
      setErrorMessage(result.error || "Registration failed. Please try again.");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-church-rock/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-church-stone overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-church-rock via-stone-900 to-church-rock p-6 text-white flex items-center justify-between border-b border-church-gold/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-church-gold/25 flex items-center justify-center text-amber-300 border border-church-gold/40">
              <Church className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight">
                God The Rock Assembly
              </h2>
              <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-amber-400 font-semibold">
                Edwaleni Portal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-church-stone bg-church-cream/50 px-6 pt-3">
          <button
            type="button"
            onClick={() => { setTab("login"); setErrorMessage(null); }}
            className={`flex items-center gap-2 pb-3 px-4 font-medium text-sm border-b-2 transition-all cursor-pointer ${
              tab === "login"
                ? "border-church-gold text-church-gold-dark font-semibold"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => { setTab("register"); setErrorMessage(null); }}
            className={`flex items-center gap-2 pb-3 px-4 font-medium text-sm border-b-2 transition-all cursor-pointer ${
              tab === "register"
                ? "border-church-gold text-church-gold-dark font-semibold"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Register as Member</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-8 overflow-y-auto">
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs sm:text-sm font-medium flex items-start gap-2 animate-in fade-in">
              <span className="font-bold">•</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {tab === "login" ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <Label htmlFor="login-id" className="text-xs font-semibold text-stone-700 mb-1.5 block">
                  Login Identifier or Email
                </Label>
                <Input
                  id="login-id"
                  type="text"
                  placeholder="Enter your email or login identifier"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  className="h-11 rounded-xl border-stone-300 focus-visible:ring-church-gold text-sm"
                  autoComplete="username"
                  required
                />
                <span className="text-[11px] text-stone-500 mt-1 block">
                  Staff members use their assigned GTRA login identifier.
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label htmlFor="login-pw" className="text-xs font-semibold text-stone-700">
                    Password
                  </Label>
                </div>
                <div className="relative">
                  <Input
                    id="login-pw"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="h-11 rounded-xl border-stone-300 pr-10 focus-visible:ring-church-gold text-sm"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-church-gold hover:bg-church-gold-hover text-white rounded-xl h-12 text-sm font-semibold shadow-md mt-4 transition-all"
              >
                {loading ? "Verifying Credentials..." : "Sign In to GTRA"}
              </Button>

              <div className="text-center text-xs text-stone-500 pt-2">
                Don't have an account yet?{" "}
                <button
                  type="button"
                  onClick={() => setTab("register")}
                  className="text-church-gold-dark font-semibold hover:underline"
                >
                  Register as Member
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <Label htmlFor="reg-name" className="text-xs font-semibold text-stone-700 mb-1.5 block">
                  Full Name
                </Label>
                <Input
                  id="reg-name"
                  type="text"
                  placeholder="Enter your full name"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  className="h-11 rounded-xl border-stone-300 focus-visible:ring-church-gold text-sm"
                  required
                />
              </div>

              <div>
                <Label htmlFor="reg-email" className="text-xs font-semibold text-stone-700 mb-1.5 block">
                  Personal Email Address
                </Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="Enter your email address"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="h-11 rounded-xl border-stone-300 focus-visible:ring-church-gold text-sm"
                  required
                />
                <span className="text-[11px] text-stone-500 mt-1 block">
                  Must be your personal email. Privileged staff accounts are managed by church administration.
                </span>
              </div>

              <div>
                <Label htmlFor="reg-phone" className="text-xs font-semibold text-stone-700 mb-1.5 block">
                  Phone Number <span className="text-stone-400 font-normal">(Optional)</span>
                </Label>
                <Input
                  id="reg-phone"
                  type="tel"
                  placeholder="Enter phone number"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="h-11 rounded-xl border-stone-300 focus-visible:ring-church-gold text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="reg-pw" className="text-xs font-semibold text-stone-700 mb-1.5 block">
                    Password
                  </Label>
                  <Input
                    id="reg-pw"
                    type="password"
                    placeholder="Min 6 characters"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="h-11 rounded-xl border-stone-300 focus-visible:ring-church-gold text-sm"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="reg-cpw" className="text-xs font-semibold text-stone-700 mb-1.5 block">
                    Confirm Password
                  </Label>
                  <Input
                    id="reg-cpw"
                    type="password"
                    placeholder="Re-enter password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="h-11 rounded-xl border-stone-300 focus-visible:ring-church-gold text-sm"
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80 flex items-start gap-2 text-[11px] text-amber-900">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  Member information is strictly protected under church privacy governance (POPIA compliant).
                </span>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-church-gold hover:bg-church-gold-hover text-white rounded-xl h-12 text-sm font-semibold shadow-md mt-2"
              >
                {loading ? "Creating Account..." : "Complete Member Registration"}
              </Button>

              <div className="text-center text-xs text-stone-500 pt-1">
                Already registered?{" "}
                <button
                  type="button"
                  onClick={() => setTab("login")}
                  className="text-church-gold-dark font-semibold hover:underline"
                >
                  Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
