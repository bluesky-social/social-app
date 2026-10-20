package xyz.blueskyweb.app.benchmark

import androidx.benchmark.macro.junit4.BaselineProfileRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Records the code the app runs from a cold start until the home feed's first
 * page is on screen, plus the first few flings through it.
 *
 * Run it against a build with -Pbsky.benchmark.minify=false, then turn what it
 * records into ../profiles/app.txt with ../updateProfile.mjs. See ../README.md.
 */
@RunWith(AndroidJUnit4::class)
class BaselineProfileGenerator {
    @get:Rule
    val rule = BaselineProfileRule()

    @Test
    fun generate() =
        rule.collect(packageName = TARGET_PACKAGE) {
            startAndWaitForFeed()
            scrollFeed()
        }
}
