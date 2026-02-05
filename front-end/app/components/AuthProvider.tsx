"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  user_id: number | string;
  email: string;
  first_name?: string;
  last_name?: string;
};

type AuthContextType = {
  user: User | null;
  setUser: (u: User | null) => void;
  login: (u: User) => void;
  logout: () => Promise<void>;
  fetchWithAuth: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_KEY = "hires_meta_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const router = useRouter();
  const LocalSYSVAR = process.env.NEXT_PUBLIC_LOCAL_SYSVAR || 'http://localhost:3001';

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (raw) setUserState(JSON.parse(raw));
    } catch (e) {
      // ignore
    }
  }, []);

  const setUser = (u: User | null) => {
    setUserState(u);
    if (u) localStorage.setItem(LOCAL_KEY, JSON.stringify(u));
    else localStorage.removeItem(LOCAL_KEY);
  };

  const login = (u: User) => {
    setUser(u);
  };

  const logout = async () => {
    try {
      await fetch(`${LocalSYSVAR}/api/logout`, { method: "POST", credentials: "include" });
    } catch (e) {
      // ignore
    }
    setUser(null);
    router.push("/login");
  };

  // fetch wrapper that tries refresh on token expiry
  const fetchWithAuth = async (input: RequestInfo, init: RequestInit = {}) => {
    const baseInit: RequestInit = { credentials: "include", ...init };

    let target = input;
    if (typeof input === 'string' && input.startsWith('/api')) {
      target = `${LocalSYSVAR}${input}`;
    }

    let res = await fetch(target, baseInit);

    if (res.status === 401) {
      // try to parse message
      let json: any = null;
      try {
        json = await res.clone().json();
      } catch (e) {
        // ignore
      }

      const msg = json?.message || "";
      if (typeof msg === "string" && msg.toLowerCase().includes("token expired")) {
        // attempt refresh
        const refreshRes = await fetch(`${LocalSYSVAR}/api/refresh`, { method: "POST", credentials: "include" });
        if (refreshRes.ok) {
          // retry original request once
          res = await fetch(input, baseInit);
          return res;
        }
        // refresh failed
        setUser(null);
        router.push("/login");
        return res;
      }
    }

    return res;
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, fetchWithAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!user) router.push("/login");
  }, [user, router]);
  if (!user) return null;
  return <>{children}</>;
}

export default AuthProvider;
