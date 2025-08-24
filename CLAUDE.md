# CLAUDE.md

This file provides comprehensive guidance to Claude Code (claude.ai/code) when working with code in this repository, specifically focusing on Ford Design System integration patterns and lessons learned.

## Project Overview

This is a monorepo for Expanse Marketing, a survey SAAS platform with advanced Ford Design System (FDS) integration. The repository successfully implements three-way brand switching (Ford/Lincoln/Unbranded) with proper CSS variable scoping and SurveyJS v2 custom renderers.

## Component Usage Guidelines

- We should always defer to using ford-ui components/atoms/molecules/etc rather than writing our own code to LOOK like them

## Environment Setup

- Node.js version: 20 (see .nvmrc)
- Use `nvm use` to switch to the correct Node.js version
- The project integrates with Figma via MCP server configuration (.mcp.json)
- **Critical**: Run `./packages/web-app/scripts/sync-ford-ui.sh` after Ford UI updates

[... rest of existing content remains unchanged ...]

## Memories

- The firebase project name is latitude-lead-system