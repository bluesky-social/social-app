# @atproto/syntax@0.7.5.patch

## Check the cheap datetime format first in `isDatetimeStringLenient`

Non-strict validation, used when parsing XRPC responses, checks every datetime
with `isDatetimeStringLenient`. It ran `iso-datestring-validator` first, which
builds and compiles several new `RegExp` objects on every call, and only then
the AT Protocol datetime check, which uses one precompiled regex. The result is
the disjunction of both pure checks, so the patch runs the cheap check first.
Virtually every datetime in a response then skips `iso-datestring-validator`.

**TODO: Remove once the upstream fix in `@atproto/syntax` is released.**
