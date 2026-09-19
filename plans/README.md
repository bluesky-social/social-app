# Composer V2 documentation

The active task queue lives in `AGENTS/tasks/`, not in this directory. Execute one task at a time in the operator-approved order in `AGENTS/tasks/README.md`; task frontmatter is authoritative for status. Existing task numbers and files are stable.

## Current references

- [Implementation reference](composer-v2.md): scope, behavior, queue overview, and development checks.
- [Architecture](composer-v2-architecture.md): store, input ownership, async tasks, adapters, and record/draft boundaries.

## History

- [Completed milestones](composer-v2-history.md): implementation reports from the former `plans/todo.md`, with legacy-to-current task mapping.
- [Archived adapter brief](archive/composer-v2-adapters.md): the completed legacy #3 plan, not an active instruction set.

Legacy milestone numbers are not the new task IDs. In particular, task 0006 is record construction; drafts are task 0008 and remain last.

## Current scope

Finish tasks 0001-0003, reordering, no-write record-set construction, and the comprehensive tester UI; then do the UI-free image-compression cleanup (0004) immediately before draft round trips and tester save/restore (0008), last. Production UI migration is not scheduled. Explicit post tags are in scope; a production tag-typeahead remains a future design intention.

The existing task 0007 filename still includes `production-ui` for reference stability; its title and requirements now specify the tester UI instead.

`AGENTS/` is excluded by the operator's global Git ignore configuration, so task files are local workspace data unless the operator explicitly changes that policy. This documentation cleanup does not change ignore rules or force-stage task files.
