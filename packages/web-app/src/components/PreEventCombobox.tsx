import React, { useState, useEffect } from 'react';
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import db from '../services/firestore';
import moment from 'moment';

interface PreEventComboboxProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  startDate: Date | null;
  currentEventId: string | null;
}

interface Event {
  id: string;
  name: string;
  eventTitle?: string;
}

export const PreEventCombobox: React.FC<PreEventComboboxProps> = ({
  value,
  onChange,
  label,
  startDate,
  currentEventId
}) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      if (!startDate) {
        setEvents([]);
        return;
      }

      try {
        setLoading(true);
        
        // Create start and end of day timestamps for the query
        const startOfDay = Timestamp.fromDate(moment(startDate).startOf('day').toDate());
        const endOfDay = Timestamp.fromDate(moment(startDate).endOf('day').toDate());
        
        // Query events with the same start date
        const eventsRef = collection(db, 'events');
        const q = query(
          eventsRef,
          where('startDate', '>=', startOfDay),
          where('startDate', '<=', endOfDay)
        );
        
        const snapshot = await getDocs(q);
        const fetchedEvents: Event[] = [];
        
        snapshot.forEach((doc) => {
          // Exclude the current event
          if (doc.id !== currentEventId) {
            const data = doc.data();
            fetchedEvents.push({
              id: doc.id,
              name: data.name || data.eventTitle || doc.id,
              eventTitle: data.eventTitle
            });
          }
        });
        
        setEvents(fetchedEvents);
      } catch (err) {
        console.error('Error fetching events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [startDate, currentEventId]);

  const filteredEvents =
    query === ''
      ? events
      : events.filter((event) => {
          const searchQuery = query.toLowerCase();
          return (
            event.name.toLowerCase().includes(searchQuery) ||
            event.id.toLowerCase().includes(searchQuery)
          );
        });

  const selectedEvent = events.find(e => e.id === value);

  return (
    <div>
      <label htmlFor="preEventId" className="block text-sm/6 font-medium text-gray-900">
        {label}
      </label>
      <div className="mt-2 relative">
        <Combobox value={value} onChange={onChange}>
          <div className="relative">
            <ComboboxInput
              id="preEventId"
              className="w-full rounded-md border-0 bg-white py-1.5 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm/6"
              displayValue={(eventId: string) => eventId}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={loading ? "Loading events..." : "Select a pre-event"}
              disabled={loading || !startDate}
              autoComplete="off"
            />
            <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </ComboboxButton>
          </div>
          {!loading && startDate && (
            <ComboboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event) => (
                  <ComboboxOption
                    key={event.id}
                    value={event.id}
                    className="group relative cursor-default select-none py-2 pl-3 pr-9 text-gray-900 data-[focus]:bg-indigo-600 data-[focus]:text-white"
                  >
                    <div className="flex flex-col">
                      <span className="truncate group-data-[selected]:font-semibold">
                        {event.name}
                      </span>
                      <span className="text-xs text-gray-500 group-data-[focus]:text-indigo-200 truncate">
                        {event.id}
                      </span>
                    </div>
                    <span className="absolute inset-y-0 right-0 hidden items-center pr-4 text-indigo-600 group-data-[selected]:flex group-data-[focus]:text-white">
                      <CheckIcon className="h-5 w-5" aria-hidden="true" />
                    </span>
                  </ComboboxOption>
                ))
              ) : (
                <div className="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-500">
                  No eligible events
                </div>
              )}
            </ComboboxOptions>
          )}
        </Combobox>
      </div>
      {!startDate && (
        <p className="mt-1 text-xs text-gray-500">Please select an event start date first</p>
      )}
    </div>
  );
};