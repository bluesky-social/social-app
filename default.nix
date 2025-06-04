# this doesn't work lol. sad!
{
  lib,
  stdenv,
  fetchYarnDeps,
  yarnConfigHook,
  yarnBuildHook,
  yarnInstallHook,
  nodejs,
}:
let
  package_json = lib.importJSON ./package.json;
in
stdenv.mkDerivation (finalAttrs: {
  pname = package_json.name;
  version = package_json.version;

  src = ./.;

  yarnOfflineCache = fetchYarnDeps {
    yarnLock = finalAttrs.src + "/yarn.lock";
    hash = "sha256-nuUPWMN6FKFoHOpI/nbM9Uw3Ng6BKcjXaQ38LBAzN1A=";
  };

  nativeBuildInputs = [
    yarnConfigHook
    yarnBuildHook
    yarnInstallHook
    nodejs
  ];

  meta = {
    # ...
  };
})
