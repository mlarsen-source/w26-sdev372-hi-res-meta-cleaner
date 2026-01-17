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
        <header className="bg-gray-900 text-white p-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Hi-Res Meta Cleaner</h1>
          <nav>
            <button className="bg-blue-600 px-3 py-1 rounded hover:bg-blue-700">
              Login
            </button>
          </nav>
        </header>
        <main className="p-8">{children}</main>
      </body>
    </html>
  );
}