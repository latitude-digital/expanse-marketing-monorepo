import {onRequest} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
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
interface GenerateUploadUrlRequest {
  eventId: string;
  filename: string;
  contentType: string;
}

interface GenerateUploadUrlResponse {
  uploadUrl: string;
  finalImageUrl: string;
  fields?: Record<string, string>;
}

export const generateCreatorUploadUrl = onRequest(
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

        // Get the ID token from the Authorization header
        const authorization = req.headers.authorization;
        if (!authorization || !authorization.startsWith("Bearer ")) {
          res.status(401).json({error: "Unauthorized: No token provided"});
          return;
        }

        const idToken = authorization.split("Bearer ")[1];

        // Verify the ID token
        let decodedToken;
        try {
          decodedToken = await admin.auth().verifyIdToken(idToken);
        } catch (error) {
          console.error("Error verifying token:", error);
          res.status(401).json({error: "Unauthorized: Invalid token"});
          return;
        }

        const userId = decodedToken.uid;
        const userEmail = decodedToken.email;

        // Parse request body
        const {eventId, filename, contentType}: GenerateUploadUrlRequest = req.body;

        // Validate required fields
        if (!eventId || !filename || !contentType) {
          res.status(400).json({error: "Missing required fields: eventId, filename, contentType"});
          return;
        }

        // Validate content type is an image
        if (!contentType.startsWith("image/")) {
          res.status(400).json({error: "Content type must be an image"});
          return;
        }

        // TODO: Implement proper event admin validation
        // For now, we'll check if the user is authenticated and has an email
        // In the future, this should check if the user is an admin of the specific event
        if (!userEmail) {
          res.status(403).json({error: "Forbidden: User must have a verified email"});
          return;
        }

        // Log the request for auditing
        console.log(`User ${userId} (${userEmail}) requesting upload URL for event ${eventId}`);

        // Generate timestamp for unique filename
        const timestamp = Date.now();
        const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
        const s3Key = `events/${eventId}/${timestamp}-${sanitizedFilename}`;

        // Initialize S3 client
        // IMPORTANT: Trim Firebase secrets to remove any trailing newlines
        const accessKey = awsAccessKeyId.value().trim();
        const secretKey = awsSecretAccessKey.value().trim();

        const s3Client = new S3Client({
          region: "us-east-1",
          credentials: {
            accessKeyId: accessKey,
            secretAccessKey: secretKey,
          },
        });

        // Create presigned POST URL
        const bucketName = "assets-expansemarketing-com";
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
          Expires: 900, // 15 minutes
        });


        // Construct the final CDN URL
        const finalImageUrl = `https://assets.expansemarketing.com/${s3Key}`;

        // Return the presigned POST URL and final image URL
        const response: GenerateUploadUrlResponse = {
          uploadUrl: presignedPost.url,
          fields: presignedPost.fields,
          finalImageUrl,
        };

        res.status(200).json(response);
      } catch (error) {
        console.error("Error generating upload URL:", error);
        res.status(500).json({error: "Internal server error"});
      }
    }
);