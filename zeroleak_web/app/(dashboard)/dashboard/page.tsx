/**
 * Dashboard Home Page
 * Overview of aliases, emails, and security status
 */

import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    redirect('/sign-in');
  }

  // Get or create user
  const user = await prisma.user.upsert({
    where: { clerkId },
    update: {},
    create: {
      clerkId,
      email: '', // Will be updated from Clerk
    },
  });

  // Get statistics
  const [
    totalAliases,
    activeAliases,
    killedAliases,
    leakedAliases,
    totalEmails,
    unreadEmails,
    spamEmails,
    recentAliases,
    recentEmails,
  ] = await Promise.all([
    prisma.alias.count({ where: { userId: user.id } }),
    prisma.alias.count({ where: { userId: user.id, status: 'ACTIVE' } }),
    prisma.alias.count({ where: { userId: user.id, status: 'KILLED' } }),
    prisma.alias.count({ where: { userId: user.id, status: 'LEAKED' } }),
    prisma.emailMessage.count({
      where: { alias: { userId: user.id } },
    }),
    prisma.emailMessage.count({
      where: { alias: { userId: user.id }, read: false },
    }),
    prisma.emailMessage.count({
      where: { alias: { userId: user.id }, isSpam: true },
    }),
    prisma.alias.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        _count: {
          select: {
            emailMessages: true,
            relayEvents: true,
          },
        },
      },
    }),
    prisma.emailMessage.findMany({
      where: { alias: { userId: user.id } },
      orderBy: { receivedAt: 'desc' },
      take: 5,
      include: {
        alias: {
          select: {
            localPart: true,
            domain: true,
            merchant: true,
          },
        },
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 shadow-xl">
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white">Welcome to ZeroLeak Mail 🔒</h1>
          <p className="mt-3 text-blue-100 text-lg">
            Your private, secure disposable email service with transparent auditing
          </p>
        </div>
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Aliases"
          value={totalAliases}
          subtitle={`${activeAliases} active`}
          icon="📧"
          color="blue"
        />
        <StatCard
          title="Unread Emails"
          value={unreadEmails}
          subtitle={`${totalEmails} total`}
          icon="📬"
          color="green"
        />
        <StatCard
          title="Leaked Aliases"
          value={leakedAliases}
          subtitle="Data breaches detected"
          icon="🚨"
          color="red"
        />
        <StatCard
          title="Spam Blocked"
          value={spamEmails}
          subtitle="Spam messages filtered"
          icon="🛡️"
          color="purple"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-xl shadow-md p-6 border-2 border-indigo-200">
        <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center">
          <span className="text-2xl mr-2">⚡</span>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/dashboard/aliases?action=create"
            className="group flex items-center justify-center px-6 py-4 border-2 border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            <span className="text-xl mr-2">➕</span>
            Create New Alias
          </Link>
          <Link
            href="/dashboard/inbox"
            className="group flex items-center justify-center px-6 py-4 border-2 border-indigo-300 text-sm font-bold rounded-xl text-indigo-700 bg-white hover:bg-indigo-50 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            <span className="text-xl mr-2">📬</span>
            View Inbox
          </Link>
          <Link
            href="/dashboard/audit"
            className="group flex items-center justify-center px-6 py-4 border-2 border-purple-300 text-sm font-bold rounded-xl text-purple-700 bg-white hover:bg-purple-50 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            <span className="text-xl mr-2">📊</span>
            Audit Log
          </Link>
        </div>
      </div>

      {/* Recent Aliases */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <span className="text-2xl mr-2">📧</span>
            Recent Aliases
          </h2>
          <Link
            href="/dashboard/aliases"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center transition"
          >
            View all
            <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        <div className="divide-y divide-gray-200">
          {recentAliases.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-500 font-medium">No aliases yet. Create your first one!</p>
            </div>
          ) : (
            recentAliases.map((alias) => (
              <div key={alias.id} className="px-6 py-5 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900 flex items-center">
                      <span className="mr-2">✉️</span>
                      {alias.localPart}@{alias.domain}
                    </p>
                    <p className="text-sm text-gray-600 mt-1 flex items-center">
                      <span className="mr-1">🏪</span>
                      {alias.merchant || 'No merchant'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {alias._count.emailMessages} emails
                    </span>
                    <StatusBadge status={alias.status} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Emails */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 bg-gradient-to-r from-purple-50 to-pink-50 border-b-2 border-purple-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <span className="text-2xl mr-2">📬</span>
            Recent Emails
          </h2>
          <Link
            href="/dashboard/inbox"
            className="text-sm font-semibold text-purple-600 hover:text-purple-700 flex items-center transition"
          >
            View all
            <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        <div className="divide-y divide-gray-200">
          {recentEmails.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-500 font-medium">No emails received yet</p>
            </div>
          ) : (
            recentEmails.map((email) => (
              <Link
                key={email.id}
                href={`/dashboard/inbox/${email.id}`}
                className="block px-6 py-5 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-200 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      {!email.read && (
                        <span className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse"></span>
                      )}
                      <p className="text-sm font-bold text-gray-900 truncate group-hover:text-purple-700 transition">
                        {email.fromAddress}
                      </p>
                      {email.isSpam && (
                        <span className="px-2.5 py-0.5 text-xs font-bold bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full shadow-sm">
                          SPAM
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-900 mt-1.5 font-medium">{email.subject || '(No subject)'}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {email.alias.localPart}@{email.alias.domain}
                      </span>
                      {email.alias.merchant && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          🏪 {email.alias.merchant}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ml-6 flex-shrink-0 text-right">
                    <p className="text-xs font-medium text-gray-600">
                      {new Date(email.receivedAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(email.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: string;
  color: 'blue' | 'green' | 'red' | 'purple';
}) {
  const colorClasses = {
    blue: {
      gradient: 'from-blue-500 to-indigo-600',
      iconBg: 'bg-blue-100',
      iconText: 'text-blue-600',
      border: 'border-blue-200',
    },
    green: {
      gradient: 'from-green-500 to-emerald-600',
      iconBg: 'bg-green-100',
      iconText: 'text-green-600',
      border: 'border-green-200',
    },
    red: {
      gradient: 'from-red-500 to-pink-600',
      iconBg: 'bg-red-100',
      iconText: 'text-red-600',
      border: 'border-red-200',
    },
    purple: {
      gradient: 'from-purple-500 to-pink-600',
      iconBg: 'bg-purple-100',
      iconText: 'text-purple-600',
      border: 'border-purple-200',
    },
  };

  const colors = colorClasses[color];

  return (
    <div className={`relative overflow-hidden bg-white rounded-xl shadow-lg border-2 ${colors.border} p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}>
      <div className="flex items-center justify-between">
        <div className="z-10">
          <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{title}</p>
          <p className={`mt-3 text-4xl font-bold bg-gradient-to-r ${colors.gradient} bg-clip-text text-transparent`}>
            {value}
          </p>
          <p className="mt-2 text-xs text-gray-500 font-medium">{subtitle}</p>
        </div>
        <div className={`p-4 rounded-2xl ${colors.iconBg} shadow-md`}>
          <span className={`text-3xl ${colors.iconText}`}>{icon}</span>
        </div>
      </div>
      <div className={`absolute -bottom-6 -right-6 w-32 h-32 bg-gradient-to-br ${colors.gradient} opacity-10 rounded-full blur-2xl`}></div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    ACTIVE: { label: '✓ Active', class: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md' },
    KILLED: { label: '✗ Killed', class: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md' },
    LEAKED: { label: '⚠ Leaked', class: 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-md' },
    SUSPENDED: { label: '⏸ Suspended', class: 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-md' },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ACTIVE;

  return (
    <span className={`px-3 py-1.5 text-xs font-bold rounded-full ${config.class}`}>
      {config.label}
    </span>
  );
}
