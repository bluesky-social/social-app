# OTA Deployments

## Automatic internal OTAs

OTA deployments to TestFlight/APK installs happen automatically upon all merges
into main. In cases where the fingerprint diff shows incompatible native
changes, a new client build will automatically be ran and deployed to TestFlight
(iOS) or delivered in Slack (Android).

## Production OTAs

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

### 6. Declare and tag the OTA

Add a reviewed OTA intent at `.ota/<version>-<sequence>.json`. For example,
`.ota/1.131.1-1.json`:

```json
{
  "runtimeVersion": "1.131.1",
  "iosBuildNumber": 12345,
  "androidVersionCode": 67890
}
```

Commit the intent, then tag the exact commit that should be deployed:

```sh
git tag ota-1.131.1-1 <commit-sha>
git push origin ota-1.131.1-1
```

The sequence in the filename and tag must match. See [`.ota/README.md`](../.ota/README.md)
for the complete contract.

Pushing the tag automatically starts the **Deploy Production OTA** workflow.
It validates and prepares the exact tagged bundle, then waits at the protected
`production-ota` environment before publishing.

### 7. Build web

The production OTA and TestFlight OTA workflows are separate. Production never
uses the automatic TestFlight build-number or native-rebuild behavior.

> [!NOTE]
> Production OTAs are bound to the specific native build they target. The
> workflow rejects branches and validates that the tag, intent, package
> version, native release ancestry, and build numbers agree before publishing.

**For web,** head to [Actions >
build-and-push-bskyweb-aws](https://github.com/bluesky-social/social-app/actions/workflows/build-and-push-bskyweb-aws.yaml)
and run the action.

| Steps |     |
| ----- | --- |
| Select your OTA branch `1.x.0-ota-x` and click "Run workflow" | ![workflow](./img/web_action.png) |

### 8. Deploy web

Once the web Docker container build finishes, go to your `1.x.0-ota-x` branch,
copy the most recent commit hash. Post this hash in `#ops-deploys` and request
someone with web deploy access deploy the built container.

### 9. Confirm successful deployment

In about five minutes, the new deployment should be deployed and devices will
begin downloading and installing in the background.

To confirm this, as mentioned above, you must completely clear the TestFlight
build from your device and re-install from the App Store. Then, you'll need to:
- Launch the app (or quit and reopen) and wait ~15s for the download to complete
- Quit and reopen the app
- Check the `Settings > About` page and confirm the hash matches the most recent hash on your OTA branch

## Overview diagram

![OTA Deployment](./img/ota-flow.png)
