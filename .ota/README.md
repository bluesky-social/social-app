# Production OTA intents

Production OTA metadata is committed here so that it is reviewed with the code
being deployed. This is similar to a changeset: the file declares the release
target, while an immutable Git tag declares the exact source commit.

For the first OTA targeting native release `1.131.1`, create
`.ota/1.131.1-1.json`:

```json
{
  "runtimeVersion": "1.131.1",
  "iosBuildNumber": 12345,
  "androidVersionCode": 67890
}
```

Commit and review the intent together with the OTA changes. After the OTA branch
is ready, tag its tip using the matching name:

```sh
git tag ota-1.131.1-1 <commit-sha>
git push origin ota-1.131.1-1
```

Run **Bundle and Deploy EAS Update** from that tag and select `production`. The
workflow rejects branches, mismatched versions, missing native release tags,
and OTA commits that are not descended from the native release. Runtime and
build numbers are read from the intent; production values typed into the
workflow form are ignored.

Use `ota-1.131.1-2` and `.ota/1.131.1-2.json` for the next OTA. Base it on the
previous OTA so that each update contains all earlier fixes.
