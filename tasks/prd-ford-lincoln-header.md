# PRD: Ford/Lincoln Global Navigation Header Component

## Introduction/Overview

Replace the current survey header implementation with a brand-consistent Ford/Lincoln global navigation header component that matches the official Ford Design System specifications. The new header will support both Ford and Lincoln branding with responsive design and conditional language selection functionality.

## Goals

- **Brand Consistency**: Implement header that matches official Ford/Lincoln design specifications from Figma components
- **Responsive Design**: Support desktop, tablet, and mobile breakpoints with appropriate styling
- **Brand Switching**: Seamlessly switch between Ford and Lincoln branded headers based on event configuration
- **Language Support**: Integrate language selection functionality for surveys with multiple locales
- **Administrative Control**: Allow survey administrators to toggle header visibility per event

## User Stories

**As a survey respondent:**
- I want to see the appropriate Ford or Lincoln branding in the header so I know which brand's survey I'm completing
- I want to access language selection easily when multiple languages are available
- I want the header to display properly on any device I'm using (desktop, tablet, mobile)

**As a survey administrator:**
- I want to control whether the header appears on specific events through the admin interface
- I want the header to automatically match the brand I've selected for the event
- I want language selection to only appear when I've enabled it and multiple languages are configured

**As a developer:**
- I want to use existing Ford UI design tokens and components where possible for consistency
- I want the header to integrate seamlessly with the existing Survey.tsx component structure

## Functional Requirements

### Core Header Structure
- **Ford Header**: Display Ford oval logo (not current rectangular signature)
- **Lincoln Header**: Display Lincoln star logo with appropriate styling
- **Responsive Layout**: Full-width header with centered logo and right-aligned navigation
- **Height**: 56px with 12px vertical padding as per Figma specifications

### Language Selection Integration
- **Conditional Display**: Language button appears only when:
  - Event has `showLanguageChooser: true`
  - Multiple supported locales are available
  - Event brand is Ford or Lincoln
- **Button Styling**: Use globe icon with language code (e.g., "EN") matching Figma design
- **Functionality**: Trigger existing `handleLanguageChange` function from Survey.tsx
- **Positioning**: Right-aligned within header navigation area

### Brand-Specific Behaviors
- **Ford Events**: Show Ford header with blue oval logo and Ford-specific styling
- **Lincoln Events**: Show Lincoln header with star logo and Lincoln-specific styling  
- **Other/Unbranded Events**: Continue using existing basic language selector, but that selector needs to be 50% wider (no global header)

### Administrative Controls
- **Header Toggle**: New `showHeader` boolean field in event configuration (default: true)
- **Integration**: Modify EditEvent.tsx admin form to include header visibility toggle
- **Logic**: Header only displays when `thisEvent?.fordEventID && thisEvent?.showHeader !== false`

## Non-Goals (Out of Scope)

- Full navigation menu items (Vehicles, Shop, Support & Service)
- Shopping cart functionality
- User account/login integration
- Search functionality
- Hamburger menu for mobile
- Other header utility buttons (beyond language selection)

## Design References

### Figma Component URLs
**Ford Headers:**
- Desktop: https://www.figma.com/design/XC36oPoZ2OcNwEXsamPkvj/Components--FDS-Web-?node-id=76565-15086&m=dev
- Tablet/Mobile: https://www.figma.com/design/XC36oPoZ2OcNwEXsamPkvj/Components--FDS-Web-?node-id=76571-11346&m=dev
- Language Button Detail: https://www.figma.com/design/XC36oPoZ2OcNwEXsamPkvj/Components--FDS-Web-?node-id=76565-15086&m=dev

**Lincoln Headers:**
- Desktop: https://www.figma.com/design/XC36oPoZ2OcNwEXsamPkvj/Components--FDS-Web-?node-id=58927-6991&m=dev
- Tablet/Mobile: https://www.figma.com/design/XC36oPoZ2OcNwEXsamPkvj/Components--FDS-Web-?node-id=58927-6993&m=dev

**Live Reference Sites:**
- Ford Header: https://ford.com (analyzed for language button behavior)
- Lincoln Header: https://lincoln.com (analyzed for language button behavior)

## Design Considerations

### Visual Hierarchy
- Header should not compete with survey content for attention
- Language selection should be discoverable but not prominent
- Maintain sufficient contrast ratios for accessibility

### Responsive Behavior
- Logo remains centered at all breakpoints
- Language button maintains consistent right alignment
- Header height and padding scale appropriately

### Integration Points
- Must work within existing `#fd-nxt` theme wrapper system
- Should respect current Ford/Lincoln CSS variable theming
- Integrate with existing survey language change handlers

## Technical Considerations

### Component Architecture
- Create new `GlobalHeader` component in `/src/components/`
- Accept props for brand, language options, and event configuration
- Use existing ford-ui design tokens and CSS variables where possible

### Asset Requirements
- Source Ford oval logo SVG from ford-ui packages
- Source Lincoln star logo SVG from ford-ui packages  
- Ensure proper icon sizing (32px height, 80px width for Ford per Figma)

### State Management
- Integrate with existing survey language state in Survey.tsx
- Respect current locale selection and supported locales array
- Maintain existing URL parameter synchronization for language

### Database Schema
- Add `showHeader: boolean` field to Event interface
- Update Firestore converter in EditEvent.tsx to handle new field
- Set appropriate default value (true) for backward compatibility

## Success Metrics

- **Visual Consistency**: Header matches Figma designs pixel-perfectly across breakpoints
- **Functional Integration**: Language selection works identically to current implementation
- **Performance**: No measurable impact on survey loading times
- **Accessibility**: Maintains or improves current WCAG compliance scores
- **Administrative Adoption**: Survey creators successfully use header toggle feature

## Open Questions

1. Should we maintain the current language selector for non-Ford/Lincoln events, or standardize on the new design for all brands?
2. Do we need any transition animations when switching between languages?
3. Should the header be sticky/fixed position, or scroll with the page content?
4. Are there any additional brand-specific styling requirements not visible in the Figma designs?

---

*This PRD defines the scope for implementing a new Ford/Lincoln global header component that replaces the current survey header while maintaining all existing functionality and adding administrative controls.*