import './globals.css';
import React, { ReactNode } from 'react';

export const metadata = {
  title: 'Hi-Res Meta Cleaner',
  description: 'Simplify and automate audio metadata management',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <h1>Hi-Res Meta Cleaner</h1>
          <nav>
            <button type="button" className="login-button">
              Login
            </button>
          </nav>
        </header>
        <main className="main-content">{children}</main>
      </body>
    </html>
  );
}