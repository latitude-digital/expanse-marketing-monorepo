# Bulk SMS Deployment Checklist

Quick reference for deploying the Bulk SMS feature to staging and production.

## Pre-Deployment Checklist

- [ ] All Phase 1 (Shared Types & Utilities) completed and tested
- [ ] All Phase 2 (Backend Functions) completed and tested
- [ ] Phase 4 configuration files updated (this is done ✅)
- [ ] Twilio account created and verified
- [ ] Twilio phone number purchased
- [ ] Have Twilio Account SID and Auth Token ready

## Staging Deployment

### 1. Set Environment Variables

```bash
# Option A: Using .env file (recommended)
cd packages/firebase
cp .env.example .env.staging

# Edit .env.staging and fill in:
# - TWILIO_ACCOUNT_SID
# - TWILIO_AUTH_TOKEN
# - TWILIO_PHONE_NUMBER
# - Leave TWILIO_STATUS_CALLBACK_URL empty for now
```

```bash
# Option B: Using Firebase Functions config
firebase functions:config:set twilio.account_sid="ACxxxxxxxxxx" --project staging
firebase functions:config:set twilio.auth_token="your_auth_token" --project staging
firebase functions:config:set twilio.phone_number="+15551234567" --project staging
# Leave callback URL empty for now
```

### 2. Build and Deploy Functions (First Time)

```bash
cd packages/firebase
pnpm run build

# Deploy all functions to staging
firebase deploy --only functions --project staging
```

**Note the webhook URL from the output:**
```
Function URL (staging-twilioStatusWebhook): https://us-central1-latitude-leads-staging.cloudfunctions.net/staging-twilioStatusWebhook
```

### 3. Set Callback URL

Update your environment with the webhook URL:

```bash
# Option A: Update .env.staging
TWILIO_STATUS_CALLBACK_URL=https://us-central1-latitude-leads-staging.cloudfunctions.net/staging-twilioStatusWebhook
```

```bash
# Option B: Update Firebase config
firebase functions:config:set \
  twilio.status_callback_url="https://us-central1-latitude-leads-staging.cloudfunctions.net/staging-twilioStatusWebhook" \
  --project staging
```

### 4. Redeploy Functions

```bash
# Redeploy to pick up the callback URL
firebase deploy --only functions --project staging
```

### 5. Deploy Firestore Indexes

```bash
firebase deploy --only firestore:indexes --project staging
```

**Wait 5-10 minutes for index creation.** Check status in Firebase Console:
- Go to Firestore → Indexes
- Verify "recipients" collectionGroup index is "Enabled"

### 6. Deploy Security Rules

```bash
firebase deploy --only firestore:rules --project staging
```

### 7. Verify Deployment

- [ ] Functions deployed successfully
- [ ] Webhook URL is accessible (returns 403 - expected without Twilio signature)
- [ ] Firestore indexes are built (status: Enabled)
- [ ] Security rules are deployed

### 8. Test in Staging

Follow the security verification checklist in `BULK_SMS_SETUP.md`:

- [ ] Admin user can access bulk SMS screen
- [ ] Non-admin user cannot access bulk SMS screen
- [ ] Can create a test bulk SMS send
- [ ] Messages are sent via Twilio
- [ ] Webhook updates delivery status
- [ ] Rate limiting works (6th send in 5 min fails)

## Production Deployment

**⚠️ IMPORTANT:** Only deploy to production after thorough testing in staging!

### 1. Set Environment Variables

```bash
# Option A: Using .env file (recommended)
cd packages/firebase
cp .env.example .env.prod

# Edit .env.prod and fill in PRODUCTION Twilio credentials:
# - TWILIO_ACCOUNT_SID (production account)
# - TWILIO_AUTH_TOKEN (production token)
# - TWILIO_PHONE_NUMBER (production number)
# - Leave TWILIO_STATUS_CALLBACK_URL empty for now
```

```bash
# Option B: Using Firebase Functions config
firebase functions:config:set twilio.account_sid="ACxxxxxxxxxx" --project production
firebase functions:config:set twilio.auth_token="your_auth_token" --project production
firebase functions:config:set twilio.phone_number="+15551234567" --project production
```

### 2. Build and Deploy Functions (First Time)

```bash
cd packages/firebase
pnpm run build

# Deploy all functions to production
firebase deploy --only functions --project production
```

**Note the webhook URL from the output:**
```
Function URL (prod-twilioStatusWebhook): https://us-central1-latitude-lead-system.cloudfunctions.net/prod-twilioStatusWebhook
```

### 3. Set Callback URL

```bash
# Option A: Update .env.prod
TWILIO_STATUS_CALLBACK_URL=https://us-central1-latitude-lead-system.cloudfunctions.net/prod-twilioStatusWebhook
```

```bash
# Option B: Update Firebase config
firebase functions:config:set \
  twilio.status_callback_url="https://us-central1-latitude-lead-system.cloudfunctions.net/prod-twilioStatusWebhook" \
  --project production
```

### 4. Redeploy Functions

```bash
firebase deploy --only functions --project production
```

### 5. Deploy Firestore Indexes

```bash
firebase deploy --only firestore:indexes --project production
```

**Wait 5-10 minutes for index creation.** Verify in Firebase Console.

### 6. Deploy Security Rules

```bash
firebase deploy --only firestore:rules --project production
```

### 7. Verify Production Deployment

- [ ] Functions deployed successfully
- [ ] Webhook URL is accessible
- [ ] Firestore indexes are built
- [ ] Security rules are deployed
- [ ] Admin users have correct custom claims

### 8. Production Smoke Test

**Start with a small test:**

- [ ] Send to 1-2 test numbers only
- [ ] Verify messages are sent
- [ ] Verify webhook updates delivery status
- [ ] Check Twilio Console for message status
- [ ] Verify counters are accurate in Firestore

## Updating Functions (After Initial Deployment)

If you need to update the functions after initial deployment:

```bash
cd packages/firebase
pnpm run build

# Deploy to staging
firebase deploy --only functions --project staging

# Test in staging
# ...

# Deploy to production (after testing)
firebase deploy --only functions --project production
```

## Updating Security Rules

```bash
cd packages/firebase

# Deploy to staging
firebase deploy --only firestore:rules --project staging

# Test in staging
# ...

# Deploy to production
firebase deploy --only firestore:rules --project production
```

## Rollback Procedure

If something goes wrong in production:

### Rollback Functions

```bash
# List recent deployments
firebase functions:log --project production

# Identify the version to rollback to
# Manually rollback via Firebase Console:
# Functions → Select function → Version History → Rollback
```

### Rollback Security Rules

```bash
# View rule history in Firebase Console
# Firestore → Rules → Version History
# Select previous version and publish
```

## Common Issues

### Issue: Webhook not receiving callbacks

**Solution:**
1. Verify callback URL is set correctly in environment
2. Check Cloud Functions logs for errors
3. Verify Firestore index is built
4. Test webhook signature validation

### Issue: Permission denied errors

**Solution:**
1. Verify user has admin custom claim
2. Verify security rules are deployed
3. Force token refresh in client

### Issue: Rate limit errors

**Solution:**
1. Check send frequency (max 5 per 5 minutes per user)
2. Adjust rate limit if needed in `createBulkSmsSend.ts`

### Issue: Messages not sending

**Solution:**
1. Check Twilio account balance
2. Verify phone number is verified/purchased
3. Check Cloud Functions logs for Twilio API errors
4. Verify environment variables are set correctly

## Monitoring

### Cloud Functions Logs

```bash
# View real-time logs for staging
firebase functions:log --project staging

# View logs for specific function
firebase functions:log --only createBulkSmsSend --project staging
```

### Twilio Console

Monitor in Twilio Console:
- Message logs (shows all sent messages)
- Webhook logs (shows callback requests/responses)
- Error logs (shows API errors)

### Firestore Console

Monitor in Firebase Console:
- View `bulkSmsSends` collection for send status
- View `recipients` subcollection for individual message status
- Check indexes are enabled
- Monitor security rule evaluations

## Support

For issues, refer to:
- `BULK_SMS_SETUP.md` - Complete setup guide
- `BULK_SMS_IMPLEMENTATION_PLAN.md` - Full implementation plan
- `PHASE_4_COMPLETION_SUMMARY.md` - Phase 4 summary

## Final Checklist

Before marking deployment complete:

- [ ] ✅ Staging deployment complete and tested
- [ ] ✅ Production deployment complete
- [ ] ✅ All indexes built (status: Enabled)
- [ ] ✅ Security rules deployed and tested
- [ ] ✅ Test SMS send successful
- [ ] ✅ Webhook updates working
- [ ] ✅ Rate limiting tested
- [ ] ✅ Admin access controls verified
- [ ] ✅ Monitoring in place (logs, Twilio console)
- [ ] ✅ Team trained on feature
- [ ] ✅ Documentation shared with team
