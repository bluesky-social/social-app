# @expo/cli

## build/src/start/server/serverLogLikeMetro.js - keep the error message in web terminal logs

Dev-server-terminal-only change; no runtime/app impact.

React 19 appends owner stacks to dev warnings, so a web `console.error`
arrives at the CLI as one merged string (`"<message>\n    at ..."`). The
reporter replaces the whole argument with the symbolicated stack block and
dropped the parsed message, printing a blank `Web ERROR` with only a code
frame and call stack.

The patch prepends `error.message` (when non-empty) to the returned stack
block. Native logs are unaffected (message and stack arrive as separate
arguments there).

Still present in @expo/cli 58.1.15 (2026-10-27) and on expo/expo `main` as of 2026-10-16
(the `// NOTE: Message is printed above stack by the default Metro logic`
comment is unchanged). Unreported upstream; worth filing against expo/expo
referencing expo/expo#46584.

`expo` depends on `@expo/cli@^58.1.15` (caret), so a lockfile refresh that
picks up a newer 58.x CLI will leave this patch key unused and fail the
install until the key is bumped.
