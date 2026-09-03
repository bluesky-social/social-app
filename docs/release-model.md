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
