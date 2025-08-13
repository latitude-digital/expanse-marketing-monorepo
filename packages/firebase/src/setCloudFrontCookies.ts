import {onCall} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";
import {getSignedCookies} from "@aws-sdk/cloudfront-signer";

const cloudFrontPrivateKey = defineSecret("CLOUDFRONT_PRIVATE_KEY");
const cloudFrontKeyPairId = defineSecret("CLOUDFRONT_KEY_PAIR_ID");

export const setCloudFrontCookies = onCall(
    {
      cors: true,
      secrets: [cloudFrontPrivateKey, cloudFrontKeyPairId],
    },
    async (request) => {
      const {auth} = request;
      // Validate authentication
      if (!auth) {
        throw new Error("User must be authenticated to access images");
      }

      try {
      // Get secrets
        const privateKey = cloudFrontPrivateKey.value();
        const keyPairId = cloudFrontKeyPairId.value();

        if (!privateKey || !keyPairId) {
          throw new Error("CloudFront configuration missing");
        }

        // Set cookie expiry based on Firebase session duration
        // Firebase auth tokens last for 1 hour, but we'll set cookies for 24 hours
        // to avoid frequent refreshes. The Firebase auth will still control access.
        const tokenExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours from now

        // Create cookie policy
        const policy = {
          Statement: [{
            Resource: "https://uploads.expansemarketing.com/*",
            Condition: {
              DateLessThan: {
                "AWS:EpochTime": Math.floor(tokenExpiry / 1000),
              },
            },
          }],
        };

        // Generate signed cookies
        const cookies = getSignedCookies({
          keyPairId,
          privateKey,
          policy: JSON.stringify(policy),
        });

        // Log the request for monitoring
        console.log("Cookie generation requested", {
          userId: auth.uid,
          timestamp: new Date().toISOString(),
        });

        // Return cookies for frontend to set
        return {
          success: true,
          cookies: {
            "CloudFront-Key-Pair-Id": cookies["CloudFront-Key-Pair-Id"],
            "CloudFront-Policy": cookies["CloudFront-Policy"],
            "CloudFront-Signature": cookies["CloudFront-Signature"],
          },
          expires: tokenExpiry,
        };
      } catch (error) {
        console.error("Error generating CloudFront cookies:", error);
        throw new Error("Failed to generate access cookies");
      }
    });