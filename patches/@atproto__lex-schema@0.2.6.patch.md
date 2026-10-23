# @atproto/lex-schema@0.2.6.patch

## Don't rebuild a rejection for every absent optional value

When parsing (which XRPC response handling does), `OptionalSchema` runs its
inner schema on `undefined` so that defaults can apply. For most inner schemas
that fails, and the failure is a `LexValidationError` (an `Error` subclass with
formatted issues) that is immediately discarded. Absent optional fields are the
common case in feed responses, so on Android this was about half of all
response validation time, and about 11% of the JS thread while the app
processes the first timeline on a cold start.

Schemas are stateless, so once the inner schema rejects `undefined` it always
will for the same options. The patch remembers that per strict/non-strict mode
and returns success directly afterwards. Results are unchanged.

**TODO: Remove once the upstream fix in `@atproto/lex-schema` is released.**
