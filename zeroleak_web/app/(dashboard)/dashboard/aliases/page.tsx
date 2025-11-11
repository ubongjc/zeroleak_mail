/**
 * Aliases Management Page
 * View and manage email aliases with easy replacement workflow
 */

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import dynamic from 'next/dynamic';

// Dynamic imports for modals
const ReplaceAliasModal = dynamic(() => import('@/components/ReplaceAliasModal'), { ssr: false });
const MerchantAliasHistory = dynamic(() => import('@/components/MerchantAliasHistory'), { ssr: false });

interface Alias {
  id: string;
  email: string;
  merchant?: string;
  merchantGroup?: string;
  status: string;
  createdAt: string;
  eventCount: number;
  receiptCount: number;
  breachDetected?: boolean;
}

export default function AliasesPage() {
  const { getToken } = useAuth();
  const [aliases, setAliases] = useState<Alias[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedAliasForReplace, setSelectedAliasForReplace] = useState<Alias | null>(null);
  const [selectedMerchantForHistory, setSelectedMerchantForHistory] = useState<string | null>(null);
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
    if (!confirm('Are you sure you want to kill this alias? It will stop receiving emails.\n\nNote: All your previous emails will still be accessible in your inbox!')) {
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

  const leakedAliases = aliases.filter(a => a.status === 'LEAKED' || a.breachDetected);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Aliases</h1>
          <p className="mt-2 text-gray-600">
            Create unique, disposable email addresses for each merchant or service
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          ➕ Create New Alias
        </button>
      </div>

      {/* Key Benefits Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          ✨ How Disposable Emails Protect You
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">🛡️</span>
            <div>
              <p className="font-medium text-blue-900">Hide Your Real Email</p>
              <p className="text-sm text-blue-700">
                Merchants never see your actual email address
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-2xl">🔄</span>
            <div>
              <p className="font-medium text-blue-900">Easy Replacement</p>
              <p className="text-sm text-blue-700">
                If leaked, instantly create a new email with one click
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-2xl">📬</span>
            <div>
              <p className="font-medium text-blue-900">One Unified Inbox</p>
              <p className="text-sm text-blue-700">
                View ALL emails from all aliases in one place
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Leaked Aliases Alert */}
      {leakedAliases.length > 0 && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">
                🚨 {leakedAliases.length} Email{leakedAliases.length > 1 ? 's' : ''} Detected in Data Breach
              </h3>
              <p className="text-red-800 mb-4">
                These email addresses were found in data breaches. You should replace them immediately
                to protect your privacy.
              </p>
              <ul className="space-y-2">
                {leakedAliases.map(alias => (
                  <li key={alias.id} className="flex items-center justify-between bg-white rounded p-3">
                    <div>
                      <p className="font-mono text-sm font-medium text-red-900">{alias.email}</p>
                      <p className="text-xs text-red-700">Used with: {alias.merchant || 'Unknown'}</p>
                    </div>
                    <button
                      onClick={() => setSelectedAliasForReplace(alias)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                    >
                      🔄 Replace Now
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Create New Disposable Email</h2>
          <form onSubmit={createAlias} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Merchant/Service Name
              </label>
              <input
                type="text"
                value={createForm.merchant}
                onChange={(e) => setCreateForm({ ...createForm, merchant: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2"
                placeholder="e.g., Amazon, Netflix, LinkedIn"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                This helps you identify which email is for which service
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custom Email (optional)
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={createForm.localPart}
                  onChange={(e) => setCreateForm({ ...createForm, localPart: e.target.value })}
                  className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2"
                  placeholder="custom-name"
                />
                <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500">
                  @{createForm.domain}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Leave blank to auto-generate a random, secure address
              </p>
            </div>
            <div className="flex items-start">
              <input
                type="checkbox"
                id="enableDecoy"
                checked={createForm.enableDecoy}
                onChange={(e) => setCreateForm({ ...createForm, enableDecoy: e.target.checked })}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="enableDecoy" className="ml-2 text-sm text-gray-700">
                <strong>Enable leak detection</strong> (recommended)<br />
                <span className="text-gray-500">
                  Automatically detects if this email is leaked in a data breach
                </span>
              </label>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>💡 Pro Tip:</strong> Create a unique email for every merchant. If one gets leaked,
                you can instantly replace it without affecting your other accounts!
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Create Disposable Email
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Aliases Table */}
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
            {aliases.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  <div className="text-4xl mb-3">📧</div>
                  <p className="font-medium">No email aliases yet</p>
                  <p className="text-sm mt-1">Create your first disposable email to get started!</p>
                </td>
              </tr>
            ) : (
              aliases.map((alias) => (
                <tr key={alias.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => navigator.clipboard.writeText(alias.email)}
                        className="text-sm font-medium font-mono text-blue-600 hover:text-blue-800"
                        title="Click to copy"
                      >
                        {alias.email}
                      </button>
                      {alias.breachDetected && (
                        <span className="text-red-600" title="Breach detected!">🚨</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {alias.merchant ? (
                      <div className="flex items-center space-x-2">
                        <span>{alias.merchant}</span>
                        {alias.merchantGroup && (
                          <button
                            onClick={() => setSelectedMerchantForHistory(alias.merchantGroup!)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                            title="View email history for this merchant"
                          >
                            📜 History
                          </button>
                        )}
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={alias.status} breachDetected={alias.breachDetected} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {alias.eventCount}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(alias.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                    {(alias.status === 'LEAKED' || alias.breachDetected) && (
                      <button
                        onClick={() => setSelectedAliasForReplace(alias)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        🔄 Replace
                      </button>
                    )}
                    {alias.status === 'ACTIVE' && !alias.breachDetected && (
                      <button
                        onClick={() => killAlias(alias.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Kill
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Info Box */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">📘 How to Use Your Disposable Emails</h3>
        <div className="space-y-3 text-sm text-gray-700">
          <div className="flex items-start space-x-2">
            <span className="font-bold text-blue-600">1.</span>
            <p>
              <strong>Copy the email address</strong> by clicking on it
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="font-bold text-blue-600">2.</span>
            <p>
              <strong>Use it when signing up</strong> for services, newsletters, or online shopping
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="font-bold text-blue-600">3.</span>
            <p>
              <strong>View all emails</strong> from all your aliases in the unified Inbox
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="font-bold text-blue-600">4.</span>
            <p>
              <strong>If leaked or compromised,</strong> click "Replace" to instantly create a new email
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="font-bold text-blue-600">5.</span>
            <p>
              <strong>Update the merchant</strong> with your new email address - all old emails remain accessible!
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedAliasForReplace && (
        <ReplaceAliasModal
          alias={selectedAliasForReplace}
          onClose={() => setSelectedAliasForReplace(null)}
          onSuccess={() => {
            fetchAliases();
            setSelectedAliasForReplace(null);
          }}
        />
      )}

      {selectedMerchantForHistory && (
        <MerchantAliasHistory
          merchantGroup={selectedMerchantForHistory}
          onClose={() => setSelectedMerchantForHistory(null)}
        />
      )}
    </div>
  );
}

function StatusBadge({ status, breachDetected }: { status: string; breachDetected?: boolean }) {
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
      {breachDetected && ' 🚨'}
    </span>
  );
}
