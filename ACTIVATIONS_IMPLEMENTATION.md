# Activations Feature Implementation Plan

## Overview
The Activations feature allows multiple events (called "activations" or "stations") to be linked together so that attendees only need to fill out a survey once, but can still track visits to other activations.

## Business Requirements

### The Problem
- Events can have multiple stations/activations
- We want attendees to only fill out the survey once
- We still need to track which activations they visited

### The Solution
- Link events together via `customConfig.activations` array
- When badge is scanned, check current event first
- If not found, search linked activation events
- Find the "original" survey (without `_originalActivation` field)
- Pre-populate the survey with original answers
- Save new survey with `_originalActivation` pointing back to original

## Data Structure

### Event Configuration
```typescript
interface MeridianCustomConfig {
  badgeScan?: MeridianBadgeScanConfig;
  activations?: string[];  // Array of event IDs (max 10 due to Firestore IN query limit)
  [key: string]: any;
}
```

### Survey Data
```typescript
{
  // Normal survey fields...
  _eventId: string;              // The event ID this survey belongs to
  _scanValue: string;            // The badge number scanned
  survey_date: string;           // JS date representation (e.g., "2025-10-03T17:21:55.877Z")
  _originalActivation?: string;  // Full Firestore path: "events/{eventId}/surveys/{surveyId}"
  // ... other answers
}
```

## Implementation Details

### Phase 1: Firestore Query Helper ✓

**File**: `packages/native-app/src/services/firestore.ts`

Add imports:
```typescript
import {
  getFirestore,
  collection,
  collectionGroup,
  query,
  where,
  orderBy,
  getDocs,
  // ... other imports
} from '@react-native-firebase/firestore';
```

Add new function:
```typescript
export const activationsService = {
  /**
   * Find original activation survey for a badge across linked events
   * @param badgeNumber - The scanned badge number
   * @param activationEventIds - Array of event IDs to search (max 10)
   * @returns Survey data with full path OR null if not found
   */
  findOriginalActivationSurvey: async (
    badgeNumber: string,
    activationEventIds: string[]
  ): Promise<{ data: any; path: string; eventId: string } | null> => {
    try {
      const db = getFirestore();

      // Query surveys collection group with IN query
      const surveysQuery = query(
        collectionGroup(db, 'surveys'),
        where('_scanValue', '==', badgeNumber),
        where('_eventId', 'in', activationEventIds)
      );

      const snapshot = await getDocs(surveysQuery);

      if (snapshot.empty) {
        return null;
      }

      // Filter out any surveys that already have _originalActivation
      // (we want the original, not a copy)
      const originalSurveys = snapshot.docs
        .filter(doc => !doc.data()._originalActivation)
        .map(doc => ({
          doc,
          data: doc.data(),
          createdAt: doc.data().survey_date || null
        }));

      if (originalSurveys.length === 0) {
        return null;
      }

      // Sort by survey_date (oldest first) and pick the first one
      originalSurveys.sort((a, b) => {
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

      const oldest = originalSurveys[0];

      return {
        data: oldest.data,
        path: oldest.doc.ref.path, // Full path: "events/{eventId}/surveys/{surveyId}"
        eventId: oldest.data._eventId
      };
    } catch (error) {
      console.error('[activationsService] Error finding activation survey:', error);
      throw error;
    }
  }
};
```

### Phase 2: Update BadgeScanScreen

**File**: `packages/native-app/src/screens/BadgeScanScreen.tsx`

**Current Flow** (lines 142-201):
1. Scan badge
2. Check if badge already completed survey in current event (local DB check)
3. If found, show alert and stop
4. If not found, proceed to survey

**New Flow**:
1. Scan badge
2. Check if badge already completed survey in current event (local DB check)
3. If found, show alert and stop
4. If not found AND event has `customConfig.activations`:
   - Query Firestore for original activation survey
   - If found, pass pre-populated data to survey
5. If no activation survey found, proceed as normal (new survey)

**Code Changes**:

Import the service:
```typescript
import { activationsService } from '../services/firestore';
```

Update `handleScanValue` function (around line 142):
```typescript
const handleScanValue = useCallback(
  async (value: string) => {
    if (!value) {
      return;
    }

    try {
      setIsProcessing(true);
      await playSuccessFeedback();

      // Check if this badge has already completed a survey in THIS event
      console.log('[BadgeScanScreen] Checking if badge has already completed a survey:', value);
      const dbService = DatabaseService.createEncrypted();
      await dbService.initialize();
      const operations = await dbService.getOperations();

      const allResponses = await operations.getSurveyResponses();
      const existingResponse = allResponses.find(response => {
        try {
          const data = JSON.parse(response.data);
          return data._scanValue === value && data.event_id === event.id;
        } catch {
          return false;
        }
      });

      if (existingResponse) {
        console.log('[BadgeScanScreen] Badge has already completed a survey for this event');
        setIsProcessing(false);
        Alert.alert(
          'Survey Already Completed',
          'This badge has already completed a survey for this event.',
          [
            {
              text: 'OK',
              onPress: () => {
                router.dismissTo(`/event/${event.id}`);
              },
            },
          ]
        );
        return;
      }

      // NEW: Check for activation surveys
      let preFillData = null;
      let originalActivationPath = null;

      if (event.customConfig?.activations && event.customConfig.activations.length > 0) {
        console.log('[BadgeScanScreen] Checking activation events for existing survey:', event.customConfig.activations);

        try {
          const activationResult = await activationsService.findOriginalActivationSurvey(
            value,
            event.customConfig.activations
          );

          if (activationResult) {
            console.log('[BadgeScanScreen] Found activation survey, will pre-populate:', activationResult.path);
            preFillData = activationResult.data;
            originalActivationPath = activationResult.path;
          } else {
            console.log('[BadgeScanScreen] No activation survey found, proceeding as new survey');
          }
        } catch (error) {
          console.error('[BadgeScanScreen] Error checking activation surveys:', error);
          // Continue as normal survey on error
        }
      }

      console.log('[BadgeScanScreen] Proceeding to survey...');
      const timestamp = new Date().toISOString();

      setTimeout(() => {
        goToSurvey({
          scanValue: value,
          scanTime: timestamp,
          preFillData: preFillData ? JSON.stringify(preFillData) : undefined,
          originalActivationPath: originalActivationPath || undefined
        });
      }, SCAN_ANIMATION_DURATION);
    } catch (error) {
      console.warn('[BadgeScanScreen] Error handling scan result', error);
      setErrorMessage('Unable to process scan result. Please try again.');
      setIsProcessing(false);
    }
  },
  [goToSurvey, playSuccessFeedback, event, router]
);
```

Update `goToSurvey` function signature (around line 127):
```typescript
const goToSurvey = useCallback(
  (options?: {
    scanValue?: string;
    scanTime?: string;
    preFillData?: string;
    originalActivationPath?: string;
  }) => {
    router.replace({
      pathname: `/survey/[id]`,
      params: {
        id: event.id,
        eventData: JSON.stringify(event),
        ...(options?.scanValue ? { scanValue: options.scanValue } : {}),
        ...(options?.scanTime ? { scanTime: options.scanTime } : {}),
        ...(options?.preFillData ? { preFillData: options.preFillData } : {}),
        ...(options?.originalActivationPath ? { originalActivationPath: options.originalActivationPath } : {}),
      },
    });
  },
  [event, router]
);
```

### Phase 3: Update SurveyScreen

**File**: `packages/native-app/src/screens/SurveyScreen.tsx`

**Changes Needed**:

1. Extract new params from route:
```typescript
const {
  id,
  eventData,
  scanValue,
  scanTime,
  preFillData,
  originalActivationPath
} = useLocalSearchParams();
```

2. Pre-populate SurveyJS model with activation data:
```typescript
// Parse pre-fill data if present
const preFillAnswers = useMemo(() => {
  if (preFillData && typeof preFillData === 'string') {
    try {
      return JSON.parse(preFillData);
    } catch (error) {
      console.error('[SurveyScreen] Failed to parse preFillData:', error);
      return null;
    }
  }
  return null;
}, [preFillData]);

// When creating SurveyJS model, pre-populate with answers
useEffect(() => {
  if (survey && preFillAnswers) {
    console.log('[SurveyScreen] Pre-populating survey with activation data');
    survey.data = preFillAnswers;
  }
}, [survey, preFillAnswers]);
```

3. Include `_originalActivation` in survey submission:
```typescript
// In survey onComplete handler
const surveyData = {
  ...survey.data,
  event_id: event.id,
  survey_date: new Date().toISOString(),
  _eventId: event.id,
  ...(scanValue ? { _scanValue: scanValue } : {}),
  ...(scanTime ? { _scanTime: scanTime } : {}),
  ...(originalActivationPath ? { _originalActivation: originalActivationPath } : {}), // NEW
};
```

## Important Notes

### Firestore Query Limitations
- `IN` queries are limited to 10 items maximum
- This means max 10 activation events can be linked
- This is acceptable per requirements

### Survey Date Field
- Field name: `survey_date`
- Format: JS date string (e.g., "2025-10-03T17:21:55.877Z")
- Used for sorting to find oldest survey

### Edge Cases Handled
1. **No activations configured**: Skip activation check, proceed as normal
2. **No activation survey found**: Proceed as normal (new survey)
3. **Multiple original surveys**: Pick oldest by `survey_date`
4. **Query errors**: Log error, proceed as normal (new survey)
5. **Already completed in current event**: Show alert, block entry (existing behavior)

## Testing Checklist

### Setup
- [ ] Create Event A with `customConfig.activations = [Event B ID, Event C ID]`
- [ ] Create Event B with `customConfig.activations = [Event A ID, Event C ID]`
- [ ] Create Event C with `customConfig.activations = [Event A ID, Event B ID]`

### Test Scenarios
- [ ] Scan badge at Event A (first time) → Normal survey flow
- [ ] Scan same badge at Event B → Pre-populated with Event A data, saves with `_originalActivation`
- [ ] Scan same badge at Event C → Pre-populated with Event A data, saves with `_originalActivation`
- [ ] Scan same badge at Event A again → "Already completed" alert
- [ ] Scan different badge at any event → Normal new survey flow
- [ ] Event without activations → Normal behavior

### Validation
- [ ] Check Firestore for correct `_originalActivation` paths
- [ ] Verify `_eventId` is set correctly for each survey
- [ ] Confirm oldest survey is selected when multiple exist
- [ ] Test with no internet (offline) - should gracefully handle

## Files Modified

1. ✓ `packages/shared/src/types/meridian-event.ts` - Type already exists
2. `packages/native-app/src/services/firestore.ts` - Add activation query helper
3. `packages/native-app/src/screens/BadgeScanScreen.tsx` - Add activation logic
4. `packages/native-app/src/screens/SurveyScreen.tsx` - Handle pre-population

## Current Progress

- [x] Type definitions (already existed)
- [ ] Firestore query helper (IN PROGRESS)
- [ ] BadgeScanScreen updates
- [ ] SurveyScreen updates
- [ ] Testing

## Questions & Answers

**Q: What if we find multiple surveys without `_originalActivation`?**
A: Pick the oldest by `survey_date` field.

**Q: What if no surveys are found in any activation events?**
A: Proceed as normal (create new survey).

**Q: What if `activations` array is empty or missing?**
A: Skip activation check, treat as non-activation event.

**Q: Does this work on web app?**
A: No, native app only, tied to badge scanning for now.

**Q: What about the 10-item limit on IN queries?**
A: Acceptable, 10 activations is the max limit.

**Q: What timestamp field do we use for sorting?**
A: `survey_date` (JS date string format)
