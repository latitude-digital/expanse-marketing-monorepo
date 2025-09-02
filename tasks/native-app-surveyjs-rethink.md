# Native App SurveyJS Architecture Rethink - Complete Implementation Plan

## Current State Assessment

### Existing Codebase Analysis
Before implementation, we need to understand the current native app structure:

**Key Files to Review:**
- `packages/native-app/src/components/SurveyWebView.tsx` - Current WebView implementation
- `packages/native-app/src/screens/SurveyScreen.tsx` - Survey screen integration
- `packages/web-app/src/surveyjs_questions/` - Custom questions to bundle
- `packages/web-app/src/surveysjs_renderers/` - Custom renderers to bundle
- `packages/web-app/src/styles/ford/`, `packages/web-app/src/styles/lincoln/` - FDS CSS to bundle

**Related Components:**
- Native database operations (`packages/native-app/src/services/database-operations.ts`)
- Sync manager (`packages/native-app/src/services/sync-manager.ts`)
- Offline detector (`packages/native-app/src/utils/offline-detector.ts`)

### Architecture Dependencies
- React Native WebView component
- SurveyJS v2 React integration
- Ford Design System (FDS) complete CSS bundle
- Webpack bundling system from web-app

## Problem Analysis

### Current Fundamental Issue
The native app is incorrectly treating SurveyJS as if it's still accessible via a web server, instead of realizing that it needs to build an internal single page application (SPA) that is already compiled and included in the React Native code bundle.

### Critical Problems Identified
- Native app tries to access web server endpoints for surveys
- SurveyJS custom questions/renderers are not bundled into the native app
- WebView expects a self-contained HTML/JS bundle, not web server dependencies
- Ford Design System (FDS) integration needs to work offline in the native app
- Survey data needs to flow through React Native bridge, not web APIs

## Architecture Solution

### Approach: Self-Contained Survey SPA Bundle
Create a survey-only build target within `packages/web-app/` that generates a complete SPA bundle for WebView consumption.

```
Current (BROKEN):
React Native App -> HTTP Requests -> Web Server -> SurveyJS

New (CORRECT):
React Native App -> WebView -> Bundled SPA (SurveyJS + Custom Questions + FDS)
```

## Five-Phase Implementation Plan

### Phase 1: Survey SPA Creation (Critical Path)

#### 1.1 Directory Structure Setup
```
packages/web-app/src/survey-spa/
├── index.html                 # Minimal HTML template for WebView
├── main.tsx                   # React entry point (survey only)
├── SurveySPA.tsx             # Main survey component
├── bridge/
│   ├── NativeBridge.ts       # Communication with React Native
│   └── types.ts              # Bridge message types
└── webpack.config.js         # Separate build config for SPA
```

#### 1.2 Minimal HTML Template Implementation
```html
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Survey</title>
  <style>
    /* Disable autofill/autocomplete globally for kiosk security */
    input:-webkit-autofill,
    input:-webkit-autofill:hover,
    input:-webkit-autofill:focus,
    input:-webkit-autofill:active {
      -webkit-box-shadow: 0 0 0 30px white inset !important;
      -webkit-text-fill-color: inherit !important;
    }
  </style>
</head>
<body>
  <div id="fd-nxt" class="ford_light">
    <div id="survey-root"></div>
  </div>
</body>
</html>
```

#### 1.3 React Entry Point Requirements
- Initialize SurveyJS with kiosk security settings
- Load custom questions (AllSurveys, FordSurveys, LincolnSurveys)
- Load custom renderers with autocomplete disabled
- Set up native bridge communication
- Wait for survey JSON from React Native
- Ensure all form inputs have `autocomplete="off"` and `autoComplete="off"`

#### 1.4 Package.json Script Addition
```json
{
  "scripts": {
    "build:survey-spa": "webpack --config src/survey-spa/webpack.config.js --mode production"
  }
}
```

### Phase 2: Asset Bundling & FDS Integration (Critical Path)

#### 2.1 Webpack Configuration for Complete Asset Bundling
```javascript
// src/survey-spa/webpack.config.js
module.exports = {
  entry: './main.tsx',
  output: {
    filename: 'survey-spa.js',
    path: path.resolve(__dirname, '../../dist/survey-spa'),
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
      inlineSource: '.(js|css)$' // Inline everything for WebView
    }),
    new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/.*/])
  ],
  module: {
    rules: [
      // CSS processing with all FDS files
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      // Font handling for Ford/Lincoln fonts
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/inline' // Base64 embed fonts
      }
    ]
  }
};
```

#### 2.2 FDS CSS Import Strategy
In main.tsx, import all required CSS:
```typescript
// Import all FDS CSS (absolute paths from existing sync)
import '../../styles/ford/ford.css';
import '../../styles/lincoln/lincoln.css';
import '../../styles/ford/ford-font-families.css';
import '../../styles/lincoln/lincoln-font-families.css';
import '../../index.scss'; // Typography classes
```

#### 2.3 Theme Switching in SPA Context
```typescript
// SurveySPA.tsx - Handle theme switching via bridge
const [themeClass, setThemeClass] = useState('ford_light');

useEffect(() => {
  // Listen for theme changes from React Native
  window.nativeBridge?.onThemeChange = (brand: string, mode: string) => {
    setThemeClass(`${brand}_${mode}`);
  };
}, []);
```

### Phase 3: Bridge Communication System

#### 3.1 JavaScript Bridge Interface
```typescript
export interface SurveyMessage {
  type: 'INIT_SURVEY' | 'SURVEY_COMPLETE' | 'SURVEY_PROGRESS' | 'THEME_CHANGE';
  payload: any;
}

export class NativeBridge {
  postMessage(message: SurveyMessage) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify(message));
    }
  }

  // Survey completion handler
  onSurveyComplete(surveyData: any) {
    this.postMessage({
      type: 'SURVEY_COMPLETE',
      payload: { responses: surveyData, timestamp: Date.now() }
    });
  }

  // Initialize survey from React Native
  initializeSurvey(surveyJSON: any, brand: string, theme: string) {
    // Set theme class on fd-nxt wrapper
    document.getElementById('fd-nxt')?.setAttribute('class', `${brand}_${theme}`);
    // Initialize SurveyJS with provided JSON
    return new Survey.Model(surveyJSON);
  }
}
```

### Phase 4: React Native Integration

#### 4.1 SurveyWebView Component Update
Update `packages/native-app/src/components/SurveyWebView.tsx`:
```typescript
const SurveyWebView = ({ event, onComplete }) => {
  const webViewRef = useRef<WebView>(null);

  const handleMessage = (event: WebViewMessageEvent) => {
    const message = JSON.parse(event.nativeEvent.data);
    
    if (message.type === 'SURVEY_COMPLETE') {
      onComplete(message.payload.responses);
    }
  };

  const initializeSurvey = () => {
    const message = {
      type: 'INIT_SURVEY',
      payload: {
        surveyJSON: event.surveyJSON,
        brand: event.brand || 'ford',
        theme: 'light'
      }
    };
    
    webViewRef.current?.postMessage(JSON.stringify(message));
  };

  return (
    <WebView
      ref={webViewRef}
      source={{ uri: 'file://survey-spa/index.html' }} // Bundled SPA
      onMessage={handleMessage}
      onLoadEnd={initializeSurvey}
    />
  );
};
```

### Phase 5: Testing & Validation

#### 5.1 Progressive Testing Strategy
```
Test Progression (Simple to Complex):
1. Basic SPA Bundle Test: Can webpack create single HTML file?
2. WebView Load Test: Does React Native WebView load the SPA?
3. Bridge Communication Test: Can RN → WebView → RN messaging work?
4. Simple Survey Test: Basic text/radio questions work?
5. FDS Theme Test: Do Ford/Lincoln themes render correctly?
6. Custom Questions Test: Do all surveyjs_questions/ work?
7. Complex Features Test: Google Maps autocomplete, etc.
8. Performance Test: Bundle size, memory usage, load times
```

#### 5.2 Critical Validation Points
- Bundle size < 5MB (mobile app constraint)
- FDS fonts load correctly in WebView
- All CSS variables resolve properly
- Bridge communication is reliable
- Custom renderers work identically to web version

## Critical Dependencies to Bundle

### SurveyJS Components
- SurveyJS v2 + React renderers
- Custom question types from `packages/web-app/src/surveyjs_questions/`:
  - AllSurveys.ts (Universal questions)
  - FordSurveys.ts (Ford-specific questions)  
  - LincolnSurveys.ts (Lincoln-specific questions)
- Custom renderers from `packages/web-app/src/surveysjs_renderers/`

### Ford Design System Integration
- Complete FDS CSS with theme scoping (.ford_light, .lincoln_light, etc.)
- Font files and typography classes
- All CSS variables properly scoped
- Theme switching capabilities

### Google Maps Integration Strategy
The autocompleteaddress custom question will use a graceful degradation approach:
- **Online**: Google Maps API provides autocomplete suggestions normally
- **Offline**: Falls back to regular text input where users manually type addresses
- No blocking errors - if Google Maps fails to load, the input still functions

### Kiosk Security Considerations
Since this SPA functions as a kiosk used by multiple people, critical security measures:
- **Autofill Disabled**: All form inputs have `autocomplete="off"` to prevent PII leakage
- **Autosave Disabled**: Browser autosave features disabled globally
- **No Form Memory**: Previous user data cannot persist between survey sessions
- **Clean Session**: Each survey starts with completely clean form state

## Implementation Roadmap

### Priority 1: Proof of Concept
1. Create survey-spa directory structure
2. Build minimal Webpack config with SurveyJS
3. Test basic WebView loading
4. Implement basic bridge communication

### Priority 2: FDS Integration
1. Import all FDS CSS into bundle
2. Test theme switching in WebView
3. Verify font loading and CSS variables
4. Validate against Storybook reference

### Priority 3: Custom Questions Integration
1. Bundle all custom questions (AllSurveys, FordSurveys, LincolnSurveys)
2. Bundle all custom renderers
3. Test each question type individually
4. Implement graceful degradation for autocompleteaddress questions:
   - Online: Google Maps autocomplete works normally
   - Offline: Fallback to regular text input (no errors, user types manually)

### Priority 4: Full Integration & Testing
1. Complete React Native integration
2. End-to-end testing with real survey data
3. Performance optimization and bundle size reduction
4. Production build and deployment preparation

## Validation Gates

### Phase 1 Gate: Basic SPA loads in WebView ✓/✗
### Phase 2 Gate: FDS themes render correctly ✓/✗
### Phase 3 Gate: Bridge communication works reliably ✓/✗
### Complex Question Gate: Autocomplete graceful degradation works ✓/✗

## Detailed Task Breakdown

### Phase 1 Tasks (Granular)

#### Task 1.1: Set up Survey SPA Directory Structure
**Subtasks:**
- [ ] Create `packages/web-app/src/survey-spa/` directory
- [ ] Create `packages/web-app/src/survey-spa/bridge/` subdirectory
- [ ] Initialize basic file structure with empty files
- [ ] Add survey-spa to .gitignore patterns if needed

**Files to Create:**
- `packages/web-app/src/survey-spa/index.html`
- `packages/web-app/src/survey-spa/main.tsx`
- `packages/web-app/src/survey-spa/SurveySPA.tsx`
- `packages/web-app/src/survey-spa/bridge/NativeBridge.ts`
- `packages/web-app/src/survey-spa/bridge/types.ts`
- `packages/web-app/src/survey-spa/webpack.config.js`

#### Task 1.2: Create Minimal HTML Template
**Subtasks:**
- [ ] Write HTML template with viewport meta tag
- [ ] Add kiosk security CSS for autofill prevention
- [ ] Include #fd-nxt wrapper div for FDS theming
- [ ] Add survey-root div for React mounting

**Testing:**
- [ ] Validate HTML template in browser
- [ ] Test autofill prevention CSS works

#### Task 1.3: Implement React Entry Point
**Subtasks:**
- [ ] Set up React app initialization
- [ ] Import and initialize SurveyJS
- [ ] Import all custom question types (AllSurveys, FordSurveys, LincolnSurveys)
- [ ] Import all custom renderers
- [ ] Set up bridge communication
- [ ] Add autocomplete="off" to all form inputs

**Dependencies:**
- Requires existing surveyjs_questions/ files
- Requires existing surveysjs_renderers/ files
- Requires SurveyJS v2 + React integration

### Phase 2 Tasks (Granular)

#### Task 2.1: Configure Webpack for Asset Bundling
**Subtasks:**
- [ ] Create webpack.config.js with entry/output configuration
- [ ] Add HtmlWebpackPlugin for template processing
- [ ] Add InlineChunkHtmlPlugin for single-file output
- [ ] Configure CSS processing (style-loader, css-loader)
- [ ] Configure font handling (asset/inline for base64 embedding)
- [ ] Add TypeScript/TSX processing rules

**Testing:**
- [ ] Verify webpack builds without errors
- [ ] Check output bundle contains all dependencies
- [ ] Validate single HTML file output

#### Task 2.2: Bundle FDS CSS System
**Subtasks:**
- [ ] Import ford.css and lincoln.css
- [ ] Import ford-font-families.css and lincoln-font-families.css
- [ ] Import index.scss for typography classes
- [ ] Verify CSS variables are properly scoped
- [ ] Test theme class switching

**Dependencies:**
- Requires FDS CSS sync to be up to date
- Requires ford-ui submodule to be current

### Phase 3 Tasks (Granular)

#### Task 3.1: Implement Bridge Communication
**Subtasks:**
- [ ] Create SurveyMessage interface
- [ ] Implement NativeBridge class
- [ ] Add survey completion handler
- [ ] Add survey initialization handler
- [ ] Add theme change handler
- [ ] Add error handling and logging

**Testing:**
- [ ] Test message posting works in WebView
- [ ] Verify JSON serialization/deserialization
- [ ] Test error scenarios (no ReactNativeWebView)

### Phase 4 Tasks (Granular)

#### Task 4.1: Update React Native WebView Component
**Subtasks:**
- [ ] Modify SurveyWebView.tsx to use bundled SPA
- [ ] Implement message handling for survey completion
- [ ] Add survey initialization via postMessage
- [ ] Update file URI to point to bundled HTML
- [ ] Add error handling for WebView failures

**Files to Modify:**
- `packages/native-app/src/components/SurveyWebView.tsx`

**Testing:**
- [ ] Test WebView loads bundled SPA
- [ ] Verify bidirectional communication works
- [ ] Test survey completion flow

### Phase 5 Tasks (Granular)

#### Task 5.1: Progressive Testing Implementation
**Subtasks:**
- [ ] Create basic bundle test script
- [ ] Set up WebView loading test
- [ ] Implement bridge communication test
- [ ] Create simple survey test
- [ ] Add FDS theme test
- [ ] Test all custom question types
- [ ] Performance and bundle size testing

## Risk Mitigation & Fallback Plans

### Risk 1: Bundle Size Too Large (>5MB)
**Mitigation:**
- Use tree shaking to eliminate unused code
- Compress images and fonts
- Split non-critical assets for lazy loading

### Risk 2: Google Maps API Fails in WebView
**Mitigation:**
- Implement graceful degradation (already planned)
- Test Maps API in WebView context early
- Have manual text input fallback ready

### Risk 3: FDS Themes Don't Render Correctly
**Mitigation:**
- Test theme switching early in Phase 2
- Validate CSS variable inheritance
- Compare with Storybook reference

### Risk 4: Bridge Communication Unreliable
**Mitigation:**
- Implement retry logic for critical messages
- Add message acknowledgment system
- Test on multiple devices/OS versions

## Junior Developer Guidance

### Getting Started
If you're new to this codebase:
1. **Understand the Monorepo**: This is a monorepo with web-app and native-app packages
2. **Review Existing Components**: Look at current SurveyScreen and SurveyWebView components
3. **FDS Integration**: Study how Ford Design System works in web-app first
4. **Start Small**: Begin with Phase 1, Task 1.1 - just create the directory structure

### Key Concepts to Understand
- **WebView vs Browser**: WebView has different capabilities than full browser
- **React Native Bridge**: How WebView communicates with native code
- **SurveyJS v2**: Survey library with custom renderers and questions
- **Ford Design System**: Brand-specific theming with CSS variables

### Testing Approach
- Test each phase incrementally
- Don't proceed to next phase until current phase gates pass
- Use browser dev tools to debug WebView issues

## Next Immediate Actions

### Week 1 Focus: Phase 1 Implementation
1. **Task 1.1**: Create survey-spa directory structure (30 min)
2. **Task 1.2**: Implement minimal HTML template (1 hour)
3. **Task 1.3**: Create basic React entry point (2-3 hours)
4. **Validation**: Test basic SPA loads in browser (30 min)

### Success Criteria for Week 1
- [ ] Directory structure exists
- [ ] HTML template with kiosk security CSS
- [ ] React app initializes SurveyJS
- [ ] Basic survey renders in browser (not WebView yet)

## Key Success Factors

- Self-contained SPA (no web server dependencies)
- All custom questions/renderers bundled
- FDS theming system included
- React Native integration via bridge communication
- Complete offline functionality
- Performance within mobile app constraints
- Kiosk security with autofill/autocomplete completely disabled

This plan addresses the fundamental architectural flaw and provides a clear path to a properly designed native app survey system that works entirely offline with all existing functionality preserved.