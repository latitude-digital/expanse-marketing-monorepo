import * as crypto from "crypto";
import Sqids from "sqids";
import {GoogleAuth} from "google-auth-library";

// Initialize Sqids with a 10-character alphabet for campaign ID generation
const sqids = new Sqids({
  minLength: 10,
});

/**
 * Generate a campaign ID for an event
 * @param {string} eventId The Firestore document ID of the event
 * @param {string|number} fordEventId Optional Ford Event ID
 * @return {string} Campaign ID in format "EX-[squid]" or "FE-[ford event id]"
 */
export const generateCampaignId = (eventId: string, fordEventId?: string | number): string => {
  if (fordEventId) {
    return `FE-${fordEventId}`;
  }

  // Convert the Firestore document ID to a number for Sqids
  // We'll use a simple hash function to convert the string to a number
  let hash = 0;
  for (let i = 0; i < eventId.length; i++) {
    const char = eventId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  // Ensure the hash is positive
  const positiveHash = Math.abs(hash);

  // Generate the squid
  const squid = sqids.encode([positiveHash]);

  return `EX-${squid}`;
};

/**
 * Format phone number to XXX-XXX-XXXX format
 * @param {string} phone Raw phone number
 * @return {string|null} Formatted phone number or null if invalid
 */
export const formatPhoneNumber = (phone: string): string | null => {
  const cleaned = ("" + phone).replace(/\D/g, "");
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  return null;
};

/**
 * Create MD5 hash for survey vehicle GUID
 * @param {string} input Input string to hash
 * @return {string} MD5 hash
 */
export const createMD5Hash = (input: string): string => {
  return crypto
      .createHash("md5")
      .update(input)
      .digest("hex");
};

let auth: GoogleAuth;

/**
 * Get the URL of a given v2 cloud function.
 *
 * @param {string} name the function's name
 * @param {string} location the function's location
 * @return {Promise<string>} The URL of the function
 */
export async function getFunctionUrl(name: string, location = "us-central1"): Promise<string> {
  if (!auth) {
    auth = new GoogleAuth({
      scopes: "https://www.googleapis.com/auth/cloud-platform",
    });
  }
  const projectId = await auth.getProjectId();
  
  // Functions are deployed without environment prefixes, use the base name
  const url =
    "https://cloudfunctions.googleapis.com/v2beta/" +
    `projects/${projectId}/locations/${location}/functions/${name}`;

  const client = await auth.getClient();
  const res = await client.request({url});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = res.data;
  const uri = data.serviceConfig?.uri;
  if (!uri) {
    throw new Error(`Unable to retreive uri for function at ${url}`);
  }
  return uri;
}