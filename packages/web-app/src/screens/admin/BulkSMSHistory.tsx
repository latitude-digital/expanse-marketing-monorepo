import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import db from '../../services/firestore';
import type { BulkSmsSend } from '@meridian-event-tech/shared';
import BulkSMSDetail from './BulkSMSDetail';

/**
 * BulkSMSHistory - Display list of all bulk SMS sends with real-time updates
 *
 * Features:
 * - Real-time listener on bulkSmsSends collection
 * - Ordered by createdAt desc (newest first)
 * - Limited to 50 most recent sends
 * - Table layout with status badges and success rates
 * - Click to view detailed recipient list
 * - Empty state when no sends exist
 */
const BulkSMSHistory: React.FC = () => {
  const [sends, setSends] = useState<BulkSmsSend[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSendId, setSelectedSendId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    // Real-time listener for bulk SMS sends
    const q = query(
      collection(db, 'bulkSmsSends'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const sendsData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
            createdBy: data.createdBy,
            createdByEmail: data.createdByEmail,
            message: data.message,
            totalRecipients: data.totalRecipients,
            status: data.status,
            processingLock: data.processingLock
              ? data.processingLock instanceof Timestamp
                ? data.processingLock.toDate()
                : new Date(data.processingLock)
              : null,
            successCount: data.successCount,
            failureCount: data.failureCount,
            pendingCount: data.pendingCount,
            deliveredCount: data.deliveredCount,
            undeliveredCount: data.undeliveredCount,
            invalidPhones: data.invalidPhones || [],
          } as BulkSmsSend;
        });
        setSends(sendsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading bulk SMS sends:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Format date as relative time
  const formatRelativeTime = (date: Date | string): string => {
    const now = new Date();
    const then = typeof date === 'string' ? new Date(date) : date;
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString();
  };

  // Calculate success rate
  const calculateSuccessRate = (send: BulkSmsSend): string => {
    if (send.totalRecipients === 0) return '0%';
    const rate = (send.successCount / send.totalRecipients) * 100;
    return `${Math.round(rate)}%`;
  };

  // Truncate long messages
  const truncateMessage = (message: string, maxLength: number = 50): string => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  // Get status badge color
  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter sends based on search and status
  const filteredSends = sends.filter((send) => {
    // Status filter
    if (statusFilter !== 'all' && send.status !== statusFilter) {
      return false;
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        send.message.toLowerCase().includes(searchLower) ||
        send.createdByEmail.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  // Show detail view if a send is selected
  if (selectedSendId) {
    return (
      <BulkSMSDetail
        sendId={selectedSendId}
        onBack={() => setSelectedSendId(null)}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">SMS History</h1>
        <p className="mt-1 text-sm text-gray-600">
          View all bulk SMS sends and their delivery status
        </p>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by message or sender..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredSends.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No SMS sends found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by sending your first bulk SMS'}
          </p>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date/Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Message
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recipients
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Success Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSends.map((send) => (
                <tr key={send.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatRelativeTime(send.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {send.createdByEmail}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs truncate" title={send.message}>
                      {truncateMessage(send.message)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {send.totalRecipients}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(
                        send.status
                      )}`}
                    >
                      {send.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {calculateSuccessRate(send)}
                    <div className="text-xs text-gray-500">
                      {send.successCount} / {send.totalRecipients}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => setSelectedSendId(send.id)}
                      className="text-blue-600 hover:text-blue-900 font-medium"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BulkSMSHistory;
