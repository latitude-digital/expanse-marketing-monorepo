import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import firebaseApp, { shouldUseEmulator } from '../services/firebase';
import { getApp } from 'firebase/app';

interface WinnerData {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  dealer_landscaper: string;
}

interface WinnersResponse {
  success: boolean;
  dealer?: WinnerData;
  landscaper?: WinnerData;
  dealerCount?: number;
  landscaperCount?: number;
  error?: string;
  message?: string;
}

const WinnerPicker: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [winners, setWinners] = useState<WinnersResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getFunctionUrl = () => {
    const projectId = firebaseApp.options.projectId || 'latitude-lead-system';

    if (shouldUseEmulator('functions')) {
      return `http://localhost:5001/${projectId}/us-central1/getRandomSweepstakesWinners`;
    }
    return `https://us-central1-${projectId}.cloudfunctions.net/getRandomSweepstakesWinners`;
  };

  const pickWinners = async () => {
    setLoading(true);
    setError(null);
    setWinners(null);

    try {
      // Add timestamp to bust cache
      const url = `${getFunctionUrl()}?t=${Date.now()}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // Prevent browser caching
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: WinnersResponse = await response.json();

      if (!data.success && data.error) {
        setError(data.error);
      } else {
        setWinners(data);
      }
    } catch (err) {
      console.error('Error picking winners:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const WinnerCard: React.FC<{ winner: WinnerData; title: string; count?: number }> = ({ winner, title, count }) => (
    <div className="bg-white rounded-lg shadow-lg border-2 border-[#257180] overflow-hidden">
      <div className="bg-gradient-to-r from-[#257180] to-[#1a4d57] px-6 py-4">
        <h3 className="text-xl font-bold text-white">{title}</h3>
        {count !== undefined && (
          <p className="text-sm text-white/80 mt-1">Selected from {count} {count === 1 ? 'entry' : 'entries'}</p>
        )}
      </div>
      <div className="px-6 py-4 space-y-3">
        <div className="flex items-center justify-between border-b pb-2">
          <span className="text-sm font-medium text-gray-600">Name:</span>
          <span className="text-base font-semibold text-gray-900">
            {winner.first_name} {winner.last_name}
          </span>
        </div>
        <div className="flex items-center justify-between border-b pb-2">
          <span className="text-sm font-medium text-gray-600">Email:</span>
          <span className="text-base text-gray-900">{winner.email}</span>
        </div>
        <div className="flex items-center justify-between border-b pb-2">
          <span className="text-sm font-medium text-gray-600">Phone:</span>
          <span className="text-base text-gray-900">{winner.phone}</span>
        </div>
        <div className="flex items-center justify-between border-b pb-2">
          <span className="text-sm font-medium text-gray-600">Location:</span>
          <span className="text-base text-gray-900">
            {winner.city}, {winner.state}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Type:</span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#257180] text-white">
            {winner.dealer_landscaper}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/home?ferris=1')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Back
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Ferris Sweepstakes Winner Picker</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{userData?.email || currentUser?.email}</span>
              <button
                onClick={() => navigate('/logout')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Pick Winners Button */}
        <div className="text-center mb-8">
          <button
            onClick={pickWinners}
            disabled={loading}
            className="px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-[#257180] to-[#1a4d57] hover:from-[#1a4d57] hover:to-[#257180] rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Picking Winners...
              </span>
            ) : (
              '🏆 Pick New Winners'
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error: {error}</h3>
              </div>
            </div>
          </div>
        )}

        {/* Winners Display */}
        {winners && winners.success && (
          <div className="space-y-8">
            {(winners.dealer || winners.landscaper) ? (
              <>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">🎉 Winners Selected! 🎉</h2>
                  <p className="text-gray-600">Congratulations to our Ferris Sweepstakes winners</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {winners.dealer && (
                    <WinnerCard winner={winners.dealer} title="🏆 Dealer Winner" count={winners.dealerCount} />
                  )}
                  {winners.landscaper && (
                    <WinnerCard winner={winners.landscaper} title="🏆 Landscaper Winner" count={winners.landscaperCount} />
                  )}
                </div>
              </>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-yellow-100">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Eligible Entries Found</h3>
                <p className="text-gray-600">
                  {winners.message || 'There are currently no eligible sweepstakes entries in the database.'}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Make sure survey responses exist with the correct event IDs and sweepstakes opt-in values.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Initial State */}
        {!winners && !error && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Click the button above to randomly select winners</p>
            <p className="text-gray-400 text-sm mt-2">
              This will select one Dealer and one Landscaper from eligible Ferris sweepstakes entries
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default WinnerPicker;
