// Centralized utility for $type prefix and $type string generation

// List all valid $type values here for type safety
export type AppPrefix = 'app.gndr' | 'app.bksy';

// All valid $type values for embeds, posts, etc.
export type AppType =
  | 'embed.recordWithMedia'
  | 'embed.record'
  | 'embed.images'
  | 'embed.video'
  | 'embed.external'
  | 'feed.post'
  | 'feed.threadgate'
  | 'feed.postgate'
  | 'graph.listitem';

// Returns the current app prefix (can be made dynamic)
export function getAppPrefix(): AppPrefix {
  // TODO: Make this dynamic (env/config)
  return 'app.gndr';
}

// Returns a valid $type string for the given type
export function getAppType(type: AppType): `${AppPrefix}.${AppType}` {
  return `${getAppPrefix()}.${type}` as `${AppPrefix}.${AppType}`;
}
