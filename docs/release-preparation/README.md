# Reviewing release preparation

This PR demonstrates release preparation without creating real release resources.
Start with the [generated example](./example.md): it shows the first run, an exact
retry, interruptions after every step, and conflicting resources. The example is
committed so it can be shared directly from the PR, without downloading anything.

The **Release Preparation Demo** CI check also uploads a
`release-preparation-demo-<run>-<attempt>` artifact containing:

- `README.md`: the same walkthrough shown in the job summary.
- `report.json`: inputs, planned actions, conflict reasons, and resulting snapshots.
- `RELEASE-1.133.0.md`: the proposed canonical release document.
- `github-release-body.md`: only the public changelog, without operational metadata.

## What the demo verifies

The planner validates the release, package, Expo, and effective runtime versions
and requires a resolved source SHA. It derives all resource names from the release
version, validates the generated release document, and binds the document and
source to a deterministic simulated candidate identity.

It then preflights all four resources: candidate, release branch, immutable native
tag, and draft GitHub Release. Existing resources are reused only when their
recorded identity and contents match. Any conflict blocks the entire plan before
any simulated change. Missing provenance also blocks preparation. Nothing is
force-moved, overwritten, or published.

The executor operates on a copied in-memory snapshot. Fixtures simulate an
interruption after each durable step, including after the draft release exists
but before success is acknowledged. An exact retry reuses completed steps and
finishes the rest. Changing the source or changelog produces a conflict rather
than silently replacing the candidate.

## Safety and limits

There is no live adapter, token input, `--apply` option, Git subprocess, or network
client. Running the demo without arguments prints to stdout. `--output` writes
only to a new directory and refuses to overwrite an existing report. CI has
`contents: read`, disables checkout credential persistence, and receives no
release or store secrets. Its only published output is the workflow artifact.

All inputs and resource snapshots are fixtures, **not live GitHub observations**.
`simulation:` candidate IDs are content digests, **not real Git commit SHAs**.
The original source SHA and the generated candidate identity are deliberately
separate. The demo does not claim the real release refs are available or safe to
create. Published releases and advanced release branches intentionally conflict;
this models initial preparation, not later release maintenance.

This is reviewable planning logic, not a runnable production release workflow.
Real source resolution, translation generation, committing a tree, GitHub reads
and writes, race-safe resource creation, approval rules, builds, and release
finalization still need implementation and validation. In particular, runtime
validation currently models the existing app-version policy; fingerprint runtime
integration remains coordinated work with APP-3042. No translation commands run.

The existing **Prepare Cactus Release** workflow remains a separate, read-only
preview of a selected source. It does not execute this simulation as a live plan.

## Reproduce locally

From the repository root:

```sh
node scripts/release/prepare-demo.mjs
node scripts/release/prepare-demo.mjs --output /tmp/release-preparation-demo
pnpm test --runInBand --watchman=false --runTestsByPath scripts/release/prepare.test.js
```

Choose a new output directory if that path already exists. The demo self-checks
21 scenarios without installing dependencies. Seven focused Jest tests add malformed-input,
no-overwrite, snapshot-isolation, and CLI checks without duplicating the demo
scenario matrix. CI compares the generated
walkthrough to the committed example so reviewer documentation stays current.
