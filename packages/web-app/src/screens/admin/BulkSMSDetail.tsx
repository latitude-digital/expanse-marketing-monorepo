import React, { useEffect, useState } from 'react';
import {
  doc,
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  Timestamp,
  DocumentSnapshot,
  where,
} from 'firebase/firestore';
import db from '../../services/firestore';
import type { BulkSmsSend, SmsRecipient, TwilioMessageStatus } from '@meridian-event-tech/shared';

interface BulkSMSDetailProps {
  sendId: string;
  onBack: () => void;
}

type FilterType = 'all' | 'sent' | 'failed' | 'delivered' | 'undelivered' | 'pending';

/**
 * BulkSMSDetail - Detailed view of a single bulk SMS send with recipient list
 *
 * Features:
 * - Real-time listener on parent document for stats
 * - Paginated recipient list (50 items per page) to prevent cost explosion
 * - Filter by status (All, Sent, Failed, Delivered, Undelivered, Pending)
 * - Export failed numbers to clipboard
 * - Delivery status tracking from Twilio webhooks
 *
 * CRITICAL: Uses pagination to prevent Firestore read cost explosion
 */
const BulkSMSDetail: React.FC<BulkSMSDetailProps> = ({ sendId, onBack }) => {
  const [send, setSend] = useState<BulkSmsSend | null>(null);
  const [recipients, setRecipients] = useState<SmsRecipient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const pageSize = 50;

  // Listen to parent document for stats (always)
  useEffect(() => {
    const docRef = doc(db, 'bulkSmsSends', sendId);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setSend({
            id: snapshot.id,
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
          } as BulkSmsSend);
        }
      },
      (error) => {
        console.error('Error loading send:', error);
      }
    );

    return () => unsubscribe();
  }, [sendId]);

  // Load first page of recipients
  useEffect(() => {
    loadRecipients(true);
  }, [sendId, filter]);

  const loadRecipients = (reset: boolean = false) => {
    if (reset) {
      setLoading(true);
      setRecipients([]);
      setLastVisible(null);
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }

    // Build query with filter
    let q = query(
      collection(db, 'bulkSmsSends', sendId, 'recipients'),
      orderBy('phoneNumber')
    );

    // Apply status filter
    if (filter === 'sent') {
      q = query(q, where('status', '==', 'sent'));
    } else if (filter === 'failed') {
      q = query(q, where('status', '==', 'failed'));
    } else if (filter === 'pending') {
      q = query(q, where('status', '==', 'pending'));
    } else if (filter === 'delivered') {
      q = query(q, where('deliveryStatus', '==', 'delivered'));
    } else if (filter === 'undelivered') {
      q = query(q, where('deliveryStatus', 'in', ['undelivered', 'failed']));
    }

    // Add pagination
    if (!reset && lastVisible) {
      q = query(q, startAfter(lastVisible));
    }
    q = query(q, limit(pageSize));

    // Use onSnapshot for real-time updates on current page only
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const recipientsData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            phoneNumber: data.phoneNumber,
            status: data.status,
            deliveryStatus: data.deliveryStatus,
            twilioSid: data.twilioSid,
            errorMessage: data.errorMessage,
            errorCode: data.errorCode,
            sentAt: data.sentAt instanceof Timestamp ? data.sentAt.toDate() : data.sentAt,
            deliveredAt: data.deliveredAt instanceof Timestamp ? data.deliveredAt.toDate() : data.deliveredAt,
            retryCount: data.retryCount,
          } as SmsRecipient;
        });

        if (reset) {
          setRecipients(recipientsData);
        } else {
          setRecipients((prev) => [...prev, ...recipientsData]);
        }

        // Update pagination state
        if (snapshot.docs.length > 0) {
          setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        }
        setHasMore(snapshot.docs.length === pageSize);
        setLoading(false);
        setLoadingMore(false);
      },
      (error) => {
        console.error('Error loading recipients:', error);
        setLoading(false);
        setLoadingMore(false);
      }
    );

    return unsubscribe;
  };

  // Export failed numbers to clipboard
  const handleExportFailed = () => {
    const failedNumbers = recipients
      .filter((r) => r.status === 'failed' || r.deliveryStatus === 'undelivered' || r.deliveryStatus === 'failed')
      .map((r) => r.phoneNumber)
      .join('\n');

    if (failedNumbers) {
      navigator.clipboard.writeText(failedNumbers);
      alert(`Copied ${failedNumbers.split('\n').length} failed numbers to clipboard`);
    } else {
      alert('No failed numbers to export');
    }
  };

  // Get status badge color
  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDeliveryStatusBadgeClass = (status?: TwilioMessageStatus): string => {
    if (!status) return 'bg-gray-100 text-gray-800';
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'failed':
      case 'undelivered':
        return 'bg-red-100 text-red-800';
      case 'sent':
      case 'queued':
      case 'sending':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp?: Date | string): string => {
    if (!timestamp) return '-';
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleString();
  };

  // Calculate delivery rate
  const calculateDeliveryRate = (): string => {
    if (!send || send.successCount === 0) return '0%';
    const rate = (send.deliveredCount / send.successCount) * 100;
    return `${Math.round(rate)}%`;
  };

  if (loading && !send) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!send) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Send not found</p>
        <button onClick={onBack} className="mt-4 text-blue-600 hover:text-blue-900">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button onClick={onBack} className="text-blue-600 hover:text-blue-900 mb-4 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to History
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SMS Send Details</h1>
            <p className="mt-1 text-sm text-gray-600">
              Created {formatTimestamp(send.createdAt)} by {send.createdByEmail}
            </p>
          </div>
          <span
            className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadgeClass(send.status)}`}
          >
            {send.status}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{send.totalRecipients}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">{send.successCount}</div>
          <div className="text-sm text-gray-600">Sent</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-red-600">{send.failureCount}</div>
          <div className="text-sm text-gray-600">Failed</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{send.deliveredCount}</div>
          <div className="text-sm text-gray-600">Delivered</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-orange-600">{send.undeliveredCount}</div>
          <div className="text-sm text-gray-600">Undelivered</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-yellow-600">{send.pendingCount}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
      </div>

      {/* Delivery Rate */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Delivery Rate</span>
          <span className="text-sm font-medium text-gray-900">{calculateDeliveryRate()}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full"
            style={{
              width: send.successCount > 0 ? `${(send.deliveredCount / send.successCount) * 100}%` : '0%',
            }}
          ></div>
        </div>
      </div>

      {/* Message Display */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Message</h3>
        <p className="text-gray-900 whitespace-pre-wrap">{send.message}</p>
        <div className="mt-2 text-sm text-gray-500">
          {send.message.length} characters · {Math.ceil(send.message.length / 160)} SMS segment
          {Math.ceil(send.message.length / 160) !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Recipients List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Recipients</h3>
          <button
            onClick={handleExportFailed}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"
          >
            Export Failed Numbers
          </button>
        </div>

        {/* Filter Buttons */}
        <div className="p-4 border-b border-gray-200 flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({send.totalRecipients})
          </button>
          <button
            onClick={() => setFilter('sent')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              filter === 'sent'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Sent ({send.successCount})
          </button>
          <button
            onClick={() => setFilter('failed')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              filter === 'failed'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Failed ({send.failureCount})
          </button>
          <button
            onClick={() => setFilter('delivered')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              filter === 'delivered'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Delivered ({send.deliveredCount})
          </button>
          <button
            onClick={() => setFilter('undelivered')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              filter === 'undelivered'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Undelivered ({send.undeliveredCount})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              filter === 'pending'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending ({send.pendingCount})
          </button>
        </div>

        {/* Recipients Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delivery Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sent At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delivered At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Error
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recipients.length === 0 && !loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No recipients found for this filter
                  </td>
                </tr>
              ) : (
                recipients.map((recipient) => (
                  <tr key={recipient.phoneNumber} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {recipient.phoneNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(
                          recipient.status
                        )}`}
                      >
                        {recipient.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {recipient.deliveryStatus ? (
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDeliveryStatusBadgeClass(
                            recipient.deliveryStatus
                          )}`}
                        >
                          {recipient.deliveryStatus}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTimestamp(recipient.sentAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTimestamp(recipient.deliveredAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-red-600">
                      {recipient.errorMessage || '-'}
                      {recipient.errorCode && (
                        <span className="text-xs text-gray-500"> (Code: {recipient.errorCode})</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Load More Button */}
        {hasMore && (
          <div className="p-4 border-t border-gray-200 text-center">
            <button
              onClick={() => loadRecipients(false)}
              disabled={loadingMore}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loadingMore ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkSMSDetail;
