const {withAppBuildGradle, withSettingsGradle} = require('expo/config-plugins')

/*
 * Ships the Baseline Profiles in ./profiles with the app. When prebuild runs
 * with BSKY_ANDROID_BENCHMARK=1, it also wires up the Macrobenchmark module in
 * ./benchmark and the `benchmark` build type it runs against. See ./README.md.
 *
 * Paths are relative to android/, which prebuild regenerates.
 */
const PROFILES_DIR = '../plugins/androidBaselineProfile/profiles'
const BENCHMARK_DIR = '../plugins/androidBaselineProfile/benchmark'

const profileGradle = `
// @generated begin bsky-baseline-profile
android {
    sourceSets {
        main {
            // -Pbsky.baselineProfile=false builds without them, to measure what they're worth
            if (findProperty('bsky.baselineProfile') != 'false') {
                baselineProfiles.srcDir(new File(rootDir, '${PROFILES_DIR}'))
            }
        }
    }
}

dependencies {
    // Installs the profile outside of Play, which compiles it at install itself
    implementation 'androidx.profileinstaller:profileinstaller:1.4.1'
}
// @generated end bsky-baseline-profile
`

const benchmarkBuildTypeGradle = `
// @generated begin bsky-benchmark
android {
    buildTypes {
        /*
         * Release, but profileable and signed with the debug key so the
         * benchmark module can install and trace it. Recording a profile needs
         * -Pbsky.benchmark.minify=false, since R8 renames the classes the
         * profile names.
         */
        benchmark {
            initWith release
            signingConfig signingConfigs.debug
            matchingFallbacks = ['release']
            debuggable false
            profileable true
            if (findProperty('bsky.benchmark.minify') == 'false') {
                minifyEnabled false
                shrinkResources false
            }
        }
    }
}
// @generated end bsky-benchmark
`

const benchmarkSettingsGradle = `
// @generated begin bsky-benchmark
include ':benchmark'
project(':benchmark').projectDir = new File(rootDir, '${BENCHMARK_DIR}')
// @generated end bsky-benchmark
`

/**
 * @param {string} contents
 * @param {string} block
 */
function appendOnce(contents, block) {
  const tag = block.match(/@generated begin (\S+)/)[1]
  return contents.includes(`@generated begin ${tag}`)
    ? contents
    : contents + block
}

module.exports = function withAndroidBaselineProfile(config) {
  const withBenchmark = process.env.BSKY_ANDROID_BENCHMARK === '1'

  config = withAppBuildGradle(config, config => {
    let contents = appendOnce(config.modResults.contents, profileGradle)
    if (withBenchmark) {
      contents = appendOnce(contents, benchmarkBuildTypeGradle)
    }
    config.modResults.contents = contents
    return config
  })

  if (withBenchmark) {
    config = withSettingsGradle(config, config => {
      config.modResults.contents = appendOnce(
        config.modResults.contents,
        benchmarkSettingsGradle,
      )
      return config
    })
  }

  return config
}
