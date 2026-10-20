package xyz.blueskyweb.app.benchmark

import androidx.benchmark.macro.junit4.BaselineProfileRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Records the profiles in ../profiles. Run it against a build with
 * -Pbsky.benchmark.minify=false, then turn what it records into profiles with
 * ../updateProfile.mjs. See ../README.md.
 */
@RunWith(AndroidJUnit4::class)
class BaselineProfileGenerator {
    @get:Rule
    val rule = BaselineProfileRule()

    /**
     * The code that runs from a cold start until the home feed's first page is on
     * screen. R8 puts it first in the primary dex file, so startup reads fewer
     * pages, and ART compiles it ahead of time.
     */
    @Test
    fun startup() =
        rule.collect(packageName = TARGET_PACKAGE, includeInStartupProfile = true) {
            startAndWaitForFeed()
        }

    /** Startup plus the first few flings through the feed, which ART compiles ahead of time. */
    @Test
    fun generate() =
        rule.collect(packageName = TARGET_PACKAGE) {
            startAndWaitForFeed()
            scrollFeed()
        }
}
