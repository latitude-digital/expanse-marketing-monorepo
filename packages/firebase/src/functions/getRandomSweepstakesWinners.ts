import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import { getFirestoreDatabase } from '../utils/getFirestoreDatabase';
import { logger } from 'firebase-functions/v2';

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
    dealerIndex?: number;
    landscaperIndex?: number;
    error?: string;
}

/**
 * Firebase function to randomly select sweepstakes winners.
 * Queries surveys for Ferris events and randomly picks one Dealer and one Landscaper winner.
 *
 * GET request handler - responds to HTTP GET requests
 */
export const getRandomSweepstakesWinnersImpl = (app: admin.app.App, database: string = "(default)") =>
    onRequest(
        {
            cors: true,
            maxInstances: 10,
        },
        async (req, res) => {
            try {
                const db = getFirestoreDatabase(app, database);

                // Define the event IDs to search for
                const eventIds = ["Ferris_Inside", "Ferris_Outside", "Ferris_Post"];

                logger.info('[getRandomSweepstakesWinners] Starting winner selection');

                // Query for Dealer winners
                const dealerQuery = await db.collectionGroup("surveys")
                    .where("event_id", 'in', eventIds)
                    .where("sweepstakes_optin", '==', ["Yes"])
                    .where("dealer_landscaper", '==', 'Dealer')
                    .get();

                logger.info(`[getRandomSweepstakesWinners] Found ${dealerQuery.size} dealer entries`);

                // Query for Landscaper winners
                const landscaperQuery = await db.collectionGroup("surveys")
                    .where("event_id", 'in', eventIds)
                    .where("sweepstakes_optin", '==', ["Yes"])
                    .where("dealer_landscaper", '==', 'Landscaper')
                    .get();

                logger.info(`[getRandomSweepstakesWinners] Found ${landscaperQuery.size} landscaper entries`);

                const response: WinnersResponse = {
                    success: true,
                    dealerCount: dealerQuery.size,
                    landscaperCount: landscaperQuery.size
                };

                // Randomly select a dealer winner if available
                if (!dealerQuery.empty) {
                    const randomDealerIndex = Math.floor(Math.random() * dealerQuery.size);
                    response.dealerIndex = randomDealerIndex;

                    const dealerDoc = dealerQuery.docs[randomDealerIndex];
                    const dealerData = dealerDoc.data();

                    response.dealer = {
                        first_name: dealerData.first_name || '',
                        last_name: dealerData.last_name || '',
                        phone: dealerData.phone || '',
                        email: dealerData.email || '',
                        city: dealerData.address_group?.city || '',
                        state: dealerData.address_group?.state || '',
                        dealer_landscaper: dealerData.dealer_landscaper || 'Dealer'
                    };

                    logger.info(`[getRandomSweepstakesWinners] Selected dealer winner at index ${randomDealerIndex}: ${response.dealer.email}`);
                } else {
                    logger.warn('[getRandomSweepstakesWinners] No dealer entries found');
                }

                // Randomly select a landscaper winner if available
                if (!landscaperQuery.empty) {
                    const randomLandscaperIndex = Math.floor(Math.random() * landscaperQuery.size);
                    response.landscaperIndex = randomLandscaperIndex;

                    const landscaperDoc = landscaperQuery.docs[randomLandscaperIndex];
                    const landscaperData = landscaperDoc.data();

                    response.landscaper = {
                        first_name: landscaperData.first_name || '',
                        last_name: landscaperData.last_name || '',
                        phone: landscaperData.phone || '',
                        email: landscaperData.email || '',
                        city: landscaperData.address_group?.city || '',
                        state: landscaperData.address_group?.state || '',
                        dealer_landscaper: landscaperData.dealer_landscaper || 'Landscaper'
                    };

                    logger.info(`[getRandomSweepstakesWinners] Selected landscaper winner at index ${randomLandscaperIndex}: ${response.landscaper.email}`);
                } else {
                    logger.warn('[getRandomSweepstakesWinners] No landscaper entries found');
                }

                if (!response.dealer && !response.landscaper) {
                    logger.warn('[getRandomSweepstakesWinners] No eligible entries found for either category');
                    res.status(200).send({
                        success: true,
                        dealer: undefined,
                        landscaper: undefined,
                        message: 'No eligible sweepstakes entries found in the database'
                    });
                    return;
                }

                logger.info('[getRandomSweepstakesWinners] Successfully selected winners');

                // Set cache-control headers to prevent caching
                res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
                res.set('Pragma', 'no-cache');
                res.set('Expires', '0');

                res.status(200).send(response);

            } catch (error) {
                logger.error('Error selecting sweepstakes winners:', error);
                res.status(500).send({
                    success: false,
                    error: 'Failed to select winners',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    );
