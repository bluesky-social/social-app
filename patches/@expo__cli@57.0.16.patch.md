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

Unreported upstream as of 2026-08-13; worth filing against expo/expo
referencing expo/expo#46584.
