# Bulk SMS Feature Setup Guide

This guide covers the environment configuration, security setup, and deployment for the Bulk SMS feature.

## Environment Variables

### Required Twilio Configuration

The following environment variables must be set for the Bulk SMS feature to work:

```bash
# Twilio Account Credentials
# Get these from: https://console.twilio.com/
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here

# Twilio Phone Number (must be in E.164 format: +1XXXXXXXXXX)
TWILIO_PHONE_NUMBER=+1234567890

# Note: TWILIO_STATUS_CALLBACK_URL is no longer needed!
# The callback URL is now automatically determined at runtime based on the environment:
# - Local emulator: http://127.0.0.1:5001/latitude-leads-staging/us-central1/staging-twilioStatusWebhook
# - Staging: https://us-central1-latitude-leads-staging.cloudfunctions.net/staging-twilioStatusWebhook
# - Production: https://us-central1-latitude-lead-system.cloudfunctions.net/prod-twilioStatusWebhook
```

### Setting Environment Variables

**Option 1: Local Development (.env file)**

1. Copy `.env.example` to `.env.dev`, `.env.staging`, or `.env.prod`
2. Fill in the Twilio credentials
3. The Firebase Functions will load these automatically

**Option 2: Firebase Functions Config (Deprecated but supported)**

For staging:
```bash
firebase functions:config:set twilio.account_sid="YOUR_SID" --project staging
firebase functions:config:set twilio.auth_token="YOUR_TOKEN" --project staging
firebase functions:config:set twilio.phone_number="+1XXXXXXXXXX" --project staging
```

For production:
```bash
firebase functions:config:set twilio.account_sid="YOUR_SID" --project production
firebase functions:config:set twilio.auth_token="YOUR_TOKEN" --project production
firebase functions:config:set twilio.phone_number="+1XXXXXXXXXX" --project production
```

**Note:** Environment variables in `.env` files take precedence over Firebase Functions config.

## Firestore Indexes

### Required Indexes

The Bulk SMS feature requires the following Firestore indexes:

1. **Recipients CollectionGroup Index** (for webhook lookups)
   - Collection Group: `recipients`
   - Query Scope: `COLLECTION_GROUP`
   - Fields:
     - `twilioSid` (Ascending)

This index is **CRITICAL** for the Twilio webhook to efficiently find recipient documents by their Twilio SID.

### Deploying Indexes

The indexes are defined in `firestore.indexes.json`.

To deploy to staging:
```bash
cd packages/firebase
firebase use staging
firebase deploy --only firestore:indexes
```

To deploy to production:
```bash
cd packages/firebase
firebase use prod
firebase deploy --only firestore:indexes
```

**Important:** Index creation can take 5-10 minutes. Check status in the Firebase Console under Firestore → Indexes.

## Firestore Security Rules

### Security Model

The Bulk SMS feature uses the following security model:

1. **bulkSmsSends collection:**
   - Read: Admin users only (via custom claim `admin: true`)
   - Write: Firebase Functions only (no direct client writes)

2. **recipients subcollection:**
   - Read: Admin users only (via custom claim `admin: true`)
   - Write: Firebase Functions only (no direct client writes)

This ensures that:
- Only authenticated admin users can view SMS send history and recipient details
- All SMS operations go through Firebase Functions (rate limiting, validation, logging)
- No client-side manipulation of SMS data is possible

### Deploying Security Rules

The security rules are defined in `firestore.rules`.

To deploy to staging:
```bash
cd packages/firebase
firebase use staging
firebase deploy --only firestore:rules
```

To deploy to production:
```bash
cd packages/firebase
firebase use prod
firebase deploy --only firestore:rules
```

## Twilio Status Callback URL

The Twilio status callback URL is now **automatically determined at runtime** based on the environment. No manual configuration is needed!

The system automatically uses:
- **Local emulator**: `http://127.0.0.1:5001/latitude-leads-staging/us-central1/staging-twilioStatusWebhook`
- **Staging**: `https://us-central1-latitude-leads-staging.cloudfunctions.net/staging-twilioStatusWebhook`
- **Production**: `https://us-central1-latitude-lead-system.cloudfunctions.net/prod-twilioStatusWebhook`

This is handled by the `getTwilioStatusCallbackUrl()` utility function in `src/utils/getTwilioStatusCallbackUrl.ts`.

## Security Verification Checklist

Before deploying to production, verify the following security measures:

### Authentication & Authorization Tests

- [ ] **Unauthenticated Access Test**
  - Attempt to read from `bulkSmsSends` without authentication
  - Expected: Permission denied error
  - Test: Try accessing Firestore from browser console without being logged in

- [ ] **Non-Admin Access Test**
  - Authenticate as a regular user (without admin claim)
  - Attempt to read from `bulkSmsSends`
  - Expected: Permission denied error
  - Test: Log in as non-admin, try to access bulk SMS screen

- [ ] **Admin Access Test**
  - Authenticate as an admin user (with `admin: true` custom claim)
  - Attempt to read from `bulkSmsSends`
  - Expected: Successful read operation
  - Test: Log in as admin, verify bulk SMS history loads

- [ ] **Direct Write Test**
  - Attempt to write directly to `bulkSmsSends` from client code
  - Expected: Permission denied error
  - Test: Try to create/update documents via Firestore SDK in browser console

### Function Security Tests

- [ ] **Rate Limiting Test**
  - Attempt to create more than 5 bulk SMS sends within 5 minutes
  - Expected: Rate limit error on the 6th attempt
  - Test: Call `createBulkSmsSend` function 6 times rapidly

- [ ] **Input Validation Test**
  - Send invalid phone numbers
  - Send empty message
  - Send message > 1600 characters
  - Expected: Appropriate validation errors
  - Test: Use bulk SMS UI with invalid inputs

- [ ] **Webhook Signature Validation Test**
  - Send a request to the webhook without valid Twilio signature
  - Expected: 403 Forbidden response
  - Test: Use curl/Postman to POST to webhook URL without signature
  - **Note:** This can only be fully tested in staging/production with real Twilio webhooks

### Data Integrity Tests

- [ ] **Atomic Counter Updates**
  - Send bulk SMS to multiple recipients
  - Verify all counters (successCount, failureCount, etc.) are accurate
  - Expected: Counts match actual sent/failed messages
  - Test: Send to 10 numbers, verify counts

- [ ] **Processing Lock Test**
  - Trigger the same bulk send twice simultaneously
  - Expected: Second trigger should be ignored due to processing lock
  - Test: This is handled automatically by Firebase Functions

## Troubleshooting

### Webhook Not Working

If the Twilio webhook is not updating delivery status:

1. **Check the callback URL is correct:**
   - It must be publicly accessible HTTPS
   - It must match the URL in your environment variables
   - Example: `https://us-central1-YOUR_PROJECT.cloudfunctions.net/NAMESPACE-twilioStatusWebhook`

2. **Verify webhook signature validation:**
   - Check Cloud Functions logs for "Invalid signature" warnings
   - Ensure `TWILIO_AUTH_TOKEN` is set correctly

3. **Check Firestore index is built:**
   - Go to Firebase Console → Firestore → Indexes
   - Verify the `recipients` collectionGroup index status is "Enabled"
   - If "Building", wait for completion (5-10 minutes)

4. **Test webhook manually:**
   - Use Twilio Console to view webhook request/response logs
   - Check for HTTP errors or timeouts

### Permission Denied Errors

If admin users get permission denied:

1. **Verify admin custom claim:**
   ```javascript
   // In Firebase Console or via Admin SDK
   firebase.auth().currentUser.getIdTokenResult()
     .then(token => console.log(token.claims.admin))
   ```

2. **Check security rules are deployed:**
   ```bash
   firebase deploy --only firestore:rules --project staging
   ```

3. **Force token refresh:**
   ```javascript
   // In client code
   await firebase.auth().currentUser.getIdToken(true);
   ```

### Rate Limit Issues

If legitimate users are hitting rate limits:

1. **Check recent send count:**
   - Query `bulkSmsSends` for the user in the last 5 minutes
   - Count should be ≤ 5

2. **Adjust rate limit if needed:**
   - Edit `packages/firebase/src/bulkSms/createBulkSmsSend.ts`
   - Update the time window or max count
   - Redeploy functions

## Additional Resources

- [Twilio SMS Documentation](https://www.twilio.com/docs/sms)
- [Twilio Webhooks Security](https://www.twilio.com/docs/usage/webhooks/webhooks-security)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Custom Claims](https://firebase.google.com/docs/auth/admin/custom-claims)
