"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/AuthProvider";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { login } = useAuth();
  const LocalSYSVAR = process.env.NEXT_PUBLIC_LOCAL_SYSVAR || 'http://localhost:3001';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch(`${LocalSYSVAR}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        if (res.status === 401) setError("Invalid email or password");
        else setError("Login failed");
        return;
      }
      const data = await res.json();
      // backend may return either { user: {...} } or { user_id, email, ... }
      let userObj = null;
      if (data?.user) userObj = data.user;
      else if (data?.user_id) userObj = {
        user_id: data.user_id,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
      };

      if (userObj) {
        login(userObj);
        router.push("/");
      } else {
        setError("Login succeeded but no user returned");
      }
    } catch (err) {
      setError("Login failed");
      console.error(err);
    }
  };

  return (
    <div className="auth-page">
      <h2>Login</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </label>
        <label>
          Password
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </label>
        {error && <div className="error">{error}</div>}
        <button type="submit" className="submit-button">Login</button>
      </form>
    </div>
  );
}
