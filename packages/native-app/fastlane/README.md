fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## iOS

### ios set_version

```sh
[bundle exec] fastlane ios set_version
```

Set version from package.json and build number from timestamp

### ios certificates

```sh
[bundle exec] fastlane ios certificates
```

Fetch certificates and provisioning profiles

### ios pre_build

```sh
[bundle exec] fastlane ios pre_build
```

update all the default data

### ios build_staging

```sh
[bundle exec] fastlane ios build_staging
```

Push a new staging build to TestFlight

### ios build_production

```sh
[bundle exec] fastlane ios build_production
```

Release the production build to Apple

### ios staging_updates

```sh
[bundle exec] fastlane ios staging_updates
```

Build and publish EAS update for staging

### ios production_updates

```sh
[bundle exec] fastlane ios production_updates
```

Build and publish EAS update for production

### ios staging

```sh
[bundle exec] fastlane ios staging
```

Fetch certificates, build for staging and upload to TestFlight.

### ios production

```sh
[bundle exec] fastlane ios production
```

Fetch certificates, build for production and upload to TestFlight.

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
