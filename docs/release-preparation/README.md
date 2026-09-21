# Release preparation dry run

Check a proposed release without creating branches or tags, starting builds, or
publishing anything.

## Run it in GitHub

Run **Prepare Cactus Release (dry run)** with:

- **Source:** the branch, tag, or commit you want to release.
- **Version:** an `x.y.z` version matching the source's package and Expo versions.

The action checks the source and existing GitHub release resources. It prints a
summary and saves a downloadable report with the release file and public notes.
Both scripts run automatically in the action; there are no separate script commands
to run. Share the completed run with reviewers.

## Read the results

The report lists the source commit, release names, notes, and proposed steps.
Each branch, tag, release file, and GitHub draft gets a result:

- **Create:** it doesn't exist yet.
- **Reuse:** it matches what this release needs.
- **Blocked:** something differs or couldn't be checked. The whole run stops.

The report is saved even when a GitHub check blocks the run.

## Follow the planned requests

The action now walks through the requests a release would need:

1. Create or reuse the release branch.
2. Prepare the Git tree and commit containing the release file.
3. Update the branch, then create or reuse the tag and draft.
4. Prepare the iOS, Android, and web build requests.

Before each step it reads GitHub again. If anything changed or can't be checked,
it stops. Each write is marked **skipped-dry-run**; matching resources are marked
**verified-reuse**. Nothing is sent except read requests.

The report includes request bodies and dependencies. A value such as
`fromStep: prepared-commit` means “use the commit returned by that step.” It isn't
a made-up commit hash. Because writes are skipped, rechecks compare against the
original GitHub state throughout the run.

### Build requests

- **iOS and Android:** production profile, exact prepared commit, store submission
  disabled.
- **Web:** the existing workflow builds the prepared commit and pushes a production image to ECR.
  The dry run only prints that request.
- **All three:** run from the release tag and check out the exact prepared commit. The source's workflow files must match the
  definitions reviewed with this tool, and GitHub must report the workflows active.

These are planned requests, not proof that the builds will succeed.

### What counts as a match?

- **Branch:** it still points to the selected source, or has exactly one
  preparation commit whose only change is the expected release file.
- **Release file:** its contents match exactly, so no new commit is needed.
- **Tag:** it points to the verified preparation commit.
- **Draft:** its tag, name, and public notes match, and it hasn't been published.

Moved branches, changed files, published releases, and API errors block the run.
If the token can't establish that it can see drafts, that check is blocked too.
GitHub's [draft visibility rules](https://docs.github.com/en/rest/releases/releases#list-releases)
require push access; the action keeps read-only permissions.

## Where it stops

A passing report means the checks passed at that moment. It doesn't reserve or
change anything on GitHub.

Request planning and rechecks are wired up. Live execution is deliberately absent;
there is no flag to turn it on.

Before adding live execution, we still need to handle changes between a check and
a write, avoid duplicate build requests on retries, wait for real build results,
and record their actual build numbers in the release file. App release remains
manual.

Other limits:

- **Notes need review.** They're commit titles since the highest reachable version
  tag, excluding the requested version. Without an earlier tag, they include all
  reachable history.
- **Translations aren't refreshed.** Builds, store submissions, and deployments
  aren't tested.
- **Runtime policy must be `appVersion`.** Fingerprint runtimes aren't supported yet.
