**Shared Types Audit**

- Owner: @expanse/shared
- Scope: packages/shared/src/types and all consumers in monorepo
- Date: 2025-09-09

---

**Overview**

- Goal: Remove duplicated/guessed types, establish a single, accurate source of truth for shared domain types used by web and native apps.
- Method: Scanned shared types, mapped usage in mappers/uploader/admin screens, and ran TypeScript on the web app to surface real mismatches.

---

**Key Findings**

- Duplicated types exist in `core.ts` and `survey.ts` with conflicting shapes.
- Two competing event models: `expanse.ts` vs `expanse-event.ts`.
- Handcrafted SurveyJS model typing in `survey.ts` conflicts with official SurveyJS types already re-exported in `core.ts`.
- Several “made-up”/unused interfaces that don’t match real usage (e.g., `OptIn`, bespoke `VehicleOfInterest`, etc.).
- Native/web payload types for Ford/Lincoln are duplicated across files, risking drift.

---

**Finding 1: Duplicated Types (core.ts vs survey.ts)**

Files:
- `packages/shared/src/types/core.ts`
- `packages/shared/src/types/survey.ts`

Duplicates and issues:
- `SurveyEvent`
  - Problem: Different properties. `core.ts` is missing fields used in the web app such as `thanks`, `showFooter`, etc. This leads to TSC errors in `packages/web-app/src/screens/Survey.tsx`.
  - Fix: Stop defining `SurveyEvent` in two places. Prefer consolidating on the richer `ExpanseEvent` (see Finding 2) and remove `SurveyEvent` duplicates. If a `SurveyEvent` alias is needed, use `type SurveyEvent = ExpanseEvent`.

- `MeridianSurveyData` (formerly `SurveyData`)
  - Problem: Different shapes. `survey.ts` included `microsite_email_template`; `core.ts` had foundational metadata. Also, `microsite_email_template` should not be part of survey data.
  - Fix: Define a single, flexible `MeridianSurveyData` with core metadata and dynamic fields; remove `microsite_email_template` entirely from survey data.

- `EmailTemplate`, `FFSData`, `OptIn`, `AddressData`, `WaiverData`
  - Problem: Duplicated definitions across both files; many are unused or guessed. The email template reference in survey data was incorrectly modeled as an object.
  - Fix: Do not include an email template object in survey data. Where a template reference is needed elsewhere, use a simple string id (e.g., `type EmailTemplateId = string`). Remove unused types (`OptIn`, bespoke `VehicleOfInterest`, `AddressData`, `WaiverData`, duplicated `FFSData`). If an `FFSData` helper is desired, define a single alias in one place only.

Proposed canonical `MeridianSurveyData` (single source of truth):

```ts
// packages/shared/src/types/core.ts
export interface MeridianSurveyData {
  // Core identification
  device_survey_guid?: string | null;
  event_id?: string;
  device_id?: string;

  // Timing
  start_time?: Date | string;
  end_time?: Date | string;
  survey_date?: Date | string;

  // Technical metadata
  app_version?: string;
  _utm?: Record<string, string>;
  _referrer?: string;
  _language?: string | null;
  _screenWidth?: number;
  _offset?: number;
  _timeZone?: string;

  // Status/internal
  abandoned?: number;
  _preSurveyID?: string | null;
  _checkedIn?: unknown;
  _checkedOut?: unknown;
  _claimed?: unknown;
  _used?: unknown;
  _email?: unknown;
  _sms?: unknown;
  _exported?: unknown;

  // Dynamic fields come from survey definition (FFS/custom)
  [key: string]: unknown;
}
```

---

**Finding 2: Conflicting Expanse Event Models**

Files:
- `packages/shared/src/types/expanse.ts` (leaner)
- `packages/shared/src/types/expanse-event.ts` (richer; used by admin & survey screens)

Problem:
- The web app expects properties like `thanks`, `theme`, `showFooter`, `autoCheckOut`, and email automation config, which exist in `expanse-event.ts` but not in `expanse.ts`. This mismatch produces many TSC errors in admin screens (EditEventTailwind, etc.).

Fix:
- Canonicalize `ExpanseEvent` to the richer `expanse-event.ts` definition and export it from the barrel.
- Remove (or convert) `types/expanse.ts` to re-export the canonical `ExpanseEvent` to avoid divergent definitions.

Example re-export to de-dup:

```ts
// packages/shared/src/types/expanse.ts
export type { ExpanseEvent } from './expanse-event';
export interface ExpanseSurvey { /* delete or re-home if unused */ }
export interface ExpanseUser { /* delete or re-home if unused */ }
export interface ApiResponse<T = unknown> { /* if used, keep here */ }
export interface UploadStatus { /* if used, keep here */ }
export interface ValidationResult { /* if used, keep here */ }
```

If only `ExpanseEvent` is required by consumers, prefer deleting unrelated interfaces from this file to avoid confusion.

---

**Finding 3: Handcrafted SurveyJS Typing**

Files:
- `packages/shared/src/types/survey.ts` (custom `SurveyJSModel` structure)
- `packages/shared/src/types/core.ts` (already re-exports SurveyJS `Model` and `Question` from `survey-core`)

Problem:
- The custom `SurveyJSModel` JSON shape guesses field names and diverges from actual SurveyJS types and usage. The code creates `Model` from JSON and inspects questions dynamically.

Fix:
- Use official SurveyJS types everywhere. Keep the existing re-export in `core.ts`:

```ts
export type { Model as SurveyJSModel, Question as SurveyJSQuestion } from 'survey-core';
```

- For stored survey config, rely on `MeridianEvent.surveyJSModel/surveyJSTheme: Record<string, unknown>` (Firestore maps).
- Remove the handcrafted `SurveyJSModel` interface from `survey.ts` and keep only re-exports as a temporary shim.

---

**Implementation Instructions: SurveyJS Typing Cleanup**

- Remove custom SurveyJS-shaped interfaces from `packages/shared/src/types/survey.ts`.
- Keep only re-exports during migration:

```ts
// packages/shared/src/types/survey.ts (temporary shim)
export type { Model as SurveyJSModel, Question as SurveyJSQuestion } from 'survey-core';
export type { MeridianSurveyData } from './core';
```

- Update consumers to import SurveyJS types from the barrel or directly from `survey-core`.
- Do not attempt to model SurveyJS JSON; instantiate `new Model(json)` and use official APIs.

---

**Finding 4: Made‑up / Unused Interfaces**

Candidates to remove (or mark deprecated) after verifying no meaningful usage:
- `OptIn` (in both `core.ts` and `survey.ts`): no production usage found.
- `VehicleOfInterest` (in `survey.ts`): conflicts with real usage where VOI is string IDs and brand-specific VOI models exist.
- `AddressData`, `WaiverData`: not referenced by mappers; values are read directly from survey data objects.
- Duplicated `FFSData`: mappers build an FFS record dynamically; keep at most one simple alias if it helps readability.

If needed, a single helper type can be:

```ts
export type FFSData = Record<string, string | number | string[] | null | undefined>;
```

---

**Finding 5: Ford/Lincoln Payload Duplication**

Files:
- `packages/shared/src/types/ford.ts` and `lincoln.ts` (canonical payloads and creators)
- `packages/shared/src/types/survey-responses.ts` (`FordSurveyAnswers`, `LincolnSurveyAnswers` duplicates)

Problem:
- `survey-responses.ts` duplicates payload fields. This invites drift.

Fix:
- Alias native-app-facing response types to the canonical payloads:

```ts
// packages/shared/src/types/survey-responses.ts
export type FordSurveyAnswers = import('./ford').FordSurveyPayload;
export type LincolnSurveyAnswers = import('./lincoln').LincolnSurveyPayload;
```

If native app needs slight differences, maintain those differences via explicit extension or intersection types with a comment explaining why.

---

**Implementation Instructions: Native Response Aliases**

- Replace duplicated interfaces in `packages/shared/src/types/survey-responses.ts` with aliases to canonical payloads.

```ts
// packages/shared/src/types/survey-responses.ts
// BEFORE
export interface FordSurveyAnswers { /* duplicated fields */ }
export interface LincolnSurveyAnswers extends FordSurveyAnswers {}

// AFTER
export type FordSurveyAnswers = import('./ford').FordSurveyPayload;
export type LincolnSurveyAnswers = import('./lincoln').LincolnSurveyPayload;

// Keep VOI/VehicleDriven models if still used by native flows
```

Why: ensures a single source of truth for payload shapes used by mappers/uploader and prevents drift.

---

**Canonical Payload Definitions (Tightened Types)**

- Tightening rules (per product requirements):
  - `event_id` is a number (still nullable).
  - `survey_date` is a JS `Date` (still nullable).
  - Vehicle/model identifiers are numbers (still nullable).
  - Year fields are numbers (still nullable).
  - `optins` (Ford) may be an array or `null`.

Ford

```ts
// packages/shared/src/types/ford.ts
export interface FordSurveyPayload {
  event_id: number | null;
  survey_date: Date | null;
  survey_type: string | null;
  device_survey_guid: string | null;
  pre_drive_survey_guid: string | null;
  device_id: string | null;
  app_version: string | null;
  abandoned: number;
  start_time: string | Date | null;
  end_time: string | Date | null;

  // Personal info
  first_name: string | null;
  last_name: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  state: string | null;
  country_code: string | null;
  zip_code: string | null;
  phone: string | null;
  email: string | null;
  email_opt_in: number;

  // Vehicle info
  vehicle_driven_most_model_id: number | null;
  vehicle_driven_most_make_id: number | null;
  vehicle_driven_most_year: number | null;

  // Survey responses
  in_market_timing: string | null;
  accepts_sms: number;
  how_likely_acquire: string | null;
  how_likely_purchasing: string | null;
  how_likely_purchasing_pre: string | null;
  how_likely_purchasing_post: string | null;
  how_likely_recommend: string | null;
  how_likely_recommend_post: string | null;
  followup_survey_opt_in: string | null;

  // Legal
  signature: string | null;
  minor_signature: string | null;

  // Demographics / brand perception
  birth_year: number | null;
  gender: string | null;
  age_bracket: string | null;
  impression_pre: string | null;
  impression_ev: string | null;
  can_trust: string | null;
  impact_overall_opinion: string | null;

  // Containers
  optins: Array<{ optin_id: string; optin: string; }> | null;
  custom_data: string | null; // JSON string
  // Vehicles of Interest
  voi: number[] | null;
}
```

Lincoln

```ts
// packages/shared/src/types/lincoln.ts
export interface LincolnSurveyPayload {
  event_id: number | null;
  survey_date: Date | null;
  survey_type: string | null;
  device_survey_guid: string | null;
  pre_drive_survey_guid: string | null;
  device_id: string | null;
  app_version: string | null;
  abandoned: number;
  start_time: string | Date | null;
  end_time: string | Date | null;

  // Personal info
  first_name: string | null;
  last_name: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  state: string | null;
  country_code: string | null;
  zip_code: string | null;
  phone: string | null;
  email: string | null;
  email_opt_in: number;

  // Demographics / responses
  age_bracket: string | null;
  gender: string | null;
  how_familiar_other: string | null;
  how_familiar: string | null;
  impression: string | null;
  impression_pre: string | null;
  impression_pre_navigator: string | null;
  impression_post: string | null;
  impression_post_navigator: string | null;
  impression_other: string | null;
  competitive_make: string | null;
  how_likely_purchasing: string | null;
  how_likely_purchasing_pre: string | null;
  how_likely_purchasing_post: string | null;
  how_likely_purchasing_other: string | null;
  how_likely_recommend: string | null;
  how_likely_recommend_pre: string | null;
  how_likely_recommend_post: string | null;
  how_likely_recommend_other: string | null;

  // Vehicle info
  vehicle_driven_most_model_id: number | null;
  vehicle_driven_most_year: number | null;
  in_market_timing: string | null;
  most_likely_buy_model_id: number | null;
  most_likely_buy_model_id_pre: number | null;
  most_likely_buy_model_id_post: number | null;

  // Legal / misc
  signature: string | null;
  minor_signature: string | null;
  rep_initials: string | null;
  drove_bonus_vehicle: string | null;
  user_name: string | null;

  // Data containers / metadata
  custom_data: string | null;             // JSON string
  melissa_data_complete: string | null;
  melissa_data_response: string | null;
  device_name: string | null;
  one_word_impression: string | null;
  brand_impression_changed: string | null;
  language: string;                       // required
  survey_source: string | null;
  // Vehicles of Interest
  voi: number[] | null;
}
```

Note: If the current payload creators (`createDefaultFordPayload`, `createDefaultLincolnPayload`) or mappers assign strings to these fields, we will normalize/cast to numbers during mapping.

---

**Finding 6: Barrel Exports and Import Hygiene**

File:
- `packages/shared/src/types/index.ts`

Problem:
- Barrel currently exports `./core` and `./sparkpost`. `ExpanseEvent` must come from the canonical `expanse-event.ts`. Some consumers import from deep paths like `../types/survey` which we plan to remove.

Fix:
- Make the barrel the single source of truth for consumer imports:

```ts
// packages/shared/src/types/index.ts
export * from './core';
export * from './sparkpost';
export * from './meridian-event';
export type { Model as SurveyModel, Question as SurveyQuestionBase } from 'survey-core';
```

- Update imports in shared mappers/uploader and app code to import from `@expanse/shared/types` only.

Examples to change:

```ts
// BEFORE
import { MeridianSurveyData, CustomSurveyData } from '../types';

// AFTER
import { MeridianSurveyData } from '@expanse/shared/types';
type CustomSurveyData = Record<string, unknown>; // or keep a single alias in core
```

---
**Implementation Instructions: Barrel + Import Updates**

1) Update barrel:

```ts
// packages/shared/src/types/index.ts
export * from './core';
export * from './sparkpost';
export * from './meridian-event';
export type { Model as SurveyModel, Question as SurveyQuestionBase } from 'survey-core';
```

2) Update shared imports (surgical edits):
- `packages/shared/src/mappers/ford.ts`
  - Before: `import { SurveyData, CustomSurveyData } from '../types/survey'`
  - After: `import { MeridianSurveyData, MeridianEvent } from '@expanse/shared/types'`
  - Adjust signature: `mapToFordPayload(survey: Model, surveyData: MeridianSurveyData, event?: MeridianEvent)`

- `packages/shared/src/mappers/lincoln.ts`
  - Same change as Ford.

- `packages/shared/src/api/uploader.ts`
  - Before: `import { ExpanseEvent } from '../types/expanse'` and `import { SurveyData } from '../types/survey'`
  - After: `import { MeridianEvent, MeridianSurveyData } from '@expanse/shared/types'`
  - Adjust function signatures accordingly.

3) Update app imports to the barrel and rename types:
- Replace `ExpanseEvent` with `MeridianEvent` everywhere.
- Replace `SurveyData` with `MeridianSurveyData` where used.

Observed import sites to update (non-exhaustive):
- Native app
  - `packages/native-app/src/services/event-cache.ts`
  - `packages/native-app/src/services/sync-manager.ts`
  - `packages/native-app/src/services/firestore.ts`
  - `packages/native-app/src/screens/SurveyScreen.tsx`
  - `packages/native-app/src/screens/EventListScreen.tsx`
  - `packages/native-app/src/components/SurveyWebView.tsx`
  - `packages/native-app/src/components/EventCard.tsx`
- Web app
  - `packages/web-app/src/screens/Survey.tsx` (use `MeridianEvent`, `MeridianSurveyData`)
  - `packages/web-app/src/screens/Experiential.tsx` (use `MeridianSurveyData`)
  - `packages/web-app/src/screens/Stats.tsx`, `CheckIn.tsx`, `admin/EditEvent*.tsx`

4) Optional hygiene:
- Add lint rule to forbid deep imports from `@expanse/shared/src/types/*` and enforce `@expanse/shared/types` only.

Notes:
- After edits, run `pnpm --filter @expanse/shared build` and then typecheck apps to catch missed renames.

---

**Minimal Code Deltas (Illustrative)**

1) Remove handcrafted SurveyJS types and duplicates from `survey.ts`, or replace file with re-exports:

```ts
// packages/shared/src/types/survey.ts (temporary shim during migration)
export type { SurveyJSModel, SurveyJSQuestion } from './core';
export type { MeridianSurveyData } from './core';
// Intentionally no local interface definitions.
```

2) Canonicalize `ExpanseEvent` export:

```ts
// packages/shared/src/types/index.ts
export * from './core';
export * from './sparkpost';
export * from './expanse-event';
export type { Model as SurveyModel, Question as SurveyQuestionBase } from 'survey-core';
```

3) Unify native response types with payloads:

```ts
// packages/shared/src/types/survey-responses.ts
export type FordSurveyAnswers = import('./ford').FordSurveyPayload;
export type LincolnSurveyAnswers = import('./lincoln').LincolnSurveyPayload;
```

---

**Implementation Instructions: MeridianEvent (Canonical Event Type)**

- Create `packages/shared/src/types/meridian-event.ts` exporting the canonical event type and helpers.
- Remove `SurveyEvent` from all locations (no alias). Consumers must use `MeridianEvent`.
- Keep `surveyJSModel`/`surveyJSTheme` for now (string or parsed object) to match current usage in uploader/admin; we can remove later after migration.
- Do not include legacy/imagined fields (`eventName`, `eventDate`, `location`, `surveyName`, `expectedResponses`, `description`, `createdAt`, `updatedAt`, `surveyJSON`, `isActive`, `disabled`).

```ts
// Canonical Meridian event types
export type Brand = 'Ford' | 'Lincoln' | 'Other';
export type SurveyType = 'basic' | 'preTD' | 'postTD';

export interface EmailDefinition {
  template: string;
  daysBefore?: number;
  daysAfter?: number;
  sendNow?: boolean;
  sendNowAfterDays?: number;
  customData?: any;
  sendHour?: number;
}

export interface AutoCheckOutDefinition {
  minutesAfter: number;
  postEventId: string;
}

export interface SurveyTheme {
  cssVariables?: Record<string, string>;
  [key: string]: any;
}

export interface SurveyDefinition {
  pages?: any[];
  elements?: any[];
  [key: string]: any;
}

export interface MeridianEvent {
  // Core identifiers
  id: string;
  name: string;

  // Routing / brand
  brand?: Brand;
  fordEventID?: number;
  lincolnEventID?: number;

  // Workflow
  surveyType?: SurveyType;
  _preEventID?: string; // link to pre-event for postTD

  // Scheduling
  startDate: Date;
  endDate: Date;

  // Survey definition and theme (Firestore maps / object trees)
  surveyJSModel?: Record<string, unknown>;
  surveyJSTheme?: Record<string, unknown>;

  // Display toggles and UX
  thanks?: string;
  showLanguageChooser?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
  checkInDisplay?: Record<string, string>;

  // Limits
  survey_count_limit?: number;
  limit_reached_message?: string;

  // Organization
  tags?: string[];

  // Email automation and auto-checkout
  confirmationEmail?: EmailDefinition;
  reminderEmail?: EmailDefinition;
  thankYouEmail?: EmailDefinition;
  checkOutEmail?: EmailDefinition;
  autoCheckOut?: AutoCheckOutDefinition;
}
```

- Update barrel `packages/shared/src/types/index.ts` to export `MeridianEvent`:

```ts
export * from './meridian-event';
```

---

**Migration Plan**

1) Canonicalize types
- Make `meridian-event.ts` the single `MeridianEvent` export in the barrel.
- Define a single `MeridianSurveyData` in `core.ts` with base app metadata and index signature (no `microsite_email_template`).
- Remove duplicated interfaces from `survey.ts` and `core.ts`.

2) Update imports
- In shared mappers/uploader: import `SurveyData` from `@expanse/shared/types` (not `../types/survey`).
- In web/native apps: import `ExpanseEvent` and `SurveyData` from `@expanse/shared/types` only.

3) De-dup payload types
- Alias `FordSurveyAnswers`/`LincolnSurveyAnswers` to payloads.

4) Typecheck and fix fallout
- Run `pnpm --filter @expanse/shared build` (should continue to pass).
- Run web app TSC to verify `SurveyEvent`-related errors are gone and admin screens typecheck better with canonical `ExpanseEvent`.

5) Optional: enforce import hygiene
- Add lint rule or codemod to block deep imports from `@expanse/shared/src/types/survey`.

---

**Rationale**

- Reduces maintenance risk: one definition per domain concept.
- Matches real usage: web app/admin expect the richer event model and flexible survey data.
- Leans on official SurveyJS types instead of custom guessing.
- Keeps native/web aligned on Ford/Lincoln payloads.

---

**Open Questions / Confirmations**

- Is `ApiResponse`, `UploadStatus`, `ValidationResult` from `types/expanse.ts` actively used? If yes, keep them but move next to canonical `ExpanseEvent` or leave them in `expanse.ts` with a comment; if not, delete to avoid confusion.
- Any consumers requiring strongly typed address/waiver objects from survey answers? Current mappers read nested objects dynamically; if you want stricter typing, we can add a single `AddressGroup` type that mirrors the survey definition rather than duplicating in multiple files.

---

// Note: FFSData helper was considered but is not used anywhere today.
// We will not add a new FFSData alias; mappers can continue using local Record<...> typing
// or be updated later if a concrete need arises.

---

**Canonical Payload Definitions (Tightened Types)**

- Tightening rules (per product requirements):
  - `event_id` is a number (still nullable).
  - `survey_date` is a JS `Date` (still nullable).
  - Vehicle/model identifiers are numbers (still nullable).
  - Year fields are numbers (still nullable).
  - `optins` (Ford) is `{ optin_id: string; optin: string; }[] | null`.
  - `voi` is `number[] | null` for both brands.

Ford

```ts
// packages/shared/src/types/ford.ts
export interface FordSurveyPayload {
  event_id: number | null;
  survey_date: Date | null;
  survey_type: string | null;
  device_survey_guid: string | null;
  pre_drive_survey_guid: string | null;
  device_id: string | null;
  app_version: string | null;
  abandoned: number;
  start_time: string | Date | null;
  end_time: string | Date | null;

  // Personal info
  first_name: string | null;
  last_name: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  state: string | null;
  country_code: string | null;
  zip_code: string | null;
  phone: string | null;
  email: string | null;
  email_opt_in: number;

  // Vehicle info
  vehicle_driven_most_model_id: number | null;
  vehicle_driven_most_make_id: number | null;
  vehicle_driven_most_year: number | null;

  // Survey responses
  in_market_timing: string | null;
  accepts_sms: number;
  how_likely_acquire: string | null;
  how_likely_purchasing: string | null;
  how_likely_purchasing_pre: string | null;
  how_likely_purchasing_post: string | null;
  how_likely_recommend: string | null;
  how_likely_recommend_post: string | null;
  followup_survey_opt_in: string | null;

  // Legal
  signature: string | null;
  minor_signature: string | null;

  // Demographics / brand perception
  birth_year: number | null;
  gender: string | null;
  age_bracket: string | null;
  impression_pre: string | null;
  impression_ev: string | null;
  can_trust: string | null;
  impact_overall_opinion: string | null;

  // Containers
  optins: Array<{ optin_id: string; optin: string; }> | null;
  custom_data: string | null; // JSON string

  // Vehicles of Interest
  voi: number[] | null;
}
```

Lincoln

```ts
// packages/shared/src/types/lincoln.ts
export interface LincolnSurveyPayload {
  event_id: number | null;
  survey_date: Date | null;
  survey_type: string | null;
  device_survey_guid: string | null;
  pre_drive_survey_guid: string | null;
  device_id: string | null;
  app_version: string | null;
  abandoned: number;
  start_time: string | Date | null;
  end_time: string | Date | null;

  // Personal info
  first_name: string | null;
  last_name: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  state: string | null;
  country_code: string | null;
  zip_code: string | null;
  phone: string | null;
  email: string | null;
  email_opt_in: number;

  // Demographics / responses
  age_bracket: string | null;
  gender: string | null;
  how_familiar_other: string | null;
  how_familiar: string | null;
  impression: string | null;
  impression_pre: string | null;
  impression_pre_navigator: string | null;
  impression_post: string | null;
  impression_post_navigator: string | null;
  impression_other: string | null;
  competitive_make: string | null;
  how_likely_purchasing: string | null;
  how_likely_purchasing_pre: string | null;
  how_likely_purchasing_post: string | null;
  how_likely_purchasing_other: string | null;
  how_likely_recommend: string | null;
  how_likely_recommend_pre: string | null;
  how_likely_recommend_post: string | null;
  how_likely_recommend_other: string | null;

  // Vehicle info
  vehicle_driven_most_model_id: number | null;
  vehicle_driven_most_year: number | null;
  in_market_timing: string | null;
  most_likely_buy_model_id: number | null;
  most_likely_buy_model_id_pre: number | null;
  most_likely_buy_model_id_post: number | null;

  // Legal / misc
  signature: string | null;
  minor_signature: string | null;
  rep_initials: string | null;
  drove_bonus_vehicle: string | null;
  user_name: string | null;

  // Data containers / metadata
  custom_data: string | null;             // JSON string
  melissa_data_complete: string | null;
  melissa_data_response: string | null;
  device_name: string | null;
  one_word_impression: string | null;
  brand_impression_changed: string | null;
  language: string;                       // required
  survey_source: string | null;

  // Vehicles of Interest
  voi: number[] | null;
}
```

Note: Normalize types in mappers before assignment (strings → numbers/dates) where needed.

---

**Deprecations**

- Remove immediately
  - `SurveyEvent` (all locations)
  - Duplicate/guessed interfaces: `OptIn`, bespoke `VehicleOfInterest`, `AddressData`, `WaiverData`, duplicated `FFSData`
- Replace/rename
  - `packages/shared/src/types/expanse-event.ts` → superseded by `meridian-event.ts` (stop exporting; remove after migration)
  - `packages/shared/src/types/expanse.ts` → re-export only `MeridianEvent` or delete if not needed
  - `packages/shared/src/types/survey.ts` → temporary shim with re-exports only (remove later)

---

**PR Checklist (Migration Order)**

1) Add `meridian-event.ts`; export from barrel.
2) Define `MeridianSurveyData` in `core.ts`; remove `SurveyEvent` and unused interfaces.
3) Convert `survey.ts` to a shim (re-exports only).
4) Alias native responses in `survey-responses.ts` to canonical payloads.
5) Tighten `FordSurveyPayload`/`LincolnSurveyPayload` and creators to match defaults.
6) Update shared imports/signatures in mappers and uploader.
7) Update app imports (native + web) to use `MeridianEvent`/`MeridianSurveyData` from barrel.
8) Typecheck: shared + apps.
9) Remove deprecated files/exports once green.
10) Add lint rule to block deep imports and enforce barrel usage.

---

**Normalization Rules (Mappers)**

- Coerce numeric IDs/years to `number`.
- Ensure `survey_date` is a `Date`.
- Convert boolean flags to `0 | 1` for numeric API fields.
- VOI as `number[] | null`; empty arrays → null if required.
- Ford opt-ins as `{ optin_id, optin }[] | null`.
- Address mapping and default `country_code` to `"USA"` for Lincoln when absent.
- Extract signatures to strings (or null); collapse minor signature based on minorsYesNo.
- Fold `18 - 20` and `21 - 24` → `18 - 24`.

---

**Validation Checklist**

- Build shared: `pnpm --filter @expanse/shared build`
- Typecheck web app: `packages/web-app/node_modules/.bin/tsc -p packages/web-app/tsconfig.json`
- Grep for stragglers:
  - `rg -n "\bSurveyEvent\b|from '../types/survey'|from './expanse-event'"`
  - `rg -n "\bExpanseEvent\b|\bSurveyData\b"`
- Spot-check mappers for numeric/date normalization.

---

**Lint/Codemod Suggestions**

- ESLint no-restricted-imports example:

```json
{
  "rules": {
    "no-restricted-imports": ["error", {
      "patterns": [
        "@expanse/shared/src/types/*",
        "@expanse/shared/src/*"
      ]
    }]
  }
}
```

- Quick codemod (regex):
  - Find: `from ['\"]@expanse/shared/src/types/survey['\"]` → Replace: `from '@expanse/shared/types'`
  - Find: `\bExpanseEvent\b` → Replace: `MeridianEvent`
  - Find: `\bSurveyData\b` → Replace: `MeridianSurveyData`

---

**Naming Conventions: Expanse → Meridian (Code-Wide)**

- Scope (what to rename now)
  - Types/interfaces/classes: `Expanse*` → `Meridian*` (e.g., `ExpanseEvent` → `MeridianEvent`).
  - Identifiers (vars, functions, constants): `expanse` → `meridian` where it represents our app/domain (not vendor names).
  - Filenames where safe (e.g., `expanse-event.ts` → `meridian-event.ts`).
  - Comments and documentation references in the codebase.

- Out of scope for now (do NOT rename yet)
  - External resources: Firebase project/collections, deployed URLs/domains, S3 buckets, Jenkins jobs, third‑party dashboards.
  - NPM package scope `@expanse/*` (coordinate downstream usage before changing scope).
  - Any persisted data field names used as API contracts unless explicitly migrated (Firestore doc fields, API payload keys).

- Mapping guidelines (common patterns)
  - Types: `ExpanseEvent` → `MeridianEvent`; `ExpanseSurvey` → review/remove or `MeridianSurvey` if still used.
  - Data: `SurveyData` → `MeridianSurveyData` (already planned).
  - Files: `types/expanse-event.ts` → `types/meridian-event.ts` (already planned), `types/expanse.ts` → remove/re‑export.
  - Constants/env: Prefer `MERIDIAN_*` for new additions; keep existing `EXPANSE_*` until config rollout.
- Namespaces: When changing `@expanse/shared` scope later, plan coordinated PRs across all apps.

- Safe find/replace checklist (code only)
  - Search terms:
    - `\bExpanseEvent\b`, `\bExpanse(Survey|User|.*)\b`, `\bSurveyData\b`
    - `from ['\"]@expanse/shared` (package scope changes later)
    - `expanse-event.ts`
  - Exclusions: `node_modules`, `lib/`, `build/`, `survey-library/`, configuration JSON, env files.
  - Ripgrep examples:

```bash
rg -nI "\\bExpanseEvent\\b|\\bSurveyData\\b|expanse-event\\.ts" --no-ignore -g '!**/(node_modules|lib|build|survey-library)/**'
rg -nI "@expanse/shared" --no-ignore -g '!**/(node_modules|lib|build|survey-library)/**'
```

- Codemod order (keep PRs small)
  1) Types only: introduce `MeridianEvent`, `MeridianSurveyData`, update imports/usages.
  2) File renames: `expanse-event.ts` → `meridian-event.ts` (update barrel exports), remove old exports.
  3) Identifier cleanup: rename obvious `expanse*` function/variable names to `meridian*` in shared and apps.
  4) Package scope and external config: separate coordinated effort (versioned releases, CI updates).

- Risks & validation
  - Avoid renaming keys in persisted documents or API contracts without a migration plan.
  - Run typecheck and smoke tests after each PR slice to catch missed references.

---

**Org/Package Scope Plan**

- Proposed GitHub org: `meridian-event-tech` ("Meridian" is taken)
  - Repos would live under `github.com/meridian-event-tech/*`.
  - Update CI (Jenkins, GH Actions) repo references when moved.

- Future NPM package scope (when publishing): `@meridian-event-tech/*`
  - Packages in this monorepo would be renamed, for example:
    - `@expanse/shared` → `@meridian-event-tech/shared`
    - `@expanse/web-app` → `@meridian-event-tech/web-app`
    - `@expanse/firebase` → `@meridian-event-tech/firebase`
    - `@expanse/native-app` → `@meridian-event-tech/native-app`

- Rename checklist (to run when ready to change scope)
  1) Update `package.json` name fields for each workspace to new scope.
  2) Update inter-package imports across the repo from `@expanse/*` → `@meridian-event-tech/*`.
  3) Update PNPM workspace references and any scripts that pin `@expanse/*`.
  4) Verify TypeScript path aliases (if any) remain correct or are updated.
  5) Update build, deploy, and test pipelines (Jenkinsfile, scripts) that grep for old scope.
  6) Rebuild and run typecheck across all apps.
  7) Publish dry-run to verify registry acceptance (when packages are public/private as desired).

- For now
  - Keep current scope `@expanse/*` to avoid broad churn during the type refactor.
  - Land type renames (`MeridianEvent`, `MeridianSurveyData`) first; change package scope in a separate PR series.

---
