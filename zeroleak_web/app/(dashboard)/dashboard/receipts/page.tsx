/**
 * Receipts Page
 * View and export receipts for tax purposes
 */

'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';

export default function ReceiptsPage() {
  const { getToken } = useAuth();
  const [exporting, setExporting] = useState(false);

  const exportReceipts = async (format: 'csv' | 'json' | 'summary') => {
    setExporting(true);
    try {
      const token = await getToken();
      const response = await fetch(`/api/export/receipts?format=${format}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipts-${new Date().getFullYear()}.csv`;
        a.click();
      } else {
        const data = await response.json();
        console.log('Export data:', data);
        alert('Export successful! Check console for data.');
      }
    } catch (error) {
      console.error('Error exporting receipts:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Receipts</h1>
        <p className="mt-2 text-gray-600">
          Export receipts for tax purposes and record keeping
        </p>
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Receipts</h2>
        <p className="text-sm text-gray-600 mb-4">
          Download your receipts in various formats for tax filing and financial records.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => exportReceipts('csv')}
            disabled={exporting}
            className="flex flex-col items-center justify-center p-6 border-2 border-gray-300 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition disabled:opacity-50"
          >
            <span className="text-3xl mb-2">📊</span>
            <span className="font-medium text-gray-900">CSV</span>
            <span className="text-xs text-gray-500 text-center mt-1">
              Spreadsheet format for Excel/Google Sheets
            </span>
          </button>

          <button
            onClick={() => exportReceipts('json')}
            disabled={exporting}
            className="flex flex-col items-center justify-center p-6 border-2 border-gray-300 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition disabled:opacity-50"
          >
            <span className="text-3xl mb-2">📄</span>
            <span className="font-medium text-gray-900">JSON</span>
            <span className="text-xs text-gray-500 text-center mt-1">
              Machine-readable format for processing
            </span>
          </button>

          <button
            onClick={() => exportReceipts('summary')}
            disabled={exporting}
            className="flex flex-col items-center justify-center p-6 border-2 border-gray-300 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition disabled:opacity-50"
          >
            <span className="text-3xl mb-2">📈</span>
            <span className="font-medium text-gray-900">Summary</span>
            <span className="text-xs text-gray-500 text-center mt-1">
              Analytics and breakdown by category
            </span>
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-2">
          📋 About Receipt Tracking
        </h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>
            ZeroLeak Mail automatically detects and categorizes receipts from your emails.
          </p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Receipts are organized by tax year and category</li>
            <li>Export for tax filing or expense tracking</li>
            <li>All data is encrypted and secure</li>
            <li>No merchant can track your real email address</li>
          </ul>
        </div>
      </div>

      {/* Coming Soon Features */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Coming Soon</h2>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-center">
            <span className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center mr-3 text-xs">1</span>
            Automatic receipt extraction from email attachments
          </li>
          <li className="flex items-center">
            <span className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center mr-3 text-xs">2</span>
            OCR for PDF receipts
          </li>
          <li className="flex items-center">
            <span className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center mr-3 text-xs">3</span>
            Category auto-detection using AI
          </li>
          <li className="flex items-center">
            <span className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center mr-3 text-xs">4</span>
            Tax form generation (1099, etc.)
          </li>
          <li className="flex items-center">
            <span className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center mr-3 text-xs">5</span>
            Integration with accounting software
          </li>
        </ul>
      </div>
    </div>
  );
}
