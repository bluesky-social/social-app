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
