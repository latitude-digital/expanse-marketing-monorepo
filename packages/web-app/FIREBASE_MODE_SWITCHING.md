# Firebase Mode Switching Guide

This guide explains how to switch between production Firebase services and local emulators.

## Quick Start

### Use Production Firebase (for live testing)
```bash
cp .env.production.local.example .env.local
npm start
```

### Use Firebase Emulators (for local development)
```bash
cp .env.emulator.local.example .env.local
npm start
```

## Configuration Options

### 1. Production Mode
Set in `.env.local`:
```
REACT_APP_FIREBASE_MODE=production
```
- All services (Auth, Firestore, Functions) use production
- You'll see console messages with 🌐 indicating production services

### 2. Emulator Mode
Set in `.env.local`:
```
REACT_APP_FIREBASE_MODE=emulator
```
- All services use local emulators by default
- You'll see console messages with 🔧 indicating emulator services

### 3. Mixed Mode (Advanced)
You can mix production and emulator services:
```
REACT_APP_FIREBASE_MODE=emulator
REACT_APP_USE_FIRESTORE_EMULATOR=false  # Use production Firestore
REACT_APP_USE_AUTH_EMULATOR=false       # Use production Auth
# Functions will still use emulator
```

### 4. Default Behavior (No .env.local)
Without any configuration:
- In development: Functions emulator ON, Firestore/Auth production
- In production build: All services use production

## Switching Between Modes

1. Stop the dev server (Ctrl+C)
2. Update or create `.env.local` with desired mode
3. Restart the dev server: `npm start`
4. Check console for confirmation messages

## Console Messages

When the app starts, you'll see:
- 🌐 Using production [Service] - for production services
- 🔧 Connecting to [Service] emulator - for emulator services

## Troubleshooting

- Changes to `.env.local` require restarting the dev server
- Make sure Firebase emulators are running when using emulator mode
- The `.env.local` file is gitignored, so it won't be committed