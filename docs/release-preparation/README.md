# Release preparation

Run **Prepare Cactus Release (dry run)** in GitHub Actions with:

- `sourceRef`: branch, tag, or commit to release.
- `releaseVersion`: strict `x.y.z`, matching the package and Expo versions.

The run produces an Actions summary and an artifact containing the request plan,
release file, and public notes. Reports are saved on conflicts too.

## Plan

1. Create or reuse the release branch.
2. Create the tree and commit for the release file, or reuse a matching commit.
3. Advance the branch and create or reuse the tag and draft release.
4. Prepare the iOS, Android, and web workflow dispatches.

Each step rechecks GitHub against the initial state. A change or failed check
stops the run. The report includes request bodies, dependencies, and step results:
`skipped-dry-run`, `verified-reuse`, or `blocked`. Output references such as
`fromStep: prepared-commit` are resolved by the preceding request in a live run.

## Reuse checks

- **Branch:** points to the selected source or a single preparation commit whose
  only change is the expected release file.
- **Release file:** contents match exactly.
- **Tag:** resolves to the preparation commit.
- **Draft:** tag, name, and public notes match; it isn't published or a prerelease.

The action's read-only token may not see all drafts. That check is marked
`unverified`, and the plan finishes as `complete-with-warnings`. A draft-creation
request includes a precondition to check for existing drafts with release
permissions before execution. Conflicts and API errors still block the run.

## Build inputs

All three dispatches use the release tag and pass the prepared commit as
`sourceRef`. The source's workflow files must match this checkout's definitions,
and the workflows must be active in GitHub.

- **iOS / Android:** `profile: production`, `submit: false`.
- **Web:** builds the production image and pushes it to ECR.

## Remaining work

- Execute writes with concurrency handling and avoid duplicate build dispatches
  on retries.
- Wait for build results and record build numbers in the release file.
- Add fingerprint runtime support; validation currently requires `appVersion`.

Release notes are commit titles since the highest reachable version tag,
excluding the requested version. Without an earlier tag, they include all
reachable history. Notes still need review, and translations aren't refreshed.
App release remains manual.
