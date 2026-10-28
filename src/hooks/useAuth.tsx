import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { GoogleAuthProvider, signInWithPopup, signOut as fbSignOut } from "firebase/auth";
import { auth } from "../lib/firebase";

export interface DepartmentAssignment {
  departmentId: string;
  positionId: string;
  roleId: string;
}

export interface AuthUser {
  uid: string;
  id: string;
  email: string;
  displayName: string;
  name: string;
  firstName?: string;
  lastName?: string;
  loginIdentifier: string;
  photoURL?: string;
  status: string;
  mustChangePassword: boolean;
  assignments: DepartmentAssignment[];
  phone?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  token: string | null;
  permissions: string[];
  mustChangePassword: boolean;
  isStaff: boolean;
  isSystemAdmin: boolean;
  hasPermission: (permission: string) => boolean;
  login: (loginIdentifier: string, password: string) => Promise<{ success: boolean; mustChangePassword?: boolean; error?: string }>;
  register: (data: { fullName: string; email: string; password: string; phone?: string }) => Promise<{ success: boolean; error?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("gtra_token"));
  const [permissions, setPermissions] = useState<string[]>([]);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (authToken: string) => {
    try {
      const res = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const profile = data.user;
        const authUser: AuthUser = {
          uid: profile.id,
          id: profile.id,
          email: profile.email,
          displayName: profile.name,
          name: profile.name,
          firstName: profile.firstName,
          lastName: profile.lastName,
          loginIdentifier: profile.loginIdentifier,
          status: profile.status,
          mustChangePassword: profile.mustChangePassword,
          assignments: profile.assignments || [],
          phone: profile.phone,
          photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.name)}`,
        };
        setUser(authUser);
        setPermissions(data.permissions || []);
        setMustChangePassword(Boolean(data.mustChangePassword));
      } else {
        // Expired or invalid token
        localStorage.removeItem("gtra_token");
        setToken(null);
        setUser(null);
        setPermissions([]);
      }
    } catch (err) {
      console.error("Failed to load user profile:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchProfile(token);
    } else {
      setLoading(false);
    }
  }, [token, fetchProfile]);

  const login = async (loginIdentifier: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginIdentifier, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Login failed. Check credentials." };
      }

      localStorage.setItem("gtra_token", data.token);
      setToken(data.token);

      const profile = data.user;
      const authUser: AuthUser = {
        uid: profile.id,
        id: profile.id,
        email: profile.email,
        displayName: profile.name,
        name: profile.name,
        firstName: profile.firstName,
        lastName: profile.lastName,
        loginIdentifier: profile.loginIdentifier,
        status: profile.status,
        mustChangePassword: profile.mustChangePassword,
        assignments: profile.assignments || [],
        photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.name)}`,
      };

      setUser(authUser);
      setPermissions(data.permissions || []);
      setMustChangePassword(Boolean(data.mustChangePassword));

      return { success: true, mustChangePassword: data.mustChangePassword };
    } catch (err: any) {
      return { success: false, error: "Network error connecting to login service." };
    }
  };

  const register = async (data: { fullName: string; email: string; password: string; phone?: string }) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const resData = await res.json();
      if (!res.ok) {
        return { success: false, error: resData.error || "Registration failed." };
      }

      localStorage.setItem("gtra_token", resData.token);
      setToken(resData.token);

      const profile = resData.user;
      const authUser: AuthUser = {
        uid: profile.id,
        id: profile.id,
        email: profile.email,
        displayName: profile.name,
        name: profile.name,
        firstName: profile.firstName,
        lastName: profile.lastName,
        loginIdentifier: profile.loginIdentifier,
        status: profile.status,
        mustChangePassword: false,
        assignments: [],
        photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.name)}`,
      };

      setUser(authUser);
      setPermissions(resData.permissions || []);
      setMustChangePassword(false);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: "Network error during registration." };
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!token) return { success: false, error: "Not authenticated" };

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Failed to update password." };
      }

      setMustChangePassword(false);
      if (user) {
        setUser({ ...user, mustChangePassword: false });
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: "Network error updating password." };
    }
  };

  const signOut = async () => {
    localStorage.removeItem("gtra_token");
    setToken(null);
    setUser(null);
    setPermissions([]);
    setMustChangePassword(false);
    try {
      await fbSignOut(auth);
    } catch {
      // ignore
    }
  };

  const refreshProfile = async () => {
    if (token) {
      await fetchProfile(token);
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.warn("Google popup error (preview/iframe fallback to GTRA dialog):", error);
    }
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;
    const isSystemAdmin = permissions.includes("users.deactivate") && permissions.includes("departments.manage");
    return isSystemAdmin || permissions.includes(permission);
  };

  const isStaff = Boolean(
    user && ((user.assignments && user.assignments.length > 0) || permissions.length > 0)
  );

  const isSystemAdmin = Boolean(
    user && (user.loginIdentifier === "admin@system-gtra.org" || (permissions.includes("users.deactivate") && permissions.includes("departments.manage")))
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        token,
        permissions,
        mustChangePassword,
        isStaff,
        isSystemAdmin,
        hasPermission,
        login,
        register,
        changePassword,
        signOut,
        refreshProfile,
        signInWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
