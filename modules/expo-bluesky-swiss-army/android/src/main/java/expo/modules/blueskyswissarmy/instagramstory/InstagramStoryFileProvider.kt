package expo.modules.blueskyswissarmy.instagramstory

import androidx.core.content.FileProvider

/**
 * Hands Instagram the story images. Its own class so the manifest entry
 * doesn't clash with other libraries' FileProviders.
 */
class InstagramStoryFileProvider : FileProvider()
