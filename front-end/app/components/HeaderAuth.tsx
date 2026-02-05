"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";

export default function HeaderAuth() {
  const { user, logout } = useAuth();

  return (
    <div className="header-auth">
      {user ? (
        <>
          <span className="user-greeting">{user.first_name || user.email}</span>
          <button type="button" className="logout-button" onClick={() => void logout()}>
            Logout
          </button>
        </>
      ) : (
        <>
          <Link href="/login">
            <button type="button" className="login-button">Login</button>
          </Link>
          <Link href="/register">
            <button type="button" className="register-button">Register</button>
          </Link>
        </>
      )}
    </div>
  );
}
