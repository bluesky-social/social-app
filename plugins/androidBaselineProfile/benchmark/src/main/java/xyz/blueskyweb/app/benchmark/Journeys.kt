package xyz.blueskyweb.app.benchmark

import androidx.benchmark.macro.MacrobenchmarkScope
import androidx.test.uiautomator.By
import androidx.test.uiautomator.Direction
import androidx.test.uiautomator.Until
import java.util.regex.Pattern

const val TARGET_PACKAGE = "xyz.blueskyweb.app"

/** PostFeedItem's testID */
private val FEED_ITEM = By.res(Pattern.compile("feedItem-by-.*"))

/** The home feed's list, whether Following or a custom feed is selected */
private val FEED_LIST = By.res(Pattern.compile(".*FeedPage-feed-flatlist"))

/**
 * Cold starts the app and waits for the first post in the home feed.
 *
 * The app calls reportFullyDrawn() once the first page of a feed renders, so
 * waiting for a post is what lets StartupTimingMetric report time to full
 * display. The benchmark build keeps its data between runs, so log in on the
 * device once before running anything.
 */
fun MacrobenchmarkScope.startAndWaitForFeed() {
    pressHome()
    startActivityAndWait()
    check(device.wait(Until.hasObject(FEED_ITEM), 30_000)) {
        "No posts appeared within 30s. Is the benchmark build logged in, with posts in the home feed?"
    }
    device.waitForIdle()
}

/** Flings through the first few screens of the home feed. */
fun MacrobenchmarkScope.scrollFeed() {
    val list = checkNotNull(device.findObject(FEED_LIST)) { "Couldn't find the home feed's list" }
    // Keep clear of the edges, where the system's gesture navigation takes over
    list.setGestureMargin(device.displayWidth / 5)
    repeat(3) {
        list.fling(Direction.DOWN)
        device.waitForIdle()
    }
}
