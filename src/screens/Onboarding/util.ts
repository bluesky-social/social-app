function shuffle(array: any) {
  let currentIndex = array.length,
    randomIndex

  // While there remain elements to shuffle.
  while (currentIndex > 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex--

    // And swap it with the current element.
    ;[array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ]
  }

  return array
}

export function aggregateInterestItems(
  interests: string[],
  map: {[key: string]: string[]},
  fallbackItems: string[],
) {
  const selected = interests.length
  const all = interests
    .map(i => {
      const suggestions = shuffle(map[i])

      if (selected === 1) {
        return suggestions // return all
      } else if (selected === 2) {
        return suggestions.slice(0, 5) // return 5
      } else {
        return suggestions.slice(0, 3) // return 3
      }
    })
    .flat()
  // dedupe suggestions
  const results = Array.from(new Set(all))

  // backfill
  if (results.length < 20) {
    results.push(...shuffle(fallbackItems))
  }

  // dedupe and return 20
  return Array.from(new Set(results)).slice(0, 20)
}
