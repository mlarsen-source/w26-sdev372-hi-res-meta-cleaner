import './globals.css';
import React, { ReactNode } from 'react';
import AuthProvider from './components/AuthProvider';

export const metadata = {
  title: 'Hi-Res Meta Cleaner',
  description: 'Simplify and automate audio metadata management',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <main className="main-content">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
