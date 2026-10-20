package xyz.blueskyweb.app.benchmark

import androidx.benchmark.macro.BaselineProfileMode
import androidx.benchmark.macro.CompilationMode
import androidx.benchmark.macro.StartupMode
import androidx.benchmark.macro.StartupTimingMetric
import androidx.benchmark.macro.junit4.MacrobenchmarkRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Cold start to the first post in the home feed. Reports time to initial
 * display (first frame) and time to full display (first page of the feed).
 *
 * To measure the profiles in ../profiles against the ones AndroidX libraries
 * ship anyway, compare startupBaselineProfile between a run of the normal build
 * and a run with -Pbsky.baselineProfile=false.
 */
@RunWith(AndroidJUnit4::class)
class StartupBenchmark {
    @get:Rule
    val rule = MacrobenchmarkRule()

    /** Nothing compiled ahead of time, like a sideload that hasn't been dexopted yet */
    @Test
    fun startupNoCompilation() = startup(CompilationMode.None())

    /** Only the Baseline Profile compiled, like the first launch after a Play install or update */
    @Test
    fun startupBaselineProfile() = startup(CompilationMode.Partial(BaselineProfileMode.Require))

    private fun startup(compilationMode: CompilationMode) =
        rule.measureRepeated(
            packageName = TARGET_PACKAGE,
            metrics = listOf(StartupTimingMetric()),
            compilationMode = compilationMode,
            startupMode = StartupMode.COLD,
            iterations = 15,
        ) {
            startAndWaitForFeed()
        }
}
