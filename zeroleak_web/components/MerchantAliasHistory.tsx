/**
 * Merchant Alias History Component
 * Shows all email addresses (past and present) used for a specific merchant
 */

'use client';

import { useEffect, useState } from 'react';

interface MerchantAliasHistoryProps {
  merchantGroup: string;
  onClose: () => void;
}

export default function MerchantAliasHistory({ merchantGroup, onClose }: MerchantAliasHistoryProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [merchantGroup]);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`/api/alias/replace?merchantGroup=${encodeURIComponent(merchantGroup)}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <p>Loading history...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4 my-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Email History: {data.merchant || merchantGroup}
            </h2>
            <p className="text-gray-600 mt-1">
              All email addresses you've used with this merchant
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600">Total Aliases</p>
            <p className="text-2xl font-bold text-blue-900">{data.stats.totalAliases}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-600">Total Emails</p>
            <p className="text-2xl font-bold text-green-900">{data.stats.totalEmails}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-purple-600">Active</p>
            <p className="text-2xl font-bold text-purple-900">{data.stats.activeCount}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-sm text-red-600">Leaked</p>
            <p className="text-2xl font-bold text-red-900">{data.stats.leakedCount}</p>
          </div>
        </div>

        {/* Current Active Alias */}
        {data.currentAlias && (
          <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium mb-1">✓ Current Active Email</p>
                <p className="text-xl font-mono font-bold text-green-900">
                  {data.currentAlias.email}
                </p>
                <p className="text-sm text-green-700 mt-1">
                  Created: {new Date(data.currentAlias.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(data.currentAlias.email)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                📋 Copy
              </button>
            </div>
          </div>
        )}

        {/* Replacement Chain */}
        {data.replacementChain && data.replacementChain.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              📜 Email Address Evolution
            </h3>
            <div className="space-y-3">
              {data.replacementChain.map((item: any, index: number) => (
                <div key={item.id}>
                  <div
                    className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                      item.status === 'ACTIVE'
                        ? 'bg-green-50 border-green-300'
                        : item.status === 'LEAKED'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                          item.status === 'ACTIVE'
                            ? 'bg-green-600'
                            : item.status === 'LEAKED'
                            ? 'bg-red-600'
                            : 'bg-gray-400'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-mono text-sm font-medium text-gray-900">
                          {item.email}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(item.createdAt).toLocaleDateString()}
                          {item.killedAt &&
                            ` - ${new Date(item.killedAt).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        item.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : item.status === 'LEAKED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {item.reason}
                    </span>
                  </div>
                  {index < data.replacementChain.length - 1 && (
                    <div className="flex justify-center my-2">
                      <div className="text-gray-400">↓ Replaced by</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Full History Table */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            📋 Complete History
          </h3>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email Address
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Emails
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Created
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.history.map((alias: any) => (
                  <tr key={alias.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono text-gray-900">
                      {alias.email}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          alias.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : alias.status === 'LEAKED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {alias.status}
                        {alias.breachDetected && ' 🚨'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {alias.emailCount}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(alias.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {alias.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Understanding Your History</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              <strong>All emails are preserved:</strong> Even if you replace an address, you can
              still see all the old emails in your inbox
            </li>
            <li>
              <strong>Each address is tracked:</strong> You can see exactly when each email was
              created, used, and replaced
            </li>
            <li>
              <strong>Leak detection:</strong> Red badges (🚨) indicate the email was found in a
              data breach
            </li>
            <li>
              <strong>Easy replacement:</strong> When an email is leaked, you can instantly create
              a new one
            </li>
          </ul>
        </div>

        {/* Close Button */}
        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
