# Release preparation

Run **Prepare Cactus Release** in GitHub Actions with:

- `sourceRef`: branch, tag, or commit to release.
- `releaseVersion`: strict `x.y.z`, matching the package and Expo versions.
- `dryRun`: defaults to `true`. Disable it to create the draft and start builds.

The run produces an Actions summary and an artifact containing the request plan,
release file, and public notes. Reports are saved on conflicts too.

## Cut a release candidate

1. Choose a green commit on main with the intended package and Expo version.
   Review the commit-title changelog and refresh translations before choosing
   that commit if needed.
2. Run a preview with that **full commit SHA** as `sourceRef` and review the
   generated release document and requests.
3. Run the workflow on `main` with the same version and SHA and `dryRun: false`.
   Live preparation only accepts source commits in the tooling commit's main
   history. Its build workflow definitions must match the tooling checkout.
4. Follow the three build links in the execution summary. `builds-dispatched`
   means that the builds were started, not that they succeeded.

The live job has `contents: write` and `actions: write`; the preview remains
read-only. Live preparation rejects unverified draft visibility. No separate
PAT is required. The workflow serializes runs for each release version, never
force-updates a ref, and never publishes the draft or submits native builds.
The web build does push its production image to ECR.

The local live entry point is deliberately separate from the preview CLI:

```sh
node scripts/release/prepare.mjs 1.133.0 /path/to/clean/source release-preparation
node scripts/release/execute.mjs release-preparation bluesky-social/social-app --apply
```

It requires `GH_TOKEN` with Contents and Actions write permissions. Prefer the
workflow for its main-only entry point and per-version concurrency control.

## Plan

The preview can describe creation or verified reuse; live execution only accepts
a new release.

1. Create or reuse the release branch.
2. Create the tree and commit for the release file, or reuse a matching commit.
3. Advance the branch and create or reuse the tag and draft release.
4. Prepare the iOS, Android, and web workflow dispatches.

Each preview step rechecks GitHub against the initial state. A change or failed check
stops the run. The report includes request bodies, dependencies, and step results:
`skipped-dry-run`, `verified-reuse`, or `blocked`. Output references such as
`fromStep: prepared-commit` are resolved by the preceding request in live execution.

Live execution resolves these references to actual API outputs, rechecks state
before each operation, and verifies each resource write before continuing. It
records completed writes even if a later operation fails.

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

## Partial failures and manual recovery

Live preparation does not resume existing releases or automatically retry API
requests. If the release branch, tag, or GitHub Release already exists, it stops
before writing anything. A failure during preparation stops the remaining steps;
completed writes and dispatched builds are not rolled back.

1. Inspect the run summary and `report.json` artifact. They contain the selected
   source, resolved request bodies, completed operations, and returned build-run
   links. A `write-requested` or `dispatch-requested` result means the response
   was not confirmed: GitHub may still have accepted the request.
2. Check GitHub before issuing any manual request. A timeout does not prove that
   a branch, draft, or build was not created. Do not delete a release tag or
   rerun the whole preparation workflow to retry a build.
3. Finish only the missing operations, using the report's source and prepared
   commit. Native builds must use the release tag as their workflow ref and the
   exact prepared commit as `sourceRef`, with `profile: production` and
   `submit: false`. The iOS `testFlightGroup` stays `none`.
4. For a failed build, inspect and rerun its failed jobs in Actions. If a dispatch
   response was lost, find the run by workflow, time, release tag, and commit
   before considering a new dispatch. Escalate uncertain outcomes for inspection.

The workflow serializes preparation by version, but manual commands must not run
alongside an active preparation job. IPA/dSYM and AAB artifacts are retained for
30 days for inspection and later submission. This workflow does not wait for
builds, collect their metadata, or submit them to stores.

## Remaining work

- Wait for build results and record build numbers in the release file.
- Collect verified build receipts and finalize the release document.
- Submit the retained artifacts without rebuilding, then perform manual rollout.
- Add fingerprint runtime support; validation currently requires `appVersion`.

Release notes are commit titles since the highest reachable version tag,
excluding the requested version. Without an earlier tag, they include all
reachable history. Notes still need review, and translations aren't refreshed.
App release remains manual.
