/**
 * Replace Alias Modal
 * Easy workflow to replace a leaked/compromised email alias
 */

'use client';

import { useState } from 'react';

interface ReplaceAliasModalProps {
  alias: {
    id: string;
    email: string;
    merchant?: string;
    status: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReplaceAliasModal({ alias, onClose, onSuccess }: ReplaceAliasModalProps) {
  const [customEmail, setCustomEmail] = useState('');
  const [enableDecoy, setEnableDecoy] = useState(true);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleReplace = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/alias/replace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldAliasId: alias.id,
          customLocalPart: customEmail || undefined,
          enableDecoy,
          notes,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error replacing alias:', error);
      alert('Failed to replace alias. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  if (result) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-900">
              New Email Address Created!
            </h2>
          </div>

          <div className="space-y-6">
            {/* Old Email */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium">Old Email (Compromised)</p>
                  <p className="text-lg font-mono text-red-800">{result.oldAlias.email}</p>
                </div>
                <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full">
                  ❌ {result.oldAlias.status}
                </span>
              </div>
            </div>

            {/* New Email */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">New Email Address</p>
                    <p className="text-xl font-mono font-bold text-green-800">
                      {result.newAlias.email}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                    ✓ ACTIVE
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(result.newAlias.email)}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  📋 Copy New Email Address
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">📝 What to do next:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                <li>
                  <strong>Go to {alias.merchant || 'the merchant'}'s website</strong>
                </li>
                <li>
                  <strong>Navigate to Account Settings or Profile</strong>
                </li>
                <li>
                  <strong>Update your email to:</strong>
                  <div className="ml-6 mt-1 p-2 bg-white rounded border border-blue-300">
                    <code className="text-green-600 font-bold">{result.newAlias.email}</code>
                  </div>
                </li>
                <li>
                  <strong>Verify the new email</strong> (check your inbox)
                </li>
              </ol>
            </div>

            {/* Important Notes */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900 mb-2">💡 Important:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
                <li>
                  <strong>All your old emails are safe</strong> - You can still view them in your inbox
                </li>
                <li>
                  <strong>The old email is now blocked</strong> - It won't receive new messages
                </li>
                <li>
                  <strong>Your new email has leak detection enabled</strong> - You'll be notified if it's compromised
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  onSuccess();
                  onClose();
                }}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Done
              </button>
              <button
                onClick={() => copyToClipboard(result.newAlias.email)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Copy Email Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-xl w-full mx-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Replace Leaked Email Address
        </h2>
        <p className="text-gray-600 mb-6">
          Create a new email address for <strong>{alias.merchant || 'this merchant'}</strong>.
          All your previous emails will remain accessible.
        </p>

        {/* Current Email */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-600 mb-1">Current Email (Compromised)</p>
          <p className="text-lg font-mono text-red-800">{alias.email}</p>
        </div>

        {/* Form */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Email (optional)
            </label>
            <div className="flex items-center">
              <input
                type="text"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder="e.g., amazon-secure"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="px-4 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-gray-600">
                @zeroleak.email
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Leave blank to auto-generate a random address
            </p>
          </div>

          <div className="flex items-start">
            <input
              type="checkbox"
              id="enableDecoy"
              checked={enableDecoy}
              onChange={(e) => setEnableDecoy(e.target.checked)}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="enableDecoy" className="ml-2 text-sm text-gray-700">
              <strong>Enable leak detection</strong> (recommended)<br />
              <span className="text-gray-500">
                Automatically detect if this email is leaked again
              </span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Replaced after 2024 breach"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">✨ What happens next:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ A new email address will be created</li>
            <li>✓ The old email will be permanently disabled</li>
            <li>✓ All your previous emails stay in your inbox</li>
            <li>✓ You'll get instructions on how to update the merchant</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={handleReplace}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
          >
            {loading ? 'Creating...' : '🔄 Replace Email Address'}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
