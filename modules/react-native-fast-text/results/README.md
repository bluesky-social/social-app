# Measurement manifest

Do not glob all JSON files into one comparison. The collector's raw schema does
not encode the implementation revision or whether UI inspection was polling.
`analyze.ts` can separate platforms/configurations, but cannot infer these facts.
Use the exact final-run groups below. Times in filenames are collector UTC times.

## Final release groups

All use the delivered implementation, 400 labels, 3 warmup rounds and 12 measured
rounds per renderer/workload. No performance profiler or repeated UI inspection
ran during collection. Runs were serial, with no builds/tests/analysis competing
with the benchmark. Fonts were loaded first.

| Group              | Raw files                                                                            | Summary                                          |
| ------------------ | ------------------------------------------------------------------------------------ | ------------------------------------------------ |
| iOS Typography     | [22-03-42](2026-09-25T22-03-42.520Z.json), [22-04-52](2026-09-25T22-04-52.395Z.json) | [summary](ios-typography-final-summary.json)     |
| Android Typography | [21-50-39](2026-09-25T21-50-39.424Z.json), [21-55-36](2026-09-25T21-55-36.859Z.json) | [summary](android-typography-final-summary.json) |
| iOS library        | [22-05-57](2026-09-25T22-05-57.241Z.json), [22-07-27](2026-09-25T22-07-27.776Z.json) | [summary](ios-library-final-summary.json)        |
| Android library    | [21-59-49](2026-09-25T21-59-49.860Z.json)                                            | [summary](android-library-final-summary.json)    |

Each Typography run has 270 raw samples (216 measured); each library run has
180 raw samples (144 measured). Two-run groups have 24 observations per cell;
the Android library group has 12. iOS lowers eligible content to UILabel.
Android keeps RN's renderer and lowers only safe object children.

## Earlier experiments: excluded from final summaries

| Raw file                                  | Classification / why separate                                                                  |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------- |
| [20-38-49](2026-09-25T20-38-49.578Z.json) | Instrumented development baseline, RN/upstream only; 40 samples                                |
| [20-47-26](2026-09-25T20-47-26.688Z.json) | Development library experiment; 96 samples                                                     |
| [20-59-06](2026-09-25T20-59-06.626Z.json) | Development Typography, before the hook-adapter refinement; 144 samples                        |
| [21-06-05](2026-09-25T21-06-05.922Z.json) | Instrumented development library, paired to React profiler session 20260925-210639; 60 samples |
| [21-12-30](2026-09-25T21-12-30.171Z.json) | Preliminary iOS Release library; UI tree was polled                                            |
| [21-15-37](2026-09-25T21-15-37.021Z.json) | Preliminary iOS Release library; UI tree was polled                                            |
| [21-16-46](2026-09-25T21-16-46.089Z.json) | Preliminary iOS Release Typography; UI tree was polled                                         |
| [21-18-13](2026-09-25T21-18-13.053Z.json) | Preliminary iOS Release Typography; UI tree was polled                                         |
| [21-20-26](2026-09-25T21-20-26.402Z.json) | Preliminary iOS Release Typography; UI tree was polled                                         |
| [21-35-40](2026-09-25T21-35-40.372Z.json) | Rejected Android native-backend library experiment; UI tree was polled                         |
| [21-42-12](2026-09-25T21-42-12.799Z.json) | Rejected Android native-backend Typography experiment; no repeated UI polling                  |

`release-summary.json` is the preliminary iOS aggregate, **not** the final
headline result. `android-first-summary.json` and
`android-typography-first-summary.json` describe the rejected native strategy.
`android-rn-first-summary.json` is only the first of the final Android Typography
repetitions; use the two-run `android-typography-final-summary.json` instead.

## Structural profiling and compatibility

- [Compact React profile](react-profile-structure.json): all 60 bulk-mount
  commits mapped to samples, with component render counts. The accompanying
  [compressed raw records](react-profile-structure.commits.json.gz) preserve the
  evidence and original metadata; the compact file records their SHA-256.
- [Extraction script](../example/extract-profile.ts): accepts the raw JSON or
  compressed archive. The chronological `hotCommitIndices` mapping is specific
  to this controlled mount/unmount capture. This is development evidence, not
  release timing.
- `visual-initial/` and `visual-typography/`: earlier iOS bare/component captures;
  the latter includes native layout-event measurements.
- `visual-android-typography/` and `visual-android-fixed/`: rejected native-backend
  experiment, including the RTL/ellipsis correction.
- `visual-ios-final/` and `visual-android-final/`: final implementation pixel
  comparisons. `behavior-final/`: final locale, counter, rich text and selection
  observations. Behavior screenshots are downscaled; pixel-diff sources are
  full resolution.

The baseline revision and measurement caveats are in [the report](../PERFORMANCE.md).
Source/binary fingerprints for the delivered tree are recorded in
[provenance.json](provenance.json), including notes on tooling-only changes after measurement.
