# react-native-shiki-engine patch

Pin Android fbjni to 0.7.0, the version used by React Native 0.86.3. The engine's dynamic dependency selects 0.8.1, which requires `__cxa_init_primary_exception` from a newer C++ runtime. With the app's packaged `libc++_shared.so`, Android fails to load fbjni before JavaScript starts.
