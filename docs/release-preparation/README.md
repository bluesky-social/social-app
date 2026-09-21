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

A future live workflow would still need to:

- Create or reuse the branch, release file, tag, and draft.
- Start iOS, Android, and web builds, then record their build numbers.
- Recheck before each write in case another run changed something.

Those actions are outside this PR's dry-run scope. Releasing the app would remain
a manual step.

Other limits:

- **Notes need review.** They're commit titles since the highest reachable version
  tag, excluding the requested version. Without an earlier tag, they include all
  reachable history.
- **Translations aren't refreshed.** Builds, store submissions, and deployments
  aren't tested.
- **Runtime policy must be `appVersion`.** Fingerprint runtimes aren't supported yet.
