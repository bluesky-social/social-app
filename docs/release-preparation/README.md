# Release preparation dry run

Choose a source branch, tag, or commit and the version you want to release.
The **Prepare Cactus Release (dry run)** action checks that the package and Expo
versions match, then puts together the release notes from Git history.

At the end, it prints the source commit, release branch and tag names, the release
file, public notes, and the steps a real release would take. You can share the
Actions summary with reviewers or download the report and notes from that run.
This uses the source you picked; the old demo and its made-up scenarios are gone.

A real run would create the release branch, commit the release file, create a
draft GitHub Release, and request native and web builds. Once those builds finish,
it would record their build numbers in the release file. Releasing the app would
still be a manual step.

This action only checks the source and writes the report. It doesn't create those
resources, run builds, submit to stores, or deploy anything. It has read-only
repository permissions and no release or store secrets.

## What still needs work

The dry run doesn't check GitHub for existing releases or prove that retrying a
real release is safe. Creating and reusing release branches, tags, and drafts,
wiring up all three builds, and saving the completed release file are still to do.
The separate native build workflows retain their existing recovery support.

The notes are provisional commit titles since the highest version tag reachable
from the selected commit, excluding the requested version. With no earlier tag,
it uses all reachable history. Translations aren't refreshed. The version check
currently requires Expo's `appVersion` runtime policy; fingerprint runtime support
will need a separate adjustment.

## Run it locally

Use a clean checkout with full Git history. The version must match that checkout:

```sh
node scripts/release/prepare.mjs 1.133.0 /path/to/source
```

To save the report and notes too, add a new output directory:

```sh
node scripts/release/prepare.mjs 1.133.0 /path/to/source /tmp/release-report
```

The output directory must not already exist. The report contains the actual
source commit; it doesn't invent a prepared commit or build numbers. Loading
`app.config.js` executes the selected checkout's configuration, so use trusted
repository code, just as you would when running other project scripts.
