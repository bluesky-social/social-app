export const INTEREST_TO_DISPLAY_NAME: {
  [key: string]: string
} = {
  news: 'News',
  journalism: 'Journalism',
  nature: 'Nature',
  art: 'Art',
  comics: 'Comics',
  writers: 'Writers',
  culture: 'Culture',
  sports: 'Sports',
  pets: 'Pets',
  animals: 'Animals',
  books: 'Books',
  education: 'Education',
  climate: 'Climate',
  science: 'Science',
  politics: 'Politics',
  fitness: 'Fitness',
  tech: 'Tech',
  dev: 'Software Dev',
  comedy: 'Comedy',
  gaming: 'Video Games',
  food: 'Food',
  cooking: 'Cooking',
}

export const API_RESPONSE: {
  interests: string[]
  suggestedAccountDids: {
    [key: string]: string[]
  }
  feedUris: {
    [key: string]: string[]
  }
} = {
  interests: Object.keys(INTEREST_TO_DISPLAY_NAME),
  suggestedAccountDids: {
    default: ['bsky.app', 'jay.bsky.team'],
    news: ['bsky.app', 'jay.bsky.team'],
    journalism: ['bsky.app', 'jay.bsky.team'],
    writers: ['bsky.app', 'jay.bsky.team'],
    culture: ['bsky.app', 'jay.bsky.team'],
    books: ['bsky.app', 'jay.bsky.team'],
    sports: ['bsky.app', 'jay.bsky.team'],
    comedy: ['bsky.app', 'jay.bsky.team'],
    pets: ['bsky.app', 'jay.bsky.team'],
    animals: ['bsky.app', 'jay.bsky.team'],
    nature: ['bsky.app', 'jay.bsky.team'],
    art: ['bsky.app', 'jay.bsky.team'],
    comics: ['bsky.app', 'jay.bsky.team'],
    education: ['bsky.app', 'jay.bsky.team'],
    climate: ['bsky.app', 'jay.bsky.team'],
    science: ['bsky.app', 'jay.bsky.team'],
    politics: ['bsky.app', 'jay.bsky.team'],
    fitness: ['bsky.app', 'jay.bsky.team'],
    tech: ['bsky.app', 'jay.bsky.team'],
    dev: ['bsky.app', 'jay.bsky.team'],
    gaming: ['bsky.app', 'jay.bsky.team'],
    food: ['bsky.app', 'jay.bsky.team'],
    cooking: ['bsky.app', 'jay.bsky.team'],
  },
  feedUris: {
    default: [
      'at://did:plc:jfhpnnst6flqway4eaeqzj2a/app.bsky.feed.generator/for-science',
      'at://did:plc:y7crv2yh74s7qhmtx3mvbgv5/app.bsky.feed.generator/art-new',
    ],
    news: [
      'at://did:plc:jfhpnnst6flqway4eaeqzj2a/app.bsky.feed.generator/for-science',
      'at://did:plc:y7crv2yh74s7qhmtx3mvbgv5/app.bsky.feed.generator/art-new',
    ],
    journalism: [
      'at://did:plc:jfhpnnst6flqway4eaeqzj2a/app.bsky.feed.generator/for-science',
      'at://did:plc:y7crv2yh74s7qhmtx3mvbgv5/app.bsky.feed.generator/art-new',
    ],
    writers: [
      'at://did:plc:jfhpnnst6flqway4eaeqzj2a/app.bsky.feed.generator/for-science',
      'at://did:plc:y7crv2yh74s7qhmtx3mvbgv5/app.bsky.feed.generator/art-new',
    ],
    culture: [
      'at://did:plc:jfhpnnst6flqway4eaeqzj2a/app.bsky.feed.generator/for-science',
      'at://did:plc:y7crv2yh74s7qhmtx3mvbgv5/app.bsky.feed.generator/art-new',
    ],
    books: [
      'at://did:plc:jfhpnnst6flqway4eaeqzj2a/app.bsky.feed.generator/for-science',
      'at://did:plc:y7crv2yh74s7qhmtx3mvbgv5/app.bsky.feed.generator/art-new',
    ],
    sports: [
      'at://did:plc:jfhpnnst6flqway4eaeqzj2a/app.bsky.feed.generator/for-science',
      'at://did:plc:y7crv2yh74s7qhmtx3mvbgv5/app.bsky.feed.generator/art-new',
    ],
    comedy: [
      'at://did:plc:jfhpnnst6flqway4eaeqzj2a/app.bsky.feed.generator/for-science',
      'at://did:plc:y7crv2yh74s7qhmtx3mvbgv5/app.bsky.feed.generator/art-new',
    ],
    pets: [
      'at://did:plc:jfhpnnst6flqway4eaeqzj2a/app.bsky.feed.generator/for-science',
      'at://did:plc:y7crv2yh74s7qhmtx3mvbgv5/app.bsky.feed.generator/art-new',
    ],
    animals: [
      'at://did:plc:jfhpnnst6flqway4eaeqzj2a/app.bsky.feed.generator/for-science',
      'at://did:plc:y7crv2yh74s7qhmtx3mvbgv5/app.bsky.feed.generator/art-new',
    ],
    nature: [
      'at://did:plc:jfhpnnst6flqway4eaeqzj2a/app.bsky.feed.generator/for-science',
      'at://did:plc:y7crv2yh74s7qhmtx3mvbgv5/app.bsky.feed.generator/art-new',
    ],
    art: [
      'at://did:plc:jfhpnnst6flqway4eaeqzj2a/app.bsky.feed.generator/for-science',
      'at://did:plc:y7crv2yh74s7qhmtx3mvbgv5/app.bsky.feed.generator/art-new',
    ],
    comics: [
      'at://did:plc:jfhpnnst6flqway4eaeqzj2a/app.bsky.feed.generator/for-science',
      'at://did:plc:y7crv2yh74s7qhmtx3mvbgv5/app.bsky.feed.generator/art-new',
    ],
    education: [
      'at://did:plc:jfhpnnst6flqway4eaeqzj2a/app.bsky.feed.generator/for-science',
      'at://did:plc:y7crv2yh74s7qhmtx3mvbgv5/app.bsky.feed.generator/art-new',
    ],
    climate: [
      'at://did:plc:jfhpnnst6flqway4eaeqzj2a/app.bsky.feed.generator/for-science',
      'at://did:plc:y7crv2yh74s7qhmtx3mvbgv5/app.bsky.feed.generator/art-new',
    ],
    science: [
      'at://did:plc:jfhpnnst6flqway4eaeqzj2a/app.bsky.feed.generator/for-science',
      'at://did:plc:y7crv2yh74s7qhmtx3mvbgv5/app.bsky.feed.generator/art-new',
    ],
    politics: [
      'at://did:plc:jfhpnnst6flqway4eaeqzj2a/app.bsky.feed.generator/for-science',
      'at://did:plc:y7crv2yh74s7qhmtx3mvbgv5/app.bsky.feed.generator/art-new',
    ],
    fitness: [
      'at://did:plc:jfhpnnst6flqway4eaeqzj2a/app.bsky.feed.generator/for-science',
      'at://did:plc:y7crv2yh74s7qhmtx3mvbgv5/app.bsky.feed.generator/art-new',
    ],
    tech: [
      'at://did:plc:jfhpnnst6flqway4eaeqzj2a/app.bsky.feed.generator/for-science',
      'at://did:plc:y7crv2yh74s7qhmtx3mvbgv5/app.bsky.feed.generator/art-new',
    ],
    dev: [
      'at://did:plc:jfhpnnst6flqway4eaeqzj2a/app.bsky.feed.generator/for-science',
      'at://did:plc:y7crv2yh74s7qhmtx3mvbgv5/app.bsky.feed.generator/art-new',
    ],
    gaming: [
      'at://did:plc:jfhpnnst6flqway4eaeqzj2a/app.bsky.feed.generator/for-science',
      'at://did:plc:y7crv2yh74s7qhmtx3mvbgv5/app.bsky.feed.generator/art-new',
    ],
    food: [
      'at://did:plc:jfhpnnst6flqway4eaeqzj2a/app.bsky.feed.generator/for-science',
      'at://did:plc:y7crv2yh74s7qhmtx3mvbgv5/app.bsky.feed.generator/art-new',
    ],
    cooking: [
      'at://did:plc:jfhpnnst6flqway4eaeqzj2a/app.bsky.feed.generator/for-science',
      'at://did:plc:y7crv2yh74s7qhmtx3mvbgv5/app.bsky.feed.generator/art-new',
    ],
  },
}
