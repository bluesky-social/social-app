# Release preparation demo

This demo shows how release prep should handle a normal run, retries, and
conflicts. It uses made-up release data and keeps all changes in memory. It
won't create branches or tags, contact GitHub, or kick off a build.

Start with the [example walkthrough](./example.md). You can read it right in the
PR. The **Release Preparation Demo** CI job also includes the walkthrough in its
summary and uploads a `release-preparation-demo-<run>-<attempt>` artifact with:

- `README.md` — the walkthrough.
- `report.json` — the inputs and the state of each simulated release after each run.
- `RELEASE-1.133.0.md` — an example release file, including its metadata.
- `github-release-body.md` — the public release notes extracted from that file.

## What to look for

On the first run, prep checks that the package, Expo, and runtime versions all
match the requested release version. It generates the release file and derives
the branch, tag, and GitHub Release names from that version.

The demo then simulates creating the candidate commit, release branch, tag, and
draft GitHub Release. Before doing any of that, it checks whether something with
the same identity already exists:

- If it matches, reuse it.
- If it differs, or there's not enough information to verify it, stop.

The retry examples stop after each step, then run prep again. Completed steps
should be reused, and the remaining steps should finish with the same result as
an uninterrupted run. Changing the source commit or changelog should cause a
conflict. Prep should never replace an existing release to make a retry work.

## What's still missing

This is a demo of the preparation rules, not the release workflow itself. The
source commit is a placeholder, and IDs beginning with `simulation:` aren't Git
SHAs. The results don't tell us whether any real branch, tag, or release exists.
The demo covers initial preparation; an already-published release or a release
branch that has moved will cause a conflict.

We still need to connect this to Git and GitHub, pull translations, create real
commits, handle concurrent runs, and wire up approvals, builds, and finalization.
The version checks also need to be reconciled with the fingerprint runtime work
in APP-3042. The demo doesn't run translation commands.

There's no `--apply` option or live API connection. The CI job has read-only
repository access and no release or store secrets. The existing **Prepare Cactus
Release** workflow is separate: it previews a selected source but doesn't carry
out the steps shown here.

## Run it locally

From the repository root, print the walkthrough:

```sh
node scripts/release/prepare-demo.mjs
```

Or save the walkthrough and supporting files:

```sh
node scripts/release/prepare-demo.mjs --output /tmp/release-preparation-demo
```

Use a new directory each time; the demo won't overwrite an existing one. It runs
without installing dependencies and checks the expected result of each example.
CI compares its output with the committed walkthrough to catch stale examples.

The additional tests cover input validation, keeping the original data unchanged,
and writing the report files:

```sh
pnpm test --runInBand --watchman=false --runTestsByPath scripts/release/prepare.test.js
```
