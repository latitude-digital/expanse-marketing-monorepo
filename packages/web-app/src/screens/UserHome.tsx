import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs, where, orderBy, Timestamp } from 'firebase/firestore';
import db from '../services/firestore';
import { useAuth } from '../contexts/AuthContext';
import tagsService from '../services/tagsService';
import TagPill from '../components/TagPill';

// Import FontAwesome SVG icons as URLs
import ClipboardCheckIconUrl from '@fontawesome/regular/clipboard-check.svg';
import PersonToDoorIconUrl from '@fontawesome/regular/person-to-door.svg';
import ArrowsDownToPeopleIconUrl from '@fontawesome/regular/arrows-down-to-people.svg';
import TableCellsHeaderIconUrl from '@fontawesome/regular/table-cells-header.svg';
import BrowserIconUrl from '@fontawesome/regular/browser.svg';
import { FontAwesomeIcon } from '../components/FontAwesomeIcon';

// Create icon components
const ClipboardCheckIcon = (props: any) => <FontAwesomeIcon src={ClipboardCheckIconUrl} {...props} />;
const PersonToDoorIcon = (props: any) => <FontAwesomeIcon src={PersonToDoorIconUrl} {...props} />;
const ArrowsDownToPeopleIcon = (props: any) => <FontAwesomeIcon src={ArrowsDownToPeopleIconUrl} {...props} />;
const TableCellsHeaderIcon = (props: any) => <FontAwesomeIcon src={TableCellsHeaderIconUrl} {...props} />;
const BrowserIcon = (props: any) => <FontAwesomeIcon src={BrowserIconUrl} {...props} />;

interface ExpanseEvent {
  id: string;
  name: string;
  surveyType?: 'basic' | 'preTD' | 'postTD';
  startDate: Date;
  endDate: Date;
  brand?: 'Ford' | 'Lincoln' | 'Other';
  tags?: string[];
  disabled?: string;
  _preEventID?: string;
  fordEventID?: string;
  lincolnEventID?: string;
  preRegDate?: Date;
}

const UserHome: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, userData, isAdmin } = useAuth();
  const [events, setEvents] = useState<ExpanseEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // If user is admin, redirect to admin panel
    if (isAdmin) {
      navigate('/admin');
      return;
    }

    // Load events once userData is available with tags
    if (userData) {
      loadUserEvents();
    }
  }, [currentUser, userData, isAdmin, navigate]);

  const loadUserEvents = async () => {
    try {
      setLoading(true);
      
      const eventsRef = collection(db, 'events');
      const q = query(eventsRef, orderBy('startDate', 'desc'));
      const snapshot = await getDocs(q);
      
      const now = new Date();
      const userTags = userData?.tags || [];
      
      console.log('Loading events for user:', userData?.email, 'with tags:', userTags);
      
      const userEvents = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          startDate: doc.data().startDate?.toDate?.() || new Date(doc.data().startDate),
          endDate: doc.data().endDate?.toDate?.() || new Date(doc.data().endDate),
          preRegDate: doc.data().preRegDate?.toDate?.() || doc.data().preRegDate,
        } as ExpanseEvent))
        .filter(event => {
          // Filter by user tags
          if (!event.tags || event.tags.length === 0) return false;
          if (!userTags || userTags.length === 0) return false;
          
          const hasMatchingTag = event.tags.some(tag => userTags.includes(tag));
          if (!hasMatchingTag) return false;
          
          // Only show active events
          const isActive = event.startDate <= now && event.endDate >= now;
          return isActive && !event.disabled;
        });
      
      console.log('Found', userEvents.length, 'matching events');
      setEvents(userEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBrandColor = (brand?: string): string => {
    switch (brand?.toLowerCase()) {
      case 'ford': return '#257180';
      case 'lincoln': return '#8B1538';
      default: return '#333333';
    }
  };

  const handleSurvey = (event: ExpanseEvent) => {
    navigate(`/s/${event.id}`);
  };

  const handleCheckIn = (event: ExpanseEvent) => {
    navigate(`/s/${event.id}/in`);
  };

  const handleCheckOut = (event: ExpanseEvent) => {
    if (event._preEventID) {
      navigate(`/s/${event._preEventID}/out`);
    }
  };

  const handleDashboard = (event: ExpanseEvent) => {
    navigate(`/s/${event.id}/dashboard`);
  };

  const canCheckIn = (event: ExpanseEvent) => {
    return event.preRegDate || event.surveyType === 'preTD';
  };

  const canCheckOut = (event: ExpanseEvent) => {
    return event.surveyType === 'postTD' && event._preEventID;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">My Events</h1>
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
        {events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No active events available</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map(event => (
              <div
                key={event.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* Event Header with Brand Color */}
                <div 
                  className="px-6 py-4 border-b"
                  style={{ borderTopWidth: 4, borderTopColor: getBrandColor(event.brand) }}
                >
                  <h3 className="text-lg font-medium text-gray-900">{event.name}</h3>
                  <div className="mt-1 text-sm text-gray-500">
                    {event.brand || 'Other'} • {event.surveyType || 'basic'}
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    Ends: {event.endDate.toLocaleDateString()}
                  </div>
                  
                  {/* Tags */}
                  {event.tags && event.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {event.tags.map(tagId => (
                        <TagPill key={tagId} tagId={tagId} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="px-6 py-4 bg-gray-50">
                  <div className="grid grid-cols-2 gap-2">
                    {/* Survey Button - Always shown */}
                    <button
                      onClick={() => handleSurvey(event)}
                      className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-[#257180] hover:bg-[#1a4d57] rounded-md"
                    >
                      <ClipboardCheckIcon className="w-4 h-4 mr-1.5" />
                      Survey
                    </button>
                    
                    {/* Check In - Only for preTD */}
                    {canCheckIn(event) && (
                      <button
                        onClick={() => handleCheckIn(event)}
                        className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-[#257180] hover:bg-[#1a4d57] rounded-md"
                      >
                        <ArrowsDownToPeopleIcon className="w-4 h-4 mr-1.5" />
                        Check In
                      </button>
                    )}
                    
                    {/* Check Out - Only for postTD */}
                    {canCheckOut(event) && (
                      <button
                        onClick={() => handleCheckOut(event)}
                        className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-[#257180] hover:bg-[#1a4d57] rounded-md"
                      >
                        <PersonToDoorIcon className="w-4 h-4 mr-1.5" />
                        Check Out
                      </button>
                    )}
                    
                    {/* Dashboard - Always shown */}
                    <button
                      onClick={() => handleDashboard(event)}
                      className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md"
                    >
                      <TableCellsHeaderIcon className="w-4 h-4 mr-1.5" />
                      Dashboard
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default UserHome;