/**
 * Aliases Management Page
 * View and manage email aliases
 */

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';

interface Alias {
  id: string;
  email: string;
  merchant?: string;
  status: string;
  createdAt: string;
  eventCount: number;
  receiptCount: number;
}

export default function AliasesPage() {
  const { getToken } = useAuth();
  const [aliases, setAliases] = useState<Alias[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    merchant: '',
    localPart: '',
    domain: 'zeroleak.email',
    enableDecoy: true,
  });

  useEffect(() => {
    fetchAliases();
  }, []);

  const fetchAliases = async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/alias', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setAliases(data.aliases || []);
    } catch (error) {
      console.error('Error fetching aliases:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAlias = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await getToken();
      const response = await fetch('/api/alias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(createForm),
      });

      if (response.ok) {
        setShowCreateForm(false);
        setCreateForm({ merchant: '', localPart: '', domain: 'zeroleak.email', enableDecoy: true });
        fetchAliases();
      }
    } catch (error) {
      console.error('Error creating alias:', error);
    }
  };

  const killAlias = async (aliasId: string) => {
    if (!confirm('Are you sure you want to kill this alias? It will stop receiving emails.')) {
      return;
    }

    try {
      const token = await getToken();
      await fetch('/api/alias/kill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ aliasId }),
      });
      fetchAliases();
    } catch (error) {
      console.error('Error killing alias:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Aliases</h1>
          <p className="mt-2 text-gray-600">Manage your disposable email addresses</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          ➕ Create Alias
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Create New Alias</h2>
          <form onSubmit={createAlias} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Merchant/Service</label>
              <input
                type="text"
                value={createForm.merchant}
                onChange={(e) => setCreateForm({ ...createForm, merchant: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g., Amazon, Netflix, etc."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Custom Email (optional)</label>
              <div className="mt-1 flex">
                <input
                  type="text"
                  value={createForm.localPart}
                  onChange={(e) => setCreateForm({ ...createForm, localPart: e.target.value })}
                  className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="custom-name"
                />
                <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500">
                  @{createForm.domain}
                </span>
              </div>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enableDecoy"
                checked={createForm.enableDecoy}
                onChange={(e) => setCreateForm({ ...createForm, enableDecoy: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="enableDecoy" className="ml-2 block text-sm text-gray-700">
                Enable decoy seeding (detects if email is leaked)
              </label>
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email Alias
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Merchant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Emails
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {aliases.map((alias) => (
              <tr key={alias.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <button
                      onClick={() => navigator.clipboard.writeText(alias.email)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      {alias.email} 📋
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {alias.merchant || '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={alias.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {alias.eventCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(alias.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {alias.status === 'ACTIVE' && (
                    <button
                      onClick={() => killAlias(alias.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Kill
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
