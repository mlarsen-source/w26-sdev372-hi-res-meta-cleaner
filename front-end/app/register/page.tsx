"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import NavBar from "../components/NavBar";

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(true);
  const setIsUploading = () => {};
  const router = useRouter();
  const LocalSYSVAR =
    process.env.NEXT_PUBLIC_LOCAL_SYSVAR || "http://localhost:3001";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
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
    <>
      <NavBar
        setIsUploading={setIsUploading}
        setHasSubmitted={setHasSubmitted}
        hasSubmitted={hasSubmitted}
        showActive={false}
        showNavActions={false}
        activeAuth="register"
      />
      <header className="page-header">
        <h1>Hi-Res Meta Cleaner</h1>
      </header>
      <div className="auth-page">
        <h2>Register</h2>
        <form
          onSubmit={handleSubmit}
          className="auth-form">
          <label>
            First Name:
            <input
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              required
            />
          </label>
          <label>
            Last Name:
            <input
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              required
            />
          </label>
          <label>
            Email:
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              required
            />
          </label>
          <label>
            Password:
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              required
            />
          </label>
          <label>
            Confirm Password:
            <input
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              type="password"
              required
            />
          </label>
          {errors && <div className="error">{errors}</div>}
          <button
            type="submit"
            className="submit-button">
            Register
          </button>
        </form>
      </div>
    </>
  );
}
