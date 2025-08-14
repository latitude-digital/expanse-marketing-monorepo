import {onTaskDispatched} from "firebase-functions/v2/tasks";
import {onRequest} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";
import {getFunctions} from "firebase-admin/functions";
import * as admin from "firebase-admin";
import {getFirestore} from "firebase-admin/firestore";
import axios, {AxiosError, AxiosResponse, isAxiosError} from "axios";
import {generateCampaignId, getFunctionUrl} from "./utils";

const sparkpostSenderAPIKey = defineSecret("SPARKPOST_API_KEY_EXPANSE");

// Email validation via SparkPost API
export const validateEmailImpl = (app: admin.app.App) => 
  onRequest({cors: true}, (req, res) => {
    const {email} = req.body;

    // SparkPost APIs
    const sparkpostBaseURL = "https://api.sparkpost.com/api/v1";
    const sparkpostAPISecret = "6707e53662166a60560ae5eda5d330ed2811ef6e";
    const sparkpostHeaders = {
      Authorization: sparkpostAPISecret,
    };

    axios
        .get(
            `${sparkpostBaseURL}/recipient-validation/single/${encodeURIComponent(
                email
            )}`,
            {
              headers: sparkpostHeaders,
            }
        )
        .then((response: AxiosResponse) => {
          console.log("validateEmail!!!!!", response.data);
          res.status(response.status || 200).send(response.data);
          return;
        })
        .catch((err: Error | AxiosError) => {
          if (isAxiosError(err)) {
            console.error(
                err.response?.status,
                err.response?.statusText,
                err.response?.data
            );
            res.status(err.response?.status || 500).send(err.response?.data);
          } else {
            res.status(500).send(JSON.stringify(err));
          }
          return;
        });
  });

// Create new user with Firebase Auth and send verification email
export const createNewUserImpl = (app: admin.app.App) =>
  onRequest({cors: true, secrets: ["SPARKPOST_API_KEY_EXPANSE"]}, (req, res) => {
    const {email, phoneNumber, displayName, password} = req.body;

    const sparkpostBaseURL = "https://api.sparkpost.com/api/v1";
    const sparkpostAPISecret = sparkpostSenderAPIKey.value();
    const sparkpostHeaders = {
      Authorization: sparkpostAPISecret,
    };

    admin
        .auth()
        .createUser({
          email,
          emailVerified: true,
          phoneNumber,
          displayName,
          password: password || "latitud123",
        })
        .then((userRecord) => {
          const actionCodeSettings = {
            url: "https://survey.expansemarketing.com/welcome",
            handleCodeInApp: true,
          };

          admin
              .auth()
              .generatePasswordResetLink(email, actionCodeSettings)
              .then((link) => {
                axios
                    .post(
                        `${sparkpostBaseURL}/transmissions/`,
                        {
                          content: {
                            template_id: "expanse-verify-email",
                          },
                          recipients: [
                            {
                              address: {
                                email,
                              },
                              // eslint-disable-next-line camelcase
                              substitution_data: {
                                link,
                              },
                            },
                          ],
                        },
                        {
                          headers: sparkpostHeaders,
                        }
                    )
                    .then((response: AxiosResponse) => {
                      console.log("verify email sent!!!!!", response.data);
                      return;
                    })
                    .catch((err: Error | AxiosError) => {
                      if (isAxiosError(err)) {
                        console.error(
                            err.response?.status,
                            err.response?.statusText,
                            err.response?.data
                        );
                      } else {
                        console.error(err);
                      }
                      return;
                    });
              });

          res.status(200).send(`User ${email} created ${userRecord.toJSON()}`);
        })
        .catch((err) => {
          res.status(500).send(JSON.stringify(err));
        });
  });

// Auto-checkout task dispatcher
export const autoCheckOutImpl = () => onTaskDispatched(
    {
      retryConfig: {
        maxAttempts: 3,
        minBackoffSeconds: 10,
      },
      rateLimits: {
        maxConcurrentDispatches: 10,
      },
    },
    async (req) => {
      const {queueName} = req;
      console.log(`Received auto-checkout task with name: ${queueName}`);

      const {preEventID, surveyID, postEventID, checkOutEmailTemplate} = req.data;

      try {
        // Get the correct database based on environment
        const database = process.env.DB_NAME || "(default)";
        const db = database === "staging" 
          ? getFirestore(admin.app(), "staging")
          : getFirestore(admin.app());

        // Update the survey to mark it as checked out
        const surveyRef = db
            .doc(`events/${preEventID}/surveys/${surveyID}`);

        await surveyRef.update({
          _checkedOut: new Date(),
        });

        console.log(`Auto-checked out survey ${surveyID}`);

        // If there's a check-out email template, send the email
        if (checkOutEmailTemplate && postEventID) {
          const surveyDoc = await surveyRef.get();
          const surveyData = surveyDoc.data();

          if (!surveyData) {
            console.error("No survey data found for auto-checkout email");
            return;
          }

          const postEventDoc = await db
              .doc(`events/${postEventID}`)
              .get();

          const postEventData = postEventDoc.data();

          if (!postEventData) {
            console.error("No post event data found");
            return;
          }

          const email = surveyData.email || surveyData._email;

          if (email) {
            const emailQueue = getFunctions().taskQueue("scheduledEmail");
            const emailUri = await getFunctionUrl("scheduledEmail");

            const surveyUrl = `https://survey.expansemarketing.com/s/${postEventID}?pid=${surveyID}`;

            await emailQueue.enqueue(
                {
                  template: checkOutEmailTemplate,
                  email,
                  substitutionData: {
                    event: {
                      id: postEventID,
                      ...postEventData,
                      questions: JSON.parse(postEventData.questions || "{}"),
                      theme: JSON.parse(postEventData.theme || "{}"),
                    },
                    survey: {
                      id: surveyID,
                      ...surveyData,
                    },
                    survey_url: surveyUrl,
                  },
                },
                {
                  uri: emailUri,
                }
            );

            console.log("Check-out email queued for", email);
          }
        }
      } catch (error) {
        console.error("Error in auto-checkout:", error);
        throw error;
      }
    }
);

// Scheduled email task dispatcher
export const scheduledEmailImpl = () => onTaskDispatched(
    {
      retryConfig: {
        maxAttempts: 3,
        minBackoffSeconds: 23,
      },
      rateLimits: {
        maxConcurrentDispatches: 6,
      },
      secrets: ["SPARKPOST_API_KEY_EXPANSE"],
    },
    async (req) => {
      const {queueName} = req;
      console.log(`Received task with name: ${queueName}`);

      const sparkpostBaseURL = "https://api.sparkpost.com/api/v1";
      const sparkpostAPISecret = sparkpostSenderAPIKey.value();
      const sparkpostHeaders = {
        Authorization: sparkpostAPISecret,
      };

      const {template, email, substitutionData} = req.data;

      // Generate campaign_id based on event data
      let campaignId = "EX-default";
      if (substitutionData?.event?.id) {
        const eventId = substitutionData.event.id;
        const fordEventId = substitutionData.event.fordEventID;
        campaignId = generateCampaignId(eventId, fordEventId);
        console.log(`Generated campaign_id: ${campaignId} for event ${eventId} (Ford: ${fordEventId || "N/A"})`);
      }

      axios
          .post(
              `${sparkpostBaseURL}/transmissions/`,
              {
                content: {
                  template_id: template,
                },
                recipients: [
                  {
                    address: {
                      email,
                    },
                    // eslint-disable-next-line camelcase
                    substitution_data: substitutionData,
                  },
                ],
                campaign_id: campaignId,
              },
              {
                headers: sparkpostHeaders,
              }
          )
          .then((response: AxiosResponse) => {
            console.log("email sent!!!!!", response.data);
            return;
          })
          .catch((err: Error | AxiosError) => {
            if (isAxiosError(err)) {
              console.error(
                  err.response?.status,
                  err.response?.statusText,
                  err.response?.data
              );
            } else {
              console.error(err);
            }
            return;
          });
    }
);