import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import functions from '../../services/functions';
import { getFirebaseFunctionName } from '../../utils/getFirebaseFunctionPrefix';
import type { CreateBulkSmsSendRequest, CreateBulkSmsSendResponse } from '@meridian-event-tech/shared';
import BulkSMSProgress from './BulkSMSProgress';
import BulkSMSHistory from './BulkSMSHistory';

/**
 * BulkSMS Screen - Main component with tab navigation
 *
 * Features:
 * - Tab navigation: "New Send" and "History"
 * - Phone numbers textarea (one per line)
 * - Message textarea with character counter
 * - SMS segment calculator (160 chars per segment)
 * - Submit button with loading state
 * - Shows BulkSMSProgress when sendId exists
 * - Shows BulkSMSHistory in History tab
 */
const BulkSMS: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [phoneNumbers, setPhoneNumbers] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [sendId, setSendId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Calculate derived values
  const characterCount = message.length;
  const smsSegments = Math.ceil(characterCount / 160) || 0;
  const phoneLines = phoneNumbers.split('\n').filter(line => line.trim().length > 0);
  const phoneCount = phoneLines.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate inputs
    if (phoneCount === 0) {
      setError('Please enter at least one phone number');
      return;
    }

    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    if (characterCount > 1600) {
      setError('Message is too long (max 1600 characters)');
      return;
    }

    setSending(true);

    try {
      // Call Firebase function
      const createBulkSmsSend = httpsCallable<CreateBulkSmsSendRequest, CreateBulkSmsSendResponse>(
        functions,
        getFirebaseFunctionName('createBulkSmsSend')
      );

      const result = await createBulkSmsSend({
        phoneNumbers: phoneLines,
        message: message.trim(),
      });

      if (result.data.success && result.data.sendId) {
        setSendId(result.data.sendId);
      } else {
        setError(result.data.error || 'Failed to create bulk SMS send');
      }
    } catch (err: any) {
      console.error('Error creating bulk SMS send:', err);
      setError(err.message || 'An error occurred while creating the send');
    } finally {
      setSending(false);
    }
  };

  const handleBackToForm = () => {
    setSendId(null);
    setPhoneNumbers('');
    setMessage('');
    setError(null);
  };

  // Show progress screen if we have a sendId
  if (sendId) {
    return <BulkSMSProgress sendId={sendId} onBack={handleBackToForm} />;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bulk SMS</h1>
        <p className="mt-1 text-sm text-gray-600">
          Send SMS messages to multiple recipients at once
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('new')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'new'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            New Send
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            History
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'history' ? (
        <BulkSMSHistory />
      ) : (
        <div className="max-w-4xl">{/* New Send Form */}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Phone Numbers Input */}
        <div>
          <label htmlFor="phoneNumbers" className="block text-sm font-medium text-gray-700 mb-2">
            Phone Numbers (one per line)
          </label>
          <textarea
            id="phoneNumbers"
            value={phoneNumbers}
            onChange={(e) => setPhoneNumbers(e.target.value)}
            disabled={sending}
            rows={10}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed font-mono text-sm"
            placeholder="5551234567&#10;15551234567&#10;(555) 123-4567&#10;+1 555-123-4567"
          />
          <p className="mt-1 text-sm text-gray-500">
            {phoneCount} phone number{phoneCount !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Message Input */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            SMS Message
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={sending}
            rows={5}
            maxLength={1600}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Enter your message here..."
          />
          <div className="mt-1 flex justify-between text-sm text-gray-500">
            <span>
              {characterCount} / 1600 characters
            </span>
            <span>
              {smsSegments} SMS segment{smsSegments !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            Standard SMS messages are 160 characters. Longer messages are split into multiple segments.
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={sending || phoneCount === 0 || !message.trim()}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {sending ? 'Creating...' : 'Send SMS'}
          </button>
        </div>
      </form>
        </div>
      )}
    </div>
  );
};

export default BulkSMS;
