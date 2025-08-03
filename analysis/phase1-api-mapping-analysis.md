# Phase 1 API Mapping Analysis

## Ford API Mapping (SURVEY_UPLOAD_V11, VEHICLES_INSERT)

### Key Findings from Survey.tsx (lines 800-868):

**Endpoint**: `SURVEY_UPLOAD_V11` - `/survey/upload/v11`
**Authentication**: `Authorization: '989ae554-08ca-4142-862c-0058407d2769'`
**Payload Format**: `{ surveyCollection: [mergedSurveyData] }`

**Data Flow**:
1. Survey.tsx calls `mapSurveyToFordSurvey()` to transform SurveyJS data
2. Maps FFS fields (_ffs properties) to Ford API fields 
3. Handles signature extraction from objects to strings
4. Merges custom data into JSON string

**VOI Handling** (lines 847-868):
- If `voi` array exists, calls `VEHICLES_INSERT` endpoint
- Maps each vehicle_id to `{ vehicle_id, device_survey_guid, survey_vehicle_guid }`
- Uses same Authorization header

### FordSurvey Interface (48 fields):
```typescript
interface FordSurvey {
  // Core identifiers
  event_id: number | string | null;
  device_survey_guid: string | null;
  pre_drive_survey_guid: string | null;
  
  // Metadata
  survey_date: string | Date | null;
  survey_type: string | null;
  device_id: string | null;
  app_version: string | null;
  abandoned: number;
  start_time: string | Date | null;
  end_time: string | Date | null;
  
  // Personal Information
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  birth_year: string | number | null;
  gender: string | null;
  age_bracket: string | null;
  
  // Address
  address1: string | null;
  address2: string | null;
  city: string | null;
  state: string | null;
  country_code: string | null;
  zip_code: string | null;
  
  // Vehicle Information
  vehicle_driven_most_model_id: number | string | null;
  vehicle_driven_most_make_id: number | string | null;
  vehicle_driven_most_year: number | string | null;
  
  // Survey Responses
  in_market_timing: string | null;
  how_likely_acquire: string | null;
  how_likely_purchasing: string | null;
  how_likely_purchasing_pre: string | null;
  how_likely_purchasing_post: string | null;
  how_likely_recommend: string | null;
  how_likely_recommend_post: string | null;
  impression_pre: string | null;
  impression_ev: string | null;
  can_trust: string | null;
  impact_overall_opinion: string | null;
  
  // Opt-ins and Permissions
  email_opt_in: number;
  accepts_sms: number;
  followup_survey_opt_in: string | null;
  
  // Legal
  signature: string | null;
  minor_signature: string | null;
  
  // Data Storage
  optins: any[];
  custom_data: string | null; // JSON string
}
```

## Lincoln API Mapping (LINCOLN_SURVEY_UPLOAD, LINCOLN_VEHICLES_INTERESTED, LINCOLN_VEHICLES_DRIVEN)

### Key Findings from Survey.tsx (lines 872-978):

**Primary Endpoint**: `LINCOLN_SURVEY_UPLOAD` - `https://api.latitudeshowtracker.com/events/v1/survey/insert/v13`
**Authentication**: `GTB-ACCESS-KEY: '91827364'`
**Payload Format**: `[mergedLincolnSurveyData]` (array, not object wrapper)

**Data Flow**:
1. Survey.tsx calls `mapSurveyToLincolnSurvey()` 
2. **Uses same FordSurvey interface** but different event_id (lincolnEventID)
3. Same field mapping logic as Ford

**VOI Handling** (lines 918-945):
- Endpoint: `LINCOLN_VEHICLES_INTERESTED`
- Payload includes: `event_id`, `device_survey_guid`, `survey_date`, `vehicle_id`, `app_version`, `abandoned`, `custom_data`

**Driven Vehicle Handling** (lines 948-977):
- Endpoint: `LINCOLN_VEHICLES_DRIVEN` 
- Payload includes: `event_id`, `make_id`, `model_id`, `year`, etc.

## Common vs Brand-Specific Fields Analysis

### Common Fields (Used by both Ford and Lincoln):
- **Core Survey Data**: device_survey_guid, survey_date, survey_type, start_time, end_time
- **Personal Info**: first_name, last_name, email, phone, age_bracket, gender
- **Address**: address1, address2, city, state, zip_code, country_code
- **Vehicle Data**: vehicle_driven_most_make_id, vehicle_driven_most_model_id, vehicle_driven_most_year
- **Survey Responses**: All likelihood ratings, impressions, opinions
- **Legal**: signature, minor_signature
- **Metadata**: app_version, abandoned, custom_data

### Brand-Specific Differences:
1. **Event ID Field**: 
   - Ford: `event_id` = `event.fordEventID`
   - Lincoln: `event_id` = `event.lincolnEventID`

2. **API Authentication**:
   - Ford: `Authorization: '989ae554-08ca-4142-862c-0058407d2769'`
   - Lincoln: `GTB-ACCESS-KEY: '91827364'`

3. **Payload Wrapper**:
   - Ford: `{ surveyCollection: [data] }`
   - Lincoln: `[data]` (direct array)

4. **VOI Endpoint Structure**:
   - Ford: Simpler payload with just IDs
   - Lincoln: More metadata (survey_date, app_version, custom_data)

### ExpanseEvent Interface Analysis

From types.d.ts (lines 30-56):

```typescript
type ExpanseEvent = {
  id: string;                           // Firestore document ID
  brand?: 'Ford' | 'Lincoln' | 'Other'; // Brand selector
  fordEventID?: number;                 // Ford API event ID
  lincolnEventID?: number;              // Lincoln API event ID
  surveyType?: "basic" | "preTD" | "postTD"; // Survey workflow type
  _preEventID?: string;                 // Links to pre-event survey
  
  // Display and behavior
  checkInDisplay?: Record<string, string>;
  disabled?: string;                    // Disable message
  
  // Scheduling
  preRegDate?: Date;
  startDate: Date;
  endDate: Date;
  
  // Content
  name: string;
  questions: ISurvey;                   // SurveyJS definition
  thanks?: string;                      // Completion message
  theme: IExtendedTheme | ITheme;       // Visual theme
  
  // Email automation
  confirmationEmail?: EmailDefinition;
  reminderEmail?: EmailDefinition;
  thankYouEmail?: EmailDefinition;
  checkOutEmail?: EmailDefinition;
  autoCheckOut?: AutoCheckOutDefinition;
  
  // Limits and features
  survey_count_limit?: number;
  limit_reached_message?: string;
  showLanguageChooser?: boolean;        // Enable language selector
  showHeader?: boolean;                 // Show brand header
  showFooter?: boolean;                 // Show brand footer
};
```

### Key Architecture Patterns:

1. **Multi-API Strategy**: Single survey data saved to Firestore + brand-specific API
2. **Common Interface**: Both Ford and Lincoln use FordSurvey interface
3. **Event-Driven Routing**: `fordEventID` or `lincolnEventID` determines API calls
4. **Unified Mapping**: Same transformation logic for both brands
5. **Brand-Specific Endpoints**: Different URLs, headers, and payload formats