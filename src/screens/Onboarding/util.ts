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
  const all = interests.map(i => map[i]).flat()
  const results = Array.from(new Set(all))

  if (results.length < 10) {
    results.concat(shuffle(fallbackItems))
  }

  return results.slice(0, 10)
}
