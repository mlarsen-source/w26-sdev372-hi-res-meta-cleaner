"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import styles from "./HeaderAuth.module.css";

export default function HeaderAuth() {
  const { user, logout } = useAuth();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <div className="header-auth" />;
  }

  return (
    <div className="header-auth">
      {user ? (
        <>
          <span className="user-greeting">{user.first_name || user.email}</span>
          <button type="button" className={`logout-button ${styles.logoutButton}`} onClick={() => void logout()}>
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
