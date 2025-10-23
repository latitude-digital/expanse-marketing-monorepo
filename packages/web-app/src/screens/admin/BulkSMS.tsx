import React, { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import functions from '../../services/functions';
import { getFirebaseFunctionName } from '../../utils/getFirebaseFunctionPrefix';
import type { CreateBulkSmsSendRequest, CreateBulkSmsSendResponse } from '@meridian-event-tech/shared';
import BulkSMSProgress from './BulkSMSProgress';
import BulkSMSHistory from './BulkSMSHistory';
import BulkSMSDetail from './BulkSMSDetail';

// Import types from Firebase function
interface PhoneValidationResult {
  original: string;
  normalized: string | null;
  isValid: boolean;
  carrier?: string;
  phoneType?: 'mobile' | 'landline' | 'voip';
  errorMessage?: string;
}

interface ValidatePhoneNumbersResponse {
  success: boolean;
  results: PhoneValidationResult[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
    duplicates: number;
    uniqueValid: number;
  };
  error?: string;
}

/**
 * BulkSMS Screen - Main component with tab navigation
 *
 * Features:
 * - Tab navigation: "New Send" and "History"
 * - Phone numbers textarea (one per line)
 * - Phone number validation with Twilio Lookup API
 * - Automatic deduplication after normalization
 * - Message textarea with character counter
 * - SMS segment calculator (160 chars per segment)
 * - Submit button with loading state (disabled until validation)
 * - Shows BulkSMSProgress when sendId exists
 * - Shows BulkSMSHistory in History tab
 */
const BulkSMS: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [phoneNumbers, setPhoneNumbers] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [sendId, setSendId] = useState<string | null>(null);
  const [detailSendId, setDetailSendId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Validation state
  const [validating, setValidating] = useState<boolean>(false);
  const [validationResults, setValidationResults] = useState<PhoneValidationResult[] | null>(null);
  const [validationSummary, setValidationSummary] = useState<ValidatePhoneNumbersResponse['summary'] | null>(null);
  const [isValidated, setIsValidated] = useState<boolean>(false);
  const [phoneNumbersSnapshot, setPhoneNumbersSnapshot] = useState<string>('');

  // Calculate derived values
  const characterCount = message.length;
  const smsSegments = Math.ceil(characterCount / 160) || 0;
  const phoneLines = phoneNumbers.split('\n').filter(line => line.trim().length > 0);
  const phoneCount = phoneLines.length;

  // Check if phone numbers have changed since validation
  const phoneNumbersChanged = phoneNumbers !== phoneNumbersSnapshot;

  // Reset validation when phone numbers change
  useEffect(() => {
    if (phoneNumbersChanged && isValidated) {
      setIsValidated(false);
      setValidationResults(null);
      setValidationSummary(null);
    }
  }, [phoneNumbers, phoneNumbersChanged, isValidated]);

  const handleValidate = async () => {
    setError(null);
    setValidating(true);
    setValidationResults(null);
    setValidationSummary(null);

    try {
      const validatePhoneNumbers = httpsCallable<{ phoneNumbers: string[] }, ValidatePhoneNumbersResponse>(
        functions,
        getFirebaseFunctionName('validatePhoneNumbers')
      );

      const result = await validatePhoneNumbers({ phoneNumbers: phoneLines });

      // Always update the list with valid numbers, even if validation partially failed
      if (result.data.results && result.data.results.length > 0) {
        setValidationResults(result.data.results);
        setValidationSummary(result.data.summary);

        // Replace phone numbers textarea with only valid, normalized, deduplicated numbers
        // This happens even if there are errors - we clean the list regardless
        const validNumbers = result.data.results
          .filter(r => r.isValid && r.normalized)
          .map(r => r.normalized)
          // Remove duplicates (Set ensures uniqueness)
          .filter((value, index, self) => self.indexOf(value) === index);

        const cleanedPhoneNumbers = validNumbers.join('\n');
        setPhoneNumbers(cleanedPhoneNumbers);
        setPhoneNumbersSnapshot(cleanedPhoneNumbers);
      }

      // Set validation state based on success
      if (result.data.success) {
        setIsValidated(true);
      } else {
        setError(result.data.error || 'Validation failed');
      }
    } catch (err: any) {
      console.error('Error validating phone numbers:', err);
      setError(err.message || 'An error occurred during validation');
    } finally {
      setValidating(false);
    }
  };

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
    setValidationResults(null);
    setValidationSummary(null);
    setIsValidated(false);
    setPhoneNumbersSnapshot('');
  };

  const handleViewDetails = (id: string) => {
    setDetailSendId(id);
    setActiveTab('history');
  };

  const handleBackFromDetail = () => {
    setDetailSendId(null);
  };

  // Show detail screen if we have a detailSendId
  if (detailSendId) {
    return <BulkSMSDetail sendId={detailSendId} onBack={handleBackFromDetail} />;
  }

  // Show progress screen if we have a sendId
  if (sendId) {
    return <BulkSMSProgress sendId={sendId} onBack={handleBackToForm} onViewDetails={handleViewDetails} />;
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
            disabled={sending || validating}
            rows={10}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed font-mono text-sm"
            placeholder="5551234567&#10;15551234567&#10;(555) 123-4567&#10;+1 555-123-4567"
          />
          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {phoneCount} phone number{phoneCount !== 1 ? 's' : ''}
              {phoneNumbersChanged && isValidated && (
                <span className="ml-2 text-yellow-600">(changed since validation)</span>
              )}
            </p>
            <button
              type="button"
              onClick={handleValidate}
              disabled={phoneCount === 0 || validating || sending}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {validating ? 'Validating...' : 'Validate Phone Numbers'}
            </button>
          </div>

          {/* Validation Results Summary */}
          {validationSummary && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Total:</span>{' '}
                  <span className="text-gray-900">{validationSummary.total}</span>
                </div>
                <div>
                  <span className="font-medium text-green-700">Valid:</span>{' '}
                  <span className="text-green-900">{validationSummary.valid}</span>
                </div>
                <div>
                  <span className="font-medium text-red-700">Invalid:</span>{' '}
                  <span className="text-red-900">{validationSummary.invalid}</span>
                </div>
                <div>
                  <span className="font-medium text-yellow-700">Duplicates:</span>{' '}
                  <span className="text-yellow-900">{validationSummary.duplicates}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Will Send:</span>{' '}
                  <span className="text-blue-900">{validationSummary.uniqueValid}</span>
                </div>
              </div>
            </div>
          )}

          {/* Validation Results Details - Invalid/Duplicate Numbers */}
          {validationResults && validationResults.some(r => !r.isValid) && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-md">
              <div className="px-3 py-2 border-b border-red-200">
                <h4 className="text-sm font-medium text-red-800">
                  {validationResults.filter(r => !r.isValid).length} Invalid/Duplicate Numbers
                </h4>
                <p className="text-xs text-red-600 mt-1">
                  Copy the table below to paste into Excel
                </p>
              </div>
              <div className="overflow-x-auto max-h-60 overflow-y-auto">
                <table className="min-w-full divide-y divide-red-200">
                  <thead className="bg-red-100 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-red-900 uppercase tracking-wider">
                        Phone Number
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-red-900 uppercase tracking-wider">
                        Reason
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-red-100">
                    {validationResults.filter(r => !r.isValid).map((result, idx) => (
                      <tr key={idx} className="hover:bg-red-50">
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-mono text-gray-900">
                          {result.original}
                        </td>
                        <td className="px-3 py-2 text-sm text-red-700">
                          {result.errorMessage || 'Invalid'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
            disabled={sending || phoneCount === 0 || !message.trim() || !isValidated || phoneNumbersChanged || (validationSummary?.uniqueValid || 0) === 0}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
            title={
              !isValidated ? 'Please validate phone numbers first' :
              phoneNumbersChanged ? 'Phone numbers changed - please validate again' :
              (validationSummary?.uniqueValid || 0) === 0 ? 'No valid phone numbers to send to' :
              undefined
            }
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
