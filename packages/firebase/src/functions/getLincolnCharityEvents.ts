import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestoreDatabase } from '../utils/getFirestoreDatabase';
import moment from 'moment-timezone';

interface EventData {
    id: string;
    name: string;
    brand?: string;
    startDate: any;
    endDate: any;
    tags?: string[];
    lincolnEventID?: string;
    disabled?: boolean;
}

export const getLincolnCharityEventsImpl = (app: admin.app.App, database: string = "(default)") =>
    onCall<{ tagId: string }, EventData[]>(
        {
            cors: true,
            maxInstances: 10,
        },
        (async (request) => {
            const { tagId } = request.data;

            if (!tagId) {
                throw new HttpsError('invalid-argument', 'Tag ID is required');
            }

            try {
                const db = getFirestoreDatabase(app, database);
                const now = moment();

                // Query for events with the specified tag that are not disabled
                const eventsRef = db.collection('events');
                const snapshot = await eventsRef
                    .where('tags', 'array-contains', tagId)
                    .where('disabled', '!=', true)
                    .get();

                const events: EventData[] = [];

                snapshot.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
                    const data = doc.data();
                    
                    // Convert Firestore timestamps to dates
                    const startDate = data.startDate?.toDate ? data.startDate.toDate() : new Date(data.startDate);
                    const endDate = data.endDate?.toDate ? data.endDate.toDate() : new Date(data.endDate);
                    
                    // Check if event is currently running
                    const startMoment = moment(startDate).startOf('day');
                    const endMoment = moment(endDate).endOf('day');
                    const isCurrentlyRunning = now.isSameOrAfter(startMoment) && now.isSameOrBefore(endMoment);
                    
                    // Check if it's a Lincoln event
                    const isLincolnEvent = data.brand === 'Lincoln' || !!data.lincolnEventID;
                    
                    if (isCurrentlyRunning && isLincolnEvent) {
                        events.push({
                            id: doc.id,
                            name: data.name,
                            brand: data.brand,
                            startDate: startDate.toISOString(),
                            endDate: endDate.toISOString(),
                            tags: data.tags || [],
                            lincolnEventID: data.lincolnEventID,
                            disabled: data.disabled || false,
                        });
                    }
                });

                // Sort events by name
                events.sort((a, b) => a.name.localeCompare(b.name));

                return events;
            } catch (error) {
                console.error('Error fetching Lincoln charity events:', error);
                throw new HttpsError('internal', 'Failed to fetch events');
            }
        }) as any
    );
