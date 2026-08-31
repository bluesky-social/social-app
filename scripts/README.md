# Tool Scripts

## react-compiler-report.ts

Reports which components and hooks React Compiler skipped optimizing, grouped by
the compiler's own diagnostic category. Run with `pnpm react-compiler:report`;
the React Compiler report workflow also runs it on every pull request and posts
the report as a sticky PR comment.

## updateExtensions.sh

Updates the extensions in `/modules` with the current iOS/Android project changes.
