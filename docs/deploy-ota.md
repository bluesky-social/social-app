# OTA Deployments

## Fingerprint rollout

The fingerprint pipeline is staged behind the repository variable
`OTA_FINGERPRINT_PIPELINE_ENABLED`. Leave it unset until the additive Denis
server support and structured publisher release have been deployed. The legacy
numeric-runtime workflow remains the rollback and supported-client hotfix path
during migration.

Fingerprint releases calculate iOS and Android runtimes independently from the
exact commit and native profile being exported. Production still requires an
explicit numeric native build target for each platform. A native build receipt
may be supplied as additional validation: a valid receipt must match the
calculated runtime, profile, platform, and build number, but an expired or
missing GitHub Actions artifact does not freeze production publishing. Never
copy a runtime from a receipt onto a newly exported bundle.

TestFlight and pull-request channels do not target build numbers once the
fingerprint server path is enabled. They remain isolated by platform, channel,
and the native runtime fingerprint. Existing numeric-runtime binaries continue
to use the legacy build filters.

Before enabling the repository variable, verify that the pinned Denis release
accepts `publish --release-file`, both serving and asset routes accept hash
runtimes, and the new shared calculator action has been pinned to a reviewed
commit. Do not enable the variable with only one of those dependencies ready.

The structured publisher version is pinned by `OTA_FINGERPRINT_DENIS_VERSION`.
After canary validation, set `OTA_FINGERPRINT_PIPELINE_ENABLED` to `true` to
select the new automatic workflow and fingerprint native builds. The process
environment flag passed to app config is `1`; an unset flag retains app-version
runtimes. Use **Bundle and Deploy Fingerprint OTA** for an explicit fingerprint
production publication, selecting the release branch and exact iOS/Android
build numbers. Optional native receipt run IDs/attempts add evidence, not a
runtime override. Each platform's verified/unverified result is in the summary.

This draft still needs automatic per-platform TestFlight receipt lookup and
native rebuild scheduling. With the gate enabled, the main workflow can publish
a safe fingerprinted update without a matching installed binary; it does not
yet automatically create the missing binary. Trigger a native build explicitly
during canary testing, and do not treat publication as proof that a compatible
TestFlight build is available to install. Real fingerprint IPA/AAB canaries are
also required to verify packaged runtime/channel/build extraction before
enablement. Slack notification enrichment and OTA notifications are tracked in
APP-3042; until implemented, verification warnings remain in the GHA summary.

The legacy workflow below remains available for explicitly dispatched
production hotfixes after the gate is enabled. It must export from the correct
legacy release source; do not use it as an automatic fallback after a failed
fingerprint publication.

## Automatic internal OTAs

The following describes the legacy workflow while the fingerprint rollout
flag is unset.

OTA deployments to TestFlight/APK installs happen automatically upon all merges
into main. In cases where the fingerprint diff shows incompatible native
changes, a new client build will automatically be ran and deployed to TestFlight
(iOS) or delivered in Slack (Android).

## Legacy production OTAs

Production OTAs can only update the JavaScript bundle. Changes to native modules
must be done as a full release cycle through the app stores.

> [!TIP]
> If you're using a TestFlight build, in order to reference the correct build
> number and to verify the success of an OTA, you will need to delete the
> TestFlight app itself, delete the Bluesky app entirely, and re-install from
> the App Store.

### 1. Find the build numbers

Find the latest production build numbers for iOS and Android in Slack. These are
spit out into `#bot-client-builds` after each release. You can also find this
information under the `About` section in app settings.

| Slack | In app |
| ----- | ------ |
| ![slack](./img/slack_client_builds.jpeg) | ![slack](./img/ios_settings_about.jpeg) |

### 2. Ensure the release is tagged

You need to ensure that the latest release was properly tagged using the format
`1.X.0`. If the commit is not properly tagged, then the OTA deployment will
simply fail since the GitHub Action will not be able to find a commit to
fingerprint and diff against.

### 3. Create an OTA branch

Create a branch based off the last commit that was deployed in the most recent
release. This could be the commit that was tagged `1.x.0`, or a later commit,
but it **needs to be the tip of the latest production release** in any case.
Double check yourself by ensuring that the `version` in `package.json` matches
what's in the latest release.

This new OTA branch should follow the format `1.X.0-ota-1`. If one or more OTAs
have already been deployed for this release, increment the branch name e.g.
`1.x.0-ota-2`.

### 4. Add commits to the OTA branch

Cherry pick in the commits that need to be deployed on top of the most recent
release or OTA.

### 5. Pull translations

Since translators may have added new strings, and positions within the code may
have shifted, it's typically best to pull the latest translations.

Run this and commit the result as the last commit on the OTA branch.

```sh
pnpm intl:release
```

### 6. Run the GitHub actions
You'll need to run two separate actions: one to deploy the iOS/Android OTA
itself, and one to build the web Docker container.

**For the iOS/Android OTA,** head to [Actions > Bundle and Deploy EAS
Update](https://github.com/bluesky-social/social-app/actions/workflows/bundle-deploy-eas-update.yml)
and run the action.

| Steps |     |
| ----- | --- |
| Select your OTA branch `1.x.0-ota-x`, select `production` in the dropdown, enter the git tag of the latest release `1.x.0`, enter the iOS build number and Android version code you found in **Step 1**, and click "Run workflow"  | ![workflow](./img/ota_action.png) |

> [!NOTE]
> Production OTAs are bound to the specific native build they target, so the
> workflow requires the build numbers to be entered manually. There is no need
> to change the global EAS build counters (and doing so is no longer necessary
> for OTAs - they are only used when producing new native builds).

> [!NOTE]
> If you do enter an incorrect version here, the deployment will either:
> - Fail, because the action cannot find a commit with your misentered version
> - Succeed, but with no users receiving the update. This is because the
>   version and build numbers you entered will not match any clients in the
>   wild, so none will be able to receive the update.

**For web,** head to [Actions >
build-and-push-bskyweb-aws](https://github.com/bluesky-social/social-app/actions/workflows/build-and-push-bskyweb-aws.yaml)
and run the action.

| Steps |     |
| ----- | --- |
| Select your OTA branch `1.x.0-ota-x` and click "Run workflow" | ![workflow](./img/web_action.png) |

### 7. Deploy web

Once the web Docker container build finishes, go to your `1.x.0-ota-x` branch,
copy the most recent commit hash. Post this hash in `#ops-deploys` and request
someone with web deploy access deploy the built container.

### 8. Confirm successful deployment

In about five minutes, the new deployment should be deployed and devices will
begin downloading and installing in the background.

To confirm this, as mentioned above, you must completely clear the TestFlight
build from your device and re-install from the App Store. Then, you'll need to:
- Launch the app (or quit and reopen) and wait ~15s for the download to complete
- Quit and reopen the app
- Check the `Settings > About` page and confirm the hash matches the most recent hash on your OTA branch

## Overview diagram

![OTA Deployment](./img/ota-flow.png)
