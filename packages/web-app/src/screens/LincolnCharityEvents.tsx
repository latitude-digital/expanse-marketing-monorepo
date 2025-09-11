import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import functions from '../services/functions';
import { getFirebaseFunctionName } from '../utils/getFirebaseFunctionPrefix';
import moment from 'moment';

interface ExpanseEvent {
    id: string;
    name: string;
    brand?: string;
    startDate: Date;
    endDate: Date;
    tags?: string[];
    fordEventID?: string;
    lincolnEventID?: string;
    surveyType?: string;
    disabled?: boolean;
}

export default function LincolnCharityEvents() {
    const { tagId } = useParams<{ tagId: string }>();
    const navigate = useNavigate();
    const [events, setEvents] = useState<ExpanseEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadEvents();
    }, [tagId]);

    const loadEvents = async () => {
        if (!tagId) {
            setError('No tag specified');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            // Call Firebase function to get Lincoln charity events
            const getLincolnCharityEvents = httpsCallable<{ tagId: string }, ExpanseEvent[]>(
                functions,
                getFirebaseFunctionName('getLincolnCharityEvents')
            );
            
            const result = await getLincolnCharityEvents({ tagId });
            
            // Convert date strings back to Date objects for display
            const eventsWithDates = result.data.map(event => ({
                ...event,
                startDate: new Date(event.startDate),
                endDate: new Date(event.endDate)
            }));
            
            setEvents(eventsWithDates);
        } catch (err) {
            console.error('Error loading events:', err);
            setError('Failed to load events. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleEventClick = (eventId: string) => {
        navigate(`/s/${eventId}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
                {/* Lincoln Header */}
                <div className="bg-black">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <img 
                            src="https://cdn.expansemarketing.com/lincoln/lincoln-logo-white.svg" 
                            alt="Lincoln" 
                            className="h-12"
                        />
                    </div>
                </div>
                
                <div className="flex justify-center items-center h-96">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
                        </div>
                        <p className="text-gray-600">Loading events...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
                {/* Lincoln Header */}
                <div className="bg-black">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <img 
                            src="https://cdn.expansemarketing.com/lincoln/lincoln-logo-white.svg" 
                            alt="Lincoln" 
                            className="h-12"
                        />
                    </div>
                </div>
                
                <div className="flex justify-center items-center h-96">
                    <div className="text-center">
                        <div className="mb-4">
                            <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-gray-900 font-medium mb-2">Error</p>
                        <p className="text-gray-600">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
                {/* Lincoln Header */}
                <div className="bg-black">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <img 
                            src="https://cdn.expansemarketing.com/lincoln/lincoln-logo-white.svg" 
                            alt="Lincoln" 
                            className="h-12"
                        />
                    </div>
                </div>
                
                <div className="flex justify-center items-center h-96">
                    <div className="text-center">
                        <div className="mb-4">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                        </div>
                        <p className="text-gray-900 font-medium mb-2">No Active Events</p>
                        <p className="text-gray-600">There are no charity events currently running.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Lincoln Header */}
            <div className="bg-black">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <img 
                        src="https://cdn.expansemarketing.com/lincoln/lincoln-logo-white.svg" 
                        alt="Lincoln" 
                        className="h-12"
                    />
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Title Section */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-light text-gray-900 mb-4">
                        Select Your Event
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Choose the Lincoln charity event you're attending from the options below
                    </p>
                </div>

                {/* Events Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {events.map((event) => (
                        <div
                            key={event.id}
                            onClick={() => handleEventClick(event.id)}
                            className="group cursor-pointer transform transition-all duration-300 hover:scale-105"
                        >
                            <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 hover:shadow-2xl transition-shadow duration-300">
                                {/* Card Header with Lincoln Accent */}
                                <div className="h-2 bg-gradient-to-r from-gray-800 to-black"></div>
                                
                                {/* Card Content */}
                                <div className="p-8">
                                    {/* Event Name */}
                                    <h2 className="text-2xl font-light text-gray-900 mb-4 group-hover:text-black transition-colors">
                                        {event.name}
                                    </h2>
                                    
                                    {/* Event Details */}
                                    <div className="space-y-3 text-sm text-gray-600">
                                        <div className="flex items-center">
                                            <svg className="h-5 w-5 mr-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span>
                                                {moment(event.startDate).format('MMM D')} - {moment(event.endDate).format('MMM D, YYYY')}
                                            </span>
                                        </div>
                                        
                                        {event.lincolnEventID && (
                                            <div className="flex items-center">
                                                <svg className="h-5 w-5 mr-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                                </svg>
                                                <span className="font-mono text-xs">
                                                    Event ID: {event.lincolnEventID}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Call to Action */}
                                    <div className="mt-6 flex items-center text-black font-medium group-hover:translate-x-2 transition-transform">
                                        <span>Begin Survey</span>
                                        <svg className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Text */}
                <div className="mt-16 text-center text-sm text-gray-500">
                    <p>Thank you for supporting Lincoln charity initiatives</p>
                </div>
            </div>
        </div>
    );
}