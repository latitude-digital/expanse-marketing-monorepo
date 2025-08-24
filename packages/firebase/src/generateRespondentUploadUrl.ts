import {onRequest} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import {getFirestore} from "firebase-admin/firestore";
import {S3Client} from "@aws-sdk/client-s3";
import {createPresignedPost, PresignedPost} from "@aws-sdk/s3-presigned-post";
import {defineSecret} from "firebase-functions/params";

// Initialize admin SDK if not already initialized
if (!admin.apps || admin.apps.length === 0) {
  admin.initializeApp();
}

// Define secrets for AWS credentials
const awsAccessKeyId = defineSecret("AWS_ACCESS_KEY_ID");
const awsSecretAccessKey = defineSecret("AWS_SECRET_ACCESS_KEY");

// Interfaces
interface GenerateRespondentUploadUrlRequest {
  eventId: string;
  surveyId: string;
  questionId: string;
  filename: string;
  contentType: string;
}

interface GenerateRespondentUploadUrlResponse {
  uploadUrl: string;
  finalImageUrl: string;
  fields?: Record<string, string>;
}

export const generateRespondentUploadUrl = onRequest(
    {
      cors: true,
      secrets: [awsAccessKeyId, awsSecretAccessKey],
      maxInstances: 10,
    },
    async (req, res) => {
      try {
        // Validate request method
        if (req.method !== "POST") {
          res.status(405).json({error: "Method not allowed"});
          return;
        }

        // Parse request body
        const {eventId, surveyId, questionId, filename, contentType}: GenerateRespondentUploadUrlRequest = req.body;

        // Validate required fields
        if (!eventId || !surveyId || !questionId || !filename || !contentType) {
          res.status(400).json({
            error: "Missing required fields: eventId, surveyId, questionId, filename, contentType",
          });
          return;
        }

        // Validate content type is an image
        if (!contentType.startsWith("image/")) {
          res.status(400).json({error: "Content type must be an image"});
          return;
        }

        // TODO: Validate survey exists and is active
        // This will check Firestore for the survey and event validation
        try {
          // Get the correct database based on environment
          const database = process.env.DB_NAME || "(default)";
          const db = database === "staging" 
            ? getFirestore(admin.app(), "staging")
            : getFirestore(admin.app());
          const eventDoc = await db.collection("events").doc(eventId).get();

          if (!eventDoc.exists) {
            res.status(404).json({error: "Event not found"});
            return;
          }

          const eventData = eventDoc.data();
          if (!eventData) {
            res.status(404).json({error: "Event data not found"});
            return;
          }

          // Check if event is still active (basic date validation)
          const now = new Date();
          if (eventData.endDate && eventData.endDate.toDate() < now) {
            res.status(400).json({error: "Event has ended"});
            return;
          }

          // Note: We don't validate survey existence since uploads happen before survey submission
          // The surveyId is used for unique file path generation only
        } catch (error) {
          console.error("Error validating survey:", error);
          res.status(500).json({error: "Survey validation failed"});
          return;
        }

        // Log the request for auditing (anonymous, so no user info)
        console.log(
            `Anonymous respondent requesting upload URL for event ${eventId}, ` +
          `survey ${surveyId}, question ${questionId}`
        );

        // Generate timestamp and sanitize filename
        const timestamp = Date.now();
        const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");

        // S3 Key Structure: events/{eventId}/responses/{questionId}-{filename}
        const s3Key = `events/${eventId}/responses/${questionId}-${timestamp}-${sanitizedFilename}`;

        // Initialize S3 client
        // IMPORTANT: Trim Firebase secrets to remove any trailing newlines (S01 lesson learned)
        const accessKey = awsAccessKeyId.value().trim();
        const secretKey = awsSecretAccessKey.value().trim();

        const s3Client = new S3Client({
          region: "us-east-1",
          credentials: {
            accessKeyId: accessKey,
            secretAccessKey: secretKey,
          },
        });

        // Create presigned POST URL for uploads bucket (not assets bucket)
        const bucketName = "uploads-expansemarketing-com";
        const presignedPost: PresignedPost = await createPresignedPost(s3Client, {
          Bucket: bucketName,
          Key: s3Key,
          Conditions: [
            ["content-length-range", 0, 10485760], // Max 10MB
            ["starts-with", "$Content-Type", "image/"],
          ],
          Fields: {
            "Content-Type": contentType,
          },
          Expires: 300, // 5 minutes (shorter than creator uploads)
        });

        // Construct the final CDN URL
        const finalImageUrl = `https://uploads.expansemarketing.com/${s3Key}`;

        // Return the presigned POST URL and final image URL
        const response: GenerateRespondentUploadUrlResponse = {
          uploadUrl: presignedPost.url,
          fields: presignedPost.fields,
          finalImageUrl,
        };

        res.status(200).json(response);
      } catch (error) {
        console.error("Error generating respondent upload URL:", error);
        res.status(500).json({error: "Internal server error"});
      }
    }
);