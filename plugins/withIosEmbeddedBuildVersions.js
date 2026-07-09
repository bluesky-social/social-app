const {withXcodeProject} = require('expo/config-plugins')

const PHASE_NAME = '[Blacksky] Sync embedded build versions'

const SCRIPT = String.raw`set -euo pipefail

parent_plist="$TARGET_BUILD_DIR/$INFOPLIST_PATH"
build_version=""

if [ -n "\${EAS_BUILD_IOS_BUILD_NUMBER:-}" ]; then
  build_version="$EAS_BUILD_IOS_BUILD_NUMBER"
fi

if [ -z "$build_version" ] && [ -n "\${BSKY_IOS_BUILD_NUMBER:-}" ]; then
  build_version="$BSKY_IOS_BUILD_NUMBER"
fi

if [ -f "$parent_plist" ]; then
  build_version="$build_version"
  if [ -z "$build_version" ]; then
    build_version=$(/usr/libexec/PlistBuddy -c "Print :CFBundleVersion" "$parent_plist" 2>/dev/null || true)
  fi
fi

if [ -z "$build_version" ] || [[ "$build_version" == *'$('* ]]; then
  build_version="$CURRENT_PROJECT_VERSION"
fi

if [ -z "$build_version" ] || [[ "$build_version" == *'$('* ]]; then
  echo "error: Unable to resolve parent CFBundleVersion for embedded targets"
  exit 1
fi

sync_bundle() {
  local bundle="$1"
  local plist="$bundle/Info.plist"

  [ -d "$bundle" ] || return 0
  [ -f "$plist" ] || return 0

  /usr/libexec/PlistBuddy -c "Set :CFBundleVersion $build_version" "$plist" 2>/dev/null \\
    || /usr/libexec/PlistBuddy -c "Add :CFBundleVersion string $build_version" "$plist"

  if [ "\${CODE_SIGNING_ALLOWED:-YES}" != "NO" ] && [ -n "\${EXPANDED_CODE_SIGN_IDENTITY:-}" ] && [ "\${EXPANDED_CODE_SIGN_IDENTITY:-}" != "-" ]; then
    /usr/bin/codesign --force --sign "$EXPANDED_CODE_SIGN_IDENTITY" \\
      --preserve-metadata=identifier,entitlements,flags \\
      \${OTHER_CODE_SIGN_FLAGS:-} \\
      "$bundle"
  fi

  echo "Synced $(basename "$bundle") CFBundleVersion to $build_version"
}

for bundle in "$TARGET_BUILD_DIR/$WRAPPER_NAME/PlugIns/"*.appex "$TARGET_BUILD_DIR/$WRAPPER_NAME/AppClips/"*.app; do
  sync_bundle "$bundle"
done
`

const withIosEmbeddedBuildVersions = config => {
  return withXcodeProject(config, config => {
    const project = config.modResults
    const shellScripts =
      project.hash.project.objects.PBXShellScriptBuildPhase ?? {}
    const existingEntry = Object.entries(shellScripts).find(
      ([key, phase]) =>
        !key.endsWith('_comment') && phase && phase.name === `"${PHASE_NAME}"`,
    )
    const target =
      project.hash.project.objects.PBXNativeTarget[
        project.getFirstTarget().uuid
      ]

    let phaseUuid = existingEntry?.[0]

    if (phaseUuid) {
      shellScripts[phaseUuid].shellScript = `"${SCRIPT.replace(/"/g, '\\"')}"`
    } else {
      project.addBuildPhase(
        [],
        'PBXShellScriptBuildPhase',
        PHASE_NAME,
        project.getFirstTarget().uuid,
        {
          inputPaths: [],
          outputPaths: [],
          shellPath: '/bin/sh',
          shellScript: SCRIPT,
        },
      )
      const nextEntry = Object.entries(shellScripts).find(
        ([key, phase]) =>
          !key.endsWith('_comment') &&
          phase &&
          phase.name === `"${PHASE_NAME}"`,
      )
      phaseUuid = nextEntry?.[0]
    }

    if (phaseUuid && target?.buildPhases) {
      target.buildPhases = target.buildPhases.filter(
        phase => phase.value !== phaseUuid,
      )
      target.buildPhases.push({
        value: phaseUuid,
        comment: PHASE_NAME,
      })
    }

    return config
  })
}

module.exports = withIosEmbeddedBuildVersions
