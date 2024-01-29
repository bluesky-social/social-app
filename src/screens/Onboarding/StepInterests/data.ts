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

export type ApiResponseMap = {
  interests: string[]
  suggestedAccountDids: {
    [key: string]: string[]
  }
  suggestedFeedUris: {
    [key: string]: string[]
  }
}
