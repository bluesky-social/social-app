# Release preparation

All release orchestration lives in GitHub Actions, using inline Bash, `gh`, and
`jq`. No release JavaScript or local release scripts are required.

## Create a release

Run **Create Release** (`create-release.yml`) on `main` with:

- `releaseVersion`: strict `x.y.z`, matching package.json and Expo config.
- `sourceRef`: a commit, branch, or tag in main history (default `main`).
- `dryRun`: validate and preview without creating resources or starting builds.

The workflow checks versions, Expo's appVersion runtime policy, source ancestry,
build workflow definitions, active workflows, and existing release resources.
It generates notes through GitHub's release notes API, adds `RELEASE-x.y.z.md`
in one preparation commit, and creates `release-x.y.z` at that commit.
Only after these checks succeed does it dispatch **Run Release**.
Both workflows must be on main and active before use.

The summary records the original and prepared commits. Dry runs perform reads
and generate a preview but do not create a branch, tag, release, or build.
The workflow token provides the required contents/actions permissions; no PAT
is required. Both workflows serialize on the same release version.

## Run or resume a release

**Run Release** (`run-release.yml`) is kicked off automatically by Create Release.
For recovery, run it on `main` with the same `releaseVersion`, the prepared SHA
as `sourceRef`, and the original source SHA as `sourceSha`.

It verifies the preparation commit, branch, tag, and existing draft identity.
Before tagging, it downloads translations from Crowdin using the repository's
`CROWDIN_PERSONAL_TOKEN` secret, extracts all catalogs, and commits only
`src/locale/locales/*/messages.po` changes. Even when catalogs are unchanged,
an empty translation checkpoint commit records that the refresh completed.

It then compiles translations and runs lint, formatting, lexicon verification,
all platform typechecks, and tests. Only successful checks allow tag creation,
draft creation/update, or build dispatch. Builds use the translation commit.
Draft notes are overwritten from the public changelog in the release document. Published releases and
conflicting refs are rejected; refs are never force-updated.

`startBuilds` defaults to false for manual runs, allowing notes and draft recovery
without starting builds. Create Release sets it to true. Builds use the release
tag with the immutable prepared commit passed as `sourceRef`:

- iOS and Android: production builds with `submit: false`.
- Web: production image pushed to ECR.

Each dispatch reserves `release-build-x.y.z-ios`, `-android`, or `-web` first.
Repeated runs skip reserved builds. The summary links to each dispatched run;
dispatch success does not mean build success. The draft is never published and
native builds are never submitted by this process.

## Partial failures

If creation succeeded but the handoff failed, retry Create Release with the same
version and original source SHA. It verifies that the branch contains exactly
one preparation commit adding the expected release document, optionally followed
by one translation checkpoint commit containing only regular catalog files. It
preserves existing notes, checks any tag, draft, and build reservations, and retries the
handoff. A dry run validates reuse without dispatching anything. Different
sources, unexpected changes, and conflicting release resources still fail.

Use a full commit SHA for `sourceRef`: retrying with `main` or another moving
branch can resolve to a newer commit and will then be rejected. The original
source SHA is recorded in the creation summary. Alternatively, use Run Release
directly with both SHAs from that summary.

Once a translation checkpoint exists, retries reuse it and rerun checks without
pulling translations again. Once tagged, the commit is never changed. A failed
check leaves the checkpoint available for inspection but creates no tag or builds;
source fixes require a new release preparation rather than changing that checkpoint.
Tags from the older flow without a translation checkpoint are rejected.

GitHub outages can leave completed writes behind even when a request reports a
failure. After recovery, retry with the same source; no branch or tag is reset.
For failed builds, rerun failed jobs in their own Actions runs.

If a dispatch fails after its reservation was created, inspect Actions before
manually dispatching that build: a timeout may still have started it. Reservations
are intentionally retained to prevent automatic duplicate native builds.

Build-result collection, release document finalization, and submission of retained
artifacts remain separate work. Native artifacts are retained for 30 days.
