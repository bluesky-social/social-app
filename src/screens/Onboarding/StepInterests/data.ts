export type InterestItem = {
  title: string
  name: string
  tags: string[]
}

export const INTERESTS: InterestItem[] = [
  {
    title: 'News',
    name: 'news',
    tags: [],
  },
  {
    title: 'Journalism',
    name: 'journalism',
    tags: [],
  },
  {
    title: 'Writers',
    name: 'writers',
    tags: [],
  },
  {
    title: 'Culture',
    name: 'culture',
    tags: [],
  },
  {
    title: 'Books',
    name: 'books',
    tags: [],
  },
  {
    title: 'Sports',
    name: 'sports',
    tags: [],
  },
  {
    title: 'Comedy',
    name: 'comedy',
    tags: [],
  },
  {
    title: 'Pets',
    name: 'pets',
    tags: [],
  },
  {
    title: 'Nature',
    name: 'nature',
    tags: [],
  },
  {
    title: 'Art',
    name: 'art',
    tags: [],
  },
  {
    title: 'Comics',
    name: 'comics',
    tags: [],
  },
  {
    title: 'Education',
    name: 'education',
    tags: [],
  },
  {
    title: 'Climate',
    name: 'climate',
    tags: [],
  },
  {
    title: 'Science',
    name: 'science',
    tags: [],
  },
  {
    title: 'Politics',
    name: 'politics',
    tags: [],
  },
  {
    title: 'Fitness',
    name: 'fitness',
    tags: [],
  },
  {
    title: 'Health',
    name: 'health',
    tags: [],
  },
  {
    title: 'Tech & Society',
    name: 'tech_and_society',
    tags: [],
  },
  {
    title: 'Software Dev',
    name: 'software_development',
    tags: [],
  },
  {
    title: 'Video Games',
    name: 'video_games',
    tags: [],
  },
  {
    title: 'Food & Cooking',
    name: 'food_and_cooking',
    tags: [],
  },
]

export const TEMP_ACCOUNT_MAPPING: {
  [key: string]: string[]
} = {
  news: ['bsky.app', 'jay.bsky.team'],
  journalism: ['bsky.app', 'jay.bsky.team'],
  writers: ['bsky.app', 'jay.bsky.team'],
  culture: ['bsky.app', 'jay.bsky.team'],
  books: ['bsky.app', 'jay.bsky.team'],
  sports: ['bsky.app', 'jay.bsky.team'],
  comedy: ['bsky.app', 'jay.bsky.team'],
  pets: ['bsky.app', 'jay.bsky.team'],
  nature: ['bsky.app', 'jay.bsky.team'],
  art: ['bsky.app', 'jay.bsky.team'],
  comics: ['bsky.app', 'jay.bsky.team'],
  education: ['bsky.app', 'jay.bsky.team'],
  climate: ['bsky.app', 'jay.bsky.team'],
  science: ['bsky.app', 'jay.bsky.team'],
  politics: ['bsky.app', 'jay.bsky.team'],
  fitness: ['bsky.app', 'jay.bsky.team'],
  health: ['bsky.app', 'jay.bsky.team'],
  tech_and_society: ['bsky.app', 'jay.bsky.team'],
  software_development: ['bsky.app', 'jay.bsky.team'],
  video_games: ['bsky.app', 'jay.bsky.team'],
  food_and_cooking: ['bsky.app', 'jay.bsky.team'],
}
