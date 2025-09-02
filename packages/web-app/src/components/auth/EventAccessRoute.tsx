import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import db from '../../services/firestore';
import { useAuth } from '../../contexts/AuthContext';

interface EventAccessRouteProps {
  children: React.ReactNode;
}

const EventAccessRoute: React.FC<EventAccessRouteProps> = ({ children }) => {
  const { eventID } = useParams();
  const { currentUser, userData, isAdmin, loading: authLoading } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!eventID || authLoading) {
        return;
      }

      // If user is not logged in, redirect to login
      if (!currentUser) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      // Admins always have access
      if (isAdmin) {
        setHasAccess(true);
        setLoading(false);
        return;
      }

      try {
        // Fetch event document to check tags
        const eventDoc = await getDoc(doc(db, 'events', eventID));
        
        if (!eventDoc.exists()) {
          console.error('Event not found:', eventID);
          setHasAccess(false);
          setLoading(false);
          return;
        }

        const eventData = eventDoc.data();
        const eventTags = eventData.tags || [];
        
        // Fetch user document to get user tags
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        let userTags: string[] = [];
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          userTags = userData.tags || [];
        }

        // Check if user has matching tags
        if (eventTags.length === 0) {
          // Event has no tags, allow access
          setHasAccess(true);
        } else if (userTags.length === 0) {
          // Event has tags but user has none, deny access
          setHasAccess(false);
        } else {
          // Check for matching tags
          const hasMatchingTag = eventTags.some((tag: string) => userTags.includes(tag));
          setHasAccess(hasMatchingTag);
        }
      } catch (error) {
        console.error('Error checking event access:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [eventID, currentUser, isAdmin, authLoading]);

  // Show loading state
  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!currentUser) {
    const currentPath = window.location.pathname;
    return <Navigate to={`${currentPath}/login`} replace />;
  }

  // Show access denied if user doesn't have access
  if (hasAccess === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this event.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-[#257180] text-white rounded-md hover:bg-[#1a4d57]"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Render children if user has access
  return <>{children}</>;
};

export default EventAccessRoute;