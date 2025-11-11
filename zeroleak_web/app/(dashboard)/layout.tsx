/**
 * Dashboard Layout
 * Main layout for authenticated dashboard pages
 */

import { ReactNode } from 'react';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b-2 border-purple-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0">
              <Link href="/dashboard" className="text-xl sm:text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-700 transition">
                🔒 ZeroLeak
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex space-x-1">
              <Link
                href="/dashboard"
                className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg text-sm font-semibold transition-all"
              >
                📊 Dashboard
              </Link>
              <Link
                href="/dashboard/aliases"
                className="text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-3 py-2 rounded-lg text-sm font-semibold transition-all"
              >
                📧 Aliases
              </Link>
              <Link
                href="/dashboard/inbox"
                className="text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-lg text-sm font-semibold transition-all"
              >
                📬 Inbox
              </Link>
              <Link
                href="/dashboard/receipts"
                className="text-gray-700 hover:text-green-600 hover:bg-green-50 px-3 py-2 rounded-lg text-sm font-semibold transition-all"
              >
                🧾 Receipts
              </Link>
              <Link
                href="/dashboard/audit"
                className="text-gray-700 hover:text-orange-600 hover:bg-orange-50 px-3 py-2 rounded-lg text-sm font-semibold transition-all"
              >
                📋 Audit
              </Link>
              <Link
                href="/dashboard/settings"
                className="text-gray-700 hover:text-pink-600 hover:bg-pink-50 px-3 py-2 rounded-lg text-sm font-semibold transition-all"
              >
                ⚙️ Settings
              </Link>
            </nav>

            {/* Mobile Navigation - Simplified */}
            <nav className="lg:hidden flex items-center space-x-2 text-xs">
              <Link
                href="/dashboard"
                className="text-gray-700 hover:text-blue-600 px-2 py-1 rounded font-semibold"
                title="Dashboard"
              >
                📊
              </Link>
              <Link
                href="/dashboard/aliases"
                className="text-gray-700 hover:text-purple-600 px-2 py-1 rounded font-semibold"
                title="Aliases"
              >
                📧
              </Link>
              <Link
                href="/dashboard/inbox"
                className="text-gray-700 hover:text-indigo-600 px-2 py-1 rounded font-semibold"
                title="Inbox"
              >
                📬
              </Link>
              <Link
                href="/dashboard/settings"
                className="text-gray-700 hover:text-pink-600 px-2 py-1 rounded font-semibold"
                title="Settings"
              >
                ⚙️
              </Link>
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {children}
      </main>
    </div>
  );
}
