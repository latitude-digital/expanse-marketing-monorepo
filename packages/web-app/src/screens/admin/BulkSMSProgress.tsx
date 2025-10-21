import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import db from '../../services/firestore';
import type { BulkSmsSend } from '@meridian-event-tech/shared';

interface BulkSMSProgressProps {
  sendId: string;
  onBack: () => void;
}

/**
 * BulkSMSProgress Screen - Real-time progress tracking for bulk SMS sends
 *
 * Features:
 * - Real-time Firestore listener on bulkSmsSends/{sendId}
 * - Display progress stats (total, sent, failed, pending)
 * - Progress bar visualization
 * - Message preview
 * - Completion message when status === 'completed'
 * - Back button to send another
 */
const BulkSMSProgress: React.FC<BulkSMSProgressProps> = ({ sendId, onBack }) => {
  const [send, setSend] = useState<BulkSmsSend | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Set up real-time listener for the send document
    const sendRef = doc(db, 'bulkSmsSends', sendId);

    const unsubscribe = onSnapshot(sendRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();

        // Convert Firestore data to BulkSmsSend type
        const sendData: BulkSmsSend = {
          id: snapshot.id,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          createdBy: data.createdBy,
          createdByEmail: data.createdByEmail,
          message: data.message,
          totalRecipients: data.totalRecipients,
          status: data.status,
          processingLock: data.processingLock,
          successCount: data.successCount,
          failureCount: data.failureCount,
          pendingCount: data.pendingCount,
          deliveredCount: data.deliveredCount || 0,
          undeliveredCount: data.undeliveredCount || 0,
          invalidPhones: data.invalidPhones || [],
        };

        setSend(sendData);
        setLoading(false);
      } else {
        console.error('Send document not found:', sendId);
        setLoading(false);
      }
    }, (error) => {
      console.error('Error listening to send document:', error);
      setLoading(false);
    });

    // Clean up listener on unmount
    return () => unsubscribe();
  }, [sendId]);

  if (loading || !send) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Calculate progress
  const processedCount = send.successCount + send.failureCount;
  const progress = send.totalRecipients > 0
    ? Math.round((processedCount / send.totalRecipients) * 100)
    : 0;
  const isComplete = send.status === 'completed';

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bulk SMS Progress</h1>
        <p className="mt-1 text-sm text-gray-600">
          Tracking send progress in real-time
        </p>
      </div>

      {/* Status Badge */}
      <div className="mb-6">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            send.status === 'completed'
              ? 'bg-green-100 text-green-800'
              : send.status === 'failed'
              ? 'bg-red-100 text-red-800'
              : send.status === 'processing'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {send.status.charAt(0).toUpperCase() + send.status.slice(1)}
        </span>
      </div>

      {/* Progress Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Total</div>
          <div className="text-2xl font-bold text-gray-900">{send.totalRecipients}</div>
        </div>

        <div className="bg-white p-4 border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Sent</div>
          <div className="text-2xl font-bold text-green-600">{send.successCount}</div>
        </div>

        <div className="bg-white p-4 border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Failed</div>
          <div className="text-2xl font-bold text-red-600">{send.failureCount}</div>
        </div>

        <div className="bg-white p-4 border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Pending</div>
          <div className="text-2xl font-bold text-gray-600">{send.pendingCount}</div>
        </div>
      </div>

      {/* Delivery Stats (if available) */}
      {(send.deliveredCount > 0 || send.undeliveredCount > 0) && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 border border-gray-200 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Delivered</div>
            <div className="text-2xl font-bold text-green-600">{send.deliveredCount}</div>
            <div className="text-xs text-gray-500 mt-1">Confirmed by carrier</div>
          </div>

          <div className="bg-white p-4 border border-gray-200 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Undelivered</div>
            <div className="text-2xl font-bold text-red-600">{send.undeliveredCount}</div>
            <div className="text-xs text-gray-500 mt-1">Failed delivery</div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-700 mb-2">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Message Preview */}
      <div className="mb-6 bg-white p-4 border border-gray-200 rounded-lg">
        <div className="text-sm font-medium text-gray-700 mb-2">Message:</div>
        <div className="text-gray-900 whitespace-pre-wrap break-words">
          {send.message}
        </div>
        <div className="mt-2 text-xs text-gray-500">
          {send.message.length} characters • {Math.ceil(send.message.length / 160)} segment{Math.ceil(send.message.length / 160) !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Invalid Phones Warning */}
      {send.invalidPhones.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm font-medium text-yellow-800 mb-2">
            {send.invalidPhones.length} invalid phone number{send.invalidPhones.length !== 1 ? 's' : ''} skipped:
          </p>
          <div className="text-xs text-yellow-700 font-mono">
            {send.invalidPhones.slice(0, 5).join(', ')}
            {send.invalidPhones.length > 5 && ` ... and ${send.invalidPhones.length - 5} more`}
          </div>
        </div>
      )}

      {/* Completion Message */}
      {isComplete && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm font-medium text-green-800">
            Bulk SMS send completed!
          </p>
          <p className="text-sm text-green-700 mt-1">
            Successfully sent: {send.successCount} • Failed: {send.failureCount}
          </p>
          {send.deliveredCount > 0 && (
            <p className="text-xs text-green-600 mt-1">
              Delivery confirmations will continue to arrive over the next few minutes.
            </p>
          )}
        </div>
      )}

      {/* Back Button */}
      <div className="flex justify-end">
        <button
          onClick={onBack}
          className="px-6 py-2 bg-gray-100 text-gray-700 font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          {isComplete ? 'Send Another' : 'Back to Form'}
        </button>
      </div>
    </div>
  );
};

export default BulkSMSProgress;
