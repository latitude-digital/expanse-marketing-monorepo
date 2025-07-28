# Dependency Cleanup Analysis

## Overview
Analysis of latitude-leads-web dependencies to identify unused packages before migration to the monorepo.

## Kendo UI Analysis

### Used Kendo Packages (11/42)
- `@progress/kendo-react-buttons` ✅ (Button components)
- `@progress/kendo-react-common` ✅ (Common utilities)
- `@progress/kendo-react-dateinputs` ✅ (Calendar in Bookeo renderer)
- `@progress/kendo-react-dialogs` ✅ (Dialog components)
- `@progress/kendo-react-form` ✅ (Form components)
- `@progress/kendo-react-indicators` ✅ (Loader component)
- `@progress/kendo-react-inputs` ✅ (Input, MaskedTextBox)
- `@progress/kendo-react-labels` ✅ (Label, Hint, Error)
- `@progress/kendo-react-layout` ✅ (Avatar component)
- `@progress/kendo-react-listview` ✅ (ListView components)
- `@progress/kendo-svg-icons` ✅ (SVG icons)

### Unused Kendo Packages (31/42) - SAFE TO REMOVE
- `@progress/kendo-data-query` ❌
- `@progress/kendo-date-math` ❌
- `@progress/kendo-drawing` ❌
- `@progress/kendo-intl` ❌
- `@progress/kendo-licensing` ❌ (may be required for licensing)
- `@progress/kendo-popup-common` ❌
- `@progress/kendo-react-animation` ❌
- `@progress/kendo-react-charts` ❌
- `@progress/kendo-react-conversational-ui` ❌
- `@progress/kendo-react-data-tools` ❌
- `@progress/kendo-react-dropdowns` ❌
- `@progress/kendo-react-editor` ❌
- `@progress/kendo-react-excel-export` ❌
- `@progress/kendo-react-gantt` ❌
- `@progress/kendo-react-gauges` ❌
- `@progress/kendo-react-grid` ❌
- `@progress/kendo-react-intl` ❌
- `@progress/kendo-react-listbox` ❌
- `@progress/kendo-react-notification` ❌
- `@progress/kendo-react-pdf` ❌
- `@progress/kendo-react-pivotgrid` ❌
- `@progress/kendo-react-popup` ❌
- `@progress/kendo-react-progressbars` ❌
- `@progress/kendo-react-ripple` ❌
- `@progress/kendo-react-scheduler` ❌
- `@progress/kendo-react-sortable` ❌
- `@progress/kendo-react-tooltip` ❌
- `@progress/kendo-react-treelist` ❌
- `@progress/kendo-react-treeview` ❌
- `@progress/kendo-react-upload` ❌
- `@progress/kendo-theme-default` ❌

## Other Dependencies Analysis

### Well-Used Dependencies
- `ag-grid-community` ✅ (Used in admin screens)
- `ag-grid-react` ✅ (React wrapper for AG Grid)
- `survey-*` packages ✅ (Core survey functionality)
- `firebase` ✅ (Firebase integration)
- `formik` ✅ (Form management)
- `lodash` ✅ (Utility functions)
- `moment` ✅ (Date handling)
- `styled-components` ✅ (CSS-in-JS)
- `react-router-dom` ✅ (Routing)

### Potentially Unused Dependencies
- `add` ❌ (Version 2.0.6 - may be accidental install)
- `inputmask` ⚠️ (Check if used in MaskedInput)
- `showdown` ⚠️ (Markdown conversion - check usage)
- `sprintf-js` ⚠️ (String formatting - check usage)
- `ua-parser-js` ⚠️ (User agent parsing - check usage)

### Legacy Ford UI
- `@ford/ford-ui-components` ⚠️ (Old version, will be replaced with Ford UI v2)
- `@ford/gdux-design-foundation` ⚠️ (Old Ford design system)

## File Size Impact Analysis

### Current Bundle Impact
- **31 unused Kendo packages** = ~15-20MB of unused dependencies
- **Kendo licensing** = ~500KB
- **Unused utilities** = ~2-5MB

### Expected Savings
- **Bundle size reduction**: 15-25MB
- **Build time improvement**: 10-15% faster builds
- **Install time improvement**: 20-30% faster installs

## Cleanup Strategy

### Phase 1: Safe Removals (High Confidence)
```json
{
  "remove": [
    "@progress/kendo-react-animation",
    "@progress/kendo-react-charts", 
    "@progress/kendo-react-conversational-ui",
    "@progress/kendo-react-data-tools",
    "@progress/kendo-react-dropdowns",
    "@progress/kendo-react-editor",
    "@progress/kendo-react-excel-export",
    "@progress/kendo-react-gantt",
    "@progress/kendo-react-gauges",
    "@progress/kendo-react-grid",
    "@progress/kendo-react-intl",
    "@progress/kendo-react-listbox",
    "@progress/kendo-react-notification",
    "@progress/kendo-react-pdf",
    "@progress/kendo-react-pivotgrid",
    "@progress/kendo-react-popup",
    "@progress/kendo-react-progressbars",
    "@progress/kendo-react-ripple",
    "@progress/kendo-react-scheduler",
    "@progress/kendo-react-sortable",
    "@progress/kendo-react-tooltip",
    "@progress/kendo-react-treelist",
    "@progress/kendo-react-treeview",
    "@progress/kendo-react-upload",
    "@progress/kendo-theme-default",
    "@progress/kendo-data-query",
    "@progress/kendo-date-math",
    "@progress/kendo-drawing",
    "@progress/kendo-intl",
    "@progress/kendo-popup-common",
    "add"
  ]
}
```

### Phase 2: Verification Required
```json
{
  "verify_then_remove": [
    "@progress/kendo-licensing",
    "inputmask",
    "showdown", 
    "sprintf-js",
    "ua-parser-js"
  ]
}
```

### Phase 3: Ford UI Migration
```json
{
  "replace_with_ford_ui_v2": [
    "@ford/ford-ui-components",
    "@ford/gdux-design-foundation"
  ]
}
```

## Testing Strategy

1. **Static Analysis**: Run dependency analyzer tools
2. **Build Test**: Ensure build succeeds after removal
3. **Runtime Test**: Test all major user flows
4. **Bundle Analysis**: Verify size reduction

## Risk Mitigation

1. **Git Commit**: Commit after each phase
2. **Rollback Plan**: Keep package.json backup
3. **Testing**: Comprehensive testing before proceeding
4. **Documentation**: Document any breaking changes

---

**Total Estimated Savings**: 15-25MB bundle reduction, 20-30% faster installs