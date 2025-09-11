import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import auth from '../../services/auth';
import firebaseApp from '../../services/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import Dialog from '../../components/Dialog';
import Button from '../../components/Button';
import { LoadingStates } from '../../components/LoadingStates';
import { getFirebaseFunctionName } from '../../utils/getFirebaseFunctionPrefix';

interface Event {
  id: string;
  name: string;
  brand?: string;
  fordEventID?: string;
  lincolnEventID?: string;
  surveyCount?: number;
  lastModified?: Date;
  surveyJSModel?: any;
  questions?: string;
  surveyJSTheme?: any;
  theme?: string;
}

interface UploadProgress {
  total: number;
  successful: number;
  failed: number;
  inProgress: boolean;
  errors: Array<{
    documentPath: string;
    error: string;
    details?: any;
  }>;
}

interface ReUploadModalProps {
  event: Event;
  isOpen: boolean;
  onClose: () => void;
}

const ReUploadModal: React.FC<ReUploadModalProps> = ({ event, isOpen, onClose }) => {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    total: 0,
    successful: 0,
    failed: 0,
    inProgress: false,
    errors: []
  });
  const [selectedError, setSelectedError] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const functions = getFunctions(firebaseApp);

  const handleReUpload = async () => {
    setConfirmed(true);
    setUploadProgress({
      total: event.surveyCount || 0,
      successful: 0,
      failed: 0,
      inProgress: true,
      errors: []
    });

    try {
      // Call the new server-side Firebase function to handle re-upload
      const reuploadFunction = httpsCallable(functions, getFirebaseFunctionName('reuploadEventSurveys'));
      const result = await reuploadFunction({ eventId: event.id });
      const uploadResults = (result.data as any).results;
      
      setUploadProgress({
        total: uploadResults.total,
        successful: uploadResults.successful,
        failed: uploadResults.failed,
        inProgress: false,
        errors: uploadResults.errors || []
      });
      
    } catch (error: any) {
      console.error('Re-upload process error:', error);
      setUploadProgress(prev => ({
        ...prev,
        inProgress: false,
        failed: prev.total,
        errors: [{
          documentPath: 'Function call failed',
          error: error.message || 'Unknown error',
          details: error
        }]
      }));
    }
  };

  const getEventId = () => {
    if (event.fordEventID) return event.fordEventID;
    if (event.lincolnEventID) return event.lincolnEventID;
    return event.id;
  };

  return (
    <Dialog open={isOpen} onClose={onClose} title="Re-upload Surveys">
      <div className="p-6">
        {!confirmed ? (
          <div className="space-y-4">
            <p className="text-lg font-semibold">{event.name}</p>
            <p>Brand: <span className="font-medium">{event.brand || 'Unknown'}</span></p>
            <p>Event ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{getEventId()}</span></p>
            <p className="text-lg">
              This will re-upload <span className="font-bold text-blue-600">{event.surveyCount || 0}</span> surveys
              to the {event.brand} API.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 font-medium">⚠️ Warning</p>
              <p className="text-yellow-700 text-sm mt-1">
                This operation will re-submit all surveys to the external API. 
                Duplicate submissions may occur if surveys were already uploaded.
              </p>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button onClick={onClose} variant="secondary">Cancel</Button>
              <Button onClick={handleReUpload} variant="primary">Confirm Re-upload</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{uploadProgress.total}</p>
                  <p className="text-sm text-gray-600">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{uploadProgress.successful}</p>
                  <p className="text-sm text-gray-600">Successful</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{uploadProgress.failed}</p>
                  <p className="text-sm text-gray-600">Failed</p>
                </div>
              </div>
              
              {uploadProgress.inProgress && (
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${((uploadProgress.successful + uploadProgress.failed) / uploadProgress.total) * 100}%` 
                    }}
                  />
                </div>
              )}
            </div>

            {uploadProgress.errors.length > 0 && (
              <div className="mt-4">
                <p className="font-medium text-red-600 mb-2">Failed Uploads:</p>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {uploadProgress.errors.map((error, index) => (
                    <div
                      key={index}
                      className="border border-red-200 rounded p-2 cursor-pointer hover:bg-red-50"
                      onClick={() => setSelectedError(selectedError === index ? null : index)}
                    >
                      <p className="text-sm font-mono text-red-700">{error.documentPath}</p>
                      <p className="text-sm text-red-600 mt-1">{error.error}</p>
                      {selectedError === index && error.details && (
                        <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-x-auto">
                          {JSON.stringify(error.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!uploadProgress.inProgress && (
              <div className="flex justify-end mt-6">
                <Button onClick={onClose}>Close</Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
};

const ReUpload: React.FC = () => {
  const [user, loading] = useAuthState(auth);
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const functions = getFunctions(firebaseApp);

  useEffect(() => {
    if (user) {
      loadEvents();
    }
  }, [user]);

  const loadEvents = async () => {
    try {
      setLoadingEvents(true);
      const getEvents = httpsCallable(functions, getFirebaseFunctionName('getFordLincolnEvents'));
      const result = await getEvents();
      const eventsData = (result.data as any).events || [];
      
      // Sort by last modified date (most recent first)
      eventsData.sort((a: Event, b: Event) => {
        const dateA = a.lastModified ? new Date(a.lastModified).getTime() : 0;
        const dateB = b.lastModified ? new Date(b.lastModified).getTime() : 0;
        return dateB - dateA;
      });
      
      setEvents(eventsData);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleReUploadClick = (event: Event) => {
    setSelectedEvent(event);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedEvent(null);
    // Reload events to refresh survey counts
    loadEvents();
  };

  if (loading) return <LoadingStates.Skeleton />;
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Please log in to access this page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Re-upload Surveys</h1>
            <p className="mt-1 text-sm text-gray-600">
              Re-upload Ford and Lincoln surveys to their respective APIs
            </p>
          </div>
          
          {loadingEvents ? (
            <div className="p-6">
              <LoadingStates.Spinner />
            </div>
          ) : events.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No Ford or Lincoln events found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Brand
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Surveys
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Modified
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {events.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {event.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          event.brand === 'Ford' ? 'bg-blue-100 text-blue-800' : 
                          event.brand === 'Lincoln' ? 'bg-purple-100 text-purple-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {event.brand || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {event.fordEventID || event.lincolnEventID || event.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {event.surveyCount || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {event.lastModified ? new Date(event.lastModified).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Button
                          onClick={() => handleReUploadClick(event)}
                          variant="primary"
                          size="sm"
                          disabled={!event.surveyCount || event.surveyCount === 0}
                        >
                          Re-upload
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {selectedEvent && (
        <ReUploadModal
          event={selectedEvent}
          isOpen={modalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default ReUpload;
