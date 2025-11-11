/**
 * Inbox Page
 * View received emails with advanced search
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
  hasAttachments?: boolean;
}

interface SearchFilters {
  query: string;
  from: string;
  merchant: string;
  startDate: string;
  endDate: string;
  hasAttachments: boolean | null;
  isSpam: boolean | null;
  isRead: boolean | null;
}

export default function InboxPage() {
  const { getToken } = useAuth();
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    from: '',
    merchant: '',
    startDate: '',
    endDate: '',
    hasAttachments: null,
    isSpam: null,
    isRead: null,
  });
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchEmails();
  }, [filter]);

  const fetchEmails = async () => {
    try {
      setLoading(true);
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

  const performSearch = async () => {
    try {
      setIsSearching(true);
      const token = await getToken();
      const params = new URLSearchParams();

      // Add search parameters
      if (searchFilters.query) params.append('query', searchFilters.query);
      if (searchFilters.from) params.append('from', searchFilters.from);
      if (searchFilters.merchant) params.append('merchant', searchFilters.merchant);
      if (searchFilters.startDate) params.append('startDate', searchFilters.startDate);
      if (searchFilters.endDate) params.append('endDate', searchFilters.endDate);
      if (searchFilters.hasAttachments !== null) params.append('hasAttachments', String(searchFilters.hasAttachments));
      if (searchFilters.isSpam !== null) params.append('isSpam', String(searchFilters.isSpam));
      if (searchFilters.isRead !== null) params.append('isRead', String(searchFilters.isRead));

      const response = await fetch(`/api/inbox/search?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setEmails(data.emails || []);
    } catch (error) {
      console.error('Error searching emails:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchFilters({
      query: '',
      from: '',
      merchant: '',
      startDate: '',
      endDate: '',
      hasAttachments: null,
      isSpam: null,
      isRead: null,
    });
    fetchEmails();
  };

  const hasActiveFilters = Object.values(searchFilters).some(val =>
    val !== '' && val !== null
  );

  if (loading && !isSearching) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            📬 Unified Inbox
          </h1>
          <p className="mt-2 text-gray-600">
            ALL emails from ALL your disposable addresses in one place
          </p>
        </div>
      </div>

      {/* Unified Inbox Explanation */}
      <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50 border-2 border-purple-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-purple-900 mb-2">
          ✨ One Inbox for Everything
        </h3>
        <p className="text-purple-800 text-sm mb-3">
          No matter which disposable email address you use (amazon@..., netflix@..., linkedin@...),
          <strong> all your emails appear here in one unified inbox</strong>. You don't need to check
          multiple inboxes or remember which email you used where!
        </p>
        <div className="bg-white/80 backdrop-blur border border-purple-200 rounded-lg p-4">
          <p className="text-sm text-purple-900">
            <strong>💡 Pro Tip:</strong> Even if you replace a leaked email address, all the old emails
            from that address stay here forever. Nothing is ever lost!
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 shadow-sm border-2 border-blue-200">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchFilters.query}
              onChange={(e) => setSearchFilters({ ...searchFilters, query: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && performSearch()}
              placeholder="Search emails by subject, sender, content..."
              className="block w-full pl-10 pr-3 py-3 border-2 border-blue-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition"
            />
          </div>
          <button
            onClick={performSearch}
            disabled={isSearching}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md font-medium"
          >
            {isSearching ? (
              <span className="flex items-center space-x-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Searching...</span>
              </span>
            ) : (
              'Search'
            )}
          </button>
          <button
            onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
            className="px-4 py-3 bg-white border-2 border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition font-medium"
          >
            {showAdvancedSearch ? '− Filters' : '+ Filters'}
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearSearch}
              className="px-4 py-3 bg-red-100 border-2 border-red-300 text-red-700 rounded-lg hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition font-medium"
            >
              Clear
            </button>
          )}
        </div>

        {/* Advanced Search Filters */}
        {showAdvancedSearch && (
          <div className="mt-4 pt-4 border-t-2 border-blue-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fadeIn">
            <div>
              <label className="block text-sm font-medium text-blue-900 mb-1">From Address</label>
              <input
                type="text"
                value={searchFilters.from}
                onChange={(e) => setSearchFilters({ ...searchFilters, from: e.target.value })}
                placeholder="sender@example.com"
                className="block w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-900 mb-1">Merchant</label>
              <input
                type="text"
                value={searchFilters.merchant}
                onChange={(e) => setSearchFilters({ ...searchFilters, merchant: e.target.value })}
                placeholder="Amazon, Netflix..."
                className="block w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-900 mb-1">Start Date</label>
              <input
                type="date"
                value={searchFilters.startDate}
                onChange={(e) => setSearchFilters({ ...searchFilters, startDate: e.target.value })}
                className="block w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-900 mb-1">End Date</label>
              <input
                type="date"
                value={searchFilters.endDate}
                onChange={(e) => setSearchFilters({ ...searchFilters, endDate: e.target.value })}
                className="block w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-900 mb-1">Attachments</label>
              <select
                value={searchFilters.hasAttachments === null ? '' : String(searchFilters.hasAttachments)}
                onChange={(e) => setSearchFilters({ ...searchFilters, hasAttachments: e.target.value === '' ? null : e.target.value === 'true' })}
                className="block w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All</option>
                <option value="true">With Attachments</option>
                <option value="false">Without Attachments</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-900 mb-1">Status</label>
              <select
                value={searchFilters.isRead === null ? '' : String(searchFilters.isRead)}
                onChange={(e) => setSearchFilters({ ...searchFilters, isRead: e.target.value === '' ? null : e.target.value === 'true' })}
                className="block w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All</option>
                <option value="false">Unread</option>
                <option value="true">Read</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => { setFilter('all'); fetchEmails(); }}
          className={`px-5 py-2.5 rounded-lg font-medium transition shadow-sm ${
            filter === 'all'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105'
              : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-blue-300'
          }`}
        >
          📩 All
        </button>
        <button
          onClick={() => { setFilter('unread'); fetchEmails(); }}
          className={`px-5 py-2.5 rounded-lg font-medium transition shadow-sm ${
            filter === 'unread'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105'
              : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-blue-300'
          }`}
        >
          🔵 Unread
        </button>
        <button
          onClick={() => { setFilter('spam'); fetchEmails(); }}
          className={`px-5 py-2.5 rounded-lg font-medium transition shadow-sm ${
            filter === 'spam'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105'
              : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-red-300'
          }`}
        >
          🚫 Spam
        </button>
      </div>

      {/* Email List */}
      <div className="bg-white rounded-xl shadow-md divide-y divide-gray-200 overflow-hidden border border-gray-200">
        {isSearching ? (
          <div className="px-6 py-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Searching emails...</p>
          </div>
        ) : emails.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="mt-4 text-gray-500 font-medium">No emails found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search filters</p>
          </div>
        ) : (
          emails.map((email) => (
            <Link
              key={email.id}
              href={`/dashboard/inbox/${email.id}`}
              className="block px-6 py-5 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    {!email.read && (
                      <span className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse"></span>
                    )}
                    <p className={`text-sm ${email.read ? 'text-gray-700' : 'font-bold text-gray-900'} truncate group-hover:text-blue-700 transition`}>
                      {email.from}
                    </p>
                    {email.isSpam && (
                      <span className="px-2.5 py-0.5 text-xs font-bold bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full shadow-sm">
                        SPAM
                      </span>
                    )}
                    {email.hasAttachments && (
                      <span className="text-gray-400" title="Has attachments">
                        📎
                      </span>
                    )}
                  </div>
                  <p className={`text-sm mt-1.5 ${email.read ? 'text-gray-600' : 'font-semibold text-gray-900'} group-hover:text-blue-900 transition`}>
                    {email.subject || '(No subject)'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1.5 truncate">
                    {email.preview}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {email.alias.email}
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
  );
}
