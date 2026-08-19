# react-native-dotenv@3.4.11.patch

Avoid inlining Metro's `JEST_WORKER_ID` or `VITEST_WORKER_ID` into application
code, which causes libraries such as react-native-mmkv to use test-only mocks.
