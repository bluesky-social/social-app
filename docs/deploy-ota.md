# OTA Deployments

## Overview

![OTA Deployment](./img/ota-flow.png)

## Internal Deployments

Internal OTA deployments should be performed automatically upon all merges into main. In cases where the fingerprint diff results in incompatible native changes, a new client build will automatically be ran and deployed to TestFlight (iOS) or delivered in Slack (Android).

## Production Deployments

### Prerequisites

- Remove any internal client from your device and download the client from the App Store/Google Play. This will help for testing as well as retrieving the build number.
- You should have signed in to EAS locally through npx eas login. You will need to modify the build number in a subsequent step.
- Identify the build number of the production app you want to deploy an update for. iOS and Android build numbers are divergent, so you will need to find both

  ![app-build-number](./img/app-build-number.jpg)

- Ensure that the commit the initial client was cut from is properly tagged. The tag should be in the format of 1.X.0

### Preparation

- Create a new branch from the tag that the initial release was cut from if no OTA deployment has been made yet for this client. Name this branch 1.X.0-ota-1
- If a deployment has been made previously for this release, increment the tag, i.e. 1.x.0-ota-2
- If necessary, cherry-pick the commit(s) that you wish to deploy
- Ensure that the package.json’s version field is set to the appropriate value. As long as you always use the

### Deployment

- Update the build number through EAS
    - Note: This isn’t strictly necessary, but having a step that takes you off of GitHub and into the terminal provides a little “friction” to avoid fat fingering a release. Since there are legitimate reasons to just “click and deploy” for internal builds, I felt it useful to make sure it doesn’t accidentally become a prod deployment.
    - Set the build number to the appropriate build number found in the prerequisite steps. Again, this should be the build number for the current production release you want to deploy for.
    - `npx eas build:version:set -p ios`
    - `npx eas build:version:set -p android`
- Run the deployment
  - Navigate to https://github.com/bluesky-social/social-app/actions/workflows/bundle-deploy-eas-update.yml
  - Select the “Run Workflow” dropdown
  
    ![run-workflow](./img/run-workflow.png)
  
  - Select the branch for the deployment you are releasing.
  
    ![branch-selection](./img/branch-selection.png)
  
  - Double check the branch selection.
  - Select the production channel
  - Enter the version for the client you are releasing to, i.e. 1.80.0
  
    ![other-ota-options](./img/other-ota-options.png)
  
  - Triple check the branch selection.
  - Press “Run Workflow”

In about five minutes, the new deployment should be available for download. To test:

- Remove the internal build of the app from your device
- Download the app from the App Store/Google Play
- Launch the app once and wait approximately 15 seconds
- Relaunch the app
- Check the Settings page and scroll to the bottom. The commit hash should now be the latest commit on your deployed branch.
