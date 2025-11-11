/**
 * Audit Log Page
 * Transparent view of all security events and actions
 */

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';

interface AuditLog {
  id: string;
  action: string;
  resource?: string;
  metadata?: any;
  timestamp: string;
  ipAddress?: string;
}

export default function AuditPage() {
  const { getToken } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/audit', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Audit Log</h1>
        <p className="mt-2 text-gray-600">
          Complete transparency of all actions and security events
        </p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resource
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP Address
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No audit logs yet
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ActionBadge action={log.action} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {log.resource || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {log.metadata && (
                        <details className="cursor-pointer">
                          <summary className="text-blue-600 hover:text-blue-800">
                            View details
                          </summary>
                          <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.ipAddress || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-blue-600 text-xl">🔒</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Transparent Auditing</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                All actions in ZeroLeak Mail are logged for complete transparency. This includes:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Alias creation, modification, and deletion</li>
                <li>Leak detection and automatic alias kills</li>
                <li>Email forwarding and spam detection</li>
                <li>Data export and security events</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionBadge({ action }: { action: string }) {
  const actionConfig: Record<string, { label: string; class: string }> = {
    ALIAS_CREATED: { label: 'Alias Created', class: 'bg-green-100 text-green-800' },
    ALIAS_KILLED: { label: 'Alias Killed', class: 'bg-gray-100 text-gray-800' },
    ALIAS_AUTO_KILLED: { label: 'Auto-Killed', class: 'bg-red-100 text-red-800' },
    LEAK_DETECTED: { label: 'Leak Detected', class: 'bg-red-100 text-red-800' },
    RECEIPTS_EXPORTED: { label: 'Export', class: 'bg-blue-100 text-blue-800' },
  };

  const config = actionConfig[action] || { label: action, class: 'bg-gray-100 text-gray-800' };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded ${config.class}`}>
      {config.label}
    </span>
  );
}
