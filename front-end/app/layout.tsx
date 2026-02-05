import './globals.css';
import React, { ReactNode } from 'react';
import AuthProvider from './components/AuthProvider';
import HeaderAuth from './components/HeaderAuth';

export const metadata = {
  title: 'Hi-Res Meta Cleaner',
  description: 'Simplify and automate audio metadata management',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <header className="site-header">
            <h1>Hi-Res Meta Cleaner</h1>
            <nav>
              <HeaderAuth />
            </nav>
          </header>
          <main className="main-content">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}