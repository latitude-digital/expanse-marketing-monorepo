# EAS Updates Channel/Branch Setup

This document outlines the EAS Updates channel and branch strategy for the Meridian Events app.

## Channel Strategy

We use separate channels for each app variant and environment:

### Staging App (`com.meridianeventtech.app.staging`)
- **development** - For development builds with dev client
- **preview** - For internal testing builds
- **staging** - For TestFlight staging releases

### Production App (`com.meridianeventtech.app`)
- **production** - For App Store production releases

## Setup Commands

Run these commands to create the channels (you only need to do this once):

```bash
cd packages/native-app

# Create channels for staging app
eas channel:create development
eas channel:create preview
eas channel:create staging

# Create channel for production app
eas channel:create production
```

## Viewing Channels and Branches

```bash
# List all channels
eas channel:list

# List all branches
eas branch:list

# View specific channel
eas channel:view staging
eas channel:view production
```

## Publishing Updates

### Staging Updates
```bash
# Publish to staging channel (for staging app)
APP_VARIANT=staging eas update --branch staging --message "Description of changes"
```

### Production Updates
```bash
# Publish to production channel (for production app)
eas update --branch production --message "Description of changes"
```

## Automated Workflows

GitHub Actions automatically publishes updates:

- **Staging**: Push to `staging` branch → publishes to `staging` channel
- **Production**: Push to `main` branch → publishes to `production` channel

## Runtime Version Strategy

We keep `runtimeVersion: { policy: "appVersion" }` in `app.config.js`. EAS updates are gated by the fingerprints stored in `packages/native-app/fingerprints.json`:

- Full native builds refresh the fingerprint for the selected environment via `pnpm fingerprint:update -- <env>`
- `eas update` invokes `pnpm fingerprint:check` first; if the generated fingerprint differs from the stored one, the update is blocked
- Run a full native build whenever native dependency changes alter the fingerprint so the stored value can be updated

## Channel to Build Profile Mapping

| Channel | Build Profile | Bundle ID | Environment |
|---------|---------------|-----------|-------------|
| development | development | com.meridianeventtech.app.staging | Staging |
| preview | preview | com.meridianeventtech.app.staging | Staging |
| staging | staging | com.meridianeventtech.app.staging | Staging |
| production | production | com.meridianeventtech.app | Production |

## Best Practices

1. **Always use descriptive messages** when publishing updates
2. **Test in preview/staging** before publishing to production
3. **Monitor rollout** after publishing production updates
4. **Use rollout percentage** for gradual production rollouts if needed:
   ```bash
   eas update --branch production --message "Update" --rollout-percentage 25
   ```
5. **Run a full build for native changes** – OTA updates only work when the fingerprint matches the installed binary
