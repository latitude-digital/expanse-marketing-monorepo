# Project Instructions

## Project Overview

### Project Name
> Expanse Marketing Survey SAAS Platform

### Project Goal
> A comprehensive survey SAAS platform with advanced Ford Design System integration, featuring three-way brand switching (Ford/Lincoln/Unbranded) and custom SurveyJS v2 renderers. The platform enables event management, survey deployment, and user check-in/out functionality with CloudFront-protected surveys. Currently implementing Role-Based Access Control (RBAC) to provide secure tenant isolation with admin and client user roles.

### Target Users
> - **Primary Users**: Ford and Lincoln dealerships, marketing teams, and event organizers
> - **Admin Users**: Platform administrators managing multiple client organizations
> - **Client Users**: Individual clients managing their specific events and surveys
> - **End Users**: Survey respondents at Ford/Lincoln events

## Technical Preferences

### Preferred Tech Stack
- Frontend: React 18 + TypeScript + Vite + SurveyJS v2.2.6
- Backend: Firebase Cloud Functions (TypeScript) + Firestore
- Database: Firestore (NoSQL) with custom security rules
- Design System: Ford UI v2 components with Tailwind CSS
- Authentication: Firebase Auth + CloudFront signed cookies
- Package Management: pnpm workspaces (monorepo)
- Testing: Vitest, Playwright, Firebase Emulator Suite
- CI/CD: Jenkins with Mac Mini agents

### Must-Have Features
1. Three-way brand switching (Ford/Lincoln/Unbranded) with light/dark theme support
2. Custom SurveyJS renderers using Ford Design System components
3. Event management with survey deployment and user check-in/out
4. Role-Based Access Control with admin/client distinction
5. CloudFront-protected survey access with signed cookies

### Nice-to-Have Features
- Audit logging with 1-year retention and export capabilities
- BigQuery integration for advanced analytics
- Multi-language support for surveys
- Real-time collaboration features
- Advanced reporting and dashboard visualizations

## Architecture & Design

### Architecture Style
> Monorepo architecture with separate packages for web-app and Firebase functions. Features a sophisticated CSS theme-scoping architecture for brand switching, custom SurveyJS renderer system, and upcoming RBAC implementation with Firebase custom claims and Firestore-managed permissions.

### Design Patterns
> - **Component Architecture**: Ford UI v2 components with custom wrapper components
> - **CSS Architecture**: Theme-scoped CSS variables with automatic inheritance
> - **State Management**: React hooks with context for brand/theme switching
> - **Security**: Firestore security rules + Cloud Functions for complex authorization
> - **Testing**: Test-Driven Development (TDD) with red-green-blue cycle

### UI/UX Requirements
> - **Ford Brand**: Ford blue palette, FordF1 font family, rounded buttons
> - **Lincoln Brand**: Lincoln burgundy palette, LincolnSerif fonts, luxury styling
> - **Unbranded**: Neutral grays, system fonts, minimal styling
> - **Admin Console**: Tailwind Plus Application Shell with sidebar navigation
> - **Accessibility**: WCAG AA compliance, keyboard navigation support

## Development Guidelines

### Code Style
> - TypeScript with strict mode enabled
> - ESLint and Prettier configuration enforced
> - Component naming: PascalCase for components, camelCase for functions
> - File naming: kebab-case for files, PascalCase for component files
> - CSS: Theme-scoped variables, absolute import paths, bridge classes for SurveyJS

### Testing Requirements
> - **Unit Tests**: Vitest for components and utilities (80% coverage target for backend)
> - **Integration Tests**: Firebase Emulator Suite for security rules and Cloud Functions
> - **E2E Tests**: Playwright for critical user flows (100% pass rate required)
> - **Visual Regression**: Playwright snapshots for admin screens
> - **Accessibility**: axe-core automated scans in CI
> - **TDD Policy**: All RBAC features must follow red-green-blue cycle

### Documentation Needs
> - Component documentation with usage examples
> - API documentation for Cloud Functions
> - Admin and client user guides
> - Migration and deployment checklists
> - Ford UI integration troubleshooting guide
> - CONTRIBUTING.md with TDD guidelines

## Resources & References

### API Documentation
> - Firebase Admin SDK: https://firebase.google.com/docs/admin/setup
> - SurveyJS v2 API: https://surveyjs.io/form-library/documentation/api-reference/survey-data-model
> - Ford UI Components: Internal Storybook at http://localhost:4400

### Design References
> - Ford.com for brand guidelines and header patterns
> - Lincoln.com for luxury brand styling
> - Tailwind Plus for admin console components
> - Internal Figma designs (via MCP integration)

### Technical Documentation
> - Project README.md for detailed setup and troubleshooting
> - CLAUDE.md for Ford Design System integration patterns
> - RBAC PRD in ChatPRD for implementation specifications
> - Firebase Security Rules documentation

## Constraints & Considerations

### Technical Constraints
> - Node.js 20.13.1+ required (see .nvmrc)
> - Ford UI submodule must be kept in sync
> - CSS variable naming must match Ford UI expectations
> - Firebase custom claims limited to Admin/Client roles only
> - Group membership managed in Firestore, not in custom claims
> - Browser support: Chrome, Firefox, Safari (latest 2 versions)

### Timeline
> - RBAC Implementation: 6 phases over 11-16 days (part-time development)
> - Phase 1-2: Admin Shell and Lists (3-5 days)
> - Phase 3-4: Groups and Authorization (5-8 days)
> - Phase 5-6: Audit Logs and QA (2-5 days)

### Budget/Resource Constraints
> - Development on Mac Mini CI/CD agents
> - Firebase free tier limitations for development
> - Part-time development pace (1-2 engineers)
> - Existing Ford UI license and components only

---

## Instructions for Claude

1. Read this PROJECT_INSTRUCTIONS.md carefully
2. Review TASK_INSTRUCTIONS.md for task management guidelines
3. Check TASKS.md for current RBAC implementation tasks
4. Review CLAUDE.md for Ford Design System patterns and lessons learned
5. Consult the RBAC PRD from ChatPRD for detailed requirements

Remember to:
- Update TASKS.md as you work using the proper format
- Follow TDD methodology for all RBAC features
- Run `pnpm ford-ui:update` after Ford UI changes
- Test brand switching in all three themes
- Ensure CSS variables use correct `--semantic-color-*` naming
- Use absolute paths for CSS imports
- Maintain test coverage requirements
- Ask clarifying questions if specifications are unclear
- Suggest improvements based on best practices
- Keep the user informed of progress and decisions

### Critical Success Factors
1. **CSS Variable Correctness**: Always use original Ford UI source files, not broken generator
2. **Theme Completeness**: All four theme classes must exist (ford_light, ford_dark, lincoln_light, lincoln_dark)
3. **Test-First Development**: Red-green-blue cycle for all RBAC features
4. **Security-First Design**: Firestore rules and Cloud Functions for authorization
5. **Brand Consistency**: Components must inherit theme automatically via #fd-nxt wrapper