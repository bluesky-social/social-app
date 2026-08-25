# Tool Scripts

## react-compiler-report.ts

Reports which components and hooks React Compiler skipped optimizing, grouped by
the compiler's own diagnostic category. Run with `pnpm react-compiler:report`;
also runs in the Lint workflow, where it writes the report to the job summary.

## updateExtensions.sh

Updates the extensions in `/modules` with the current iOS/Android project changes.
