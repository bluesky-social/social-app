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

A finalized document will record the frozen source and artifact-derived build numbers
after both native builds succeed. Finalization is not wired into the dry run.
The document format requires every field:

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

## Release preparation dry run

The **Prepare Cactus Release (dry run)** workflow reads the selected source,
checks its versions, and prints the release details, provisional notes, and steps
a real run would take. It also prepares ordered GitHub and build request templates,
rechecks remote state before each step, and skips every write. It saves those
files as a downloadable artifact. It does
not create release resources or start builds. See the
[release preparation guide](release-preparation/README.md) for usage and limits.

## Build source

The existing iOS, Android, and web workflows accept an optional `sourceRef`.
They check out that ref and expose the resolved commit as `source-sha`. Native
submission jobs use the same resolved commit as the build job. Without an input,
the workflows keep using the event's source SHA.

The dry-run plan supplies the prepared commit to all three workflows and sets
`submit: false` for native builds. Android's existing submission option is retained;
iOS gets the same option, defaulting to `true` for existing callers. Web image tags
and revision labels use the checked-out source SHA.

Artifact handling and build steps otherwise follow the existing workflows.
Native recovery checkpoints, checksum receipts, and submission deduplication are
outside this PR. The dry run does not start any of these workflows.
