{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    android-nixpkgs.url = "github:tadfisher/android-nixpkgs";
    wrangler-flake.url = "github:ryand56/wrangler";
  };

  outputs =
    {
      nixpkgs,
      flake-utils,
      wrangler-flake,
      android-nixpkgs,
      ...
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config = {
            android_sdk.accept_license = true;
            allowUnfree = true;
          };
        };
        pinnedJDK = pkgs.jdk17;
        androidSdk = android-nixpkgs.sdk.${system} (
          sdkPkgs:
          with sdkPkgs;
          [
            cmdline-tools-latest
            build-tools-35-0-0
            build-tools-34-0-0
            platform-tools
            platforms-android-35
            emulator
            cmake-3-22-1
            ndk-26-1-10909125
            ndk-28-0-13004108
          ]
          ++ nixpkgs.lib.optionals (system == "aarch64-darwin") [
            system-images-android-35-google-apis-arm64-v8a
            system-images-android-35-google-apis-playstore-arm64-v8a
          ]
          ++ nixpkgs.lib.optionals (system == "x86_64-darwin" || system == "x86_64-linux") [
            system-images-android-35-google-apis-x86-64
            system-images-android-35-google-apis-playstore-x86-64
          ]
        );
      in
      with pkgs;
      {
        packages = {
          default = callPackage ./default.nix { };
        };
        devShells = {
          default = mkShell rec {
            buildInputs = [
              androidSdk
              pinnedJDK
            ];

            JAVA_HOME = pinnedJDK;
            ANDROID_HOME = "${androidSdk}/share/android-sdk";
            ANDROID_SDK_ROOT = "${androidSdk}/share/android-sdk";

            GRADLE_OPTS = "-Dorg.gradle.project.android.aapt2FromMavenOverride=${ANDROID_SDK_ROOT}/build-tools/35.0.0/aapt2";

            packages = [
              just
              fastmod
              nodejs
              yarn
              crowdin-cli
              eas-cli

              bundletool

              typescript
              typescript-language-server

              go
              gopls

              wrangler-flake.packages.${system}.wrangler
            ];

            shellHook = ''
              export GRADLE_USER_HOME=~/.cache/gradle
            '';
          };
        };
      }
    );
}
