# Release model

Each app release gets one document that keeps its version, build information, and public changelog together in one place.

## Identity

The workflow accepts one version in strict `x.y.z` format and derives all other identifiers from it:

| Resource | Format |
| --- | --- |
| Cumulative branch | `release-x.y.z` |
| Immutable native tag | `x.y.z` |
| Release document | `RELEASE-x.y.z.md` |
| GitHub Release name | `Release x.y.z` |
| Successful OTA tag | `ota-x.y.z-N` |

Callers must not supply these derived identifiers independently.

## Prepared state

The preparation workflow creates the document before freezing the native candidate. At this stage, only `releaseVersion` is required:

```md
---
releaseVersion: 1.131.1
---

# Release 1.131.1

<!-- public-changelog:start -->

## Initial release

- Added something

<!-- public-changelog:end -->
```

## Final state

After both native builds succeed, the workflow records the frozen source and artifact-derived build numbers. A finalized document requires every field:

```yaml
releaseVersion: 1.131.1
sourceTag: 1.131.1
sourceSha: 0123456789abcdef0123456789abcdef01234567
iosBuildNumber: 1662
androidVersionCode: 1110
```

`sourceTag` must equal `releaseVersion`, `sourceSha` must be a full Git object ID, and both build numbers must be positive integers.

Each successful OTA adds exactly one contiguous section (`OTA 1`, `OTA 2`, and so on) inside the public changelog delimiters. GitHub Release text is extracted only from those delimiters; operational frontmatter is never published.

## Command line usage

The release model can be exercised locally with `node scripts/release/cli.mjs`. Run it without arguments to see the available commands for creating, validating, finalizing, and updating a release document.

## Manual preview

The **Prepare Cactus Release** workflow accepts a release version and optional source ref. It validates the checked-out package and Expo versions, generates a provisional changelog from commit titles, uploads the prepared release document as an artifact, and summarizes every derived identifier. It has read-only repository permissions and does not create a branch, tag, commit, or GitHub Release.

## Preparation simulation for reviewers

The [reviewer guide](release-preparation/README.md) and
[generated walkthrough](release-preparation/example.md) demonstrate preparation,
retry, and conflict behavior with fixtures. The read-only **Release Preparation
Demo** check produces downloadable evidence; it creates no release resources.

## Build provenance

Native build artifacts are retained with metadata recording their exact source SHA, package version, artifact-derived build number, filename, SHA-256 checksum, and submission state. Store submission can be disabled so production-profile artifacts can be inspected without publishing them.

## Native recovery

Use **Re-run failed jobs** on the original GitHub Actions run. Each platform
keeps independent, immutable checkpoints scoped to `github.run_id`. A successful
platform does not need to be rebuilt when the other platform fails. A new
workflow dispatch is a new build, not a retry of the previous run.

Before building, the workflow records the source SHA, package version, platform,
build profile, and run ID. On a retry those must still match. Prefer a full commit
SHA for `sourceRef`: if an explicitly selected branch or tag moved, the workflow
stops instead of silently building a different candidate. The selected source must
contain the recovery scripts and local action.

If the native artifact already exists, the workflow validates its identity, build
number, and SHA-256 checksum, then restores the original outputs without running
EAS Build or incrementing a build counter. iOS also validates the dSYM checksum.
Artifacts use a flat layout so the same files are verified and submitted. A
failed build with no uploaded native artifact may be rebuilt from the recorded
source, provided no submission checkpoint exists. Native work completed before
artifact upload cannot be recovered from the runner's temporary disk.

Submission has two checkpoints:

- An intent, uploaded **before** calling EAS Submit.
- A receipt, uploaded after `eas submit --wait` succeeds and before Sentry or
  Slack steps run. This records upload completion, not store approval or device
  availability. See the [EAS Submit CLI reference](https://docs.expo.dev/eas/cli/#eas-submit).

On retry, a matching receipt skips EAS Submit and receipt upload. Follow-up steps
such as dSYM upload can then finish without uploading the binary again. An
intent without a receipt is an **unknown submission outcome**, including when
EAS reported an error: the remote operation may still have started. Automatic
resubmission is blocked in this case.

For an unknown outcome, retain the artifacts and inspect the original run's EAS
submission URL/logs and App Store Connect or Google Play. Compare the exact
version/build, source, and binary checksum from the intent. Do not delete the
intent to bypass the guard, and do not dispatch a replacement build as a retry.
Store-side reconciliation and a workflow to record the verified outcome are not
implemented here; an operator must resolve that case before resuming release
orchestration.

API errors, expired artifacts, unsupported metadata, identity mismatches, and
checksum mismatches stop recovery. Evidence is retained for 14 days; retries do
not overwrite or refresh its expiration. Do not delete recovery artifacts while
a run may still be retried. Older runs without this metadata schema cannot be
upgraded into recoverable runs.

This protects native build and submission recovery within one workflow run.
OTA publication/finalization, cross-run artifact reuse, APK generation/attachment,
and deduplicated notifications remain separate work. GitHub still controls which
jobs rerun; prefer failed-job retries over rerunning all jobs, since downstream
notification and APK steps may repeat.

### Local verification

`pnpm test --runInBand --watchman=false scripts/release/recovery.test.js` exercises
the helper and CLI with dummy binaries, matching and mismatched checkpoints,
interrupted submissions, moved refs, expired evidence, and API failures. It does
not build an app, contact EAS or a store, or publish anything.
