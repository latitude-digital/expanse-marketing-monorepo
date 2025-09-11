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
        (async (request: any) => {
            const { tagId } = request.data;

            if (!tagId) {
                throw new HttpsError('invalid-argument', 'Tag ID is required');
            }

            try {
                const db = getFirestoreDatabase(app, database);
                const now = moment();

                console.log(`[getLincolnCharityEvents] Searching for events with tag name: ${tagId}`);
                console.log(`[getLincolnCharityEvents] Current time: ${now.format()}`);

                // First, find the tag ID by tag name
                const tagsRef = db.collection('tags');
                const tagSnapshot = await tagsRef.where('name', '==', tagId).get();
                
                if (tagSnapshot.empty) {
                    console.log(`[getLincolnCharityEvents] Tag "${tagId}" not found in tags collection`);
                    return [];
                }
                
                const tagDoc = tagSnapshot.docs[0];
                const actualTagId = tagDoc.id;
                console.log(`[getLincolnCharityEvents] Found tag "${tagId}" with ID: ${actualTagId}`);

                // Query for events with the specified tag ID
                const eventsRef = db.collection('events');
                const snapshot = await eventsRef
                    .where('tags', 'array-contains', actualTagId)
                    .get();

                console.log(`[getLincolnCharityEvents] Found ${snapshot.size} events with tag ID "${actualTagId}"`);

                const events: EventData[] = [];

                // First, let's see ALL events (without the tag filter)
                const allEventsSnapshot = await db.collection('events').get();
                console.log(`[getLincolnCharityEvents] TOTAL events in database: ${allEventsSnapshot.size}`);
                
                allEventsSnapshot.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
                    const data = doc.data();
                    console.log(`[getLincolnCharityEvents] All events - ${data.name}: tags=${JSON.stringify(data.tags)}, brand=${data.brand}`);
                });

                snapshot.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
                    const data = doc.data();
                    
                    console.log(`[getLincolnCharityEvents] Processing event: ${data.name} (${doc.id})`);
                    console.log(`[getLincolnCharityEvents] Event brand: ${data.brand}, tags: ${JSON.stringify(data.tags)}`);
                    
                    // Convert Firestore timestamps to dates
                    const startDate = data.startDate?.toDate ? data.startDate.toDate() : new Date(data.startDate);
                    const endDate = data.endDate?.toDate ? data.endDate.toDate() : new Date(data.endDate);
                    
                    console.log(`[getLincolnCharityEvents] Event dates: ${startDate.toISOString()} to ${endDate.toISOString()}`);
                    
                    // Check if event is currently running
                    const startMoment = moment(startDate).startOf('day');
                    const endMoment = moment(endDate).endOf('day');
                    const isCurrentlyRunning = now.isSameOrAfter(startMoment) && now.isSameOrBefore(endMoment);
                    
                    console.log(`[getLincolnCharityEvents] Is currently running: ${isCurrentlyRunning} (${startMoment.format()} to ${endMoment.format()})`);
                    
                    // Check if it's a Lincoln event
                    const isLincolnEvent = data.brand === 'Lincoln' || !!data.lincolnEventID;
                    
                    console.log(`[getLincolnCharityEvents] Is Lincoln event: ${isLincolnEvent} (brand: ${data.brand}, lincolnEventID: ${data.lincolnEventID})`);
                    
                    // Check if event is disabled
                    const isDisabled = data.disabled === true;
                    console.log(`[getLincolnCharityEvents] Is disabled: ${isDisabled}`);
                    
                    if (isCurrentlyRunning && isLincolnEvent && !isDisabled) {
                        console.log(`[getLincolnCharityEvents] ✅ Adding event to results: ${data.name}`);
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

                console.log(`[getLincolnCharityEvents] Returning ${events.length} events`);
                return events;
            } catch (error) {
                console.error('Error fetching Lincoln charity events:', error);
                throw new HttpsError('internal', 'Failed to fetch events');
            }
        }) as any
    );
