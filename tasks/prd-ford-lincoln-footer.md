# PRD: Ford/Lincoln GlobalFooter Component

## Introduction/Overview

Create a new GlobalFooter component to replace the current FordFooter implementation, supporting both Ford and Lincoln branding with proper theme switching, administrative controls, and responsive design. The new GlobalFooter will maintain the existing minimal structure (language selection, legal links, and brand signature) while adding Lincoln brand support and following the same architectural patterns established by the GlobalHeader component.

## Goals

- **Brand Consistency**: Implement footer that switches between Ford and Lincoln branding based on event configuration
- **Minimal Enhancement**: Keep existing footer structure but add Lincoln equivalent links and styling
- **Responsive Design**: Support desktop and mobile breakpoints matching official site layouts
- **Brand Switching**: Seamlessly switch between Ford and Lincoln branded footers based on event configuration
- **Administrative Control**: Allow survey administrators to toggle footer visibility per event
- **Language Support**: Maintain existing language selection functionality with brand-appropriate styling

## User Stories

**As a survey respondent:**
- I want to see the appropriate Ford or Lincoln branding in the footer so I know which brand's survey I'm completing
- I want to access language selection easily when multiple languages are available
- I want the footer to display properly on any device I'm using (desktop, mobile)
- I want to access relevant legal and privacy information for the appropriate brand

**As a survey administrator:**
- I want to control whether the footer appears on specific events through the admin interface
- I want the footer to automatically match the brand I've selected for the event
- I want language selection to only appear when I've enabled it and multiple languages are configured

**As a developer:**
- I want to create a new GlobalFooter component that follows the same patterns as GlobalHeader
- I want to reuse the existing FordFooter structure and styling as the foundation
- I want to use existing Ford UI design tokens and CSS variables for consistency

## Functional Requirements

### Core Footer Structure
- **Ford Footer**: Display current structure with Ford signature logo and Ford-specific links
- **Lincoln Footer**: Display Lincoln equivalent with Lincoln signature logo and Lincoln-specific links
- **Responsive Layout**: Three-section layout (language selection, legal links, brand signature)
- **Styling**: Follow Ford UI design system variables for proper brand theming

### Existing Links Mapping
Based on current FordFooter links, map to Lincoln equivalents:

**Ford Links (Current):**
- © 2025 Ford Motor Company → https://www.ford.com
- Privacy Notice → https://www.ford.com/help/privacy/
- Your Privacy Choices → https://www.ford.com/help/privacy/your-privacy-choices/
- Interest Based Ads → https://www.ford.com/help/privacy/#interest

**Lincoln Links (New):**
- © 2025 Lincoln Motor Company → https://www.lincoln.com
- Privacy Notice → https://www.lincoln.com/help/privacy/
- Your Privacy Choices → https://www.lincoln.com/help/privacy/your-privacy-choices/
- Interest Based Ads → https://www.lincoln.com/help/privacy/#interest

### Language Selection Integration
- **Conditional Display**: Language selector appears only when:
  - Event has `showLanguageChooser: true`
  - Multiple supported locales are available
  - Event brand is Ford or Lincoln
- **Brand-Specific Styling**: Use Ford vs Lincoln globe icons and typography
- **Functionality**: Maintain existing `onLanguageChange` function integration
- **Positioning**: Left-aligned section in footer layout

### Brand-Specific Behaviors
- **Ford Events**: Show Ford footer with blue oval signature and Ford-specific links
- **Lincoln Events**: Show Lincoln footer with star signature and Lincoln-specific links
- **Other/Unbranded Events**: No footer displayed (consistent with GlobalHeader pattern)

### Administrative Controls
- **Footer Toggle**: New `showFooter` boolean field in event configuration (default: true)
- **Integration**: Modify EditEvent.tsx admin form to include footer visibility toggle
- **Logic**: Footer displays when `thisEvent?.showFooter !== false`

## Non-Goals (Out of Scope)

- Adding new footer navigation sections (keeping minimal structure)
- Social media icons or links
- Newsletter signup functionality
- Expanded legal or company information
- Mobile app download links
- Footer mega-menu navigation

## Design References

### Current Implementation
- **Existing FordFooter**: `/packages/web-app/src/components/FordFooter/index.tsx`
- **Current Styling**: `/packages/web-app/src/components/FordFooter/_index.css`

### Official Site References
**Ford Footer Styling** (for reference):
- Desktop: Three-section horizontal layout with centered legal links
- Mobile: Stacked vertical layout with proper spacing
- Typography: Ford F-1 font family, 11px font size for links

**Lincoln Footer Styling** (for reference):
- Desktop: Similar three-section layout with Lincoln branding
- Mobile: Stacked vertical layout matching Lincoln design patterns
- Typography: Lincoln font family, consistent sizing with Lincoln brand

## Design Considerations

### Visual Hierarchy
- Footer should remain unobtrusive and not compete with survey content
- Language selection should be discoverable but minimal
- Legal links should be clearly readable but not prominent
- Brand signature should be appropriately sized for brand recognition

### Responsive Behavior
- **Desktop (≥768px)**: Horizontal three-section layout (language, links, signature)
- **Mobile (<768px)**: Vertical stacked layout with proper spacing
- **Padding**: 16px mobile, 24px-48px desktop following current patterns

### Brand Theme Integration
- Must work within existing `#fd-nxt` theme wrapper system
- Should respect current Ford/Lincoln CSS variable theming
- Use semantic color variables for consistent brand switching

## Technical Considerations

### Component Architecture
- **New Component**: Create GlobalFooter component in `/src/components/GlobalFooter.tsx`
- **Pattern Consistency**: Follow same architectural patterns as GlobalHeader component
- **Code Reuse**: Base styling and structure on existing FordFooter implementation

### Asset Requirements
- **Ford Assets**: Continue using existing FordSignature and globe icon
- **Lincoln Assets**: Source Lincoln signature logo SVG from ford-ui packages
- **Icon Sizing**: Maintain current sizing (80px width, 31px height for signature)

### State Management
- Integrate with existing Survey.tsx brand switching logic
- Respect current locale selection and supported locales array
- Follow same patterns as GlobalHeader for consistency

### Database Schema
- Add `showFooter: boolean` field to Event interface  
- Update Firestore converter in EditEvent.tsx to handle new field
- Set appropriate default value (true) for backward compatibility

### Implementation Strategy
```typescript
// GlobalFooter component structure
interface GlobalFooterProps {
  brand: 'Ford' | 'Lincoln';
  supportedLanguages?: string[];
  currentLocale?: string;
  onLanguageChange?: (languageCode: string) => void;
  showLanguageSelector?: boolean;
}

// Brand-specific link mapping
const getFooterLinks = (brand: string) => {
  if (brand === 'Lincoln') {
    return [
      { text: '© 2025 Lincoln Motor Company', url: 'https://www.lincoln.com' },
      { text: 'Privacy Notice', url: 'https://www.lincoln.com/help/privacy/' },
      { text: 'Your Privacy Choices', url: 'https://www.lincoln.com/help/privacy/your-privacy-choices/' },
      { text: 'Interest Based Ads', url: 'https://www.lincoln.com/help/privacy/#interest' },
    ];
  }
  // Default to Ford links
  return fordLinks;
};
```

## Success Metrics

- **Visual Consistency**: Footer matches Ford/Lincoln brand guidelines and integrates seamlessly with existing survey styling
- **Functional Integration**: Language selection and link functionality work identically to current implementation
- **Brand Switching**: Footer properly switches between Ford and Lincoln styling when brand changes
- **Performance**: No measurable impact on survey loading times
- **Administrative Adoption**: Survey creators successfully use footer toggle feature
- **Accessibility**: Maintains current WCAG compliance for footer elements

## Implementation Plan

### Phase 1: Component Creation
1. Create new GlobalFooter component based on FordFooter structure
2. Add brand-specific link mapping logic
3. Create Lincoln signature asset integration
4. Implement brand-specific theming and styling

### Phase 2: Integration
1. Update Survey.tsx to use GlobalFooter instead of FordFooter
2. Add conditional footer rendering based on showFooter and brand settings
3. Integrate with existing brand switching logic

### Phase 3: Administrative Controls
1. Add showFooter field to Event interface
2. Update EditEvent.tsx admin form
3. Update Firestore schema and converters

### Phase 4: Testing & Refinement
1. Test brand switching functionality
2. Verify responsive behavior across devices
3. Validate language selection integration
4. Confirm administrative controls work properly

## Open Questions

1. Should we deprecate the existing FordFooter component immediately or maintain it for backward compatibility?
2. Do we need any transition animations when switching between brands?
3. Should the footer maintain the same responsive breakpoints as the current implementation (768px)?
4. Are there any Lincoln-specific privacy or legal requirements that differ from Ford?

---

*This PRD defines the scope for creating a new GlobalFooter component to replace the existing FordFooter, supporting both Ford and Lincoln branding while maintaining the current minimal structure and adding administrative controls consistent with the GlobalHeader implementation.*