# Ford Design System SurveyJS Renderers Integration Tasks

**Generated from PRD:** fds-renderers-refactor.md  
**Target:** EOD tomorrow delivery  
**Goal:** Enable real FDS components in SurveyJS surveys for Ford and Lincoln brands

## Relevant Files

### Files to Modify
- `packages/web-app/src/surveysjs_renderers/FDSRenderers/FDSText.tsx` - Refactor to use real StyledTextField
- `packages/web-app/src/surveysjs_renderers/FDSRenderers/FDSCheckbox.tsx` - Replace custom HTML with real Checkbox component
- `packages/web-app/src/surveysjs_renderers/FDSRenderers/index.ts` - Update exports for all new renderers

### Files to Create
- `packages/web-app/src/surveysjs_renderers/FDSRenderers/FDSShared/utils.tsx` - Markdown processing utilities
- `packages/web-app/src/surveysjs_renderers/FDSRenderers/FDSShared/FDSQuestionWrapper.tsx` - Shared wrapper for Pattern B components
- `packages/web-app/src/surveysjs_renderers/FDSRenderers/FDSShared/FDSErrorDisplay.tsx` - Consistent error display
- `packages/web-app/src/surveysjs_renderers/FDSRenderers/FDSShared/FDSRequiredIndicator.tsx` - Required field indicator
- `packages/web-app/src/surveysjs_renderers/FDSRenderers/FDSRadio.tsx` - Radio button group renderer
- `packages/web-app/src/surveysjs_renderers/FDSRenderers/FDSDropdown.tsx` - Dropdown/select renderer
- `packages/web-app/src/surveysjs_renderers/FDSRenderers/FDSTextArea.tsx` - Textarea renderer
- `packages/web-app/src/surveysjs_renderers/FDSRenderers/FDSToggle.tsx` - Toggle/boolean renderer

### Reference Files (Do Not Modify)
- `packages/web-app/src/screens/FDS_Demo.tsx` - Reference for correct FDS component usage patterns
- `packages/web-app/src/surveysjs_questions/` - Custom question type definitions
- `packages/web-app/src/screens/Survey.tsx` - Survey integration and theme wrapper

### Testing Files (May Need Updates)
- Survey test pages to validate renderer integration
- Theme switching test scenarios

## Testing Strategy

### Individual Renderer Testing
- Test each renderer with sample survey JSON
- Verify Ford and Lincoln theme switching works
- Validate markdown support in labels and descriptions
- Test error states and validation messages

### Integration Testing
- Create complete survey with all question types (text, checkbox, radio, dropdown, textarea, toggle)
- Test theme switching between Ford and Lincoln
- Verify survey submission works with new renderers
- Performance testing with real survey data

### Edge Case Validation
- Log any SurveyJS features that don't map to FDS components to `fds-integration-edge-cases.log`
- Test with complex survey JSON structures
- Validate accessibility compliance

## Implementation Tasks

### 1.0 Quick Foundation & First Renderer Proof
**Goal:** Establish working proof of concept and validate integration approach

- [x] **1.1 Analyze current FDSText implementation**
  - Review `packages/web-app/src/surveysjs_renderers/FDSRenderers/FDSText.tsx`
  - Identify what needs to be replaced vs. what can be kept
  - Document current markdown processing approach

- [x] **1.2 Create minimal markdown utility function**
  - Create `packages/web-app/src/surveysjs_renderers/FDSRenderers/FDSShared/utils.tsx`
  - Extract and optimize existing Showdown processing
  - Add function: `processMarkdown(text: string): React.ReactNode`
  - Ensure it handles both plain text and markdown content

- [x] **1.3 Refactor FDSText to use real StyledTextField**
  - Import `StyledTextField` from `@ui/ford-ui-components/src/v2/inputField/Input`
  - Replace custom HTML with direct StyledTextField usage
  - Use Pattern A approach (component has built-in wrapper)
  - Map SurveyJS props to StyledTextField props:
    - `label={processMarkdown(question.fullTitle)}`
    - `description={processMarkdown(question.description)}`
    - `value={question.value || ""}`
    - `onChange={(value) => question.value = value}`
    - `isRequired={question.isRequired}`
    - `isDisabled={question.isReadOnly}`
    - `isInvalid={question.errors.length > 0}`
    - `errorMessage={errorMessage}`

- [x] **1.4 Test FDSText in survey environment**
  - Create test survey JSON with text questions
  - Verify text input works in both Ford and Lincoln themes
  - Test markdown rendering in labels and descriptions
  - Validate error states and validation messages

- [x] **1.5 Validate SurveyJS ReactQuestionFactory integration**
  - Ensure registration with `ReactQuestionFactory.Instance.registerQuestion` works
  - Test that SurveyJS properly renders the new component
  - Verify question value updates correctly
  - Confirm theme switching works without page refresh

### 2.0 Shared Component Architecture
**Goal:** Create reusable components for Pattern B renderers (components without built-in wrappers)

- [x] **2.1 Create FDSQuestionWrapper component**
  - Create `packages/web-app/src/surveysjs_renderers/FDSRenderers/FDSShared/FDSQuestionWrapper.tsx`
  - Interface: `{ label: string; description?: string; isRequired?: boolean; isInvalid?: boolean; errorMessage?: string; children: React.ReactNode }`
  - Render structure:
    - Question label with markdown support
    - Optional description with markdown support
    - Required indicator when `!isRequired`
    - Children (the actual FDS component)
    - Error display when `isInvalid && errorMessage`
  - Use CSS variables for theming: `var(--semantic-color-text-onlight-moderate-default)`

- [x] **2.2 Create FDSErrorDisplay component**
  - Create `packages/web-app/src/surveysjs_renderers/FDSRenderers/FDSShared/FDSErrorDisplay.tsx`
  - Interface: `{ message: string }`
  - Style consistently with FDS error patterns
  - Use error color: `var(--semantic-color-text-onlight-danger-default)`

- [x] **2.3 Create FDSRequiredIndicator component**
  - Create `packages/web-app/src/surveysjs_renderers/FDSRenderers/FDSShared/FDSRequiredIndicator.tsx`
  - Display "(Optional)" text using `surveyLocalization.locales[currentLocale]?.["optionalText"]`
  - Style consistently with FDS patterns
  - Use subtle color: `var(--semantic-color-text-onlight-subtle-default)`

- [x] **2.4 Test shared components with theme switching**
  - Create test page with FDSQuestionWrapper examples
  - Verify Ford and Lincoln theme switching updates colors correctly
  - Test markdown rendering in labels and descriptions
  - Validate error display styling matches FDS patterns

### 3.0 Core Selection Renderers
**Goal:** Implement checkbox and radio renderers (most critical for surveys)

- [x] **3.1 Refactor FDSCheckbox to use real Checkbox component**
  - Import `Checkbox` from `@ui/ford-ui-components/src/v2/checkbox/Checkbox`
  - Replace existing custom HTML implementation
  - Use Pattern B approach with FDSQuestionWrapper
  - Handle SurveyJS array values → individual Checkbox state mapping
  - For each choice in `question.choices`:
    - Create individual Checkbox component
    - Map `isSelected={currentValues.includes(choice.value)}`
    - Handle `onChange` to update SurveyJS array
  - Wrap entire group with FDSQuestionWrapper

- [x] **3.2 Implement FDSRadio with RadioButtonGroup**
  - Create `packages/web-app/src/surveysjs_renderers/FDSRenderers/FDSRadio.tsx`
  - Import `RadioButtonGroup` from `@ui/ford-ui-components/src/v2/radio/RadioButtonGroup`
  - Use Pattern A approach (RadioButtonGroup has built-in wrapper with groupLabel, description, errorMessage)
  - Map SurveyJS props:
    - `groupLabel={question.fullTitle}`
    - `name={question.name}`
    - `options={question.choices.map(choice => ({ value: choice.value, label: choice.text, isDisabled: question.isReadOnly }))}`
    - `value={question.value}`
    - `onChange={(value) => question.value = value}`
  - Register with ReactQuestionFactory for "radiogroup" type

- [x] **3.3 Test checkbox and radio with complex selection scenarios**
  - Create test survey with multiple checkbox groups
  - Test radio button groups with various options
  - Verify state management works correctly (arrays for checkbox, single values for radio)
  - Test Ford and Lincoln theme switching
  - Validate accessibility (ARIA labels, keyboard navigation)

- [x] **3.4 Validate theme inheritance**
  - Confirm both renderers inherit Ford/Lincoln theme colors
  - Test in Survey.tsx with proper #fd-nxt wrapper
  - Verify CSS variables cascade correctly
  - Check focus states and hover effects match FDS patterns

### 4.0 Remaining Input Renderers
**Goal:** Complete functional requirement coverage for all core question types

- [ ] **4.1 Implement FDSDropdown with StyledSelectDropdown**
  - Create `packages/web-app/src/surveysjs_renderers/FDSRenderers/FDSDropdown.tsx`
  - Import `StyledSelectDropdown` from `@ui/ford-ui-components/src/v2/selectDropdown/SelectDropdown`
  - Use Pattern A approach (component has built-in wrapper)
  - Map SurveyJS props:
    - `label={processMarkdown(question.fullTitle)}`
    - `description={processMarkdown(question.description)}`
    - `options={question.choices.map(choice => ({ id: choice.value, label: choice.text, value: choice.value }))}`
    - `selectedKey={question.value}`
    - `onSelectionChange={(key) => question.value = key}`
  - Register with ReactQuestionFactory for "dropdown" type

- [ ] **4.2 Implement FDSTextArea with TextArea component**
  - Create `packages/web-app/src/surveysjs_renderers/FDSRenderers/FDSTextArea.tsx`
  - Import `TextArea` from `@ui/ford-ui-components/src/v2/textarea/textarea`
  - Use Pattern B approach with FDSQuestionWrapper
  - Map SurveyJS props:
    - `value={question.value || ""}`
    - `onChange={(e) => question.value = e.target.value}`
    - `placeholder={question.placeholder}`
    - `rows={question.rows || 4}`
    - `maxLength={question.maxLength}`
    - `showCharacterCount={!!question.maxLength}`
  - Register with ReactQuestionFactory for "text" type where inputType is "textarea"

- [ ] **4.3 Implement FDSToggle with Toggle component**
  - Create `packages/web-app/src/surveysjs_renderers/FDSRenderers/FDSToggle.tsx`
  - Import `Toggle` from `@ui/ford-ui-components/src/v2/toggle/Toggle`
  - Use Pattern B approach with FDSQuestionWrapper
  - Map SurveyJS props:
    - `isSelected={question.value === true}`
    - `onChange={(isSelected) => question.value = isSelected}`
    - `isDisabled={question.isReadOnly}`
    - Children: `{processMarkdown(question.fullTitle)}`
  - Register with ReactQuestionFactory for "boolean" type

- [ ] **4.4 Test all input types**
  - Create comprehensive test survey with all question types
  - Test each renderer individually and in combination
  - Verify all Pattern A and Pattern B components work correctly
  - Validate theme switching across all components
  - Test form submission with mixed question types

### 5.0 Integration & Production Readiness
**Goal:** Complete system integration and prepare for EOD deployment

- [ ] **5.1 Update index.ts with all renderer exports**
  - Update `packages/web-app/src/surveysjs_renderers/FDSRenderers/index.ts`
  - Export all new renderers:
    ```typescript
    export * from './FDSText';
    export * from './FDSCheckbox';
    export * from './FDSRadio';
    export * from './FDSDropdown';
    export * from './FDSTextArea';
    export * from './FDSToggle';
    export * from './FDSShared/utils';
    export * from './FDSShared/FDSQuestionWrapper';
    ```
  - Ensure all ReactQuestionFactory registrations are active

- [ ] **5.2 Test complete survey with all question types**
  - Create production-like survey JSON with all FR-01 through FR-06 question types
  - Test in Survey.tsx with proper Ford/Lincoln theme switching
  - Verify survey submission includes all renderer values
  - Test with complex survey logic (conditional questions, validation rules)

- [ ] **5.3 Validate Ford/Lincoln theme switching**
  - Test theme switching sequence: Ford Light → Ford Dark → Lincoln Light → Lincoln Dark
  - Verify all renderers respond to theme changes instantly
  - Check CSS variable inheritance works for all components
  - Validate visual consistency with FDS_Demo.tsx reference

- [ ] **5.4 Create edge case logging system**
  - Create `fds-integration-edge-cases.log` file
  - Document any SurveyJS features that don't map to FDS components
  - Include: description, attempted solution, workaround used, impact assessment
  - Add logging utility function for development team to use

- [ ] **5.5 Final deployment preparation**
  - Run complete regression testing
  - Verify performance meets requirements (theme switching <50ms)
  - Validate accessibility compliance (WCAG 2.1 AA)
  - Confirm all PRD requirements FR-01 through FR-18 are met
  - Document any known limitations or future improvements needed

## Success Criteria

### Primary Goals (Must Complete by EOD)
- [ ] All 6 core question types (FR-01 through FR-06) use real FDS components
- [ ] Ford and Lincoln theme switching works seamlessly
- [ ] Survey respondents see properly branded components
- [ ] Survey JSON loads and processes without errors

### Quality Gates
- [ ] Components match FDS_Demo.tsx visual reference exactly
- [ ] Markdown support maintained for labels and descriptions
- [ ] No custom CSS used - all styling through FDS components
- [ ] Accessibility standards maintained

### Production Readiness
- [ ] Complete survey integration tested
- [ ] Edge cases documented for future iterations
- [ ] Performance requirements met
- [ ] Ready for immediate deployment

## Go/No-Go Decision Point

**Before proceeding with detailed implementation, confirm:**
1. Access to Ford/Lincoln theme testing environment
2. Ability to test survey integration end-to-end
3. Stakeholder approval for edge case logging approach
4. Clear rollback plan if issues discovered

**Type "Go" to proceed with implementation, or provide any concerns/questions.**