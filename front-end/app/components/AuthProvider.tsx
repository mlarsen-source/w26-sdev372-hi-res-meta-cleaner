"use client";

import React, { createContext, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "../lib/apiBaseUrl";

type User = {
  user_id: number | string;
  email: string;
  first_name?: string;
  last_name?: string;
};

type AuthContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  login: (user: User) => void;
  logout: () => Promise<void>;
  fetchWithAuth: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "hires_meta_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const storedUserData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedUserData) return JSON.parse(storedUserData);
    } catch (error) {
      console.error("Failed to parse stored user data:", error);
    }
    return null;
  });
  const router = useRouter();

  const setUser = (updatedUser: User | null) => {
    setUserState(updatedUser);
    if (updatedUser) localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedUser));
    else localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  const login = (newUser: User) => {
    setUser(newUser);
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/logout`, { method: "POST", credentials: "include" });
    } catch (error) {
      console.error("Logout request failed:", error);
    }
    setUser(null);
    router.push("/login");
  };

  // fetch wrapper that tries refresh on token expiry
  const fetchWithAuth = async (input: RequestInfo, init: RequestInit = {}) => {
    const requestInit: RequestInit = { credentials: "include", ...init };

    let requestUrl = input;
    if (typeof input === "string" && input.startsWith("/api")) {
      requestUrl = `${API_BASE_URL}${input}`;
    }

    let response = await fetch(requestUrl, requestInit);

    if (response.status === 401) {
      let responseData: unknown = null;
      try {
        responseData = await response.clone().json();
      } catch {
        responseData = null;
      }

      const errorMessage =
        (responseData as { error?: string; message?: string })?.error ||
        (responseData as { error?: string; message?: string })?.message ||
        "";

      if (
        typeof errorMessage === "string" &&
        errorMessage.toLowerCase().includes("token expired")
      ) {
        const refreshResponse = await fetch(`${API_BASE_URL}/api/refresh`, {
          method: "POST",
          credentials: "include",
        });

        if (refreshResponse.ok) {
          response = await fetch(requestUrl, requestInit);
          return response;
        }
      }

      setUser(null);
      router.push("/login");
    }

    return response;
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, fetchWithAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export default AuthProvider;
