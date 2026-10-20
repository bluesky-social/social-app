import org.jetbrains.kotlin.gradle.dsl.JvmTarget

/*
 * Macrobenchmarks and Baseline Profile recording for the app. Only included in
 * the Gradle build when prebuild runs with BSKY_ANDROID_BENCHMARK=1. See
 * ../README.md.
 */
plugins {
    id("com.android.test")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "xyz.blueskyweb.app.benchmark"
    compileSdk = 36

    defaultConfig {
        // BaselineProfileRule needs API 28, or API 33 on a device that isn't rooted
        minSdk = 28
        targetSdk = 36
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildTypes {
        // Runs against the app's `benchmark` build type, which the config plugin adds
        create("benchmark") {
            isDebuggable = true
            signingConfig = getByName("debug").signingConfig
            matchingFallbacks += listOf("release")
        }
    }

    targetProjectPath = ":app"
    experimentalProperties["android.experimental.self-instrumenting"] = true
}

kotlin {
    compilerOptions {
        jvmTarget.set(JvmTarget.JVM_17)
    }
}

// Resolving the app to test needs the repositories its build.gradle adds, such as bitdrift's
evaluationDependsOn(":app")
repositories {
    project(":app").repositories.withType<MavenArtifactRepository>().forEach { maven(it.url) }
}

androidComponents {
    // Macrobenchmark refuses to measure a debuggable app, so only keep the variant that targets `benchmark`
    beforeVariants(selector().all()) {
        it.enable = it.buildType == "benchmark"
    }
}

dependencies {
    implementation("androidx.benchmark:benchmark-macro-junit4:1.5.0")
    implementation("androidx.test.ext:junit:1.3.0")
    implementation("androidx.test.uiautomator:uiautomator:2.3.0")
}
