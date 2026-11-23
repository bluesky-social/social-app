export type ShareSubjectType = 'post' | 'profile' | 'feed' | 'list'

/** What the share sheet is sharing. */
export type ShareSubject = {
  type: ShareSubjectType
  /** The AT URI, or `at://<did>` for a profile. Logged with share events. */
  uri: string
  /**
   * Whose it is: the post's author, the feed or list's creator, or the
   * profile itself. Logged with share events.
   */
  authorDid: string
  /** The bsky.app link that's copied and sent. */
  url: string
  /** Prefilled subject line for apps that take one, like email and Reddit. */
  title: string
  /**
   * Set when people who aren't signed in can't open it. The apps row is
   * hidden and this shows in its place.
   */
  loggedInOnlyNotice?: string
  /**
   * A post URI to attach when it's sent to a chat. Without one, the link goes
   * in the message text, since chats can only attach posts so far.
   */
  chatEmbed?: string
}

/**
 * Where opening an app from the apps row failed. Logged with
 * `share:platform:openFailed`.
 */
export type OpenSharePlatformStep =
  /** The check ran and found the app's scheme or package missing. */
  | 'notInstalled'
  /**
   * The check for the app threw. On iOS that means the build can't query the
   * scheme (it's missing from `LSApplicationQueriesSchemes`, e.g. an OTA added
   * the app before a native build did), not that the app is gone.
   */
  | 'checkInstalled'
  /** Copying the link before opening the app failed (iOS). */
  | 'clipboard'
  /** The OS refused to open the app or its share link. */
  | 'openUrl'
  /** Sending the link straight to the app failed (Android). */
  | 'shareToPackage'
  /** The app has no config for this OS. */
  | 'unsupported'
  /** Something else threw. */
  | 'unknown'
