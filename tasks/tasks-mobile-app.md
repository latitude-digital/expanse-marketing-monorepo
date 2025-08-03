# Tasks for Mobile App PRD (./mobile-app.prd)

## Relevant Files

### Files to Create:
- `packages/shared/types/survey-responses.ts` - Extracted survey response interfaces
- `packages/shared/types/expanse-event.ts` - ExpanseEvent interface formalization  
- `packages/shared/types/api-clients.ts` - API client type definitions
- `packages/shared/utils/api-client.ts` - Shared API client logic
- `packages/shared/utils/data-mapping.ts` - Response mapping functions
- `packages/shared/package.json` - Shared package configuration
- `packages/native-app/app.json` - Expo configuration
- `packages/native-app/package.json` - Native app dependencies
- `packages/native-app/tsconfig.json` - TypeScript configuration
- `packages/native-app/src/components/EventList.tsx` - Event listing component
- `packages/native-app/src/components/EventCard.tsx` - Brand-aware event cards
- `packages/native-app/src/components/SurveyWebView.tsx` - Survey WebView container
- `packages/native-app/src/components/SyncStatusIndicator.tsx` - Sync status feedback
- `packages/native-app/src/screens/EventListScreen.tsx` - Main event list screen
- `packages/native-app/src/screens/EventDetailScreen.tsx` - Event details screen
- `packages/native-app/src/screens/SurveyScreen.tsx` - Survey execution screen
- `packages/native-app/src/services/database.ts` - SQLite database operations
- `packages/native-app/src/services/sync-manager.ts` - Multi-API sync logic
- `packages/native-app/src/services/event-cache.ts` - Offline event caching
- `packages/native-app/src/services/api-client.ts` - HTTP client service
- `packages/native-app/src/utils/theme-provider.ts` - Ford/Lincoln theme provider
- `packages/native-app/src/utils/offline-detector.ts` - Connectivity detection
- `packages/native-app/App.tsx` - Main app component

### Files to Modify:
- `package.json` - Add native-app to workspace configuration
- `pnpm-workspace.yaml` - Include new packages

### Files to Reference (Read-Only):
- `packages/web-app/src/screens/Survey.tsx` - Extract data models from existing mapping logic (copy, don't modify)
- `packages/web-app/src/types.d.ts` - Reference ExpanseEvent interface (copy, don't modify)
- `packages/firebase/functions/src/` - Reference API endpoint patterns (copy, don't modify)

### Test Files to Create:
- `packages/shared/__tests__/data-mapping.test.ts` - Data mapping utility tests
- `packages/native-app/__tests__/components/EventList.test.tsx` - Event list component tests
- `packages/native-app/__tests__/components/SurveyWebView.test.tsx` - WebView component tests
- `packages/native-app/__tests__/services/database.test.ts` - Database service tests
- `packages/native-app/__tests__/services/sync-manager.test.ts` - Sync manager tests

## Tasks

### 1.0 Shared Code Architecture & Data Models ✅ **COMPLETED**
Foundation phase to extract and formalize data structures from existing web app.

#### 1.1 Analyze Existing Survey.tsx Data Mapping (Read-Only Analysis) ✅
- [x] 1.1.1 Read and document current Survey.tsx mapping logic for Ford API payloads (SURVEY_UPLOAD_V11, VEHICLES_INSERT) - **DO NOT MODIFY**
- [x] 1.1.2 Read and document current Survey.tsx mapping logic for Lincoln API payloads (LINCOLN_SURVEY_UPLOAD, LINCOLN_VEHICLES_INTERESTED, LINCOLN_VEHICLES_DRIVEN) - **DO NOT MODIFY**
- [x] 1.1.3 Identify common fields vs brand-specific fields in survey responses - **ANALYSIS ONLY**
- [x] 1.1.4 Document current ExpanseEvent interface usage patterns from admin and Survey.tsx - **ANALYSIS ONLY**

#### 1.2 Create Shared TypeScript Interfaces Package (Native App Only) ✅
- [x] 1.2.1 Create `packages/shared/types/` directory structure with proper package.json - **FOR NATIVE APP USE ONLY**
- [x] 1.2.2 Copy and adapt `BaseSurveyAnswers` interface for common Firestore fields (device_survey_guid, timestamp, etc.) - **DUPLICATE, DON'T MODIFY ORIGINAL**
- [x] 1.2.3 Copy and adapt `FordSurveyAnswers` interface matching Ford API payload structure with all required fields - **DUPLICATE, DON'T MODIFY ORIGINAL**
- [x] 1.2.4 Copy and adapt `LincolnSurveyAnswers` interface matching Lincoln API payload structure with all required fields - **DUPLICATE, DON'T MODIFY ORIGINAL**
- [x] 1.2.5 Create `VehicleOfInterest` and `VehicleDriven` data models for both brands with proper typing - **NEW INTERFACES FOR NATIVE APP**
- [x] 1.2.6 Copy and adapt `ExpanseEvent` interface with all required properties (brand, showHeader, API routing, etc.) - **DUPLICATE, DON'T MODIFY ORIGINAL**

#### 1.3 Set Up Shared Utilities Package (Native App Only) ✅
- [x] 1.3.1 Create `packages/shared/utils/` directory with data transformation utilities - **FOR NATIVE APP USE ONLY**
- [x] 1.3.2 Copy API client configurations from web-app (endpoints, headers, authentication) - **DUPLICATE, DON'T MODIFY ORIGINAL**
- [x] 1.3.3 Create reusable data mapping functions that convert SurveyJS responses to API payloads - **NEW IMPLEMENTATION FOR NATIVE APP**
- [x] 1.3.4 Set up shared package.json with proper TypeScript configuration and exports - **ISOLATED FROM WEB-APP**

#### 1.4 Establish Monorepo Structure for Native App ✅
- [x] 1.4.1 Create `packages/native-app/` directory structure following Expo conventions
- [x] 1.4.2 Configure TypeScript to reference shared packages without circular dependencies
- [x] 1.4.3 Update root package.json and pnpm-workspace.yaml to include new packages
- [x] 1.4.4 Verify shared code imports work correctly within native-app only (DO NOT integrate with web-app yet)

### 2.0 Project Setup & Expo Integration ✅ **COMPLETED**
Foundation phase to establish native app development environment.

#### 2.1 Initialize Expo v53 + React 19 Project ✅
- [x] 2.1.1 Update package.json to Expo SDK 53 and React 19 with proper peer dependency management
- [x] 2.1.2 Resolve peer dependency conflicts and test basic Expo functionality
- [x] 2.1.3 Configure app.json with kiosk-appropriate settings (orientation locks, splash screen, permissions)
- [x] 2.1.4 Verify TypeScript configuration works with updated dependencies

#### 2.2 Configure Dependencies and Build Pipeline ✅
- [x] 2.2.1 Install required Expo dependencies (expo-sqlite, expo-web-browser, expo-network, expo-file-system)
- [x] 2.2.2 Add development dependencies (testing frameworks, linting, TypeScript types)
- [x] 2.2.3 Configure EAS build profiles for development, staging, and production environments
- [x] 2.2.4 Set up environment variable handling for API endpoints and Firebase configuration

#### 2.3 WebView + SurveyJS Compatibility Validation ✅ **CRITICAL PATH VALIDATED**
- [x] 2.3.1 Create prototype WebView component with basic SurveyJS integration to validate feasibility
- [x] 2.3.2 Test Ford Design System CSS loading in WebView environment (asset bundling, font loading)  
- [x] 2.3.3 Validate custom renderers work in mobile WebView context with touch events
- [x] 2.3.4 Test file upload functionality in WebView (camera access, file picker, image processing)

### 3.0 Event Management & Offline Storage ✅ **COMPLETED**
Core features for event listing and offline data storage.

#### 3.1 SQLite Database Setup ✅
- [x] 3.1.1 Install and configure expo-sqlite with database encryption for sensitive survey data
- [x] 3.1.2 Create database schema for events, survey responses, and sync queue with proper indexing
- [x] 3.1.3 Implement database initialization, migration logic, and version management
- [x] 3.1.4 Add database utility functions for CRUD operations with error handling and transactions

#### 3.2 Event List Screen Implementation
- [x] 3.2.1 Create EventListScreen with filtering logic (Current/Past/Future) matching admin interface patterns
- [x] 3.2.2 Implement EventCard component with brand-aware styling (Ford blue, Lincoln burgundy, Other neutral)
- [x] 3.2.3 Add pull-to-refresh for event list updates when connectivity is available
- [x] 3.2.4 Implement event search and sorting functionality with performance optimization

#### 3.3 Event Caching & Brand Integration ✅
- [x] 3.3.1 Implement event configuration caching from ExpanseEvent API with cache invalidation
- [x] 3.3.2 Create brand-aware theme provider for Ford/Lincoln/Other with dynamic styling
- [x] 3.3.3 Add offline detection and cache refresh logic with smart background updates
- [x] 3.3.4 Implement event detail screen with survey launch capability and metadata display

### 4.0 Survey Execution & WebView Integration ✅ **COMPLETED**
Core survey execution engine with Ford Design System integration.

#### 4.1 SurveyJS WebView Integration ✅
- [x] 4.1.1 Create SurveyWebView component with full-screen display and proper navigation handling
- [x] 4.1.2 Implement JavaScript bridge for survey completion detection and data extraction
- [x] 4.1.3 Add Ford Design System CSS injection based on event brand with proper asset loading
- [x] 4.1.4 Handle WebView navigation, security policies, and error states gracefully

#### 4.2 Survey Data Capture & Privacy ✅
- [x] 4.2.1 Implement survey response capture from WebView with proper data validation
- [x] 4.2.2 Store completed surveys with event metadata in SQLite with encryption
- [x] 4.2.3 Add automatic survey reset after completion to ensure respondent privacy
- [x] 4.2.4 Ensure no respondent data persists between sessions with proper cleanup

#### 4.3 File Uploads & Custom Renderers ✅
- [x] 4.3.1 Handle file upload functionality in WebView context (camera, gallery, documents)
- [x] 4.3.2 Validate custom renderers work with mobile touch events and screen sizes
- [x] 4.3.3 Implement image capture and storage for driver's license uploads with compression
- [x] 4.3.4 Add comprehensive error handling for complex survey interactions and recovery

#### 4.4 Survey Screen Navigation ✅
- [x] 4.4.1 Create SurveyScreen with WebView container and navigation controls
- [x] 4.4.2 Implement back navigation with confirmation dialogs for incomplete surveys
- [x] 4.4.3 Add progress indicators for long surveys with estimated completion time
- [x] 4.4.4 Handle survey abandonment scenarios with proper cleanup and state management

### 5.0 Multi-API Sync & Background Processing
Advanced sync system for multiple API endpoints with offline queuing.

#### 5.1 Queuing System Implementation
- [ ] 5.1.1 Create survey response queue manager with SQLite storage and priority handling
- [ ] 5.1.2 Implement retry logic with exponential backoff and maximum retry limits
- [ ] 5.1.3 Add queue persistence across app restarts with state recovery
- [ ] 5.1.4 Create queue status tracking and reporting with detailed sync metrics

#### 5.2 Multi-Endpoint Sync Strategy
- [ ] 5.2.1 Implement Firestore sync using existing SAVE_SURVEY endpoint with proper authentication
- [ ] 5.2.2 Add Ford API sync (SURVEY_UPLOAD_V11 + VEHICLES_INSERT) with brand-specific data mapping
- [ ] 5.2.3 Add Lincoln API sync (LINCOLN_SURVEY_UPLOAD + LINCOLN_VEHICLES_INTERESTED + LINCOLN_VEHICLES_DRIVEN)
- [ ] 5.2.4 Handle partial sync failures and rollback strategies with transaction management

#### 5.3 Background Sync & Connectivity
- [ ] 5.3.1 Implement network connectivity detection with cellular vs wifi awareness
- [ ] 5.3.2 Create background sync service with app state handling (foreground, background, suspended)
- [ ] 5.3.3 Add sync scheduling based on connectivity changes with intelligent batching
- [ ] 5.3.4 Implement sync progress tracking and user notifications with clear status updates

#### 5.4 Error Handling & Status Indicators
- [ ] 5.4.1 Create SyncStatusIndicator component with real-time updates and visual feedback
- [ ] 5.4.2 Implement comprehensive error handling and user feedback with actionable messages
- [ ] 5.4.3 Add manual sync trigger for troubleshooting with detailed error reporting
- [ ] 5.4.4 Create sync logs and diagnostic information for support and debugging

### 6.0 Shared Code Consolidation & Integration
Cleanup phase to consolidate duplicated types and integrate with web-app after native app is proven.

#### 6.1 Consolidate Shared Types
- [ ] 6.1.1 Review and compare duplicated interfaces between native-app and web-app for consistency
- [ ] 6.1.2 Create unified shared types package that both web-app and native-app can use
- [ ] 6.1.3 Move proven interfaces from packages/shared to a truly shared location
- [ ] 6.1.4 Ensure backward compatibility for existing web-app functionality

#### 6.2 Integrate Web-App with Shared Types
- [ ] 6.2.1 Update web-app package.json to reference shared types package
- [ ] 6.2.2 Modify Survey.tsx to import types from shared package instead of local definitions
- [ ] 6.2.3 Update Firebase functions to use shared types where applicable
- [ ] 6.2.4 Run full web-app test suite to ensure no regressions

#### 6.3 Consolidate API Utilities
- [ ] 6.3.1 Review API client implementations between web-app and native-app
- [ ] 6.3.2 Create unified API client utilities that work for both platforms
- [ ] 6.3.3 Update both apps to use consolidated API utilities
- [ ] 6.3.4 Ensure platform-specific differences are properly abstracted

#### 6.4 Comprehensive Testing & Validation
- [ ] 6.4.1 Run full test suite for web-app with shared dependencies
- [ ] 6.4.2 Run full test suite for native-app with consolidated shared code
- [ ] 6.4.3 Test end-to-end functionality: web survey creation → native survey collection → data sync
- [ ] 6.4.4 Validate that both apps produce identical API payloads for the same survey responses
- [ ] 6.4.5 Performance testing to ensure shared code doesn't impact build times or runtime performance

#### 6.5 Documentation & Cleanup
- [ ] 6.5.1 Update monorepo documentation to reflect shared package architecture
- [ ] 6.5.2 Create developer guide for working with shared types across platforms
- [ ] 6.5.3 Remove any temporary duplicated code and update import paths
- [ ] 6.5.4 Document migration patterns for future shared code additions