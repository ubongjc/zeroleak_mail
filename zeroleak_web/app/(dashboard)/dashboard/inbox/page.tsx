/**
 * Inbox Page
 * View received emails
 */

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';

interface Email {
  id: string;
  alias: {
    email: string;
    merchant?: string;
  };
  from: string;
  subject?: string;
  preview?: string;
  receivedAt: string;
  read: boolean;
  isSpam: boolean;
  status: string;
}

export default function InboxPage() {
  const { getToken } = useAuth();
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchEmails();
  }, [filter]);

  const fetchEmails = async () => {
    try {
      const token = await getToken();
      const params = new URLSearchParams();
      if (filter === 'unread') params.append('unreadOnly', 'true');
      if (filter === 'spam') params.append('status', 'SPAM');

      const response = await fetch(`/api/inbox?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setEmails(data.emails || []);
    } catch (error) {
      console.error('Error fetching emails:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📬 Unified Inbox</h1>
          <p className="mt-2 text-gray-600">
            ALL emails from ALL your disposable addresses in one place
          </p>
        </div>
      </div>

      {/* Unified Inbox Explanation */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-purple-900 mb-2">
          ✨ One Inbox for Everything
        </h3>
        <p className="text-purple-800 text-sm mb-3">
          No matter which disposable email address you use (amazon@..., netflix@..., linkedin@...),
          <strong> all your emails appear here in one unified inbox</strong>. You don't need to check
          multiple inboxes or remember which email you used where!
        </p>
        <div className="bg-white border border-purple-200 rounded-lg p-4">
          <p className="text-sm text-purple-900">
            <strong>💡 Pro Tip:</strong> Even if you replace a leaked email address, all the old emails
            from that address stay here forever. Nothing is ever lost!
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex space-x-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'unread'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Unread
        </button>
        <button
          onClick={() => setFilter('spam')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'spam'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Spam
        </button>
      </div>

      {/* Email List */}
      <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
        {emails.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            No emails found
          </div>
        ) : (
          emails.map((email) => (
            <Link
              key={email.id}
              href={`/dashboard/inbox/${email.id}`}
              className="block px-6 py-4 hover:bg-gray-50 transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    {!email.read && (
                      <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                    )}
                    <p className={`text-sm ${email.read ? 'text-gray-700' : 'font-semibold text-gray-900'} truncate`}>
                      {email.from}
                    </p>
                    {email.isSpam && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded">
                        SPAM
                      </span>
                    )}
                  </div>
                  <p className={`text-sm mt-1 ${email.read ? 'text-gray-600' : 'font-medium text-gray-900'}`}>
                    {email.subject || '(No subject)'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1 truncate">
                    {email.preview}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    To: {email.alias.email}
                    {email.alias.merchant && ` (${email.alias.merchant})`}
                  </p>
                </div>
                <div className="ml-4 flex-shrink-0 text-right">
                  <p className="text-xs text-gray-500">
                    {new Date(email.receivedAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(email.receivedAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
