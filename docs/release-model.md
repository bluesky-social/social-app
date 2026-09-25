# Release model

`RELEASE-x.y.z.md` holds the release version, build metadata, and cumulative
public changelog.

## Names

All names come from one strict `x.y.z` version:

- Branch: `release-x.y.z`
- Native tag: `x.y.z`
- Document: `RELEASE-x.y.z.md`
- GitHub Release: `Release x.y.z`
- OTA tag: `ota-x.y.z-N`

## Prepared document

Only `releaseVersion` is required before builds:

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

## Finalized document

Finalization adds the source commit and build numbers read from the native
artifacts. All fields are required:

```yaml
releaseVersion: 1.131.1
sourceTag: 1.131.1
sourceSha: 0123456789abcdef0123456789abcdef01234567
iosBuildNumber: 1662
androidVersionCode: 1110
```

`sourceTag` must match `releaseVersion`. `sourceSha` must be a full Git object ID.
Build numbers must be positive integers. Collecting build results and finalizing
the document are not implemented in the preparation workflow yet.

## Changelog

GitHub Release notes come from between the public changelog markers. Each OTA
adds a numbered section (`OTA 1`, `OTA 2`, etc.) with no gaps in the sequence.

## Build inputs

The iOS, Android, and web workflows accept `sourceRef`, defaulting to the event's
SHA, and expose the checked-out commit as `source-sha`. Native submission jobs
check out that same commit. Web image tags and revision labels use it too.

Native workflows accept `submit`, defaulting to `true`. Run Release sets it to
`false`. Create Release validates the source and creates the prepared branch;
Run Release creates the tag and draft, refreshes notes, and dispatches builds.
Native artifacts remain available for 30 days. Build-result collection, document
finalization, and submission of retained artifacts are separate work.

## Implementation

- [Release workflow usage and recovery](release-preparation/README.md)
- `.github/workflows/create-release.yml`: validation, document and branch creation,
  and handoff to Run Release.
- `.github/workflows/run-release.yml`: repeatable draft notes, tag creation, and
  guarded build dispatch using the GitHub CLI.
