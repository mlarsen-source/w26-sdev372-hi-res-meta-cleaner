"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<string | null>(null);
  const router = useRouter();
  const LocalSYSVAR = process.env.NEXT_PUBLIC_LOCAL_SYSVAR || 'http://localhost:3001';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(null);
    if (password !== confirmPassword) {
      setErrors("Passwords do not match");
      return;
    }

    try {
      const res = await fetch(`${LocalSYSVAR}/api/user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setErrors(json?.message || "Registration failed");
        return;
      }

      // success -> redirect to login
      router.push("/login");
    } catch (err) {
      console.error(err);
      setErrors("Registration failed");
    }
  };

  return (
    <div className="auth-page">
      <h2>Register</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          First Name
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </label>
        <label>
          Last Name
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </label>
        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </label>
        <label>
          Password
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </label>
        <label>
          Confirm Password
          <input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" required />
        </label>
        {errors && <div className="error">{errors}</div>}
        <button type="submit" className="submit-button">Register</button>
      </form>
    </div>
  );
}
