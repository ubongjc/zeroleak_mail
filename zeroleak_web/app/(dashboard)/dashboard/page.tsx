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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Overview of your disposable email aliases and security status
        </p>
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
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/dashboard/aliases?action=create"
            className="flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            ➕ Create New Alias
          </Link>
          <Link
            href="/dashboard/inbox"
            className="flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            📬 View Inbox
          </Link>
          <Link
            href="/dashboard/audit"
            className="flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            📊 Audit Log
          </Link>
        </div>
      </div>

      {/* Recent Aliases */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Recent Aliases</h2>
          <Link href="/dashboard/aliases" className="text-sm text-blue-600 hover:text-blue-700">
            View all →
          </Link>
        </div>
        <div className="divide-y divide-gray-200">
          {recentAliases.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No aliases yet. Create your first one!
            </div>
          ) : (
            recentAliases.map((alias) => (
              <div key={alias.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {alias.localPart}@{alias.domain}
                    </p>
                    <p className="text-sm text-gray-500">{alias.merchant || 'No merchant'}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-xs text-gray-500">
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
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Recent Emails</h2>
          <Link href="/dashboard/inbox" className="text-sm text-blue-600 hover:text-blue-700">
            View all →
          </Link>
        </div>
        <div className="divide-y divide-gray-200">
          {recentEmails.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No emails received yet
            </div>
          ) : (
            recentEmails.map((email) => (
              <Link
                key={email.id}
                href={`/dashboard/inbox/${email.id}`}
                className="block px-6 py-4 hover:bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      {!email.read && (
                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                      )}
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {email.fromAddress}
                      </p>
                      {email.isSpam && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded">
                          SPAM
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-900 mt-1">{email.subject || '(No subject)'}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      To: {email.alias.localPart}@{email.alias.domain}
                      {email.alias.merchant && ` (${email.alias.merchant})`}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <p className="text-xs text-gray-500">
                      {new Date(email.receivedAt).toLocaleDateString()}
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
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    ACTIVE: { label: 'Active', class: 'bg-green-100 text-green-800' },
    KILLED: { label: 'Killed', class: 'bg-gray-100 text-gray-800' },
    LEAKED: { label: 'Leaked', class: 'bg-red-100 text-red-800' },
    SUSPENDED: { label: 'Suspended', class: 'bg-yellow-100 text-yellow-800' },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ACTIVE;

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded ${config.class}`}>
      {config.label}
    </span>
  );
}
